// Reads an 8-bit RGB PNG back as exact bytes. Area packs keep their data in PNGs (lossless, compressed, loads anywhere), so the
// bytes must come back untouched: the first way inflates the file itself; the second lets the browser decode it and reads the
// texture back. Either result is checked against the pack's checksum.

export const checksum = a => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s = (s + a[i] * ((i % 251) + 1)) >>> 0;
  return s;
};

// Undo PNG's per-row filters (3 bytes per pixel).
export function unfilter(raw, w, h) {
  const st = w * 3,
    out = new Uint8Array(w * h * 3);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (st + 1)],
      ro = y * (st + 1) + 1,
      o = y * st,
      po = o - st;
    for (let x = 0; x < st; x++) {
      const a = x >= 3 ? out[o + x - 3] : 0,
        b = y ? out[po + x] : 0,
        c = y && x >= 3 ? out[po + x - 3] : 0;
      let pr = 0;
      if (f === 1) pr = a;
      else if (f === 2) pr = b;
      else if (f === 3) pr = (a + b) >> 1;
      else if (f === 4) {
        const pa = Math.abs(b - c),
          pb = Math.abs(a - c),
          pc = Math.abs(a + b - 2 * c);
        pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      out[o + x] = (raw[ro + x] + pr) & 255;
    }
  }
  return out;
}

async function viaInflate(url) {
  const b = new Uint8Array(await (await fetch(url)).arrayBuffer()),
    dv = new DataView(b.buffer, b.byteOffset, b.byteLength),
    parts = [];
  let p = 8,
    w = 0,
    h = 0;
  while (p < b.length) {
    const len = dv.getUint32(p),
      type = String.fromCharCode(b[p + 4], b[p + 5], b[p + 6], b[p + 7]);
    if (type === 'IHDR') {
      w = dv.getUint32(p + 8);
      h = dv.getUint32(p + 12);
    } else if (type === 'IDAT') parts.push(b.subarray(p + 8, p + 8 + len));
    p += 12 + len;
  }
  const stream = new Blob(parts).stream().pipeThrough(new DecompressionStream('deflate')),
    raw = new Uint8Array(await new Response(stream).arrayBuffer());
  return { w, h, rgb: unfilter(raw, w, h) };
}

async function viaTexture(gl, url) {
  let src;
  try {
    const blob = await (await fetch(url)).blob();
    src = await createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
  } catch (e) {
    src = await new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => rej(new Error('image'));
      im.src = url;
    });
  }
  const w = src.width,
    h = src.height,
    t = gl.createTexture(),
    fb = gl.createFramebuffer();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
  const px = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.deleteFramebuffer(fb);
  gl.deleteTexture(t);
  const rgb = new Uint8Array(w * h * 3);
  for (let i = 0, j = 0; i < px.length; i += 4) {
    rgb[j++] = px[i];
    rgb[j++] = px[i + 1];
    rgb[j++] = px[i + 2];
  }
  return { w, h, rgb };
}

export async function loadPng(gl, url, sum) {
  const ways = typeof DecompressionStream === 'function' ? [() => viaInflate(url), () => viaTexture(gl, url)] : [() => viaTexture(gl, url)];
  let last = '';
  for (const way of ways) {
    try {
      const r = await way();
      if (sum === undefined || checksum(r.rgb) === sum) return r;
      last = 'the data did not read back exactly';
    } catch (e) {
      last = String((e && e.message) || e);
    }
  }
  throw new Error(url + ': ' + last);
}
