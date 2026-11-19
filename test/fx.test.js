import test from 'node:test';
import assert from 'node:assert/strict';
import { createFx, hexColor, KIND } from '../engine/fx.js';

// a repeatable random source, so runs do not differ
const seeded = () => {
  let s = 7;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
};
const opts = { at: [0, 1, 0], from: [10, 5, 0], h: 6, r: 2, targets: [[4, 1, 2], [6, 1, -2]], right: [0.6, 0.8] };

test('every preset plays, draws only finite numbers, and is gone in a few seconds', () => {
  const fx = createFx(seeded());
  for (const name of fx.presets) {
    fx.play(name, opts);
    let most = 0;
    for (let i = 0; i < 40; i++) {
      fx.update(0.05);
      const { fx: out } = fx.emit();
      most = Math.max(most, out.n);
      for (let k = 0; k < out.n * 14; k++) assert.ok(Number.isFinite(out.data[k]), name + ': a number that is not finite');
    }
    assert.ok(most > 0, name + ' drew nothing');
    for (let i = 0; i < 100; i++) fx.update(0.05);
    assert.equal(fx.count, 0, name + ' left something behind');
  }
});

test('effects drawn over everything come last, and kinds are the ones the shader knows', () => {
  const fx = createFx(seeded());
  fx.play('cast', opts); // all depth-tested
  fx.play('hit', opts); // all on top
  fx.update(0.01);
  const { fx: out } = fx.emit(),
    under = out.n - out.over;
  assert.ok(under > 0 && out.over > 0);
  const kinds = new Set(Object.values(KIND));
  for (let i = 0; i < out.n; i++) assert.ok(kinds.has(out.data[i * 14 + 9]));
  // the last `over` instances are the hit's (glows and stars), the first ones the cast's glyph
  assert.equal(out.data[9], KIND.glyph);
});

test('the dimming eases in and out, a flash fades, and an unknown effect is an error', () => {
  const fx = createFx(seeded());
  fx.dimTo(0.5);
  for (let i = 0; i < 30; i++) fx.update(0.05);
  assert.ok(Math.abs(fx.emit().dim - 0.5) < 0.01);
  fx.dimTo(0);
  fx.flash('#fff', 0.6);
  assert.deepEqual(fx.emit().flash, [1, 1, 1, 0.6]);
  for (let i = 0; i < 30; i++) fx.update(0.05);
  assert.ok(fx.emit().dim < 0.01);
  assert.equal(fx.emit().flash, null);
  assert.throws(() => fx.play('fireworks', opts), /Unknown effect/);
});

test('colours: short and long hex, or a list as it is', () => {
  assert.deepEqual(hexColor('#fff'), [1, 1, 1]);
  assert.deepEqual(hexColor('#ff0000'), [1, 0, 0]);
  assert.deepEqual(hexColor([0.5, 1, 0.2]), [0.5, 1, 0.2]);
});
