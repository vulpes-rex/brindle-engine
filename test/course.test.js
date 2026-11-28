// An area that is all climb (seen side-on "only", with jumping) is played through here on its real ground by someone who
// plays plainly: walks north, jumps where the floor ends, waits for a ledge that moves until a jump would land on it. What
// is checked is that the course can be finished, with room to spare at each jump, and that what the second jump is for
// cannot be done without it.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createPlat, JUMP } from '../engine/jump.js';
import { createLanes } from '../engine/lanes.js';
import { Nav } from '../engine/nav.js';
import { genMain } from '../engine/gen/genmain.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  DT = 1 / 60,
  WALK = 13;

for (const f of fs.readdirSync(path.join(root, 'game/areas'))) {
  const a = JSON.parse(fs.readFileSync(path.join(root, 'game/areas', f), 'utf8'));
  if (!a.side || !a.side.jump || !a.side.only) continue;
  test(a.name + ': the course can be played through, with room to spare', async () => {
    const scene = (await import(pathToFileURL(path.join(root, 'game/scenes', a.scene + '.js')))).default,
      w = genMain(scene, () => {}).walk,
      nav = new Nav({ NU: w.NU, C: w.C, N: w.N, RS: w.RS, BL: w.BL, GH: w.GH }),
      P = createPlat((x, z) => nav.gh(x, z), w.ledges, { kill: a.side.kill }),
      lanes = createLanes(a.side),
      lane = lanes.segs[0],
      X = lane.c,
      spawn = Object.values(a.spawns)[0].at,
      b = P.body(X, spawn[1]),
      log = [];
    assert.ok(lanes.segs.length === 1 && !lane.col, 'one lane');
    assert.ok(P.kill > -1e8, 'the area says how far down is out of the world');
    let now = 0;
    // one frame of the real thing: dir is -1, 0 or 1 along the lane; jump asks for one
    const frame = (Q, q, dir, jump, t) => {
      Q.tick(t);
      if (jump) q.want = 0;
      const v = (q.air ? JUMP.air : WALK) * dir,
        z1 = Math.max(lane.a, Math.min(lane.b, q.z + v * DT));
      Q.step(q, 0, z1 - q.z, DT);
    };
    const dead = q => q.y < P.kill;
    // What would a jump made now come to, holding north (and, `twice`, jumping again at the top)? Tried on a fork: where
    // it lands { on, y, z, t, dead }, how near the landing was to the ends of what it landed on, and how high it rose.
    const tryJump = (from, t0, twice, hold = 1) => {
      const Q = P.fork(),
        q = { ...from };
      let t = t0,
        again = false,
        top = q.y;
      frame(Q, q, hold, true, t);
      for (t += DT; t < t0 + 3 && q.air && !dead(q); t += DT) {
        const second = twice && !again && q.vy <= 0 && q.extra > 0;
        if (second) again = true;
        frame(Q, q, hold, second, t);
        top = Math.max(top, q.y);
      }
      const l = q.on >= 0 ? Q.ledges[q.on] : null;
      // (on the ground, room is there if it is level a little way back: not the very lip of a pit)
      return { on: q.on, y: q.y, z: q.z, t: t - t0, dead: dead(q) || q.air, room: l ? Math.min(q.z - l.z0, l.z1 - q.z) : P.ground(X, q.z - 0.7) > q.y - 0.5 ? 9 : 0, top };
    };
    // where the floor ends ahead: nothing to stand on within a step, a little way on
    const edge = (q, d = 0.6) => P.floor(X, q.z + d, q.y + JUMP.step) < q.y - JUMP.step;
    // walk north until `until` says so or the floor ends; false if the walk is stopped or lost first
    const walk = (until, secs = 20) => {
      for (const t1 = now + secs; now < t1; now += DT) {
        if (until(b)) return true;
        if (dead(b)) return false;
        frame(P, b, 1, false, now);
      }
      return false;
    };
    const stand = (until, secs = 20) => {
      for (const t1 = now + secs; now < t1; now += DT) {
        if (until(b)) return true;
        if (dead(b) || b.air) return false;
        frame(P, b, 0, false, now);
      }
      return false;
    };
    // make the jump for real: north all the way, or easing off so as to come down where `aim` says
    const leap = (twice, aim) => {
      let again = false;
      frame(P, b, 1, true, now);
      for (now += DT; b.air && !dead(b); now += DT) {
        const second = twice && !again && b.vy <= 0 && b.extra > 0;
        if (second) again = true;
        frame(P, b, aim !== undefined && b.z >= aim ? 0 : 1, second, now);
      }
      return !dead(b);
    };
    const onGround = (q, y) => !q.air && q.on === -1 && Math.abs(q.y - y) < 0.01;
    const L = P.ledges,
      movers = L.filter(l => l.move && l.move[0] === 'z'),
      lift = L.find(l => l.move && l.move[0] === 'y'),
      planks = L.filter(l => l.crumble),
      shelves = L.filter(l => !l.dyn);
    assert.ok(movers.length >= 2 && lift && planks.length >= 2 && shelves.length >= 2, 'the course has gliding slabs, a lift, planks that give way and shelves');

    // ---- 1. the pits before the chasm: each cleared by a jump from its edge, and as well from a full unit short of it
    let pits = 0;
    while (b.z < movers[0].base[2] - 4) {
      assert.ok(walk(q => edge(q) || q.z > movers[0].base[2] - 4), 'walked to the next pit: at ' + b.z.toFixed(1));
      if (!edge(b)) break;
      const short = tryJump({ ...b, z: b.z - 1 }, now, false),
        here = tryJump(b, now, false);
      assert.ok(!here.dead && here.on === -1 && here.z > b.z + 3, 'pit ' + pits + ' is cleared from its edge (' + b.z.toFixed(1) + '): lands at ' + here.z.toFixed(1));
      assert.ok(!short.dead && short.on === -1 && short.z > b.z + 3, 'pit ' + pits + ' is cleared from a unit short of its edge: lands at ' + short.z.toFixed(1));
      const from = b.z;
      assert.ok(leap(false), 'jumped pit ' + pits);
      log.push('pit ' + pits + ': ' + from.toFixed(1) + ' to ' + b.z.toFixed(1) + ' at height ' + b.y.toFixed(1));
      pits++;
      // (a walk into it instead is a fall out of the world)
      const Q = P.fork(),
        q = { ...b, z: from, y: P.floor(X, from, 99), air: false, on: -1 };
      for (let t = now; t < now + 3 && !dead(q); t += DT) frame(Q, q, 1, false, t);
      assert.ok(dead(q), 'walking into pit ' + (pits - 1) + ' is a fall out of the world');
    }
    assert.ok(pits >= 3, 'three pits or more before the chasm: ' + pits);

    // ---- 2. the chasm: onto the first slab, from it to the second when they come together, and off on the far bank
    assert.ok(walk(q => edge(q)), 'to the brink of the chasm');
    const hop = (to, what, secs = 12) => {
      // wait until a jump made now would land on `to` (a ledge's index, or -1 for ground further on) well inside it
      const z0 = b.z,
        ok = r => !r.dead && r.on === to && r.room > 0.7 && (to >= 0 || (r.z > z0 + 1.5 && r.y > b.y - 1));
      assert.ok(stand(q => ok(tryJump(q, now, false)), secs), 'a moment came to jump ' + what);
      const waited = now;
      assert.ok(leap(false) && b.on === to, 'jumped ' + what + ': on ' + b.on + ' at ' + b.z.toFixed(1));
      return waited;
    };
    hop(movers[0].i, 'onto the first slab');
    // (to its north end, then across: and how long in each round of theirs the jump is on)
    const ride = (l, off = 0.6) => {
      for (let n = 0; n < 240 && Math.abs(b.z - (l.z1 - off)) > 0.05; n++, now += DT) frame(P, b, Math.sign(l.z1 - off - b.z) * Math.min(1, Math.abs(l.z1 - off - b.z) / (WALK * DT)), false, now);
      return !b.air && b.on === l.i;
    };
    assert.ok(ride(movers[0]), 'walked along the first slab as it went');
    {
      let open = 0;
      const period = movers[0].move[2],
        Q0 = P.fork(),
        q0 = { ...b };
      for (let t = now; t < now + period; t += DT) {
        frame(Q0, q0, 0, false, t);
        // (standing at its north end the whole round)
        const Q = Q0.fork(),
          q = { ...q0 };
        let tt = t;
        frame(Q, q, 1, true, tt);
        for (tt += DT; tt < t + 3 && q.air && q.y >= P.kill; tt += DT) frame(Q, q, 1, false, tt);
        if (!q.air && q.on === movers[1].i) {
          const l = Q.ledges[q.on];
          if (Math.min(q.z - l.z0, l.z1 - q.z) > 0.5) open += DT;
        }
      }
      log.push('the jump between the slabs is on for ' + open.toFixed(2) + ' s of every ' + period);
      assert.ok(open >= 0.8, 'the jump between the slabs is on for a good part of each round: ' + open.toFixed(2) + ' s');
      assert.ok(open <= period * 0.7, 'and is not always on (it is a thing to time): ' + open.toFixed(2) + ' s');
    }
    hop(movers[1].i, 'from the first slab to the second');
    assert.ok(ride(movers[1]), 'walked along the second slab');
    hop(-1, 'off the second slab onto the far bank');
    assert.ok(onGround(b, P.floor(X, b.z, 99)) && b.z > movers[1].base[3], 'across the chasm: at ' + b.z.toFixed(1));
    log.push('across the chasm at ' + now.toFixed(1) + ' s');

    // ---- 3. the lift: stood under until it comes down, ridden up, and left for the first shelf
    const up = shelves[0];
    // (the gallery is out of a jump's reach from the floor)
    {
      const below = { ...b, z: (up.z0 + up.z1) / 2 },
        r = tryJump(below, now, false, 0);
      assert.ok(r.on === -1 && r.top < up.y - 1, 'no jump from the floor reaches the gallery: rises to ' + r.top.toFixed(1) + ' of ' + up.y);
    }
    const mid = (lift.z0 + lift.z1) / 2;
    assert.ok(walk(q => q.z >= mid), 'walked to where the lift comes down: ' + JSON.stringify(b) + ' mid ' + mid);
    assert.ok(stand(q => q.on === lift.i), 'the lift picked the leader up');
    assert.ok(stand(q => q.on !== lift.i || L[lift.i].y > up.y - 0.6), 'and carried them up');
    assert.ok(b.on === lift.i && !b.air, 'still on it at the top');
    assert.ok(walk(q => q.z >= lift.z1 - 0.6 || q.on !== lift.i, 3), 'to its north end');
    hop(up.i, 'from the lift to the first shelf', 8);

    // ---- 4. the planks: run and jump, never standing; each gives way behind
    let gave = 0;
    for (const pl of planks) {
      assert.ok(walk(q => edge(q), 2), 'to the end of what is underfoot: at ' + b.z.toFixed(1));
      const r = tryJump(b, now, false);
      assert.ok(!r.dead && r.on === pl.i && r.room > 0.3, 'the jump to plank ' + pl.i + ' lands on it with room: ' + r.room.toFixed(2));
      assert.ok(leap(false) && b.on === pl.i, 'onto plank ' + pl.i);
      // (someone who stops here goes down with it, to the floor below: a walk back, not a fall out of the world)
      const Q = P.fork(),
        q = { ...b };
      let t = now;
      for (; t < now + 4 && !(q.on === -1 && !q.air); t += DT) frame(Q, q, 0, false, t);
      assert.ok(Q.ledges[pl.i].gone > 0 && !dead(q) && q.y < pl.y - 3, 'standing still on plank ' + pl.i + ' is a drop to the floor below');
      gave++;
    }
    assert.ok(walk(q => edge(q), 2), 'to the end of the last plank');
    {
      const stood = now - L[planks[planks.length - 1].i].stood;
      assert.ok(stood < planks[0].crumble - 0.1, 'with time left on the last plank: ' + stood.toFixed(2) + ' of ' + planks[0].crumble + ' s');
      const r = tryJump(b, now, false);
      assert.ok(!r.dead && r.on === -1 && Math.abs(r.y - up.y) < 0.6, 'the jump off the planks lands on the high block');
      assert.ok(leap(false), 'onto the high block');
    }
    const blockY = b.y;
    assert.ok(onGround(b, blockY) && blockY > 8, 'on the high block at ' + blockY.toFixed(1));
    log.push('on the high block at ' + now.toFixed(1) + ' s, ' + gave + ' planks behind');

    // ---- 5. past the block: the shelf below the balcony is out of one jump's reach from anywhere on it, and in two's
    const shelf = shelves[shelves.length - 1],
      relic = (a.props || []).find(p => p.id === 'relic');
    assert.ok(relic && a.side.double, 'there is a relic, and a flag for the second jump');
    assert.ok(walk(q => edge(q), 4), 'to the north end of the block: ' + b.z.toFixed(1));
    const brink = b.z;
    for (let z = brink; z > brink - 8; z -= 0.25) {
      const from = { ...b, z, y: P.floor(X, z, 99) };
      for (const hold of [1, 0.5]) {
        const r = tryJump(from, now, false, hold);
        assert.ok(r.on !== shelf.i && !(r.on === -1 && r.y > blockY + 3), 'without the second jump nothing higher is reached from ' + z.toFixed(2) + ': ' + JSON.stringify(r));
      }
    }
    b.double = true;
    {
      const r = tryJump(b, now, true);
      assert.ok(!r.dead && r.on === shelf.i, 'with it, two jumps from the brink land on the shelf: ' + JSON.stringify(r));
      assert.ok(r.room > 0.4, 'holding north the whole way still lands on it, with room: ' + r.room.toFixed(2));
      // (and from a unit and a half short of the brink)
      const s = tryJump({ ...b, z: b.z - 1.5 }, now, true);
      assert.ok(!s.dead && s.on === shelf.i, 'and from short of the brink: ' + JSON.stringify(s));
    }
    assert.ok(leap(true) && b.on === shelf.i, 'onto the shelf');
    assert.ok(walk(q => edge(q), 3), 'to its north end');
    {
      const r = tryJump(b, now, false);
      assert.ok(!r.dead && r.on === -1 && r.y > shelf.y + 2, 'one more jump reaches the balcony: ' + JSON.stringify(r));
      assert.ok(leap(false), 'onto the balcony');
    }
    const chest = w.poi.chest;
    assert.ok(chest && Math.abs(b.y - chest[2]) < 0.01, 'the balcony is where the chest is: ' + b.y);
    assert.ok(walk(q => q.z >= chest[1], 4) && onGround(b, chest[2]), 'walked to the chest');
    log.push('at the chest at ' + now.toFixed(1) + ' s');
    // everything to be used is beside the lane, at the height of the ground there
    for (const p of a.props || []) {
      const at = w.poi[p.poi];
      assert.ok(at && Math.abs(at[0] - X) <= (p.r || 2.5) + 6 && at[1] >= lane.a - 3 && at[1] <= lane.b + 3, 'the ' + p.id + ' is beside the lane');
      if (at.length > 2) assert.ok(Math.abs(nav.gh(X, at[1]) - at[2]) < 0.01, 'the ' + p.id + ' is at the height of the ground beside it');
    }
    if (process.env.SPOTS) console.log(a.name + ':\n  ' + log.join('\n  '));
  });
}
