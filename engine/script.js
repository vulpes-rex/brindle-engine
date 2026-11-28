// Scripts: what happens when you use a person, a thing or an exit. A script is a list of steps, written as data:
//
//   ["Name", "A line of speech."]              a line (an empty name is narration); lines in a row are shown as one conversation
//   {"case": [[cond, script], ..., [null, script]]}   the first branch whose condition holds (null always does)
//   {"if": cond, "then": script, "else": script}
//   {"set": "flag"}   {"unset": "flag"}
//   {"give": "item", "n": 2}                   (a negative n takes items away)
//   {"battle": "id"}                           fight; the battle's own "won" / "lost" scripts run afterwards
//   {"go": "area", "at": "spawn"}              travel to another area
//   {"choose": [["Answer", script], ["Answer", script, cond], ...]}
//                                              ask: the line just before is the question and stays up; each answer runs its
//                                              own script (one with a condition is offered only while it holds)
//   {"stop": true}                             end the whole script here
//   {"memory": "spawn"}                        a memory: the picture fades into the past at this spawn of the area. The
//                                              leader is not there; people marked "memory" in the area are, and no one else
//   {"memory": false}                          back from it, to where the leader stood
//   {"move": "person", "to": "poi" | [x, z], "face": [dx, dz], "speed": 5, "gone": true}
//                                              someone walks there (and then faces `face`; or, `gone`, is gone); the script
//                                              waits until they arrive. Ground they walk off they are lowered down to.
//   {"wait": 1.5}                              a pause, in seconds
//
// A condition is a flag name ("key"), its negation ("!key"), {"all": [...]}, {"any": [...]} or {"has": "item", "n": 1}.
//
// The runner knows nothing about the game: a host supplies flag/set/has/give/say/choose/battle/go/memory/move/wait.

export function test(cond, host) {
  if (cond == null) return true;
  if (typeof cond === 'string') return cond[0] === '!' ? !host.flag(cond.slice(1)) : !!host.flag(cond);
  if (cond.all) return cond.all.every(c => test(c, host));
  if (cond.any) return cond.any.some(c => test(c, host));
  if (cond.has) return host.has(cond.has) >= (cond.n || 1);
  throw new Error('Unknown condition: ' + JSON.stringify(cond));
}

export function runScript(script, host, done) {
  const stack = [{ s: script || [], i: 0 }];
  // the choice at the top frame's current step, with its question (a line) or null
  const ask = q => {
    const f = stack[stack.length - 1],
      st = f.s[f.i++],
      open = st.choose.filter(o => test(o[2], host));
    if (!open.length) return q ? host.say([q], next) : next();
    host.choose(q, open.map(o => o[0]), k => {
      stack.push({ s: open[k][1] || [], i: 0 });
      next();
    });
  };
  const next = () => {
    for (;;) {
      const f = stack[stack.length - 1];
      if (!f) {
        if (done) done();
        return;
      }
      if (f.i >= f.s.length) {
        stack.pop();
        continue;
      }
      const st = f.s[f.i];
      if (Array.isArray(st)) {
        const lines = [];
        while (f.i < f.s.length && Array.isArray(f.s[f.i])) lines.push(f.s[f.i++]);
        // (a line just before a choice is its question: it is asked with the choice, not before it)
        const q = f.s[f.i] && f.s[f.i].choose ? lines.pop() : null;
        if (lines.length) host.say(lines, q ? () => ask(q) : next);
        else ask(q);
        return;
      }
      if (st.choose) return ask(null);
      f.i++;
      if (st.case) {
        const hit = st.case.find(c => test(c[0], host));
        if (hit) stack.push({ s: hit[1], i: 0 });
      } else if (st.if !== undefined) {
        const branch = test(st.if, host) ? st.then : st.else;
        if (branch) stack.push({ s: branch, i: 0 });
      } else if (st.set) host.set(st.set, true);
      else if (st.unset) host.set(st.unset, false);
      else if (st.give) host.give(st.give, st.n === undefined ? 1 : st.n);
      else if (st.battle) {
        host.battle(st.battle, next);
        return;
      } else if (st.go) {
        host.go(st.go, st.at, next);
        return;
      } else if (st.memory !== undefined) {
        host.memory(st.memory, next);
        return;
      } else if (st.move) {
        host.move(st.move, st.to, { face: st.face, speed: st.speed, gone: !!st.gone }, next);
        return;
      } else if (st.wait !== undefined) {
        host.wait(st.wait, next);
        return;
      } else if (st.stop) stack.length = 0;
      else throw new Error('Unknown script step: ' + JSON.stringify(st));
    }
  };
  next();
}

// Problems in a script, found without running it (used by the build to check content): returns a list of messages.
export function checkScript(script, where, known) {
  const out = [];
  const cond = (c, at) => {
    if (c == null || typeof c === 'string') return;
    if (c.all || c.any) (c.all || c.any).forEach(x => cond(x, at));
    else if (c.has) {
      if (known.items && !known.items.includes(c.has)) out.push(at + ': unknown item "' + c.has + '"');
    } else out.push(at + ': unknown condition ' + JSON.stringify(c));
  };
  const walk = (s, at) => {
    if (!Array.isArray(s)) {
      out.push(at + ': a script must be a list');
      return;
    }
    s.forEach((st, i) => {
      const here = at + '[' + i + ']';
      if (Array.isArray(st)) {
        if (st.length !== 2 || typeof st[0] !== 'string' || typeof st[1] !== 'string') out.push(here + ': a line is ["name", "text"]');
      } else if (!st || typeof st !== 'object') out.push(here + ': not a step');
      else if (st.case) st.case.forEach((c, k) => (cond(c[0], here), walk(c[1], here + '.case' + k)));
      else if (st.if !== undefined) {
        cond(st.if, here);
        if (st.then) walk(st.then, here + '.then');
        if (st.else) walk(st.else, here + '.else');
      } else if (st.choose) {
        if (!Array.isArray(st.choose) || !st.choose.length) out.push(here + ': choose needs a list of answers');
        else
          st.choose.forEach((o, k) => {
            if (!Array.isArray(o) || typeof o[0] !== 'string' || !Array.isArray(o[1])) out.push(here + '.choose' + k + ': an answer is ["text", script] or ["text", script, cond]');
            else {
              cond(o[2], here + '.choose' + k);
              walk(o[1], here + '.choose' + k);
            }
          });
      } else if (st.set || st.unset || st.stop) {
        /* nothing to check */
      } else if (st.give) {
        if (known.items && !known.items.includes(st.give)) out.push(here + ': unknown item "' + st.give + '"');
      } else if (st.battle) {
        if (known.battles && !known.battles.includes(st.battle)) out.push(here + ': unknown battle "' + st.battle + '"');
      } else if (st.go) {
        const sp = known.spawns && known.spawns[st.go];
        if (!sp) out.push(here + ': unknown area "' + st.go + '"');
        else if (!sp.includes(st.at)) out.push(here + ': area "' + st.go + '" has no spawn "' + st.at + '"');
      } else if (st.memory !== undefined) {
        if (st.memory !== false && typeof st.memory !== 'string') out.push(here + ': memory is a spawn of this area, or false');
        else if (st.memory && known.here && !known.here.spawns.includes(st.memory)) out.push(here + ': this area has no spawn "' + st.memory + '"');
      } else if (st.move) {
        if (known.here && !known.here.actors.includes(st.move)) out.push(here + ': this area has no one called "' + st.move + '"');
        const to = st.to;
        if (typeof to === 'string') {
          if (known.here && known.here.pois && !known.here.pois.includes(to)) out.push(here + ': this area has no place "' + to + '"');
        } else if (!Array.isArray(to) || to.length !== 2 || !to.every(v => typeof v === 'number')) out.push(here + ': move needs "to": a place or [x, z]');
      } else if (st.wait !== undefined) {
        if (typeof st.wait !== 'number' || st.wait < 0) out.push(here + ': wait is a number of seconds');
      } else out.push(here + ': unknown step ' + JSON.stringify(st));
    });
  };
  walk(script, where);
  return out;
}
