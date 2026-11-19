// Reading and writing RGBA PNGs for the art tools (no dependencies). Reads 8-bit grey, grey+alpha, RGB and RGBA, and indexed
// colour at 1, 2, 4 or 8 bits with or without transparency, which covers what art tools and generators write.
import fs from 'node:fs';
import zlib from 'node:zlib';

const CH = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

export function readPng(file) {
  const b = Buffer.isBuffer(file) ? file : fs.readFileSync(file);
  if (b.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let p = 8,
    w = 0,
    h = 0,
    depth = 8,
    type = 6,
    lace = 0,
    pal = null,
    trns = null;
  const parts = [];
  while (p < b.length) {
    const len = b.readUInt32BE(p),
      ty = b.toString('latin1', p + 4, p + 8),
      d = b.subarray(p + 8, p + 8 + len);
    if (ty === 'IHDR') {
      w = d.readUInt32BE(0);
      h = d.readUInt32BE(4);
      depth = d[8];
      type = d[9];
      lace = d[12];
    } else if (ty === 'PLTE') pal = d;
    else if (ty === 'tRNS') trns = d;
    else if (ty === 'IDAT') parts.push(d);
    p += 12 + len;
  }
  if (lace) throw new Error('interlaced PNGs are not read');
  if (depth !== 8 && !(type === 3 && depth < 8)) throw new Error('only 8-bit PNGs (or indexed) are read');
  const raw = zlib.inflateSync(Buffer.concat(parts)),
    bpp = Math.max(1, (CH[type] * depth) >> 3),
    stride = Math.ceil((w * CH[type] * depth) / 8),
    px = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)],
      ri = y * (stride + 1) + 1,
      o = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[o + x - bpp] : 0,
        u = y ? px[o - stride + x] : 0,
        c = x >= bpp && y ? px[o - stride + x - bpp] : 0;
      let v = raw[ri + x];
      if (f === 1) v += a;
      else if (f === 2) v += u;
      else if (f === 3) v += (a + u) >> 1;
      else if (f === 4) {
        const q = a + u - c,
          pa = Math.abs(q - a),
          pb = Math.abs(q - u),
          pc = Math.abs(q - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? u : c;
      }
      px[o + x] = v & 255;
    }
  }
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4,
        s = y * stride;
      if (type === 3) {
        const per = 8 / depth,
          byte = px[s + Math.floor(x / per)],
          i = (byte >> (8 - depth - (x % per) * depth)) & ((1 << depth) - 1);
        out[o] = pal[i * 3];
        out[o + 1] = pal[i * 3 + 1];
        out[o + 2] = pal[i * 3 + 2];
        out[o + 3] = trns && i < trns.length ? trns[i] : 255;
      } else {
        const n = CH[type],
          q = s + x * n;
        if (n <= 2) {
          out[o] = out[o + 1] = out[o + 2] = px[q];
          out[o + 3] = n === 2 ? px[q + 1] : 255;
        } else {
          out[o] = px[q];
          out[o + 1] = px[q + 1];
          out[o + 2] = px[q + 2];
          out[o + 3] = n === 4 ? px[q + 3] : 255;
        }
      }
    }
  return { w, h, data: out };
}

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc = b => {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (ty, data) => {
  const len = Buffer.alloc(4),
    td = Buffer.concat([Buffer.from(ty, 'latin1'), data]),
    c = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
};

export function writePng(file, w, h, data) {
  const ih = Buffer.alloc(13);
  ih.writeUInt32BE(w, 0);
  ih.writeUInt32BE(h, 4);
  ih[8] = 8;
  ih[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) Buffer.from(data.buffer, data.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]));
}
