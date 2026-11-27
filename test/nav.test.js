import test from 'node:test';
import assert from 'node:assert/strict';
import { Nav } from '../engine/nav.js';

// a 20 x 20 map, flat at height 2, with a wall across the middle that has one gap; drawn from rows of text ('#' blocked)
function map(rows) {
  const NU = rows.length,
    BL = new Uint8Array(NU * NU),
    N = NU * 2,
    GH = new Float32Array(N * N).fill(2);
  rows.forEach((r, z) => [...r].forEach((c, x) => (BL[z * NU + x] = c === '#' ? 1 : 0)));
  return new Nav({ NU, C: NU / 2, N, RS: 2, BL, GH });
}
const rows = Array.from({ length: 20 }, (_, z) => (z === 10 ? '################..##' : '....................'));

test('cells, blocking and ground height', () => {
  const nav = map(rows);
  assert.equal(nav.cell(-10, -10), 0);
  assert.equal(nav.cell(10, 0), -1);
  assert.equal(nav.blocked(0.5, 0.5), true); // the wall
  assert.equal(nav.blocked(6.5, 0.5), false); // its gap
  assert.equal(nav.gh(3.3, -4.2), 2);
  assert.equal(nav.shade(0, 0), 1);
});

test('a route goes through the gap, in a few straight legs', () => {
  const nav = map(rows),
    reach = nav.flood(-5, -5),
    path = nav.route([-5, -5], [-5, 5], reach);
  assert.ok(path && path.length >= 2 && path.length <= 5, 'legs: ' + (path && path.length));
  assert.deepEqual(path[path.length - 1], [-5, 5]);
  assert.ok(path.some(p => p[0] > 5.5 && p[0] < 8.5), 'passes the gap');
  let prev = [-5, -5];
  for (const p of path) {
    assert.ok(nav.los(prev[0], prev[1], p[0], p[1]), 'each leg is clear');
    prev = p;
  }
});

test('a route to a point in the cell one already stands in is its one short leg', () => {
  const nav = map(rows),
    reach = nav.flood(-5, -5),
    path = nav.route([-5.2, -5.2], [-5.6, -5.7], reach);
  assert.deepEqual(path, [[-5.6, -5.7]]);
});

test('no route to a sealed room or into a wall; flood and nearFree agree', () => {
  const sealed = rows.map((r, z) => (z === 10 ? '####################' : r)),
    nav = map(sealed),
    reach = nav.flood(-5, -5);
  assert.equal(nav.route([-5, -5], [-5, 5], reach), null);
  assert.equal(nav.route([-5, -5], [0.5, 0.5], reach), null);
  assert.equal(reach[nav.cell(-5, 5)], 0);
  const f = nav.nearFree(0.5, 0.5, 3, reach);
  assert.ok(f && f[1] < 0, 'nearest reachable cell is on the near side');
});

test('march follows a line of sight down to the ground', () => {
  const nav = map(rows),
    hit = nav.march([0, 10, -8], [0, -0.2, 0.1], 200);
  assert.ok(hit && Math.abs(hit[1] - -4) < 0.2, 'meets height 2 after falling 8: ' + hit);
  assert.equal(nav.march([0, 10, -8], [0, 0.1, 0], 50), null);
});
