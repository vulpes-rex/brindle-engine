import test from 'node:test';
import assert from 'node:assert/strict';
import { createTimed, timedDamage, TIMED } from '../engine/timed.js';

test('a press shortly before the blow is good, and just before it sharp', () => {
  const t = createTimed();
  t.press(1.0);
  assert.equal(t.grade(1.0 + TIMED.early - 0.01), 1);
  t.press(3.0);
  assert.equal(t.grade(3.0 + TIMED.sharp - 0.01), 2);
});

test('no press, a press too early, and a used press all count for nothing', () => {
  const t = createTimed();
  assert.equal(t.grade(1), 0);
  t.press(2.0);
  assert.equal(t.grade(2.0 + TIMED.early + 0.05), 0);
  t.press(5.0);
  assert.equal(t.grade(5.05), 2);
  assert.equal(t.grade(5.06), 0); // the same press does not time a second blow
});

test('hammering gains nothing', () => {
  const t = createTimed();
  for (let k = 0; k < 20; k++) t.press(1 + k * 0.1);
  assert.equal(t.grade(3.0), 0);
  // and a press after a pause counts again
  t.press(4.0);
  assert.equal(t.grade(4.1), 2);
});

test('a timed blow hits harder from a hero and softer on one', () => {
  assert.equal(timedDamage(20, 0, true), 20);
  assert.equal(timedDamage(20, 1, true), 25);
  assert.equal(timedDamage(20, 2, true), 30);
  assert.equal(timedDamage(20, 1, false), 15);
  assert.equal(timedDamage(20, 2, false), 10);
  assert.equal(timedDamage(1, 2, false), 1);
});
