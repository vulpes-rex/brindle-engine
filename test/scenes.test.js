import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { genMain } from '../engine/gen/genmain.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  areas = fs.readdirSync(path.join(root, 'game/areas')).map(f => JSON.parse(fs.readFileSync(path.join(root, 'game/areas', f), 'utf8')));

// The look hands a scene to a Web Worker as text, so a scene that leans on anything outside its own function breaks there
// (and only there). Running each one from its text alone catches that here.
for (const f of fs.readdirSync(path.join(root, 'game/scenes'))) {
  const id = f.slice(0, -3);
  test('scene ' + id + ' runs from its text alone and has the places its areas use', async () => {
    const scene = (await import(pathToFileURL(path.join(root, 'game/scenes', f)))).default,
      alone = new Function('return (' + scene.toString() + ')')(),
      r = genMain(alone, () => {});
    assert.ok(r.n > 0, 'no splats');
    for (const a of areas.filter(a => a.scene === id))
      for (const who of [...(a.actors || []), ...(a.props || []), ...Object.values(a.spawns || {})])
        if (who.poi) assert.ok(r.walk && r.walk.poi[who.poi], a.name + ': no place called "' + who.poi + '"');
  });
}
