import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlat, JUMP } from '../engine/jump.js';

// level ground at 1, with a terrace 3 higher beyond z = 20 and a cliff 12 high beyond z = 40; three ledges like a stair
// along x = 0, and one off to the side
const ground = (x, z) => (z >= 40 ? 13 : z >= 20 ? 4 : 1),
  LEDGES = [[-2, 2, 4, 8, 3.9], [-2, 2, 7.5, 11.5, 6.8], [-2, 2, 11, 15, 9.7], [5, 9, 4, 8, 3.9]],
  P = createPlat(ground, LEDGES),
  APEX = (JUMP.v * JUMP.v) / (2 * JUMP.g);
// run a body for `secs`: `drive(b, t)` returns [dx/dt, dz/dt] and may ask for a jump
function run(b, secs, drive, dt = 0.02) {
  let top = b.y;
  for (let t = 0; t < secs - 1e-9; t += dt) {
    const v = drive(b, t) || [0, 0];
    P.step(b, v[0] * dt, v[1] * dt, dt);
    top = Math.max(top, b.y);
  }
  return top;
}
const jump = b => (b.want = 0);

test('a jump rises to the same height whatever the size of the steps it is taken in', () => {
  for (const dt of [1 / 120, 0.02, 1 / 30, 0.1]) {
    const b = P.body(0, 0);
    jump(b);
    const top = run(b, 2, () => null, dt);
    assert.ok(top <= 1 + APEX + 1e-6 && top > 1 + APEX - JUMP.g * dt * dt, 'at ' + dt + ' it topped out at ' + top);
    assert.ok(!b.air && Math.abs(b.y - 1) < 1e-9, 'and came down where it started');
  }
});

test('a ledge is passed through from below and stood on from above', () => {
  const b = P.body(0, 6);
  assert.equal(b.y, 1);
  jump(b);
  run(b, 1.2, () => null);
  assert.ok(!b.air && b.y === 3.9, 'jumped up through the ledge and landed on it: ' + b.y);
  // walking off its end drops to the ground
  run(b, 1, () => [0, -8]);
  assert.ok(!b.air && b.y === 1 && b.z < 4, 'off the end and down: ' + [b.y, b.z]);
});

test('walking under a ledge stays on the ground, and a ledge off to the side is not stood on', () => {
  const b = P.body(0, 0);
  run(b, 1.5, () => [0, 8]);
  assert.ok(b.y === 1 && b.z > 11, 'walked under all three');
  const c = P.body(3.5, 6);
  jump(c);
  run(c, 1.2, () => null);
  assert.equal(c.y, 1);
});

test('a stair of ledges is climbed a jump at a time', () => {
  const b = P.body(0, 5);
  // (each jump is made from the end of the ledge that lies under the next, straight up through it)
  for (const [z, y] of [[5, 3.9], [7.8, 6.8], [11.2, 9.7]]) {
    run(b, 1.5, q => [0, Math.max(-8, Math.min(8, (z - q.z) * 20))]);
    jump(b);
    run(b, 1.2, () => null);
    assert.ok(!b.air && b.y === y, 'onto the ledge at ' + y + ': ' + b.y);
  }
});

test('the ground is a wall where it rises more than a step: a terrace is jumped up, a cliff is not', () => {
  const b = P.body(0, 16);
  let hit = false;
  for (let i = 0; i < 60; i++) hit = P.step(b, 0, 8 * 0.02, 0.02) || hit;
  assert.ok(hit && b.z < 20 && b.y === 1, 'walking stops at the riser: ' + [b.z, b.y]);
  jump(b);
  run(b, 1.2, () => [0, JUMP.air]);
  assert.ok(!b.air && b.y === 4 && b.z > 20, 'a jump gets up the terrace: ' + [b.z, b.y]);
  // the cliff, 9 above the terrace, is more than a jump
  run(b, 3, () => [0, 8]);
  assert.ok(b.z < 40);
  jump(b);
  run(b, 1.5, () => [0, JUMP.air]);
  assert.ok(b.z < 40 && b.y === 4, 'no jump gets up the cliff: ' + [b.z, b.y]);
  // and coming back, walking off the terrace is a drop to the ground below
  run(b, 3, () => [0, -8]);
  assert.ok(!b.air && b.y === 1 && b.z < 20);
});

test('a riser is a wall however small the steps, and a stair or a hillside is not', () => {
  // (real ground comes as a slope between points half a unit apart: a terrace 3 up is a ramp half a unit long; a stair
  // has risers of 0.75 with treads between; a hillside climbs 1.2 for each unit)
  const ramp = (z, at, rise) => Math.max(0, Math.min(1, (z - at) / 0.5)) * rise,
    R = createPlat((x, z) => 1 + ramp(z, 10, 3)),
    S = createPlat((x, z) => 1 + ramp(z, 10, 0.75) + ramp(z, 12, 0.75) + ramp(z, 14, 0.75) + ramp(z, 16, 0.75)),
    H = createPlat((x, z) => 1 + Math.max(0, z - 10) * 1.2);
  for (const dt of [1 / 240, 1 / 60, 0.05]) {
    const b = R.body(0, 6);
    for (let t = 0; t < 2; t += dt) R.step(b, 0, 13 * dt, dt);
    assert.ok(b.z < 10 && b.y < 1.01, 'at ' + dt + ' the riser stopped the walk: ' + [b.z, b.y]);
    b.want = 0;
    for (let t = 0; t < 1.2; t += dt) R.step(b, 0, JUMP.air * dt, dt);
    assert.ok(!b.air && b.y === 4 && b.z > 10.5, 'and a jump got up it: ' + [b.z, b.y]);
    const c = S.body(0, 6);
    for (let t = 0; t < 1.2; t += dt) S.step(c, 0, 13 * dt, dt);
    assert.ok(!c.air && c.y === 4 && c.z > 17, 'at ' + dt + ' the stair is walked up: ' + [c.z, c.y]);
    const e = H.body(0, 6);
    for (let t = 0; t < 1; t += dt) H.step(e, 0, 13 * dt, dt);
    assert.ok(e.z > 15 && Math.abs(e.y - (1 + (e.z - 10) * 1.2)) < 0.3, 'and the hillside: ' + [e.z, e.y]);
  }
});

test('a jump asked for just before landing, or just after walking off an edge, still counts', () => {
  // (asked for 0.08 s before landing)
  const b = P.body(0, 0);
  jump(b);
  let again = false,
    second = 0;
  run(b, 2, (q, t) => {
    if (!again && q.vy < 0 && q.y - 1 < 1.3) (jump(q), (again = true));
    if (again && q.vy > 0 && t > 0.5) second = Math.max(second, q.y);
  });
  assert.ok(again && second > 1 + APEX * 0.9, 'the second jump was made on landing: ' + second);
  // (asked for 0.06 s after the feet left the ledge)
  const c = P.body(0, 4.3);
  jump(c);
  run(c, 1.2, () => null);
  assert.equal(c.y, 3.9);
  let off = -1,
    top = 0;
  run(c, 1.5, (q, t) => {
    if (off < 0 && q.air) off = t;
    if (off >= 0 && t - off >= 0.06 && t - off < 0.08) jump(q);
    if (off >= 0) top = Math.max(top, q.y);
    return off < 0 ? [0, -8] : [0, 0];
  });
  assert.ok(off >= 0 && top > 3.9 + APEX * 0.8, 'jumped from the air just past the edge: ' + top);
  // (but not half a second later)
  const e = P.body(0, 6);
  e.y = 9;
  e.air = true;
  e.since = 0.5;
  jump(e);
  run(e, 1, () => null);
  assert.equal(e.y, 3.9);
});

// ---- ledges that move, ledges that fall away, and the second jump
// run a body on Q for `secs` from time t0, the ledges going by the clock
function runOn(Q, b, secs, drive, t0 = 0, dt = 1 / 60) {
  let top = b.y,
    t = t0;
  for (; t < t0 + secs - 1e-9; t += dt) {
    Q.tick(t);
    const v = (drive && drive(b, t)) || [0, 0];
    Q.step(b, v[0] * dt, v[1] * dt, dt);
    top = Math.max(top, b.y);
  }
  return [top, t];
}

test('a ledge that glides carries whoever stands on it, and leaves alone whoever does not', () => {
  const Q = createPlat(() => 1, [[-2, 2, 0, 5, 5, { move: ['z', 3, 4, 0] }]]),
    b = Q.body(0, 2.5, 5),
    c = Q.body(0, 2.5);
  assert.ok(b.y === 5 && b.on === 0 && c.y === 1 && c.on === -1);
  let far = 0;
  for (let t = 0; t < 4; t += 1 / 60) {
    Q.tick(t);
    Q.step(b, 0, 0, 1 / 60);
    Q.step(c, 0, 0, 1 / 60);
    const l = Q.ledges[0];
    assert.ok(Math.abs(b.z - l.z0 - 2.5) < 1e-9 && b.y === 5 && !b.air, 'rides it: ' + [b.z, l.z0]);
    far = Math.max(far, Math.abs(b.z - 2.5));
  }
  assert.ok(far > 2.9 && far < 3.01, 'three either way: ' + far);
  assert.equal(c.z, 2.5);
  // walking off it while it moves is a drop to the ground
  runOn(Q, b, 1.5, () => [0, 13], 4);
  assert.ok(!b.air && b.y === 1 && b.on === -1);
});

test('a lift takes one up from the ground and sets one down again, and is landed on as it rises', () => {
  // (from the ground at 1 up to 7 and back in 6 s, starting at the bottom)
  const Q = createPlat(() => 1, [[-2, 2, 0, 4, 4, { move: ['y', 3, 6, 0.75] }]]),
    b = Q.body(0, 2);
  let top = 0;
  for (let t = 0; t < 6.5; t += 1 / 60) {
    Q.tick(t);
    Q.step(b, 0, 0, 1 / 60);
    assert.ok(!b.air, 'never dropped: at ' + t.toFixed(2));
    top = Math.max(top, b.y);
  }
  assert.ok(top > 6.99 && b.y < 1.5, 'up to ' + top + ' and down to ' + b.y);
  // a body dropped from above while the lift comes up to meet it
  const c = Q.body(0, 2);
  c.y = 9;
  c.air = true;
  c.since = 9;
  for (let t = 7; t < 9 && c.air; t += 1 / 60) {
    Q.tick(t);
    Q.step(c, 0, 0, 1 / 60);
  }
  assert.ok(!c.air && c.on === 0 && Math.abs(c.y - Q.ledges[0].y) < 1e-9 && c.y > 2, 'landed on it at ' + c.y);
  // and under it when it is up, one walks on the ground
  const e = Q.body(0, -3);
  runOn(Q, e, 0.4, () => [0, 13], 2.6);
  assert.ok(e.y === 1 && e.z > 1.5 && Q.ledges[0].y > 6);
});

test('a crumbling ledge falls away under whoever stands on it, and comes back', () => {
  const Q = createPlat(() => 1, [[-2, 2, 0, 5, 6, { crumble: 0.5, back: 2 }]]),
    b = Q.body(0, 2.5, 6);
  assert.ok(b.y === 6 && b.on === 0);
  let fell = -1;
  for (let t = 0; t < 2; t += 1 / 60) {
    Q.tick(t);
    Q.step(b, 0, 0, 1 / 60);
    if (fell < 0 && b.air) fell = t;
  }
  assert.ok(fell > 0.49 && fell < 0.56, 'it gave way after half a second: ' + fell);
  assert.ok(!b.air && b.y === 1 && Q.ledges[0].gone > 0, 'and its rider is on the ground');
  // gone, it is jumped through; back, it is landed on
  const jumpTop = t0 => {
    const c = Q.body(0, 2.5);
    c.want = 0;
    for (let t = t0; t < t0 + 1.2; t += 1 / 60) Q.step(c, 0, 0, 1 / 60);
    return c;
  };
  assert.ok(jumpTop(1).on === -1, 'no landing on it while it is gone');
  Q.tick(3);
  assert.equal(Q.ledges[0].gone, -1);
  const d = jumpTop(3);
  assert.ok(d.on === 0 && d.y === 6, 'there again: ' + [d.on, d.y]);
});

test('a body that can jump twice gets one more jump in the air, and no third', () => {
  const Q = createPlat(() => 1, []),
    b = Q.body(0, 0),
    c = Q.body(0, 0);
  b.double = true;
  for (const q of [b, c]) {
    q.want = 0;
    let asked = 0;
    const [top] = runOn(Q, q, 3, r => {
      if (r.air && r.vy <= 0 && asked < 2) ((r.want = 0), asked++);
    });
    q.top = top;
    assert.ok(!q.air && q.y === 1 && asked === 2);
  }
  const second = (JUMP.v * JUMP.second) ** 2 / (2 * JUMP.g);
  assert.ok(Math.abs(b.top - (1 + APEX + second)) < 0.05, 'twice: ' + b.top);
  // (the other's second asking, made high in the air, is long forgotten by the time it lands)
  assert.ok(Math.abs(c.top - (1 + APEX)) < 0.01, 'once: ' + c.top);
  // walking off an edge leaves the one jump in the air, after the grace is over
  const R = createPlat((x, z) => (z < 0 ? 10 : 1), []),
    e = R.body(0, -1);
  e.double = true;
  let off = -1,
    done = false,
    low = 99;
  runOn(R, e, 2, (r, t) => {
    if (off < 0 && r.air) off = t;
    if (off >= 0 && !done && t - off > 0.3) ((r.want = 0), (done = true), (low = r.y));
    return [0, r.z < 3 ? 8 : 0];
  });
  assert.ok(done && low < 10 && e.y === 1, 'and it was made in the air, from ' + low);
});

test('a small gap between two ledges is run across; a wider one is a fall', () => {
  // (at a walk a body dips under a ledge's edge within a unit and a quarter of leaving the last)
  for (const [gap, over] of [[1, true], [1.2, true], [1.6, false], [3, false]]) {
    const Q = createPlat(() => 1, [[-2, 2, 0, 5, 6], [-2, 2, 5 + gap, 10 + gap, 6]]),
      b = Q.body(0, 2.5, 6);
    runOn(Q, b, 0.6, () => [0, 13]);
    assert.ok(over ? b.y === 6 && b.on === 1 : b.y < 6, 'a gap of ' + gap + ': ' + [b.z.toFixed(2), b.y.toFixed(2), b.on]);
  }
  // and a jump that tops out a hair under a ledge's top still lands on it
  const Q = createPlat(() => 1, [[-2, 2, 0, 5, 1 + APEX + 0.2], [-2, 2, 10, 15, 1 + APEX + 0.6]]);
  for (const [z, on] of [[2.5, true], [12.5, false]]) {
    const b = Q.body(0, z);
    b.want = 0;
    runOn(Q, b, 1.2);
    assert.equal(b.on >= 0, on);
  }
});

test('a cliff is upright: nothing lands half-way up its face, and no run of jumps climbs it', () => {
  // (real ground: 1 below, 13 above, a ramp half a unit long between them from z = 10 to 10.5; a terrace 4 up at z = 30)
  const ramp = (z, at, rise) => Math.max(0, Math.min(1, (z - at) / 0.5)) * rise,
    Q = createPlat((x, z) => 1 + ramp(z, 10, 12) + ramp(z, 30, 4));
  assert.equal(Q.ground(0, 10.25), 1);
  assert.ok(Q.ground(0, 10.49) > 12.5 && Q.ground(0, 10.01) < 1.5 && Q.ground(0, 9) === 1 && Q.ground(0, 11) === 13);
  const b = Q.body(0, 6);
  let top = 0;
  for (let n = 0; n < 12; n++) {
    b.want = 0;
    for (let t = 0; t < 0.9; t += 1 / 60) {
      Q.step(b, 0, JUMP.air / 60, 1 / 60);
      top = Math.max(top, b.y);
    }
    assert.ok(!b.air && b.y === 1, 'after jump ' + n + ' at it, back on the ground below: ' + [b.z.toFixed(2), b.y.toFixed(2)]);
  }
  assert.ok(top < 1 + APEX + 0.01 && b.z < 10.5);
  // off the top it is a clean drop to the foot
  const c = Q.body(0, 14);
  assert.equal(c.y, 13);
  runOn(Q, c, 2, () => [0, -8]);
  assert.ok(!c.air && c.y === 1 && c.z < 10.1, 'walked off the top: ' + [c.z.toFixed(2), c.y]);
  // and a terrace within a jump's reach is still jumped up
  const e = Q.body(0, 26);
  for (let t = 0; t < 1; t += 1 / 60) Q.step(e, 0, 13 / 60, 1 / 60);
  assert.ok(e.z < 30.1 && e.y === 13, 'the terrace stops a walk: ' + [e.z.toFixed(2), e.y]);
  e.want = 0;
  for (let t = 0; t < 1; t += 1 / 60) Q.step(e, 0, JUMP.air / 60, 1 / 60);
  assert.ok(!e.air && e.y === 17 && e.z > 30.5, 'and a jump gets up it: ' + [e.z.toFixed(2), e.y]);
});

test('a fork is the same place at the same moment, and goes its own way after', () => {
  const Q = createPlat(() => 1, [[-2, 2, 0, 5, 6, { crumble: 0.5, back: 2 }], [-2, 2, 8, 12, 4, { move: ['z', 2, 3, 0] }]]),
    b = Q.body(0, 2.5, 6);
  for (let t = 0; t < 0.3; t += 1 / 60) {
    Q.tick(t);
    Q.step(b, 0, 0, 1 / 60);
  }
  const F = Q.fork(),
    c = { ...b };
  assert.deepEqual(F.ledges.map(l => [l.z0, l.y, l.stood, l.gone]), Q.ledges.map(l => [l.z0, l.y, l.stood, l.gone]));
  for (let t = Q.now + 1 / 60; t < 1; t += 1 / 60) {
    F.tick(t);
    F.step(c, 0, 0, 1 / 60);
  }
  assert.ok(c.y === 1 && F.ledges[0].gone > 0, 'the fork saw it fall');
  assert.ok(b.y === 6 && Q.ledges[0].gone === -1 && Q.now < 0.31, 'and the first is as it was');
});

// ---- the areas' own climbs, on their real ground: the ledges a scene gives, in its order, and the lines over them
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createLanes } from '../engine/lanes.js';
import { Nav } from '../engine/nav.js';
import { genMain } from '../engine/gen/genmain.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const f of fs.readdirSync(path.join(root, 'game/areas'))) {
  const a = JSON.parse(fs.readFileSync(path.join(root, 'game/areas', f), 'utf8'));
  if (!a.side || !a.side.jump || a.side.only) continue; // (an area that is all climb has its own test: course.test.js)
  test(a.name + ': its ledges can be climbed one from another, and the lines beyond them walked', async () => {
    const scene = (await import(pathToFileURL(path.join(root, 'game/scenes', a.scene + '.js')))).default,
      w = genMain(scene, () => {}).walk,
      nav = new Nav({ NU: w.NU, C: w.C, N: w.N, RS: w.RS, BL: w.BL, GH: w.GH }),
      Q = createPlat((x, z) => nav.gh(x, z), w.ledges),
      lanes = createLanes(a.side),
      dt = 1 / 60;
    assert.ok(Q.ledges.length > 0, 'the scene gives its ledges');
    // (each ledge lies over one lane)
    const lane = lanes.segs.find(s => !s.col && Q.ledges.every(l => s.c >= l.x0 && s.c <= l.x1));
    assert.ok(lane, 'one lane runs over all the ledges');
    // (it is come to along a column that can be walked on the ground all the way)
    const way = lane.cross.find(k => {
      const far = Math.abs(k.s.a - lane.c) > Math.abs(k.s.b - lane.c) ? k.s.a : k.s.b;
      let y = nav.gh(far, k.s.c);
      for (let x = far; Math.abs(x - lane.c) > 0.01; x += Math.sign(lane.c - x) * Math.min(0.25, Math.abs(lane.c - x))) {
        if (!Q.open(x, k.s.c, y)) return false;
        y = Q.floor(x, k.s.c, y + JUMP.step);
      }
      return Math.abs(Q.floor(lane.c, k.s.c, y + JUMP.step) - nav.gh(lane.c, k.s.c)) < 1e-6;
    });
    assert.ok(way, 'a column comes to the foot of the climb over plain ground');
    const b = Q.body(lane.c, way.t),
      APEX2 = (JUMP.v * JUMP.v) / (2 * JUMP.g);
    assert.ok(Math.abs(b.y - nav.gh(b.x, b.z)) < 1e-6, 'starting on the ground');
    let clock = 0,
      from = b.y,
      rise = 0;
    for (const [k, l] of Q.ledges.entries()) {
      let t = 0;
      for (; t < 12 && (b.air || b.y !== l.y); t += dt) {
        // A plain climber: toward the ledge, a step inside its nearer end; a jump at a wall, or when the ledge is near
        // enough to land on; and in the air on toward it.
        const aim = Math.max(l.z0 + 1, Math.min(l.z1 - 1, b.z)),
          v = b.air ? JUMP.air : 13,
          dz = Math.max(lane.a - b.z, Math.min(lane.b - b.z, Math.max(-v * dt, Math.min(v * dt, aim - b.z)))),
          was = b.air,
          hit = Q.step(b, 0, dz, dt);
        if (was && !b.air) rise = Math.max(rise, b.y - from);
        if (!b.air) {
          from = b.y;
          if (l.y > b.y && (hit || (Math.abs(aim - b.z) < 3.4 && l.y - b.y < APEX2))) b.want = 0;
        }
      }
      assert.ok(!b.air && b.y === l.y, 'onto ledge ' + k + ' within ' + t.toFixed(1) + ' s: at ' + [b.z.toFixed(1), b.y.toFixed(1)]);
      clock += t;
    }
    assert.ok(rise < APEX2 - 0.6, 'no jump of the climb is near the limit: the highest rises ' + rise.toFixed(2) + ' of ' + APEX2.toFixed(2));
    // (and no two things to stand on are so close, one over the other, that someone on the lower has their head in the upper)
    for (const l of Q.ledges)
      for (let z = l.z0 + 0.25; z < l.z1; z += 0.5) {
        const under = Q.floor(lane.c, z, l.y - 0.01);
        assert.ok(l.y - under > 5.4, 'under the ledge at ' + l.y.toFixed(1) + ' there is ' + (l.y - under).toFixed(1) + ' of room at z ' + z);
      }
    // from the top ledge, along the lines to each thing up there that can be used: walking, and jumping where a wall stops it
    const up = (a.props || []).filter(p => p.poi && w.poi[p.poi] && nav.gh(w.poi[p.poi][0], w.poi[p.poi][1]) > b.y - 3);
    assert.ok(up.length > 0, 'there is something to find at the top');
    for (const p of up) {
      const at = w.poi[p.poi],
        goal = lanes.snap(at[0], at[1]),
        r = lanes.route([b.x, b.z], [goal.x, goal.z]);
      assert.ok(r && r.off < 0.05, 'the top ledge is on the lines');
      assert.ok(Math.hypot(goal.x - at[0], goal.z - at[1]) <= (p.r || 2.5) + 6, 'a line passes the ' + p.id);
      let t = 0,
        jumps = 0;
      for (const q of r.path)
        for (; t < 60 && Math.hypot(q[0] - b.x, q[1] - b.z) > 0.05; t += dt) {
          const d = Math.hypot(q[0] - b.x, q[1] - b.z),
            m = Math.min(d, (b.air ? JUMP.air : 13) * dt),
            hit = Q.step(b, ((q[0] - b.x) / d) * m, ((q[1] - b.z) / d) * m, dt);
          if (hit && !b.air) ((b.want = 0), jumps++);
        }
      assert.ok(Math.hypot(goal.x - b.x, goal.z - b.z) < 0.1 && !b.air, 'reached the ' + p.id + ' in ' + t.toFixed(1) + ' s with ' + jumps + ' more jumps: at ' + [b.x.toFixed(1), b.z.toFixed(1), b.y.toFixed(1)]);
      assert.ok(Math.abs(b.y - nav.gh(b.x, b.z)) < 1e-6, 'standing on the ground there');
      if (process.env.SPOTS) console.log(a.name, 'climb', clock.toFixed(1), 's, highest jump', rise.toFixed(2), '; then', t.toFixed(1), 's and', jumps, 'jumps to the', p.id, 'at height', b.y.toFixed(1));
    }
  });
}
