// Looks over the game's data before a build: every script step, flag test, spawn, sprite, battle, scene and pack must refer to
// something that exists. Returns a list of problems (empty when all is well).
import fs from 'node:fs';
import path from 'node:path';
import { checkScript } from '../engine/script.js';
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
    sheet = path.join(root, game.sprites || '', 'sheet.json'),
    sprites = fs.existsSync(sheet) ? Object.keys(read(sheet).cast) : [],
    scenes = fs.readdirSync(path.join(G, 'scenes')).filter(f => f.endsWith('.js')).map(f => f.slice(0, -3)),
    out = [],
    // (a script can start only a battle that has an arena: one fought "here" needs a foe of the map to be met)
    known = { items: Object.keys(game.items || {}), battles: Object.keys(battles).filter(id => !battles[id].here), spawns: {} };
  for (const id in areas) known.spawns[id] = Object.keys(areas[id].spawns || {});

  if (!areas[game.start.area]) out.push('game.json: start area "' + game.start.area + '" does not exist');
  else if (!known.spawns[game.start.area].includes(game.start.spawn)) out.push('game.json: start spawn "' + game.start.spawn + '" does not exist');
  if (!sprites.includes(game.leader)) out.push('game.json: no sprite called "' + game.leader + '"');
  // (a party member is a hero's id, or { id, if } for one who is in the party only while a condition holds)
  for (const p of game.party) {
    const id = typeof p === 'string' ? p : p && p.id;
    if (!heroes[id]) out.push('game.json: party member "' + id + '" is not in heroes.json');
    else if (!sprites.includes(heroes[id].sprite)) out.push('heroes.json: "' + id + '" has no sprite called "' + heroes[id].sprite + '"');
  }
  if (typeof game.party[0] !== 'string') out.push('game.json: the first of the party is always in it (the leader)');
  for (const id of game.preload || []) if (!areas[id]) out.push('game.json: preload area "' + id + '" does not exist');
  for (const p of [game.monsterPack]) if (!fs.existsSync(path.join(root, p))) out.push('game.json: missing file ' + p);
  for (const f of ['sheet.json', 'sheet.png']) if (!fs.existsSync(path.join(root, game.sprites || '?', f))) out.push('game.json: the sprite pack has no ' + f + ' (tools/bake-sprites.mjs makes it)');

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
    // foes that live on the map: a monster, a place, and a battle that is fought where they are met
    for (const f of a.foes || []) {
      if (!f.poi && !f.at) out.push(at + ': foe "' + f.id + '" needs a place (poi or at)');
      if (!monsters[f.type]) out.push(at + ': foe "' + f.id + '": no monster called "' + f.type + '"');
      if (!battles[f.battle]) out.push(at + ': foe "' + f.id + '": no battle called "' + f.battle + '"');
      else if (!battles[f.battle].here) out.push(at + ': foe "' + f.id + '": battle "' + f.battle + '" has an arena; a foe of the map is fought "here"');
      if (a.look !== 'gen') out.push(at + ': foe "' + f.id + '": only a generated area can be fought in');
    }
    // meshes: one that stands in for the whole scene, things stood about it, and parts drawn for the scene's moving ledges
    for (const m of a.meshes || []) {
      if (!fs.existsSync(path.join(root, game.meshes || '?', m.mesh + '.json'))) out.push(at + ': no mesh called "' + m.mesh + '" in ' + (game.meshes || '?'));
      if (m.part && !['move', 'crumble'].includes(m.part)) out.push(at + ': mesh "' + m.mesh + '": a part is drawn for ledges that "move" or "crumble"');
      if (!m.world && !m.part && !m.poi && !m.at) out.push(at + ': mesh "' + m.mesh + '" needs a place (poi or at)');
    }
    // an area seen side-on and no other way needs the mesh that view draws, and somewhere to walk
    if (a.side && a.side.only) {
      if (a.look !== 'gen' || !(a.meshes || []).some(m => m.world)) out.push(at + ': an area seen side-on "only" needs a generated scene and its "world" mesh');
      if (!(a.side.lanes || []).length) out.push(at + ': an area seen side-on "only" needs a lane');
    }
    if (a.side && a.side.double !== undefined && typeof a.side.double !== 'string') out.push(at + ': "side.double" is the flag that gives the second jump');
    if (a.side && a.side.kill !== undefined && typeof a.side.kill !== 'number') out.push(at + ': "side.kill" is a height');
    if (a.side && a.side.ceil !== undefined && typeof a.side.ceil !== 'number') out.push(at + ': "side.ceil" is a height');
    if (a.fight && !(Array.isArray(a.fight.from) && a.fight.from.length === 2 && Math.hypot(a.fight.from[0], a.fight.from[1]) > 0)) out.push(at + ': "fight.from" is the way from a fight to the camera, [x, z]');
    // (people seen only in a memory: a script shows them, with {"memory": "spawn"})
    for (const who of a.actors || []) if (who.memory !== undefined && who.memory !== true) out.push(at + ': "' + who.id + '": "memory" is true, for someone seen only in a memory');
    const here = { spawns: Object.keys(a.spawns || {}), actors: (a.actors || []).map(w => w.id), pois: null };
    for (const name in scripts) out.push(...checkScript(scripts[name], at + ' script "' + name + '"', Object.assign({ here }, known)));
  }
  for (const id in battles) {
    const b = battles[id],
      at = 'battles.json "' + id + '"';
    // (a battle is fought in an arena of its own, or "here": where a foe of the field was met)
    if (!b.here && !areas[b.area]) out.push(at + ': arena "' + b.area + '" does not exist');
    for (const f of b.foes) if (!Array.isArray(f.at) || f.at.length !== 2) out.push(at + ': a foe needs its place in the layout, "at": [x, z]');
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
