// Drawn battle effects, packed by tools/bake-fx.mjs from sprite sheets made with beanfx. An effect is a few sheets on one
// picture (each with its colour frames on top and its light frames under them) and a list of parts: which sheet, where it
// stands about the target, and when it starts. A skill's hit names an effect with "sheet"; the battle then stands each part
// up as a card of its own at its place on the ground, so a ring of crystals goes round the target, some behind it and some
// in front, whatever the camera's angle. Each card's colour is drawn first and its light added over it. An effect can also
// ask for rings on the ground, which the look draws flat.
import { pixels } from './sprites.js';

// load the named effects from a folder; one that fails to load is left out (the battle falls back to the hit's "fx")
export async function loadSheetFx(base, names) {
  const out = {};
  await Promise.all(
    names.map(async n => {
      try {
        const [meta, img] = await Promise.all([
          fetch(base + '/' + n + '.json').then(r => {
            if (!r.ok) throw new Error(base + '/' + n + '.json: ' + r.status);
            return r.json();
          }),
          pixels(base + '/' + n + '.png')
        ]);
        out[n] = Object.assign({ name: n, w: img.w, h: img.h, data: img.data }, meta);
      } catch (e) {
        console.warn('effect sheet "' + n + '" did not load: ' + e.message);
      }
    })
  );
  return out;
}

// where frame f of a sheet sits on the picture: { colour: [x, y, w, h], light: [x, y, w, h] }, or null once it is over
export function sheetFrame(sh, f) {
  if (f < 0 || f >= sh.frames) return null;
  const [w, h] = sh.cell,
    x = sh.x + (f % sh.cols) * w,
    y = Math.floor(f / sh.cols) * h;
  return { colour: [x, sh.y + y, w, h], light: [x, sh.lightY + y, w, h] };
}
