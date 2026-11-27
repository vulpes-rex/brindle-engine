// Who is in the party, and what each of them is like, as the game's flags have it. Nothing of this is saved by itself: the
// party is read off the flags each time it is wanted, so a save holds it without holding it.
//
//   game.json   "party": ["lastmade", { "id": "wren", "if": { "all": ["feather", "!offered"] } }]
//               a hero written with a condition is in the party only while it holds
//   heroes.json "boons": [{ "if": "offered", "mhp": 40, "atk": 4 }]
//               what a hero gains while a condition holds, added to their own numbers
//               "tint": [r, g, b] colours their sprite (for a stand-in: an echo paler than the living)
//               "halo": true gives them a thin ring of light over their head
import { test } from './script.js';

export const HALO = 7.1; // how far above a hero's feet their halo floats

const NUMBERS = ['mhp', 'mmp', 'atk', 'mag', 'def', 'mdf', 'spd'];

// the ids of those in the party now, in order
export const partyNow = (game, host) => game.party.filter(p => typeof p === 'string' || test(p.if, host)).map(p => (typeof p === 'string' ? p : p.id));

// everyone who could ever be in it
export const partyAll = game => game.party.map(p => (typeof p === 'string' ? p : p.id));

// a hero as they are now: their entry with whichever of their boons hold added on
export function heroNow(heroes, id, host) {
  const h = Object.assign({}, heroes[id]);
  for (const b of h.boons || []) if (test(b.if, host)) for (const k of NUMBERS) if (b[k]) h[k] = (h[k] || 0) + b[k];
  return h;
}
