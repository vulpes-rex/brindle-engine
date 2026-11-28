import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createLanes } from '../engine/lanes.js';
import { Nav } from '../engine/nav.js';
import { genMain } from '../engine/gen/genmain.js';

// two lanes five apart, joined by a column at each end, and a spur off the far lane
const L = createLanes({
  lanes: [
    { x: 0, z: [-10, 10] },
    { x: -5, z: [-10, 10] }
  ],
  columns: [
    { z: -10, x: [-5, 0] },
    { z: 10, x: [-5, 0] },
    { z: 2, x: [-9, -5] }
  ]
});
const near = (p, q) => Math.abs(p[0] - q[0]) < 1e-6 && Math.abs(p[1] - q[1]) < 1e-6;

test('lanes and columns know where they cross', () => {
  const [road, back, south, north, spur] = L.segs;
  assert.deepEqual(road.cross.map(k => k.t), [-10, 10]);
  assert.deepEqual(back.cross.map(k => k.t), [-10, 2, 10]);
  assert.deepEqual(spur.cross.map(k => k.s), [back]);
  assert.deepEqual(L.on(0, -10).sort((a, b) => a.col - b.col), [road, south]);
  assert.deepEqual(L.on(-2, 3), []);
  assert.ok(near([L.snap(-2, 3).x, L.snap(-2, 3).z], [0, 3]) && Math.abs(L.snap(-2, 3).d - 2) < 1e-9);
  assert.ok(north.cross.length === 2);
});

test('a route keeps to the lines and turns only at crossings', () => {
  // along one lane: a single leg
  assert.deepEqual(L.route([0, -4], [0, 7]).path, [[0, 7]]);
  // to the other lane: by the nearer column, as corners only
  assert.deepEqual(L.route([0, -6], [-5, -3]).path, [[0, -10], [-5, -10], [-5, -3]]);
  assert.deepEqual(L.route([0, 6], [-5, 3]).path, [[0, 10], [-5, 10], [-5, 3]]);
  // out along the spur
  assert.deepEqual(L.route([0, 8], [-9, 2]).path, [[0, 10], [-5, 10], [-5, 2], [-9, 2]]);
  assert.ok(Math.abs(L.route([0, 8], [-9, 2]).length - 19) < 1e-9);
  // every leg runs along x or along z
  let p = [0, 8];
  for (const q of L.route([0, 8], [-9, 2]).path) {
    assert.ok(Math.abs(p[0] - q[0]) < 1e-9 || Math.abs(p[1] - q[1]) < 1e-9);
    p = q;
  }
  // a point off the lines is taken to the nearest of them, and the route says how far off it was
  const r = L.route([1.5, 0], [0, 4]);
  assert.ok(near(r.start, [0, 0]) && Math.abs(r.off - 1.5) < 1e-9);
  assert.deepEqual(r.path, [[0, 4]]);
  // going nowhere is one leg of no length
  assert.deepEqual(L.route([0, 3], [0, 3]).path, [[0, 3]]);
});

test('the next stop along a line is a crossing or its end', () => {
  const back = L.segs[1],
    spur = L.segs[4];
  assert.equal(L.next(back, 0, 1), 2);
  assert.equal(L.next(back, 2, 1), 10);
  assert.equal(L.next(back, 10, 1), null);
  assert.equal(L.next(back, 0, -1), -10);
  assert.equal(L.next(spur, -5, -1), -9);
  assert.equal(L.next(spur, -5, 1), null);
});

test('a key turns onto another line only at or near a crossing with room that way', () => {
  const [road, back, south, , spur] = L.segs;
  // on a lane: along it, until its end
  assert.deepEqual(L.turn(0, 3, false, 1, 1.3), { s: road, via: null });
  assert.equal(L.turn(0, 10, false, 1, 1.3), null);
  // onto a column: only near where it meets the lane, and only the way it runs from there
  assert.equal(L.turn(0, 3, true, -1, 1.3), null);
  assert.deepEqual(L.turn(0, -9.2, true, -1, 1.3), { s: south, via: [0, -10] });
  assert.equal(L.turn(0, -9.2, true, 1, 1.3), null);
  assert.deepEqual(L.turn(-5, 2.6, true, -1, 1.3), { s: spur, via: [-5, 2] });
  // and from a column back onto a lane
  assert.deepEqual(L.turn(-4.4, -10, false, 1, 1.3), { s: back, via: [-5, -10] });
});

// ---- the areas' own lines
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const f of fs.readdirSync(path.join(root, 'game/areas'))) {
  const a = JSON.parse(fs.readFileSync(path.join(root, 'game/areas', f), 'utf8'));
  if (!a.side) continue;
  test(a.name + ': the side view’s lines can all be walked, join up, and reach everyone and everything', async () => {
    const scene = (await import(pathToFileURL(path.join(root, 'game/scenes', a.scene + '.js')))).default,
      w = genMain(scene, () => {}).walk,
      nav = new Nav({ NU: w.NU, C: w.C, N: w.N, RS: w.RS, BL: w.BL, GH: w.GH }),
      lanes = createLanes(a.side),
      samp = lanes.samples(0.25),
      at = o => (o.poi ? [w.poi[o.poi][0] + (o.d ? o.d[0] : 0), w.poi[o.poi][1] + (o.d ? o.d[1] : 0)] : o.at);
    // (someone who stays put blocks the cells around them, as in the field)
    for (const n of a.actors || [])
      if (!n.wander) {
        const p = at(n);
        for (let dz = -1; dz <= 1; dz++)
          for (let dx = -1; dx <= 1; dx++) {
            const j = nav.cell(p[0] + dx, p[1] + dz);
            if (j >= 0) nav.BL[j] = 1;
          }
      }
    // (a line over ledges or up a cliff is the jumping test's business: test/jump.test.js)
    for (const q of samp) assert.ok(q[2].ledge || !nav.blocked(q[0], q[1]), 'the ' + q[2].name + (q[2].col ? ' column' : ' lane') + ' is blocked at ' + q[0] + ', ' + q[1]);
    // (unless the area is one line and nothing else)
    for (const s of lanes.segs) assert.ok(lanes.segs.length < 2 || s.cross.length > 0, 'the ' + s.name + ' line meets no other');
    const s0 = lanes.segs[0];
    for (const s of lanes.segs) for (const t of [s.a, s.b]) assert.ok(lanes.route(lanes.pt(s0, s0.a), lanes.pt(s, t)), 'no way to the ' + s.name + ' line');
    // (the field stands the leader 2.2 to 6 from a person, and from just clear of a thing to 6 beyond it)
    for (const n of a.actors || []) {
      const p = at(n);
      assert.ok(samp.some(q => { const d = Math.hypot(q[0] - p[0], q[1] - p[1]); return d >= 2.2 && d <= 6; }), 'no line passes ' + n.name);
    }
    for (const n of a.props || []) {
      const p = at(n),
        r = n.r || 2.5;
      assert.ok(samp.some(q => { const d = Math.hypot(q[0] - p[0], q[1] - p[1]); return d >= r + 0.3 && d <= r + 6; }), 'no line passes the ' + n.id);
    }
    for (const [name, sp] of Object.entries(a.spawns || {})) {
      const p = at(sp);
      assert.ok(lanes.snap(p[0], p[1]).d < 0.05, 'the "' + name + '" spawn is off the lines');
    }
  });
}
