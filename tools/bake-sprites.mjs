// node tools/bake-sprites.mjs [--code] [--ppu n]
// Bakes the cast into a sprite pack the engine loads: packs/sprites/sheet.png and sheet.json.
//
// Each character comes from art/pixellab/<name>/ when it is there (rotations/<direction>.png and walk/<direction>/<n>.png, as
// tools/pixellab.mjs downloads them), or else from the cast drawn by code (game/art/sprites.js); --code uses the drawn cast
// for everyone. Every character gets eight facings (south first, clockwise: south, south-east, east, ... south-west), a
// standing frame, a walk cycle and a knocked-out frame, lined up so their feet stand on the same row.
//
// Generated art is given selective outlines on the way: a dark line pixel takes a deep shade of the colour beside it rather
// than black (as Xenogears' sprites are drawn). --ppu sets sprite pixels per game unit; by default it is worked out so a
// character stands about 6.4 game units tall.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readPng, writePng } from './png-rgba.mjs';
import { makeSprites } from '../game/art/sprites.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  arg = k => {
    const i = process.argv.indexOf(k);
    return i < 0 ? null : process.argv[i + 1];
  },
  CODE_ONLY = process.argv.includes('--code'),
  ROWS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'],
  TALL = 6.4, // how many game units a character stands (a fifth more than the first drawn cast: they were small)
  STRIDE = 6; // game units walked in one walk cycle

// ---- small images: { w, h, data (RGBA) }
const blank = (w, h) => ({ w, h, data: new Uint8Array(w * h * 4) });
const at = (im, x, y) => (y * im.w + x) * 4;
function flip(im) {
  const o = blank(im.w, im.h);
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) o.data.set(im.data.subarray(at(im, x, y), at(im, x, y) + 4), at(o, im.w - 1 - x, y));
  return o;
}
function scale(im, k) {
  const o = blank(Math.round(im.w * k), Math.round(im.h * k));
  for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) o.data.set(im.data.subarray(at(im, Math.floor(x / k), Math.floor(y / k)), at(im, Math.floor(x / k), Math.floor(y / k)) + 4), at(o, x, y));
  return o;
}
// lying down: the standing frame turned a quarter (head to the left)
function turn(im) {
  const o = blank(im.h, im.w);
  for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) o.data.set(im.data.subarray(at(im, im.w - 1 - y, im.h - 1 - x), at(im, im.w - 1 - y, im.h - 1 - x) + 4), at(o, x, y));
  return o;
}
// the rows a figure's opaque pixels span
function span(im) {
  let top = im.h,
    foot = -1,
    l = im.w,
    r = -1;
  for (let y = 0; y < im.h; y++)
    for (let x = 0; x < im.w; x++)
      if (im.data[at(im, x, y) + 3] > 127) {
        top = Math.min(top, y);
        foot = Math.max(foot, y);
        l = Math.min(l, x);
        r = Math.max(r, x);
      }
  return { top, foot, wide: r - l + 1 };
}
// selective outlines: near-black pixels take a deep, slightly cool shade of the colours around them
function selout(im) {
  const o = { w: im.w, h: im.h, data: im.data.slice() },
    lum = i => (0.3 * im.data[i] + 0.59 * im.data[i + 1] + 0.11 * im.data[i + 2]) / 255,
    dark = i => im.data[i + 3] > 127 && lum(i) < 0.15;
  for (let y = 0; y < im.h; y++)
    for (let x = 0; x < im.w; x++) {
      const i = at(im, x, y);
      if (!dark(i)) continue;
      let r = 0,
        g = 0,
        b = 0,
        n = 0;
      for (let R = 1; R <= 3 && !n; R++)
        for (let dy = -R; dy <= R; dy++)
          for (let dx = -R; dx <= R; dx++) {
            const X = x + dx,
              Y = y + dy;
            if (X < 0 || Y < 0 || X >= im.w || Y >= im.h) continue;
            const j = at(im, X, Y);
            if (im.data[j + 3] > 127 && !dark(j)) {
              r += im.data[j];
              g += im.data[j + 1];
              b += im.data[j + 2];
              n++;
            }
          }
      const c = n ? [r / n, g / n, b / n] : [70, 60, 96];
      o.data[i] = Math.round(c[0] * 0.42 + 10);
      o.data[i + 1] = Math.round(c[1] * 0.4 + 8);
      o.data[i + 2] = Math.round(c[2] * 0.46 + 22);
    }
  return o;
}

// ---- the cast
const code = makeSprites(),
  cast = code.names,
  // a frame of the code-drawn sheet: its five drawn facings, the west side mirrored
  codeFrame = (ci, row, col) => {
    const mirror = { 'north-west': 3, west: 2, 'south-west': 1 }[ROWS[row]],
      r = mirror === undefined ? row : mirror,
      im = blank(code.SW, code.SH);
    for (let y = 0; y < code.SH; y++) im.data.set(code.data.subarray(((r * code.SH + y) * code.w + (ci * code.FR + col) * code.SW) * 4, ((r * code.SH + y) * code.w + (ci * code.FR + col + 1) * code.SW) * 4), y * code.SW * 4);
    return mirror === undefined ? im : flip(im);
  };

const chars = cast.map((name, ci) => {
  const dir = path.join(root, 'art/pixellab', name);
  if (!CODE_ONLY && fs.existsSync(path.join(dir, 'rotations', 'south.png'))) {
    const rows = ROWS.map(d => {
      const walkDir = path.join(dir, 'walk', d),
        walk = fs.existsSync(walkDir)
          ? fs
              .readdirSync(walkDir)
              .filter(f => f.endsWith('.png'))
              .sort((a, b) => parseInt(a) - parseInt(b))
              .map(f => selout(readPng(path.join(walkDir, f))))
          : [];
      return [selout(readPng(path.join(dir, 'rotations', d + '.png'))), ...walk];
    });
    const n = Math.max(...rows.map(r => r.length));
    // (a direction short of walk frames repeats its last)
    for (const r of rows) while (r.length < n) r.push(r[r.length - 1]);
    return { name, src: 'pixellab', rows, stand: 0, walk: n > 1 ? [...Array(n - 1).keys()].map(i => i + 1) : [0] };
  }
  return { name, src: 'code', rows: ROWS.map((d, row) => [0, 1, 2, 3].map(col => codeFrame(ci, row, col))), stand: 1, walk: [0, 1, 2, 3] };
});

// sprite pixels per game unit: from the generated characters' height, unless it is given
const gen = chars.filter(c => c.src === 'pixellab'),
  heights = gen.map(c => span(c.rows[0][0])).map(s => s.foot - s.top + 1).sort((a, b) => a - b),
  ppu = +arg('--ppu') || (heights.length ? Math.max(5, Math.round(heights[heights.length >> 1] / TALL)) : 5);
// drawn characters join a generated cast scaled up (whole pixels where they can be)
for (const c of chars)
  if (c.src === 'code' && ppu !== 5) {
    const k = ppu / 5;
    c.rows = c.rows.map(r => r.map(im => scale(im, k)));
  }

// one cell size for all, every character's feet on the same row
const SW = Math.max(...chars.map(c => c.rows[0][0].w)),
  SH0 = Math.max(...chars.map(c => c.rows[0][0].h)),
  feet = chars.map(c => span(c.rows[0][c.stand]).foot),
  foot = Math.max(...feet),
  lift = chars.map((c, i) => foot - feet[i]),
  SH = Math.max(SH0, ...chars.map((c, i) => c.rows[0][0].h + lift[i])),
  tops = chars.map((c, i) => span(c.rows[0][c.stand]).top + lift[i]),
  wide = Math.max(...chars.map(c => span(c.rows[0][c.stand]).wide));

// ---- the sheet: each character a block of (frames x 8 facings); a strip of knocked-out frames and the icons below
const cols = Math.max(...chars.map(c => c.rows[0].length)),
  per = Math.max(1, Math.min(chars.length, Math.floor(2048 / (cols * SW)))),
  blockW = cols * SW,
  blockH = ROWS.length * SH,
  koY = Math.ceil(chars.length / per) * blockH,
  iconY = koY + Math.max(SW, SH),
  sheet = blank(per * blockW, iconY + 16),
  paste = (im, X, Y) => {
    for (let y = 0; y < im.h; y++)
      for (let x = 0; x < im.w; x++) {
        const s = at(im, x, y);
        if (im.data[s + 3] && X + x < sheet.w && Y + y < sheet.h) sheet.data.set(im.data.subarray(s, s + 4), at(sheet, X + x, Y + y));
      }
  },
  meta = { ppu, cell: [SW, SH], foot, top: Math.min(...tops), wide, stride: STRIDE, rows: ROWS, cast: {}, ko: {}, icons: {} };
chars.forEach((c, i) => {
  const bx = (i % per) * blockW,
    by = Math.floor(i / per) * blockH,
    dx = Math.floor((SW - c.rows[0][0].w) / 2);
  c.rows.forEach((r, row) => r.forEach((im, col) => paste(im, bx + col * SW + dx, by + row * SH + lift[i])));
  meta.cast[c.name] = { at: [bx, by], stand: c.stand, walk: c.walk, from: c.src };
  const ko = turn(c.rows[2][c.stand]),
    kx = i * Math.max(SW, SH);
  paste(ko, kx, koY);
  meta.ko[c.name] = [kx, koY, ko.w, ko.h, span(ko).foot];
});
for (const k of ['talk', 'exit']) {
  const [x, y, w, h] = code.icons[k],
    ox = k === 'talk' ? 0 : 16,
    im = blank(w, h);
  for (let r = 0; r < h; r++) im.data.set(code.data.subarray(((y + r) * code.w + x) * 4, ((y + r) * code.w + x + w) * 4), r * w * 4);
  paste(im, ox, iconY);
  meta.icons[k] = [ox, iconY, w, h];
}

const out = path.join(root, 'packs/sprites');
fs.mkdirSync(out, { recursive: true });
writePng(path.join(out, 'sheet.png'), sheet.w, sheet.h, sheet.data);
// (a line a setting, and a line a character, so a change to the cast reads well in a diff)
const val = v => (v && typeof v === 'object' && !Array.isArray(v) ? '{\n' + Object.entries(v).map(([k, x]) => '    ' + JSON.stringify(k) + ': ' + JSON.stringify(x)).join(',\n') + '\n  }' : JSON.stringify(v));
fs.writeFileSync(path.join(out, 'sheet.json'), '{\n' + Object.entries(meta).map(([k, v]) => '  ' + JSON.stringify(k) + ': ' + val(v)).join(',\n') + '\n}\n');
console.log('packs/sprites: ' + sheet.w + 'x' + sheet.h + ', cell ' + SW + 'x' + SH + ', ' + ppu + ' px a game unit; ' + chars.map(c => c.name + (c.src === 'pixellab' ? ' (PixelLab)' : ' (drawn)')).join(', '));
