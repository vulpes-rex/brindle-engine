// Looks over the game's data before a build: every script step, flag test, spawn, sprite, battle, scene and pack must refer to
// something that exists. Returns a list of problems (empty when all is well).
import fs from 'node:fs';
import path from 'node:path';
import { checkScript } from '../engine/script.js';
import { makeSprites } from '../game/art/sprites.js';
import { createFx } from '../engine/fx.js';

const read = f => JSON.parse(fs.readFileSync(f, 'utf8'));

export async function checkContent(root) {
  const G = path.join(root, 'game'),
    game = read(path.join(G, 'game.json')),
    areas = {};
  for (const f of fs.readdirSync(path.join(G, 'areas'))) if (f.endsWith('.json')) areas[f.slice(0, -5)] = read(path.join(G, 'areas', f));
  const heroes = read(path.join(G, 'heroes.json')),
    skills = read(path.join(G, 'skills.json')),
    monsters = read(path.join(G, 'monsters.json')),
    foeActions = read(path.join(G, 'foe-actions.json')),
    battles = read(path.join(G, 'battles.json')),
    sprites = makeSprites().names,
    scenes = fs.readdirSync(path.join(G, 'scenes')).filter(f => f.endsWith('.js')).map(f => f.slice(0, -3)),
    out = [],
    known = { items: Object.keys(game.items || {}), battles: Object.keys(battles), spawns: {} };
  for (const id in areas) known.spawns[id] = Object.keys(areas[id].spawns || {});

  if (!areas[game.start.area]) out.push('game.json: start area "' + game.start.area + '" does not exist');
  else if (!known.spawns[game.start.area].includes(game.start.spawn)) out.push('game.json: start spawn "' + game.start.spawn + '" does not exist');
  if (!sprites.includes(game.leader)) out.push('game.json: no sprite called "' + game.leader + '"');
  for (const id of game.party) if (!heroes[id]) out.push('game.json: party member "' + id + '" is not in heroes.json');
  for (const id of game.preload || []) if (!areas[id]) out.push('game.json: preload area "' + id + '" does not exist');
  for (const p of [game.monsterPack]) if (!fs.existsSync(path.join(root, p))) out.push('game.json: missing file ' + p);

  for (const id in areas) {
    const a = areas[id],
      at = 'areas/' + id + '.json',
      scripts = a.scripts || {};
    if (!['gen', 'ink'].includes(a.look)) out.push(at + ': look must be "gen" or "ink"');
    if (a.look === 'ink') for (const f of ['pack.json', 'splats.png', 'lut.png']) if (!fs.existsSync(path.join(root, a.pack || '', f))) out.push(at + ': missing ' + (a.pack || '?') + '/' + f);
    if (a.look === 'gen' && !scenes.includes(a.scene)) out.push(at + ': no scene called "' + a.scene + '" in game/scenes/');
    for (const who of (a.actors || []).concat(a.props || [])) {
      if (!who.poi && !who.at) out.push(at + ': "' + who.id + '" needs a place (poi or at)');
      if (who.script && !scripts[who.script]) out.push(at + ': "' + who.id + '" uses a script that does not exist: ' + who.script);
    }
    for (const who of a.actors || []) if (!sprites.includes(who.sprite)) out.push(at + ': no sprite called "' + who.sprite + '"');
    for (const name in scripts) out.push(...checkScript(scripts[name], at + ' script "' + name + '"', known));
  }
  for (const id in battles) {
    const b = battles[id],
      at = 'battles.json "' + id + '"';
    if (!areas[b.area]) out.push(at + ': arena "' + b.area + '" does not exist');
    for (const f of b.foes) if (!monsters[f.type]) out.push(at + ': no monster called "' + f.type + '"');
    for (const k of ['won', 'lost']) if (b[k]) out.push(...checkScript(b[k], at + ' ' + k, known));
  }
  for (const id in heroes) {
    if (!sprites.includes(heroes[id].sprite)) out.push('heroes.json "' + id + '": no sprite called "' + heroes[id].sprite + '"');
    for (const s of heroes[id].skills) if (!skills[s]) out.push('heroes.json "' + id + '": no skill called "' + s + '"');
  }
  // every effect an action names must be one the engine can play
  const effects = createFx().presets;
  for (const [file, acts] of [['skills.json', skills], ['foe-actions.json', foeActions]])
    for (const id in acts) for (const h of acts[id].hits || []) if (h.fx && !effects.includes(h.fx)) out.push(file + ' "' + id + '": no effect called "' + h.fx + '"');
  for (const id in monsters) for (const r of monsters[id].ai) if (!foeActions[r.use]) out.push('monsters.json "' + id + '": no foe action called "' + r.use + '"');
  return out;
}
