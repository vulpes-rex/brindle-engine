// Battle mode: turn-based, in rounds ordered by speed. Who fights, what they can do and how each action plays out all come
// from the game's data (heroes, monsters, skills, foe actions, battles). An action is a move (how the user steps about) and a
// few timed hits: damage, healing, a shield, sparks, a shake.
//
//   skill / foe action: { name, mp, target, move, dur, text, ask, hits: [{ at, power, magic, heal, wall, fx, color, flash, shake }] }
//   target: "foe" | "foes" | "ally" | "self"  (for heroes)   "hero" | "heroes"  (for foes)
//   move:   ["strike", x, z] run in, hop, run back   ["step", d] step forward and back   ["lunge", dx, dz] rush the target

export function createBattle(g) {
  const ui = g.ui,
    $ = ui.$,
    SP = g.SP,
    B = { on: false, busy: false, units: [] };
  let def = null,
    GY = 1,
    back = null,
    after = null;
  const bmsg = s => ($('bmsg').textContent = s),
    items = () => g.content.game.items || {},
    living = side => B.units.filter(u => u.side === side && u.hp > 0),
    fmt = (text, u, tg) => text.replace('{user}', u.name).replace('{target}', tg ? (tg === u ? 'themself' : tg.name) : '');

  // ---- setting up and tearing down
  function setup(id) {
    def = g.content.battles[id];
    GY = def.ground === undefined ? 1 : def.ground;
    Object.assign(B, { on: true, units: [], round: 0, wall: 0, shake: 0, act: null, end: null, menu: null, pend: null, cur: null, phase: 'intro', timer: 1.7, order: [], oi: 0 });
    for (const id2 of g.content.game.party) {
      const h = g.content.heroes[id2];
      B.units.push(Object.assign({ side: 'hero', x: h.at[0], z: h.at[1], hx: h.at[0], hz: h.at[1], fl: 0, flc: [1, 1, 1], kb: 0, hop: 0, dist: 0, run: false, guard: false, ko: false, hp: h.mhp, mp: h.mmp }, h, { id: id2, ci: SP.names.indexOf(h.sprite), skills: h.skills.map(s => Object.assign({ id: s }, g.content.skills[s])) }));
    }
    for (const f of def.foes) {
      const m = g.content.monsters[f.type];
      B.units.push(Object.assign({ side: 'foe', x: f.at[0], z: f.at[1], hx: f.at[0], hz: f.at[1], fl: 0, flc: [1, 1, 1], clip: 'idle', ct: Math.random() * 2, dis: 0, gone: false, n: 0, hp: m.mhp }, m, { id: f.type }));
    }
    g.cam.focus = def.camera.focus.slice();
    g.cam.yaw = g.cam.yawT = def.camera.yaw;
    ui.el.hint.style.display = 'none';
    ui.el.opts.style.display = 'none';
    $('bp').classList.remove('off');
    const ov = ui.el.ov;
    ov.innerHTML = '';
    for (const f of B.units)
      if (f.side === 'foe') {
        f.el = document.createElement('div');
        f.el.className = 'ebar';
        f.el.innerHTML = '<i></i>';
        ov.appendChild(f.el);
        f.nm = document.createElement('div');
        f.nm.className = 'enm';
        f.nm.textContent = f.name;
        ov.appendChild(f.nm);
      }
    B.curEl = document.createElement('div');
    B.curEl.className = 'cur';
    B.curEl.textContent = '▼';
    B.curEl.style.display = 'none';
    ov.appendChild(B.curEl);
    bmsg(def.intro);
    $('bcmd').innerHTML = '';
    renderParty();
  }

  // Fight battle `id`; cb(won) once the party is back where it was and the battle's own closing script has run.
  async function start(id, cb) {
    if (B.busy || B.on) return;
    B.busy = true;
    const d = g.content.battles[id];
    back = { area: g.area, focus: g.cam.focus.slice(), yaw: g.cam.yawT };
    after = cb;
    ui.loading('Getting ready…');
    let arena;
    try {
      [arena] = await Promise.all([g.loadArea(d.area), g.loadMonsters()]);
    } catch (e) {
      return ui.fail('Could not set up the battle: ' + e.message);
    }
    ui.loading(null);
    ui.fade(
      () => {
        g.mode = 'battle';
        g.show(arena);
        setup(id);
      },
      () => (B.busy = false)
    );
  }

  function finish(won) {
    if (B.busy) return;
    B.busy = true;
    ui.fade(
      () => {
        g.mode = 'field';
        g.show(back.area);
        B.on = false;
        ui.el.ov.innerHTML = '';
        $('bp').classList.add('off');
        ui.el.hint.style.display = '';
        ui.el.opts.style.display = '';
        g.cam.focus = back.focus;
        g.cam.yaw = g.cam.yawT = back.yaw;
      },
      () => {
        B.busy = false;
        const cb = after;
        after = null;
        g.run((won ? def.won : def.lost) || [], () => cb && cb(won));
      }
    );
  }

  // ---- the panel
  function renderParty() {
    let h = '';
    for (const u of B.units)
      if (u.side === 'hero') {
        const act = u === B.cur && B.phase === 'command';
        h += '<div class="pr' + (act ? ' act' : '') + (u.hp <= 0 ? ' ko' : '') + '"><span class="pn">' + (act ? '▶' : '') + u.name + (u.guard ? ' ◆' : '') + '</span><span class="bar"><i style="width:' + Math.round((100 * u.hp) / u.mhp) + '%"></i><span>' + u.hp + '/' + u.mhp + '</span></span><span class="mp">' + u.mp + ' MP</span></div>';
      }
    $('bparty').innerHTML = h;
  }

  function menu(kind) {
    B.menu = kind;
    const u = B.cur,
      tonic = g.items.tonic || 0;
    let h = '';
    if (kind === 'root') h = '<button data-c="attack">Attack</button><button data-c="skill">Skill</button><button data-c="item"' + (tonic ? '' : ' disabled') + '>Tonic ×' + tonic + '</button><button data-c="guard">Guard</button>';
    else if (kind === 'skill') {
      for (const s of u.skills) h += '<button class="wide" data-s="' + s.id + '"' + (u.mp < s.mp ? ' disabled' : '') + '>' + s.name + ' <small>' + s.mp + ' MP</small></button>';
      h += '<button class="wide" data-c="back">Back</button>';
    } else if (kind === 'foe') {
      B.units.forEach((f, i) => {
        if (f.side === 'foe' && f.hp > 0) h += '<button class="wide" data-t="' + i + '">' + f.name + '</button>';
      });
      h += '<button class="wide" data-c="back">Back</button>';
    } else if (kind === 'ally') {
      B.units.forEach((f, i) => {
        if (f.side === 'hero' && f.hp > 0) h += '<button data-t="' + i + '">' + f.name + ' <small>' + f.hp + '</small></button>';
      });
      h += '<button data-c="back">Back</button>';
    }
    $('bcmd').innerHTML = h;
  }

  // ---- turns
  function newRound() {
    B.round++;
    if (B.wall > 0) B.wall--;
    B.order = B.units.filter(u => u.hp > 0).sort((a, b) => b.spd - a.spd);
    B.oi = 0;
  }

  function nextTurn() {
    for (let guard = 0; guard < 12; guard++) {
      B.oi++;
      if (B.oi >= B.order.length) newRound();
      const u = B.order[B.oi];
      if (!u || u.hp <= 0) continue;
      B.cur = u;
      u.guard = false;
      if (u.side === 'hero') {
        B.phase = 'command';
        B.pend = null;
        menu('root');
        bmsg(u.name + ': choose an action.' + (B.wall > 0 ? ' (Shield Wall is up.)' : ''));
      } else {
        B.phase = 'act';
        foeAct(u);
      }
      renderParty();
      return;
    }
  }

  function damage(a, power, d, magic) {
    let v = ((magic ? a.mag || a.atk : a.atk) * power - (magic ? d.mdf : d.def) * 0.5) * (0.9 + 0.2 * Math.random());
    if (d.guard) v *= 0.5;
    if (d.side === 'hero' && B.wall > 0) v *= 0.5;
    return Math.max(1, Math.round(v));
  }

  // ---- effects laid over the picture
  const upos = (u, h) => ui.toStage(g.look.project(u.x, GY + (h === undefined ? (u.side === 'foe' ? u.mid : 4) : h), u.z));
  function pop(u, text, cls) {
    const p = upos(u, u.side === 'foe' ? u.mid + 2 : 7.5),
      e = document.createElement('div');
    e.className = 'num ' + (cls || '');
    e.textContent = text;
    e.style.left = p[0] + (Math.random() * 16 - 8) + 'px';
    e.style.top = p[1] + 'px';
    ui.el.ov.appendChild(e);
    setTimeout(() => e.remove(), 950);
  }
  function burst(u, col, n) {
    const p = upos(u);
    for (let i = 0; i < (n || 9); i++) {
      const e = document.createElement('div');
      e.className = 'fxp';
      e.style.background = col;
      e.style.left = p[0] + 'px';
      e.style.top = p[1] + 'px';
      ui.el.ov.appendChild(e);
      const a = Math.random() * 6.283,
        r = 22 + Math.random() * 30,
        an = e.animate([{ transform: 'translate(0,0)', opacity: 1 }, { transform: 'translate(' + Math.cos(a) * r + 'px,' + (Math.sin(a) * r - 14) + 'px)', opacity: 0 }], { duration: 460, easing: 'steps(7)' });
      an.onfinish = () => e.remove();
      setTimeout(() => e.remove(), 700);
    }
  }
  function slash(u) {
    const p = upos(u),
      e = document.createElement('div');
    e.className = 'slash';
    e.style.left = p[0] + 'px';
    e.style.top = p[1] + 'px';
    ui.el.ov.appendChild(e);
    const an = e.animate([{ transform: 'rotate(40deg) scaleY(0.1)', opacity: 1 }, { transform: 'rotate(40deg) scaleY(1.2)', opacity: 1 }, { transform: 'rotate(40deg) scaleY(1.3)', opacity: 0 }], { duration: 240, easing: 'steps(5)' });
    an.onfinish = () => e.remove();
    setTimeout(() => e.remove(), 500);
  }
  function shard(a, b) {
    const p = upos(a),
      q = upos(b),
      e = document.createElement('div');
    e.className = 'fxp';
    e.style.background = '#9ff';
    e.style.width = e.style.height = '8px';
    e.style.left = p[0] + 'px';
    e.style.top = p[1] + 'px';
    ui.el.ov.appendChild(e);
    const an = e.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(' + (q[0] - p[0]) + 'px,' + (q[1] - p[1]) + 'px)' }], { duration: 170, easing: 'linear' });
    an.onfinish = () => e.remove();
    setTimeout(() => e.remove(), 400);
  }

  function hit(tg, v, col) {
    tg.hp = Math.max(0, tg.hp - v);
    tg.fl = 1;
    tg.flc = col || [1, 1, 1];
    pop(tg, String(v), '');
    if (tg.side === 'foe') {
      tg.clip = tg.hp > 0 ? 'hurt' : 'defeat';
      tg.ct = 0;
    } else {
      tg.kb = 1;
      if (tg.hp <= 0) {
        tg.ko = true;
        tg.guard = false;
      }
    }
    renderParty();
  }
  function heal(tg, v) {
    const b = tg.hp;
    tg.hp = Math.min(tg.mhp, tg.hp + v);
    pop(tg, '+' + (tg.hp - b), 'heal');
    burst(tg, '#8ff58a');
    renderParty();
  }

  // ---- actions
  function run(moves, steps, dur, text) {
    B.phase = 'act';
    B.menu = null;
    $('bcmd').innerHTML = '';
    B.act = { t: 0, i: 0, moves, steps: steps.sort((a, b) => a.at - b.at), dur };
    bmsg(text);
    renderParty();
  }
  const strike = (u, tx, tz) => [
    { u, a: [u.hx, u.hz], b: [tx, tz], t0: 0, t1: 0.32 },
    { u, a: [tx, tz], b: [tx - 0.9, tz], t0: 0.32, t1: 0.52, hop: 1.3 },
    { u, a: [tx - 0.9, tz], b: [u.hx, u.hz], t0: 0.62, t1: 0.96 }
  ];
  const stepIn = (u, d) => [
    { u, a: [u.hx, u.hz], b: [u.hx - d, u.hz], t0: 0, t1: 0.22 },
    { u, a: [u.hx - d, u.hz], b: [u.hx - d, u.hz], t0: 0.22, t1: 0.5, hop: 0.9 },
    { u, a: [u.hx - d, u.hz], b: [u.hx, u.hz], t0: 0.6, t1: 0.85 }
  ];
  function movesOf(spec, u, tg) {
    if (!spec) return [];
    if (spec[0] === 'strike') return strike(u, spec[1], spec[2]);
    if (spec[0] === 'step') return stepIn(u, spec[1]);
    if (spec[0] === 'lunge') {
      const tx = tg.x + spec[1],
        tz = tg.z + spec[2];
      return [
        { u, a: [u.hx, u.hz], b: [tx, tz], t0: 0.02, t1: 0.27 },
        { u, a: [tx, tz], b: [u.hx, u.hz], t0: 0.6, t1: 1.02 }
      ];
    }
    throw new Error('Unknown move: ' + spec[0]);
  }

  // play an action from the data: user u, chosen target tg (if the action has one)
  function perform(u, act, tg) {
    const t = act.target,
      targets = () => (t === 'foes' ? living('foe') : t === 'heroes' ? living('hero') : t === 'self' ? [u] : [tg]),
      steps = (act.hits || []).map(h => ({
        at: h.at,
        fn() {
          const list = targets();
          if (h.fx === 'shard') shard(u, list[0]);
          if (h.shake) B.shake = h.shake;
          if (h.wall) {
            B.wall = h.wall;
            for (const a of living('hero')) {
              pop(a, 'Wall', 'txt');
              burst(a, '#9cc8ff', 5);
            }
          }
          for (const x of list) {
            if (h.fx === 'slash') slash(x);
            if (h.fx === 'burst') burst(x, h.color || '#7ff', 12);
            if (h.power && x.hp > 0) hit(x, damage(u, h.power, x, !!h.magic), h.flash);
            if (h.heal && x.hp > 0) heal(x, h.heal);
          }
        }
      }));
    run(movesOf(act.move, u, tg), steps, act.dur, fmt(act.text, u, tg));
  }

  function doAttack(u, f) {
    run(strike(u, f.x + f.rad + 1.8, f.z + 0.4), [{ at: 0.42, fn: () => (slash(f), hit(f, damage(u, 1, f, false))) }], 1.15, u.name + ' attacks the ' + f.name + '.');
  }
  function doGuard(u) {
    u.guard = true;
    u.mp = Math.min(u.mmp, u.mp + 2);
    run([], [{ at: 0.05, fn: () => pop(u, 'Guard', 'txt') }], 0.6, u.name + ' braces. (+2 MP)');
  }
  function doItem(u, tg) {
    g.items.tonic = Math.max(0, (g.items.tonic || 0) - 1);
    run(stepIn(u, 1.2), [{ at: 0.3, fn: () => heal(tg, items().tonic.heal) }], 0.95, u.name + ' uses a Tonic on ' + (tg === u ? 'themself' : tg.name) + '.');
  }
  function doSkill(u, sk, tg) {
    u.mp -= sk.mp;
    perform(u, sk, tg);
  }
  function foeAct(f) {
    const hs = living('hero'),
      h = hs[Math.floor(Math.random() * hs.length)];
    f.n++;
    f.clip = 'attack';
    f.ct = 0;
    let use = null;
    for (const r of f.ai) {
      if (r.every && f.n % r.every !== 0) continue;
      if (r.minTargets && hs.length < r.minTargets) continue;
      if (r.chance !== undefined && Math.random() >= r.chance) continue;
      use = r.use;
      break;
    }
    perform(f, g.content.foeActions[use], h);
  }

  function afterAct() {
    if (!living('foe').length) Object.assign(B, { phase: 'ending', timer: 1.9, end: 'won', cur: null }), bmsg('Victory!');
    else if (!living('hero').length) Object.assign(B, { phase: 'ending', timer: 1.3, end: 'lost', cur: null }), bmsg('The party is overwhelmed...');
    else return nextTurn();
    renderParty();
  }

  function choose(tg) {
    const u = B.cur,
      p = B.pend;
    if (!p || B.phase !== 'command' || !tg || tg.hp <= 0) return;
    if (p.type === 'attack') doAttack(u, tg);
    else if (p.type === 'item') doItem(u, tg);
    else doSkill(u, p.sk, tg);
  }

  // a tap on the picture picks a target while one is being asked for
  function tap(nx, ny) {
    if (B.phase !== 'command' || (B.menu !== 'foe' && B.menu !== 'ally')) return;
    const want = B.menu === 'foe' ? 'foe' : 'hero',
      k = g.look.px;
    let best = null,
      bd = 1e9;
    for (const u of B.units) {
      if (u.side !== want || u.hp <= 0) continue;
      const p = g.look.project(u.x, GY + (u.side === 'foe' ? u.mid : 3.5), u.z),
        d = Math.hypot(nx - p[0], ny - p[1]);
      if (d < (u.side === 'foe' ? 30 : 20) * k && d < bd) {
        bd = d;
        best = u;
      }
    }
    if (best) choose(best);
  }

  $('bcmd').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || b.disabled || g.mode !== 'battle') return;
    const u = B.cur;
    if (B.phase === 'end') return finish(B.end === 'won');
    if (B.phase !== 'command') return;
    const c = b.dataset.c,
      s = b.dataset.s,
      ti = b.dataset.t;
    if (c === 'back') {
      B.pend = null;
      menu('root');
      bmsg(u.name + ': choose an action.');
    } else if (c === 'attack') {
      B.pend = { type: 'attack' };
      menu('foe');
      bmsg('Attack which one? (You can tap it.)');
    } else if (c === 'skill') menu('skill');
    else if (c === 'item') {
      B.pend = { type: 'item' };
      menu('ally');
      bmsg('Use a Tonic on whom? Restores ' + items().tonic.heal + ' HP.');
    } else if (c === 'guard') doGuard(u);
    else if (s) {
      const sk = u.skills.find(k => k.id === s);
      B.pend = { type: 'skill', sk };
      if (sk.target === 'foe') {
        menu('foe');
        bmsg(sk.ask || sk.name + ': which one?');
      } else if (sk.target === 'ally') {
        menu('ally');
        bmsg(sk.ask || sk.name + ': who?');
      } else doSkill(u, sk, null);
    } else if (ti !== undefined) choose(B.units[+ti]);
  });

  function update(dt) {
    for (const u of B.units) {
      u.fl = Math.max(0, u.fl - dt * 3.2);
      if (u.side === 'foe') {
        u.ct += dt;
        if (u.hp <= 0) {
          if (u.ct > 0.8) u.dis = Math.min(1, u.dis + dt * 1.1);
          if (u.dis >= 1) u.gone = true;
        } else if (u.clip !== 'idle' && u.ct >= g.rigs[u.rig].clips[u.clip].dur) {
          u.clip = 'idle';
          u.ct = 0;
        }
      } else u.kb = Math.max(0, u.kb - dt * 5);
    }
    B.shake = Math.max(0, B.shake - dt * 2.6);
    if (B.phase === 'intro') {
      B.timer -= dt;
      if (B.timer <= 0) {
        newRound();
        B.oi = -1;
        nextTurn();
      }
    } else if (B.act) {
      const a = B.act;
      a.t += dt;
      for (const m of a.moves) {
        if (a.t < m.t0) continue;
        const k = Math.min(1, (a.t - m.t0) / (m.t1 - m.t0)),
          e = k * k * (3 - 2 * k),
          px = m.u.x,
          pz = m.u.z;
        m.u.x = m.a[0] + (m.b[0] - m.a[0]) * e;
        m.u.z = m.a[1] + (m.b[1] - m.a[1]) * e;
        if (m.u.side === 'hero') {
          m.u.dist += Math.hypot(m.u.x - px, m.u.z - pz);
          m.u.run = k < 1 && !m.hop;
          m.u.hop = m.hop ? Math.sin(Math.PI * k) * m.hop : 0;
        }
      }
      while (a.i < a.steps.length && a.steps[a.i].at <= a.t) a.steps[a.i++].fn();
      if (a.t >= a.dur) {
        B.act = null;
        for (const u of B.units) {
          if (u.hp > 0 || u.side === 'hero') {
            u.x = u.hx;
            u.z = u.hz;
          }
          if (u.side === 'hero') {
            u.run = false;
            u.hop = 0;
          }
        }
        afterAct();
      }
    } else if (B.phase === 'ending') {
      B.timer -= dt;
      if (B.timer <= 0) {
        B.phase = 'end';
        bmsg(B.end === 'won' ? def.wonMsg : def.lostMsg);
        $('bcmd').innerHTML = '<button class="wide" data-c="go">Continue</button>';
      }
    }
    g.cam.shake = B.shake;
    // bars, names and the turn arrow follow their owners
    for (const f of B.units)
      if (f.side === 'foe') {
        const on = f.hp > 0;
        f.el.style.display = f.nm.style.display = on ? 'block' : 'none';
        if (on) {
          const p = ui.toStage(g.look.project(f.x, GY + f.top, f.z));
          f.el.style.left = f.nm.style.left = p[0] + 'px';
          f.el.style.top = f.nm.style.top = p[1] + 'px';
          f.el.firstChild.style.width = Math.round((100 * f.hp) / f.mhp) + '%';
        }
      }
    const c = B.cur;
    if (c && c.hp > 0 && (B.phase === 'command' || (B.phase === 'act' && c.side === 'foe'))) {
      const p = ui.toStage(g.look.project(c.x, GY + (c.side === 'foe' ? c.top + 3.4 : 8.6), c.z));
      B.curEl.style.display = 'block';
      B.curEl.style.left = p[0] + 'px';
      B.curEl.style.top = p[1] + 'px';
    } else B.curEl.style.display = 'none';
  }

  // what to draw this frame
  function build(fr) {
    const SW = SP.SW,
      SH = SP.SH,
      t = g.t;
    for (const f of B.units) {
      if (f.side !== 'foe' || f.gone) continue;
      fr.models.push({ rig: g.rigs[f.rig], clip: f.clip, time: f.ct, x: f.x, y: GY, z: f.z, dis: f.dis, flash: f.fl, flashC: f.flc });
    }
    for (const u of B.units) {
      if (u.side === 'hero') fr.blobs.push({ x: u.x, y: GY + 0.25, z: u.z, r: u.ko ? 1.9 : 1.3 });
      else if (u.dis < 0.5) fr.blobs.push({ x: u.x + (u.shadowDx || 0), y: GY + 0.25, z: u.z, r: u.rad });
    }
    if (B.wall > 0) for (const u of living('hero')) fr.rings.push({ x: u.x, y: GY + 0.3, z: u.z, r: 2.1 + 0.12 * Math.sin(t * 5), col: [0.62, 0.8, 1] });
    if (B.phase === 'command' && (B.menu === 'foe' || B.menu === 'ally'))
      for (const u of living(B.menu === 'foe' ? 'foe' : 'hero')) fr.rings.push({ x: u.x, y: GY + 0.3, z: u.z, r: (u.side === 'foe' ? u.rad + 0.6 : 1.9) + 0.2 * Math.sin(t * 9), col: [1, 0.95, 0.6] });
    for (const u of B.units) {
      if (u.side !== 'hero') continue;
      const base = u.guard ? [0.78, 0.9, 1.25] : [0.9, 0.92, 1.02],
        k = u.fl,
        tint = [base[0] + (2.4 * u.flc[0] - base[0]) * k, base[1] + (2.4 * u.flc[1] - base[1]) * k, base[2] + (2.4 * u.flc[2] - base[2]) * k];
      if (u.ko) fr.sprites.push({ rect: SP.ko(u.ci), flip: 0, x: u.x, y: GY, z: u.z, tint: [0.7, 0.72, 0.86], offY: -1, bias: 0.66 });
      else fr.sprites.push({ rect: [(u.ci * SP.FR + (u.run ? Math.floor(u.dist / 1.5) % 4 : 1)) * SW, 2 * SH, SW, SH], flip: 1, x: u.x + u.kb * 0.9, y: GY + (u.hop || 0), z: u.z, tint, offY: -1, bias: 0.66 });
    }
  }

  return { B, start, update, build, tap };
}
