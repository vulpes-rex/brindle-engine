import test from 'node:test';
import assert from 'node:assert/strict';
import { STICK, push, stickAt, laneIntent } from '../engine/stick.js';

const len = p => Math.hypot(p.x, p.y);

test('a push has a dead middle, grows to 1 at the rim, and is never more', () => {
  assert.deepEqual(push(0, 0), { x: 0, y: 0 });
  assert.deepEqual(push(STICK.dead * 0.9, 0), { x: 0, y: 0 });
  assert.ok(len(push(STICK.dead + 0.01, 0)) < 0.02, 'just past the dead middle it is small');
  assert.ok(Math.abs(len(push(0.59, 0)) - 0.5) < 1e-9, 'half-way from the dead middle to the rim it is a half');
  assert.ok(Math.abs(len(push(1, 0)) - 1) < 1e-9);
  assert.ok(Math.abs(len(push(1, 1)) - 1) < 1e-9, 'a corner of a controller’s square is still 1');
  // (the direction is kept)
  const p = push(-0.3, 0.4);
  assert.ok(Math.abs(Math.atan2(p.y, p.x) - Math.atan2(0.4, -0.3)) < 1e-9);
});

test('a thumb on the drawn stick: up the page is a push up, and the knob stays inside the rim', () => {
  const a = stickAt(0, -40, 40);
  assert.ok(Math.abs(a.x) < 1e-9 && Math.abs(a.y - 1) < 1e-9);
  assert.deepEqual(a.knob, [0, -40]);
  const b = stickAt(90, 0, 40);
  assert.ok(Math.abs(b.x - 1) < 1e-9 && b.y === 0);
  assert.deepEqual(b.knob, [40, 0]);
  const c = stickAt(3, 2, 40);
  assert.deepEqual([c.x, c.y], [0, 0]);
  assert.deepEqual(c.knob, [3, 2]);
});

test('side-on a push is a walk along the lane or a change of lane, never both', () => {
  // across, gently and hard: a walk, as hard as the push
  assert.deepEqual(laneIntent(0.3, 0), { kx: 1, ky: 0, amt: 0.3 });
  assert.deepEqual(laneIntent(-1, 0), { kx: -1, ky: 0, amt: 1 });
  // across with some up in it (a thumb is never level) is still a walk
  assert.deepEqual(laneIntent(0.8, 0.5), { kx: 1, ky: 0, amt: 0.8 });
  assert.deepEqual(laneIntent(0.6, 0.65), { kx: 1, ky: 0, amt: 0.6 });
  // well up or down is a change of lane
  assert.deepEqual(laneIntent(0.1, 0.9), { kx: 0, ky: 1, amt: 1 });
  assert.deepEqual(laneIntent(-0.3, -0.8), { kx: 0, ky: -1, amt: 1 });
  // a small push up is neither
  assert.deepEqual(laneIntent(0, 0.4), { kx: 0, ky: 0, amt: 0 });
});
