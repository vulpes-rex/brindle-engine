// The pose of a side-view figure (engine/pose.js): which animation, and which frame of it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sidePose, profile, POSE } from '../engine/pose.js';
import { JUMP } from '../engine/jump.js';

const full = name => ({ run: 8, idle: 8, rise: 3, fall: 2, land: 2 })[name] || 0;

test('rising plays through once as the jump slows, falling as the fall quickens', () => {
  const rise = vy => sidePose({ air: true, vy, moving: true, dist: 0 }, 0, full);
  assert.deepEqual(rise(JUMP.v), { anim: 'rise', k: 0 });
  assert.deepEqual(rise(JUMP.v * 0.5), { anim: 'rise', k: 1 });
  assert.deepEqual(rise(0.5), { anim: 'rise', k: 2 });
  // (a second jump, made in the air, starts the rise again)
  assert.deepEqual(rise(JUMP.v * JUMP.second), { anim: 'rise', k: 0 });
  assert.deepEqual(sidePose({ air: true, vy: -1, moving: true }, 0, full), { anim: 'fall', k: 0 });
  assert.deepEqual(sidePose({ air: true, vy: -JUMP.v, moving: true }, 0, full), { anim: 'fall', k: 1 });
  assert.deepEqual(sidePose({ air: true, vy: -3 * JUMP.v, moving: true }, 0, full), { anim: 'fall', k: 1 }, 'a long drop holds the last frame');
});

test('touching down shows the landing, then standing breathes and moving runs', () => {
  const b = { air: false, vy: 0, moving: false, dist: 0, landed: 10 };
  assert.deepEqual(sidePose(b, 10, full), { anim: 'land', k: 0 });
  assert.deepEqual(sidePose(b, 10 + POSE.land * 0.6, full), { anim: 'land', k: 1 });
  assert.equal(sidePose(b, 10 + POSE.land + 0.01, full).anim, 'idle');
  // (the idle loops)
  const seen = new Set();
  for (let t = 11; t < 13; t += 0.05) seen.add(sidePose(b, t, full).k);
  assert.equal(seen.size, 8);
  // (a landing is over before a clock that starts again reaches it: a new area)
  assert.equal(sidePose(b, 2, full).anim, 'idle');
  // running: one cycle to POSE.run game units, whatever the frame count
  const run = dist => sidePose({ air: false, moving: true, dist, landed: -9 }, 20, full);
  assert.deepEqual(run(0), { anim: 'run', k: 0 });
  assert.deepEqual(run(POSE.run / 2), { anim: 'run', k: 4 });
  assert.deepEqual(run(POSE.run), { anim: 'run', k: 0 });
});

test('a set short of a pose makes do', () => {
  const only = have => name => (have.includes(name) ? full(name) : 0);
  assert.deepEqual(sidePose({ air: true, vy: 9 }, 0, only(['run', 'fall'])), { anim: 'fall', k: 0 }, 'rising with no rise: the start of the fall');
  assert.deepEqual(sidePose({ air: true, vy: -9 }, 0, only(['run', 'rise'])), { anim: 'rise', k: 2 }, 'falling with no fall: the top of the rise');
  assert.deepEqual(sidePose({ air: true, vy: 9, moving: true, dist: POSE.run / 8 }, 0, only(['run'])), { anim: 'run', k: 1 }, 'no poses in the air: the run goes on');
  assert.deepEqual(sidePose({ air: false, moving: false, landed: 5 }, 5, only(['run'])), { anim: 'run', k: 0 }, 'standing with no idle: the first frame of the run');
});

test('side-on a figure faces along the lane or across it', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7].map(profile), [0, 2, 2, 2, 4, 6, 6, 6]);
});
