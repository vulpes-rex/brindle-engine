import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { fightSpot, fightAt, drawIn, standsOf } from '../engine/ground.js';
import { partyAll } from '../engine/party.js';
import { Nav } from '../engine/nav.js';
import { genMain } from '../engine/gen/genmain.js';

// a flat field 40 across with a wall along x = 4 (cells 24) and a step up of 3 beyond z = 10
function field() {
  const NU = 40, C = 20, RS = 2, N = NU * RS,
    BL = new Uint8Array(NU * NU),
    GH = new Float32Array(N * N);
  for (let z = 0; z < NU; z++) BL[z * NU + 24] = 1;
  for (let z = 0; z < N; z++) for (let x = 0; x < N; x++) GH[z * N + x] = z / RS - C >= 10 ? 4 : 1;
  return new Nav({ NU, C, N, RS, BL, GH });
}
const STANDS = [[4, -2, 'hero'], [5, 2, 'hero'], [-4, 0, 'foe']],
  put = (r, p) => [r.o[0] + p[0] * Math.cos(r.th) - p[1] * Math.sin(r.th), r.o[1] + p[0] * Math.sin(r.th) + p[1] * Math.cos(r.th)];

test('a fight is set down where it is asked for when the ground there is free and level', () => {
  const r = fightSpot(field(), STANDS, [-8, -6], 0);
  assert.deepEqual(r.o, [-8, -6]);
  assert.equal(r.y, 1);
  assert.equal(r.bad, 0);
});

test('it moves off what is in the way: nobody stands in a wall, and the two sides are not parted by one', () => {
  const nav = field(),
    r = fightSpot(nav, STANDS, [0, -6], 0);
  assert.ok(r, 'a spot was found');
  for (const p of STANDS) assert.ok(!nav.blocked(...put(r, p)));
  // (the wall at x = 4..5 would stand between the sides at the origin asked for; the spot found has it behind one side)
  assert.equal(r.bad, 0);
  assert.ok(Math.hypot(r.o[0], r.o[1] + 6) <= 8);
});

test('the two sides stand on one level', () => {
  const nav = field(),
    r = fightSpot(nav, STANDS, [-8, 9], 0);
  const ys = STANDS.map(p => nav.gh(...put(r, p)));
  assert.ok(Math.max(...ys) - Math.min(...ys) <= 1);
});

test('a layout set down smaller draws the two sides closer', () => {
  const r = fightSpot(field(), STANDS, [-8, -6], 0, 14, 0.5),
    put2 = p => [r.o[0] + p[0] * 0.5, r.o[1] + p[1] * 0.5];
  assert.equal(r.k, 0.5);
  assert.ok(Math.abs(put2(STANDS[0])[0] - put2(STANDS[2])[0] - 4) < 1e-9);
});

test('a layout is drawn in by its sides, each keeping more of its own shape', () => {
  const L = drawIn(STANDS, 0.5, 1);
  // (the sides' middles were 8.5 apart and are now 4.25; the two heroes are still 1 and 4 apart)
  assert.ok(Math.abs((L.stands[0][0] + L.stands[1][0]) / 2 - L.stands[2][0] - 4.25) < 1e-9);
  assert.ok(Math.abs(L.stands[1][0] - L.stands[0][0] - 1) < 1e-9 && Math.abs(L.stands[1][1] - L.stands[0][1] - 4) < 1e-9);
  assert.deepEqual(L.stands.map(p => p[2]), ['hero', 'hero', 'foe']);
  // (the middle of the layout stays where it was)
  assert.deepEqual(L.to(0.25, 0), [0.25, 0]);
});

test('a meeting is fought where the two sides have least far to go, closer set where it is tight', () => {
  const nav = field();
  // (a clear field: the party falls back a little, the foe a little, each to its side)
  const a = fightAt(nav, STANDS, [-9, -8], [-12, -8], 0);
  assert.equal(a.k, 0.7);
  assert.ok(a.move < 3.5, 'they go ' + a.move);
  assert.ok(a.at[0][0] > a.at[2][0], 'the party to +x of the foe');
  for (const w of a.at) assert.ok(!nav.blocked(w[0], w[1]));
  // (a spot of the layout between the sides comes out between them on the area)
  const mid = a.to(0.25, 0);
  assert.ok(mid[0] > a.at[2][0] && mid[0] < a.at[0][0]);
  // (between two walls seven apart there is room only for a closer layout)
  for (let z = 0; z < 40; z++) nav.BL[z * 40 + 16] = 1;
  const b = fightAt(nav, STANDS, [1, -8], [-2, -8], 0);
  assert.ok(b && b.k < 0.7 && b.through === 0, 'set closer, no wall gone through: ' + (b && [b.k, b.through]));
});

test('the layout turns with the heading it is given', () => {
  const r = fightSpot(field(), STANDS, [-8, -6], Math.PI / 2);
  // (+x of the layout, from the foes to the party, now points along +z)
  const h = put(r, STANDS[0]),
    f = put(r, STANDS[2]);
  assert.ok(h[1] - f[1] > 7 && Math.abs(h[0] - f[0]) < 3);
});

test('where nothing will do there is no spot', () => {
  const nav = field();
  nav.BL.fill(1);
  assert.equal(fightSpot(nav, STANDS, [0, 0], 0), null);
});

// ---- the areas' own foes: wherever one may be met, there is ground to fight it on
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  read = f => JSON.parse(fs.readFileSync(path.join(root, 'game', f), 'utf8'));
for (const f of fs.readdirSync(path.join(root, 'game/areas'))) {
  const a = read('areas/' + f);
  if (!(a.foes || []).length) continue;
  test(a.name + ': each foe of the map can be fought wherever it may be met', async () => {
    const scene = (await import(pathToFileURL(path.join(root, 'game/scenes', a.scene + '.js')))).default,
      w = genMain(scene, () => {}).walk,
      nav = new Nav({ NU: w.NU, C: w.C, N: w.N, RS: w.RS, BL: w.BL, GH: w.GH }),
      heroes = read('heroes.json'),
      game = read('game.json'),
      // (with everyone who could be in the party: the widest it gets)
      party = partyAll(game),
      battles = read('battles.json');
    for (const foe of a.foes) {
      const home = foe.poi ? w.poi[foe.poi] : foe.at,
        stands = standsOf(heroes, party, battles[foe.battle]),
        v = (a.fight && a.fight.from) || [1, 0],
        th = Math.atan2(v[1], v[0]);
      assert.ok(!nav.blocked(home[0], home[1]), foe.id + ' has its home on free ground');
      let met = 0,
        far = 0;
      const sizes = {};
      // (meetings all round its home, out to where it gives up the chase: the leader there, the foe come up to them)
      for (let dz = -22; dz <= 22; dz += 2)
        for (let dx = -22; dx <= 22; dx += 2) {
          const m = [home[0] + dx, home[1] + dz],
            l = Math.hypot(dx, dz) || 1,
            at = [m[0] - (dx / l) * Math.min(3, l), m[1] - (dz / l) * Math.min(3, l)];
          if (nav.blocked(m[0], m[1]) || !nav.los(home[0], home[1], m[0], m[1])) continue;
          const r = fightAt(nav, stands, m, at, th);
          assert.ok(r, 'no ground to fight ' + foe.id + ' when met at ' + m);
          far = Math.max(far, r.move);
          sizes[r.k] = (sizes[r.k] || 0) + 1;
          met++;
        }
      assert.ok(met > 10, foe.id + ' can be met');
      if (process.env.SPOTS) console.log(foe.id, 'meetings', met, 'layout sizes', JSON.stringify(sizes), 'the foe goes at most', far.toFixed(1), 'to its place');
    }
  });
}
