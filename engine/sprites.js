// The cast's sprite pack, baked by tools/bake-sprites.mjs: sheet.png and sheet.json. Each character has eight facings (rows:
// south first, then clockwise), a standing frame and a walk cycle, and a knocked-out frame; the icons that bob over things
// you can use are on the same sheet. A sprite pixel is 1/ppu of a game unit, and the looks draw the world at that scale so
// sprites stay whole pixels.

async function pixels(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(url + ': ' + r.status);
  const bm = await createImageBitmap(await r.blob(), { premultiplyAlpha: 'none', colorSpaceConversion: 'none' }),
    c = document.createElement('canvas');
  c.width = bm.width;
  c.height = bm.height;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(bm, 0, 0);
  return { w: bm.width, h: bm.height, data: new Uint8Array(x.getImageData(0, 0, bm.width, bm.height).data.buffer) };
}

export async function loadSprites(base) {
  const [meta, img] = await Promise.all([
    fetch(base + '/sheet.json').then(r => {
      if (!r.ok) throw new Error(base + '/sheet.json: ' + r.status);
      return r.json();
    }),
    pixels(base + '/sheet.png')
  ]);
  const names = Object.keys(meta.cast),
    cast = names.map(n => meta.cast[n]),
    [SW, SH] = meta.cell;
  return {
    data: img.data,
    w: img.w,
    h: img.h,
    SW,
    SH,
    ppu: meta.ppu,
    names,
    icons: meta.icons,
    offY: meta.foot - SH, // (the lowest row of the feet goes a pixel into the ground)
    tall: meta.foot - meta.top, // a standing figure's height, in sprite pixels
    wide: meta.wide,
    // the frame of character ci facing row (0 south, then clockwise), standing or `dist` game units into its walk
    frame(ci, row, moving, dist) {
      const c = cast[ci],
        col = moving ? c.walk[Math.floor(dist / (meta.stride / c.walk.length)) % c.walk.length] : c.stand;
      return [c.at[0] + col * SW, c.at[1] + row * SH, SW, SH];
    },
    // lying knocked out, and how far to lower it so it lies on the ground
    ko: ci => meta.ko[names[ci]].slice(0, 4),
    koOffY: ci => meta.ko[names[ci]][4] - meta.ko[names[ci]][3]
  };
}
