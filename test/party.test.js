// The party and its heroes as read off the flags (engine/party.js), and the game's own party.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { partyNow, partyAll, heroNow } from '../engine/party.js';

const host = flags => ({ flag: n => !!flags[n], has: () => 0 });

test('a hero written with a condition is in the party only while it holds', () => {
  const game = { party: ['a', { id: 'b', if: { all: ['found', '!given'] } }, { id: 'c', if: 'late' }] };
  assert.deepEqual(partyNow(game, host({})), ['a']);
  assert.deepEqual(partyNow(game, host({ found: true })), ['a', 'b']);
  assert.deepEqual(partyNow(game, host({ found: true, given: true, late: true })), ['a', 'c']);
  assert.deepEqual(partyAll(game), ['a', 'b', 'c']);
});

test('a boon adds to a hero while its condition holds, and leaves the data alone', () => {
  const heroes = { a: { name: 'A', mhp: 100, atk: 10, boons: [{ if: 'blessed', mhp: 40, atk: 4, mag: 3 }] } };
  assert.deepEqual([heroNow(heroes, 'a', host({})).mhp, heroNow(heroes, 'a', host({})).atk], [100, 10]);
  const b = heroNow(heroes, 'a', host({ blessed: true }));
  assert.deepEqual([b.mhp, b.atk, b.mag], [140, 14, 3]);
  assert.equal(heroes.a.mhp, 100);
});

test("the game's own party: the Lastmade alone, Wren's echo from the feather until he is offered, and stronger alone after", () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
    read = f => JSON.parse(fs.readFileSync(path.join(root, 'game', f), 'utf8')),
    game = read('game.json'),
    heroes = read('heroes.json');
  assert.deepEqual(partyNow(game, host({})), ['lastmade']);
  assert.deepEqual(partyNow(game, host({ feather: true })), ['lastmade', 'wren']);
  assert.deepEqual(partyNow(game, host({ feather: true, kept: true })), ['lastmade', 'wren']);
  assert.deepEqual(partyNow(game, host({ feather: true, offered: true })), ['lastmade']);
  const plain = heroNow(heroes, 'lastmade', host({})),
    blessed = heroNow(heroes, 'lastmade', host({ offered: true }));
  assert.ok(blessed.mhp > plain.mhp && blessed.atk > plain.atk, 'offering him makes her stronger');
  // every skill a hero has exists
  const skills = read('skills.json');
  for (const id of partyAll(game)) for (const s of heroes[id].skills) assert.ok(skills[s], id + ' has a skill called ' + s);
});
