// node tools/bake-fx.mjs <art/fx/name/name.json> [packs/fx]
// Packs one drawn battle effect for engine/sheetfx.js. The effect is a handful of sprite sheets made with beanfx
// (https://github.com/baenv/beanfx), each exported as <sheet>.json, <sheet>_color.png and <sheet>_light.png beside the
// effect's own file, and that file says how they are put together:
//   sheets: { short name: export name }
//   parts:  [{ sheet, at: [across the picture, towards the camera] from the target in target radii, t: seconds in,
//              flip?, lift?: "mid" (at the target's middle, not its feet) }]   each an upright card of its own
//   rings:  [{ t, dur, r: [from, to] in target radii, color, to?: the colour it ends on }]   drawn flat on the ground
//   gain:   how strongly the light sheets are added
// Out come <out>/<name>.png (every sheet side by side, colour on top and light under it) and <out>/<name>.json.
// Draw the sheets at the game's own scale (a game unit is `ppu` pixels of packs/sprites) or they will not sit with the sprites.
import fs from 'node:fs';
import path from 'node:path';
import { readPng, writePng } from './png-rgba.mjs';

const [file, out = 'packs/fx'] = process.argv.slice(2);
if (!file) {
  console.error('usage: node tools/bake-fx.mjs <art/fx/name/name.json> [packs/fx]');
  process.exit(1);
}
const dir = path.dirname(file),
  name = path.basename(file, '.json'),
  def = JSON.parse(fs.readFileSync(file, 'utf8')),
  sheets = {},
  blocks = [];
let W = 0,
  H = 0;
for (const id in def.sheets) {
  const m = JSON.parse(fs.readFileSync(path.join(dir, def.sheets[id] + '.json'), 'utf8')).meta.beanfx;
  if (m.pages) throw new Error(id + ' is split over several pages; make it smaller (fewer frames or a smaller cell)');
  if (m.rows !== 1) throw new Error(id + ' has ' + m.rows + ' heading rows; only one-row sheets are played');
  const col = readPng(path.join(dir, m.color)),
    lit = readPng(path.join(dir, m.light));
  if (col.w !== lit.w || col.h !== lit.h) throw new Error(id + ': the colour and light sheets differ in size');
  sheets[id] = { x: W, y: 0, lightY: col.h, cell: m.frameSize, cols: m.columns, frames: m.frames, fps: m.fps, pivot: m.pivot, hits: ((m.act && m.act.hits) || []).map(h => ({ t: h.t, shake: h.shake })) };
  blocks.push({ x: W, col, lit });
  W += col.w;
  H = Math.max(H, col.h * 2);
}
if (W > 4096 || H > 4096) throw new Error('the packed picture would be ' + W + 'x' + H + '; keep it within 4096 a side for phones');
const data = new Uint8Array(W * H * 4);
for (const b of blocks)
  for (const [img, y0] of [
    [b.col, 0],
    [b.lit, b.col.h]
  ])
    for (let y = 0; y < img.h; y++) data.set(img.data.subarray(y * img.w * 4, (y + 1) * img.w * 4), ((y0 + y) * W + b.x) * 4);
const hits = [];
for (const p of def.parts) {
  if (!sheets[p.sheet]) throw new Error('a part names the sheet "' + p.sheet + '", which is not in sheets');
  for (const h of sheets[p.sheet].hits) hits.push({ t: (p.t || 0) + h.t, shake: h.shake });
}
for (const id in sheets) delete sheets[id].hits;
const info = { gain: def.gain || 1, sheets, parts: def.parts.map(p => ({ sheet: p.sheet, at: p.at || [0, 1], t: p.t || 0, flip: p.flip ? 1 : 0, lift: p.lift || '' })), rings: def.rings || [], hits };
fs.mkdirSync(out, { recursive: true });
writePng(path.join(out, name + '.png'), W, H, data);
fs.writeFileSync(path.join(out, name + '.json'), JSON.stringify(info) + '\n');
console.log(path.join(out, name + '.png'), W + 'x' + H, fs.statSync(path.join(out, name + '.png')).size, 'bytes;', Object.keys(sheets).length, 'sheets,', info.parts.length, 'parts');
