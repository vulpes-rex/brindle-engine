// node tools/bake-sprites.mjs [--code] [--ppu n]
// Bakes the cast into a sprite pack the engine loads: packs/sprites/sheet.png and sheet.json.
//
// Each character comes from art/pixellab/<name>/ when it is there (rotations/<direction>.png and walk/<direction>/<n>.png, as
// tools/pixellab.mjs downloads them), or else from the cast drawn by code (game/art/sprites.js); --code uses the drawn cast
// for everyone. Every character gets eight facings (south first, clockwise: south, south-east, east, ... south-west), a
// standing frame, a walk cycle and a knocked-out frame, lined up so their feet stand on the same row. Other animations
// (anims/<name>/<direction>/<n>.png, such as the battle's idle, attack, cast and hurt) come along for the facings they were
// made in, each as a strip of frames below the characters: cropped to what its frames use (around the canvas's middle, so
// the figure stays centred), with the row its feet stand on.
//
// Generated art is given selective outlines on the way: a dark line pixel takes a deep shade of the colour beside it rather
// than black (as Xenogears' sprites are drawn). --ppu sets sprite pixels per game unit; by default it is worked out so a
// character stands about 6.4 game units tall. A character with a "scale" in art/pixellab/cast.json is drawn that much
// smaller or larger by the game (its art is left as it is).
//
// A folder art/pixellab/<name>-side/ holds that character's side-view set: drawn at eye level, in profile, for the views
// that look at the world side-on. Only its two profile facings are used, east and west, and they join <name>'s other
// animations as strips: run (its walk/<direction>/ frames), and whichever of idle, rise, fall and land it has in anims/.
// The field plays them (engine/pose.js). Rise and fall are poses in the air: their frames are drawn with the figure
// centred on where it stands (see cropStrip).
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
  // (art/pixellab/cast.json may give a character a "scale": a child stands smaller than the grown cast, drawn from the same size of art)
  castFile = path.join(root, 'art/pixellab/cast.json'),
  scales = fs.existsSync(castFile) ? Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync(castFile, 'utf8')).cast || {}).map(([k, v]) => [k, v.scale || 1])) : {},
  // a frame of the code-drawn sheet: its five drawn facings, the west side mirrored
  codeFrame = (ci, row, col) => {
    const mirror = { 'north-west': 3, west: 2, 'south-west': 1 }[ROWS[row]],
      r = mirror === undefined ? row : mirror,
      im = blank(code.SW, code.SH);
    for (let y = 0; y < code.SH; y++) im.data.set(code.data.subarray(((r * code.SH + y) * code.w + (ci * code.FR + col) * code.SW) * 4, ((r * code.SH + y) * code.w + (ci * code.FR + col + 1) * code.SW) * 4), y * code.SW * 4);
    return mirror === undefined ? im : flip(im);
  };

// an image cut (or padded) to w x h about its middle, with `up` more rows above and `down` below; says so if that loses
// any of the drawing
function fit(im, w, h, up, down, what) {
  if (im.w === w && im.h === h && !up && !down) return im;
  const H = h + up + down,
    o = blank(w, H),
    ox = (im.w - w) >> 1,
    oy = ((im.h - h) >> 1) - up;
  let lost = 0;
  for (let y = 0; y < im.h; y++)
    for (let x = 0; x < im.w; x++) {
      const i = at(im, x, y);
      if (im.data[i + 3] < 128) continue;
      const X = x - ox,
        Y = y - oy;
      if (X < 0 || Y < 0 || X >= w || Y >= H) lost++;
      else o.data.set(im.data.subarray(i, i + 4), at(o, X, Y));
    }
  if (lost) console.log('  ' + what + ': ' + lost + ' pixels fell outside the ' + w + ' x ' + H + ' cell');
  return o;
}

const chars = cast.map((name, ci) => {
  const dir = path.join(root, 'art/pixellab', name);
  if (!CODE_ONLY && fs.existsSync(path.join(dir, 'rotations', 'south.png'))) {
    const raw = ROWS.map(d => {
      const walkDir = path.join(dir, 'walk', d),
        walk = fs.existsSync(walkDir)
          ? fs
              .readdirSync(walkDir)
              .filter(f => f.endsWith('.png'))
              .sort((a, b) => parseInt(a) - parseInt(b))
              .map(f => readPng(path.join(walkDir, f)))
          : [];
      return [readPng(path.join(dir, 'rotations', d + '.png')), ...walk];
    });
    // A walk may be drawn on a larger canvas than the standing sprite, with room to move. Its frames are cut to the
    // standing sprite's width about the middle; where a step lifts the head (or drops a foot) past the standing canvas,
    // all of this character's frames get that many more rows, so nothing is cut off and the feet stay on one row.
    let up = 0,
      down = 0;
    for (const r of raw)
      for (const im of r.slice(1)) {
        const oy = (im.h - r[0].h) >> 1,
          q = span(im);
        if (q.foot < 0) continue;
        up = Math.max(up, oy - q.top);
        down = Math.max(down, q.foot - oy - (r[0].h - 1));
      }
    const rows = raw.map((r, k) => r.map((im, col) => selout(fit(im, r[0].w, r[0].h, up, down, name + (col ? ' walk ' : ' standing ') + ROWS[k]))));
    const n = Math.max(...rows.map(r => r.length));
    // (a direction short of walk frames repeats its last)
    for (const r of rows) while (r.length < n) r.push(r[r.length - 1]);
    // other animations, by name and then by the facing (row) they were made in
    const anims = {},
      animDir = path.join(dir, 'anims');
    if (fs.existsSync(animDir))
      for (const a of fs.readdirSync(animDir).sort()) {
        anims[a] = {};
        for (const d of fs.readdirSync(path.join(animDir, a)))
          anims[a][ROWS.indexOf(d)] = fs
            .readdirSync(path.join(animDir, a, d))
            .filter(f => f.endsWith('.png'))
            .sort((x, y) => parseInt(x) - parseInt(y))
            .map(f => selout(readPng(path.join(animDir, a, d, f))));
      }
    // its side-view set, if it has one: the two profile facings, as animations of this character; with, for each, the row
    // of its canvas the standing figure's feet are on (the ground under a pose in the air)
    const sideDir = dir + '-side',
      ground = {};
    if (fs.existsSync(path.join(sideDir, 'rotations')))
      for (const d of ['east', 'west']) {
        const row = ROWS.indexOf(d),
          standing = readPng(path.join(sideDir, 'rotations', d + '.png')),
          load = folder =>
            fs
              .readdirSync(folder)
              .filter(f => f.endsWith('.png'))
              .sort((x, y) => parseInt(x) - parseInt(y))
              .map(f => selout(readPng(path.join(folder, f)))),
          add = (a, folder) => {
            if (!fs.existsSync(folder)) return;
            const frames = load(folder);
            if (!frames.length) return;
            (anims[a] = anims[a] || {})[row] = frames;
            (ground[a] = ground[a] || {})[row] = span(standing).foot + ((frames[0].h - standing.h) >> 1);
          };
        add('run', path.join(sideDir, 'walk', d));
        if (fs.existsSync(path.join(sideDir, 'anims'))) for (const a of fs.readdirSync(path.join(sideDir, 'anims')).sort()) add(a, path.join(sideDir, 'anims', a, d));
      }
    return { name, src: 'pixellab', rows, anims, ground, stand: 0, walk: n > 1 ? [...Array(n - 1).keys()].map(i => i + 1) : [0] };
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
for (const c of chars) c.anims = c.anims || {};

// an animation's frames cropped together to what they use, kept centred on the canvas's middle. The row its feet stand on
// is the first frame's lowest, unless `ground` gives it (for poses in the air, whose feet are not on the ground: the row
// the standing sprite's feet are on, were it in the middle of this canvas)
function cropStrip(frames, ground) {
  const W = frames[0].w,
    H = frames[0].h,
    cx = W / 2,
    s = frames.map(span);
  let l = W,
    r = 0;
  for (const im of frames)
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (im.data[at(im, x, y) + 3] > 127) {
          l = Math.min(l, x);
          r = Math.max(r, x);
        }
  const half = Math.min(cx, Math.ceil(Math.max(cx - l, r + 1 - cx)) + 1),
    x0 = Math.floor(cx - half),
    top = Math.max(0, Math.min(...s.map(q => q.top)) - 1),
    bottom = Math.min(H - 1, Math.max(ground === undefined ? -1 : ground, ...s.map(q => q.foot)) + 1),
    w = 2 * half,
    h = bottom - top + 1;
  return {
    foot: (ground === undefined ? s[0].foot : ground) - top,
    frames: frames.map(im => {
      const o = blank(w, h);
      for (let y = 0; y < h; y++) o.data.set(im.data.subarray(at(im, x0, top + y), at(im, x0 + w, top + y)), y * w * 4);
      return o;
    })
  };
}
// (rise and fall are poses in the air: the ground is where the side set's standing figure has its feet)
const AIR = ['rise', 'fall'];
for (const c of chars)
  for (const [a, byRow] of Object.entries(c.anims))
    for (const row of Object.keys(byRow)) byRow[row] = cropStrip(byRow[row], AIR.includes(a) && c.ground && c.ground[a] ? c.ground[a][row] : undefined);

// one cell size for all, every character's feet on the same row
const SW = Math.max(...chars.map(c => c.rows[0][0].w)),
  SH0 = Math.max(...chars.map(c => c.rows[0][0].h)),
  feet = chars.map(c => span(c.rows[0][c.stand]).foot),
  foot = Math.max(...feet),
  lift = chars.map((c, i) => foot - feet[i]),
  SH = Math.max(SH0, ...chars.map((c, i) => c.rows[0][0].h + lift[i])),
  tops = chars.map((c, i) => span(c.rows[0][c.stand]).top + lift[i]),
  wide = Math.max(...chars.map(c => span(c.rows[0][c.stand]).wide));

// ---- the sheet: each character a block of (frames x 8 facings); below, the other animations as strips, then the
// knocked-out frames and the icons (kept within 2048 pixels across, which every WebGL 2 device can take)
// (a character's block is as wide as its own frames: one with a longer walk does not widen the rest)
const blockH = ROWS.length * SH,
  blocks = [],
  strips = [];
{
  let bx = 0,
    by = 0;
  for (const c of chars) {
    const w = c.rows[0].length * SW;
    if (bx && bx + w > 2048) {
      bx = 0;
      by += blockH;
    }
    blocks.push([bx, by, w]);
    bx += w;
  }
}
const stripY = Math.max(...blocks.map(b => b[1])) + blockH;
const stripH = Math.max(SH, ...chars.flatMap(c => Object.values(c.anims).flatMap(byRow => Object.values(byRow).map(s => s.frames[0].h)))),
  sheetW = Math.max(...blocks.map(b => b[0] + b[2]), ...chars.flatMap(c => Object.values(c.anims).flatMap(byRow => Object.values(byRow).map(s => s.frames.length * s.frames[0].w))));
let sx = 0,
  sy = stripY;
for (const c of chars)
  for (const [a, byRow] of Object.entries(c.anims))
    for (const [row, { frames, foot }] of Object.entries(byRow)) {
      const w = frames.length * frames[0].w;
      if (sx + w > sheetW) {
        sx = 0;
        sy += stripH;
      }
      strips.push({ c, a, row: +row, frames, foot, x: sx, y: sy });
      sx += w;
    }
const koY = strips.length ? sy + stripH : stripY,
  iconY = koY + Math.max(SW, SH),
  sheet = blank(sheetW, iconY + 16),
  paste = (im, X, Y) => {
    for (let y = 0; y < im.h; y++)
      for (let x = 0; x < im.w; x++) {
        const s = at(im, x, y);
        if (im.data[s + 3] && X + x < sheet.w && Y + y < sheet.h) sheet.data.set(im.data.subarray(s, s + 4), at(sheet, X + x, Y + y));
      }
  },
  meta = { ppu, cell: [SW, SH], foot, top: Math.min(...tops), wide, stride: STRIDE, rows: ROWS, cast: {}, ko: {}, icons: {} };
chars.forEach((c, i) => {
  const [bx, by] = blocks[i],
    dx = Math.floor((SW - c.rows[0][0].w) / 2);
  c.rows.forEach((r, row) => r.forEach((im, col) => paste(im, bx + col * SW + dx, by + row * SH + lift[i])));
  meta.cast[c.name] = { at: [bx, by], stand: c.stand, walk: c.walk, from: c.src };
  if (c.src === 'pixellab' && scales[c.name] && scales[c.name] !== 1) meta.cast[c.name].size = scales[c.name];
  for (const s of strips.filter(s => s.c === c)) {
    const fw = s.frames[0].w,
      fh = s.frames[0].h;
    s.frames.forEach((im, k) => paste(im, s.x + k * fw, s.y));
    const an = ((meta.cast[c.name].anims = meta.cast[c.name].anims || {})[s.a] = meta.cast[c.name].anims[s.a] || { n: 0, rows: {} });
    an.n = Math.max(an.n, s.frames.length);
    an.rows[s.row] = [s.x, s.y, fw, fh, s.foot];
  }
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
