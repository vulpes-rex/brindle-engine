// node tools/convert-rig.mjs <model.glb> <packs/monsters.json> <name> [--size 9] [--splats 6000] [--idle Clip] [--attack Clip]
//                           [--yaw degrees] [--colours 12] [--fat 1.2]
// Turns a rigged, animated GLB (a generated or hand-made model) into a monster the engine can skin: rest splats scattered over
// its surface, coloured from its texture, and bone clips at 20 fps, in the format tools/bake-monsters.cjs writes. No dependencies.
//   --size     how long its longest side is, in game units (the Mossback is 11)
//   --idle     the clip to loop while it waits (default: the first one); --attack: the clip its attack is cut from (default: the last)
//   --yaw      turn it about the upright axis; left out, its longest side is laid along x. Foes face +x, towards the party
// "hurt" and "defeat" are made here from the idle pose (a flinch, a fall on its side): models rarely bring their own.
// Reads: one skin, triangles, base colour texture (PNG) or factor, linear and step animation (cubic splines are read as linear).
import fs from 'node:fs';
import { readPng } from './png-rgba.mjs';

const args = process.argv.slice(2),
  flag = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : args[i + 1]; },
  [SRC, OUT, NAME] = args;
if (!SRC || !OUT || !NAME) { console.error('usage: node tools/convert-rig.mjs <model.glb> <packs/monsters.json> <name> [options]'); process.exit(1); }
const SIZE = +flag('size', 9), COUNT = +flag('splats', 6000), NCOL = +flag('colours', 12), FAT = +flag('fat', 1.2), YAW = flag('yaw', null), FPS = 20;

// ---- the file
const file = fs.readFileSync(SRC);
if (file.readUInt32LE(0) !== 0x46546c67) throw new Error('not a GLB file');
let g = null, bin = null;
for (let o = 12; o + 8 <= file.length; ) { const len = file.readUInt32LE(o), kind = file.readUInt32LE(o + 4), body = file.subarray(o + 8, o + 8 + len); if (kind === 0x4e4f534a) g = JSON.parse(body.toString('utf8')); else if (kind === 0x004e4942 && !bin) bin = body; o += 8 + len; }
const COMP = { 5120: [1, 'getInt8', 127], 5121: [1, 'getUint8', 255], 5122: [2, 'getInt16', 32767], 5123: [2, 'getUint16', 65535], 5125: [4, 'getUint32', 1], 5126: [4, 'getFloat32', 1] },
  WIDTH = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
const acc = i => {
  const a = g.accessors[i], bv = g.bufferViews[a.bufferView], [sz, fn, top] = COMP[a.componentType], w = WIDTH[a.type], stride = bv.byteStride || sz * w,
    dv = new DataView(bin.buffer, bin.byteOffset + (bv.byteOffset || 0) + (a.byteOffset || 0)), k = a.normalized ? 1 / top : 1, out = new Float64Array(a.count * w);
  for (let e = 0; e < a.count; e++) for (let c = 0; c < w; c++) out[e * w + c] = dv[fn](e * stride + c * sz, true) * k;
  return { n: a.count, w, d: out };
};

// ---- 4x4 matrices, column-major as glTF keeps them
const ID = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const mul = (a, b) => { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]; return o; };
const trs = (t, q, s) => { const [x, y, z, w] = q, [sx, sy, sz] = s;
  return [(1 - 2 * (y * y + z * z)) * sx, 2 * (x * y + z * w) * sx, 2 * (x * z - y * w) * sx, 0, 2 * (x * y - z * w) * sy, (1 - 2 * (x * x + z * z)) * sy, 2 * (y * z + x * w) * sy, 0,
    2 * (x * z + y * w) * sz, 2 * (y * z - x * w) * sz, (1 - 2 * (x * x + y * y)) * sz, 0, t[0], t[1], t[2], 1]; };
const inv = m => { // an affine matrix
  const a = m[0], b = m[4], c = m[8], d = m[1], e = m[5], f = m[9], gg = m[2], h = m[6], i = m[10], A = e * i - f * h, B = f * gg - d * i, C = d * h - e * gg, det = a * A + b * B + c * C, k = 1 / det,
    r = [A * k, B * k, C * k, 0, (c * h - b * i) * k, (a * i - c * gg) * k, (b * gg - a * h) * k, 0, (b * f - c * e) * k, (c * d - a * f) * k, (a * e - b * d) * k, 0, 0, 0, 0, 1];
  r[12] = -(r[0] * m[12] + r[4] * m[13] + r[8] * m[14]); r[13] = -(r[1] * m[12] + r[5] * m[13] + r[9] * m[14]); r[14] = -(r[2] * m[12] + r[6] * m[13] + r[10] * m[14]);
  return r; };
const at = (m, x, y, z) => [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];
const rotY = a => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]; };
const rotX = a => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]; };
const rotZ = a => { const c = Math.cos(a), s = Math.sin(a); return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; };
const move = (x, y, z) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
const scl = s => [s, 0, 0, 0, 0, s, 0, 0, 0, 0, s, 0, 0, 0, 0, 1];

// ---- the skeleton and its clips
const ni = g.nodes.findIndex(n => n.mesh !== undefined && n.skin !== undefined);
if (ni < 0) throw new Error('no skinned mesh in this file: a monster needs a skeleton');
const skin = g.skins[g.nodes[ni].skin], joints = skin.joints, NB = joints.length;
if (NB > 255) throw new Error('too many bones: ' + NB + ' (255 at most)');
const ibm = skin.inverseBindMatrices !== undefined ? acc(skin.inverseBindMatrices).d : null, IBM = joints.map((_, j) => (ibm ? Array.from(ibm.subarray(j * 16, j * 16 + 16)) : ID()));
const parent = new Array(g.nodes.length).fill(-1);
g.nodes.forEach((n, i) => (n.children || []).forEach(c => (parent[c] = i)));
const anims = (g.animations || []).map((a, i) => {
  const ch = a.channels.filter(c => c.target.node !== undefined).map(c => { const s = a.samplers[c.sampler], inp = acc(s.input), out = acc(s.output), cub = s.interpolation === 'CUBICSPLINE';
    return { node: c.target.node, path: c.target.path, t: inp.d, v: out.d, w: out.w, step: s.interpolation === 'STEP', cub }; });
  return { name: a.name || 'clip' + i, ch, dur: Math.max(...ch.map(c => c.t[c.t.length - 1])) };
});
if (!anims.length) throw new Error('this file has no animation: a monster needs at least an idle clip');
const slerp = (a, b, u) => { let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]; const s = d < 0 ? -1 : 1; d = Math.abs(d); let ka = 1 - u, kb = u;
  if (d < 0.9995) { const th = Math.acos(d), sn = Math.sin(th); ka = Math.sin((1 - u) * th) / sn; kb = Math.sin(u * th) / sn; }
  const o = [a[0] * ka + b[0] * kb * s, a[1] * ka + b[1] * kb * s, a[2] * ka + b[2] * kb * s, a[3] * ka + b[3] * kb * s], l = Math.hypot(...o) || 1; return o.map(v => v / l); };
// the bones of a clip at a time: for each joint, world * inverse bind
const pose = (clip, time) => {
  const loc = g.nodes.map(n => ({ t: n.translation || [0, 0, 0], r: n.rotation || [0, 0, 0, 1], s: n.scale || [1, 1, 1], m: n.matrix || null }));
  if (clip) for (const c of clip.ch) {
    const T = c.t, n = T.length; let k = 0; while (k < n - 2 && T[k + 1] <= time) k++;
    const u = n < 2 || c.step ? (time >= T[Math.min(k + 1, n - 1)] ? 1 : 0) : Math.max(0, Math.min(1, (time - T[k]) / (T[k + 1] - T[k] || 1))), k1 = Math.min(n - 1, k + 1);
    const val = e => { const w = c.w, o = c.cub ? e * w * 3 + w : e * w; return Array.from(c.v.subarray(o, o + w)); }, a = val(k), b = val(k1);
    const v = c.path === 'rotation' ? slerp(a, b, u) : a.map((x, i) => x + (b[i] - x) * u), L = loc[c.node];
    if (c.path === 'translation') L.t = v; else if (c.path === 'rotation') L.r = v; else if (c.path === 'scale') L.s = v;
    L.m = null;
  }
  const world = new Array(g.nodes.length);
  const W = i => world[i] || (world[i] = (() => { const L = loc[i], m = L.m || trs(L.t, L.r, L.s); return parent[i] < 0 ? m : mul(W(parent[i]), m); })());
  return joints.map((j, k) => mul(W(j), IBM[k]));
};
const byName = (want, fallback) => { if (want === undefined) return fallback; const a = anims.find(a => a.name.toLowerCase() === String(want).toLowerCase()); if (!a) throw new Error('no clip called "' + want + '": this file has ' + anims.map(a => a.name).join(', ')); return a; };
const IDLE = byName(flag('idle'), anims[0]), ATTACK = byName(flag('attack'), anims[anims.length - 1]);

// ---- the mesh, in bind space
const prims = g.meshes[g.nodes[ni].mesh].primitives.filter(p => p.mode === undefined || p.mode === 4);
const images = new Map(), imageOf = mi => {
  const m = mi === undefined ? null : g.materials[mi], pbr = (m && m.pbrMetallicRoughness) || {}, f = pbr.baseColorFactor || [1, 1, 1, 1], bt = pbr.baseColorTexture;
  let img = null;
  if (bt) { const si = g.textures[bt.index].source; if (!images.has(si)) { const im = g.images[si], bv = g.bufferViews[im.bufferView];
      if (im.mimeType !== 'image/png') { console.warn('texture ' + si + ' is ' + im.mimeType + ', not PNG: using the material colour'); images.set(si, null); }
      else images.set(si, readPng(Buffer.from(bin.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength)))); }
    img = images.get(si); }
  return { f, img };
};
const tris = []; // each: three vertices { p, n, uv, j[4], w[4] } and its material
for (const pr of prims) {
  const P = acc(pr.attributes.POSITION), Nn = pr.attributes.NORMAL !== undefined ? acc(pr.attributes.NORMAL) : null, UV = pr.attributes.TEXCOORD_0 !== undefined ? acc(pr.attributes.TEXCOORD_0) : null;
  if (pr.attributes.JOINTS_0 === undefined) throw new Error('a part of the mesh is not weighted to the skeleton');
  const J = acc(pr.attributes.JOINTS_0), Wt = acc(pr.attributes.WEIGHTS_0), idx = pr.indices !== undefined ? acc(pr.indices).d : Float64Array.from({ length: P.n }, (_, i) => i), mat = imageOf(pr.material);
  const vert = i => ({ p: [P.d[i * 3], P.d[i * 3 + 1], P.d[i * 3 + 2]], n: Nn ? [Nn.d[i * 3], Nn.d[i * 3 + 1], Nn.d[i * 3 + 2]] : null, uv: UV ? [UV.d[i * 2], UV.d[i * 2 + 1]] : null,
    j: [0, 1, 2, 3].map(k => J.d[i * 4 + k]), w: [0, 1, 2, 3].map(k => Wt.d[i * 4 + k]) });
  for (let e = 0; e + 2 < idx.length; e += 3) tris.push({ v: [vert(idx[e]), vert(idx[e + 1]), vert(idx[e + 2])], mat });
}
if (!tris.length) throw new Error('no triangles');
const texel = (im, u, v) => { u -= Math.floor(u); v -= Math.floor(v); const x = Math.min(im.w - 1, Math.floor(u * im.w)), y = Math.min(im.h - 1, Math.floor(v * im.h)), i = (y * im.w + x) * 4; return [im.data[i], im.data[i + 1], im.data[i + 2]]; };
const srgb = v => Math.round(255 * Math.pow(Math.max(0, Math.min(1, v)), 1 / 2.2));

// ---- where it stands: the idle pose at its start decides size, turn and ground
const B0 = pose(IDLE, 0);
const skinned = (B, v, p) => { let x = 0, y = 0, z = 0, ws = 0; for (let k = 0; k < 4; k++) { const w = v.w[k]; if (!(w > 0)) continue; const q = at(B[v.j[k]], p[0], p[1], p[2]); x += q[0] * w; y += q[1] * w; z += q[2] * w; ws += w; } return ws > 0 ? [x / ws, y / ws, z / ws] : p.slice(); };
let lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9], area = 0;
const cross = (a, b, c) => { const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]; return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; };
for (const t of tris) { t.q = t.v.map(v => skinned(B0, v, v.p)); for (const q of t.q) for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], q[a]); hi[a] = Math.max(hi[a], q[a]); } t.area = 0.5 * Math.hypot(...cross(...t.q)); area += t.area; }
const yaw = YAW !== null ? (+YAW * Math.PI) / 180 : hi[2] - lo[2] > hi[0] - lo[0] ? Math.PI / 2 : 0;
// (turn first, then measure again, then scale and centre, feet on the ground)
let R = rotY(yaw), l2 = [1e9, 1e9, 1e9], h2 = [-1e9, -1e9, -1e9];
for (const t of tris) for (const q of t.q) { const p = at(R, ...q); for (let a = 0; a < 3; a++) { l2[a] = Math.min(l2[a], p[a]); h2[a] = Math.max(h2[a], p[a]); } }
const sN = SIZE / Math.max(h2[0] - l2[0], h2[1] - l2[1], h2[2] - l2[2]);
const N = mul(move(-((l2[0] + h2[0]) / 2) * sN, -l2[1] * sN, -((l2[2] + h2[2]) / 2) * sN), mul(scl(sN), R));
// rest space: bind space, scaled so the bone matrices come out near unit size (they are kept as fixed-point)
const b0 = B0[0], sB = Math.cbrt(Math.abs(b0[0] * (b0[5] * b0[10] - b0[9] * b0[6]) - b0[4] * (b0[1] * b0[10] - b0[9] * b0[2]) + b0[8] * (b0[1] * b0[6] - b0[5] * b0[2]))) || 1;
const NbS = sN * sB, Nb = scl(NbS), NbI = scl(1 / NbS);
const bones = B => B.map(b => mul(N, mul(b, NbI))); // rest (scaled bind) -> where it stands

// ---- scatter the splats
const h = Math.sqrt((area * sN * sN) / COUNT), rad = FAT * h, S = [];
let carry = 0.5, k = 0;
for (const t of tris) {
  carry += (t.area / area) * COUNT; const cnt = Math.floor(carry); carry -= cnt;
  const fn = cross(t.v[0].p, t.v[1].p, t.v[2].p), fl = Math.hypot(...fn) || 1;
  for (let c = 0; c < cnt; c++) {
    k++; let a = (k * 0.7548776662466927) % 1, b = (k * 0.5698402909980532) % 1; if (a + b > 1) { a = 1 - a; b = 1 - b; }
    const w = [1 - a - b, a, b], mix = f => [0, 1, 2].map(i => f(t.v[0])[i] * w[0] + f(t.v[1])[i] * w[1] + f(t.v[2])[i] * w[2]);
    const p = mix(v => v.p); let n = t.v[0].n ? mix(v => v.n) : fn.slice(); const nl = Math.hypot(...n) || 1; n = n.map(x => x / nl);
    if (!t.v[0].n) n = fn.map(x => x / fl);
    let col = t.mat.f.slice(0, 3).map(srgb);
    if (t.mat.img && t.v[0].uv) { const u = t.v[0].uv[0] * w[0] + t.v[1].uv[0] * w[1] + t.v[2].uv[0] * w[2], vv = t.v[0].uv[1] * w[0] + t.v[1].uv[1] * w[1] + t.v[2].uv[1] * w[2], tx = texel(t.mat.img, u, vv); col = tx.map((x, i) => Math.round(x * Math.min(1, t.mat.f[i]))); }
    // the two bones that hold this point most
    const wt = new Map(); t.v.forEach((v, i) => v.j.forEach((j, q) => v.w[q] > 0 && wt.set(j, (wt.get(j) || 0) + v.w[q] * w[i])));
    const top = [...wt.entries()].sort((x, y) => y[1] - x[1]), b1 = top[0][0], b2 = top[1] ? top[1][0] : b1, w2 = top[1] ? top[1][1] / (top[0][1] + top[1][1]) : 0;
    S.push({ p: p.map(x => x * NbS), n, col, b1, b2, w2 });
  }
}
// a few colours, as pixel art has: k-means over the splats' colours
{ let cen = []; for (let i = 0; i < NCOL; i++) cen.push(S[Math.floor(((i + 0.5) / NCOL) * S.length)].col.slice());
  for (let it = 0; it < 12; it++) { const sum = cen.map(() => [0, 0, 0, 0]);
    for (const s of S) { let bi = 0, bd = 1e9; cen.forEach((c, i) => { const d = (c[0] - s.col[0]) ** 2 * 0.3 + (c[1] - s.col[1]) ** 2 * 0.59 + (c[2] - s.col[2]) ** 2 * 0.11; if (d < bd) { bd = d; bi = i; } }); s.ci = bi; const q = sum[bi]; q[0] += s.col[0]; q[1] += s.col[1]; q[2] += s.col[2]; q[3]++; }
    cen = cen.map((c, i) => (sum[i][3] ? sum[i].slice(0, 3).map(v => v / sum[i][3]) : c)); }
  for (const s of S) s.col = cen[s.ci].map(Math.round); }

// ---- pack the splats (17 bytes each, as tools/bake-monsters.cjs)
const n = S.length; let range = 0; for (const s of S) for (let a = 0; a < 3; a++) range = Math.max(range, Math.abs(s.p[a])); range = Math.ceil(range + 0.5);
const buf = Buffer.alloc(n * 17);
S.forEach((s, i) => { const q = i * 17; for (let a = 0; a < 3; a++) { buf.writeInt16LE(Math.round((s.p[a] / range) * 32767), q + a * 2); buf.writeInt8(Math.max(-127, Math.min(127, Math.round(s.n[a] * 127))), q + 6 + a); }
  buf[q + 9] = 255; buf[q + 10] = s.col[0]; buf[q + 11] = s.col[1]; buf[q + 12] = s.col[2]; buf[q + 13] = 0; buf[q + 14] = s.b1; buf[q + 15] = s.b2; buf[q + 16] = Math.round(s.w2 * 255); });

// ---- the clips: idle looped, attack cut from a clip, hurt and defeat made from the idle pose
const ease = u => u * u * (3 - 2 * u), lerpM = (A, B, u) => A.map((m, i) => m.map((v, e) => v + (B[i][e] - v) * u));
const idle0 = bones(B0), idleDur = Math.max(0.4, Math.round(IDLE.dur * FPS) / FPS), ht = (h2[1] - l2[1]) * sN;
const make = {
  idle: { dur: idleDur, loop: true, at: u => bones(pose(IDLE, u * IDLE.dur)) },
  // one pass of the attack clip, eased in from and back out to the idle pose
  attack: { dur: 0.8, at: u => { const m = bones(pose(ATTACK, (u * ATTACK.dur * Math.max(1, Math.round(0.8 / ATTACK.dur))) % ATTACK.dur)), f = Math.min(1, u / 0.15, (1 - u) / 0.2); return f < 1 ? lerpM(idle0, m, ease(Math.max(0, f))) : m; } },
  // a flinch: back and nose up, with a shiver
  hurt: { dur: 0.55, at: u => { const k = Math.sin(Math.PI * u), G = mul(move(-0.07 * SIZE * k + 0.012 * SIZE * Math.sin(u * 40) * (1 - u), 0, 0), rotZ(0.2 * k)); return idle0.map(m => mul(G, m)); } },
  // falls on its side and sinks a little
  defeat: { dur: 0.7, at: u => { const e = ease(u), G = mul(move(0, -0.06 * ht * e, 0), rotX(1.35 * e)); return idle0.map(m => mul(G, m)); } }
};
const raw = {}; let tr = 0, mmax = 0;
for (const cn in make) { const c = make[cn], nf = Math.round(c.dur * FPS) + 1, fr = new Float32Array(nf * NB * 12);
  for (let f = 0; f < nf; f++) { const M = c.at(nf > 1 ? f / (nf - 1) : 0);
    for (let b = 0; b < NB; b++) { const m = M[b], o = (f * NB + b) * 12; // rows of the 3x3, then the translation
      fr[o] = m[0]; fr[o + 1] = m[4]; fr[o + 2] = m[8]; fr[o + 3] = m[1]; fr[o + 4] = m[5]; fr[o + 5] = m[9]; fr[o + 6] = m[2]; fr[o + 7] = m[6]; fr[o + 8] = m[10]; fr[o + 9] = m[12]; fr[o + 10] = m[13]; fr[o + 11] = m[14];
      for (let e = 0; e < 9; e++) mmax = Math.max(mmax, Math.abs(fr[o + e])); for (let e = 9; e < 12; e++) tr = Math.max(tr, Math.abs(fr[o + e])); } }
  raw[cn] = { nf, fr, dur: c.dur, loop: !!c.loop }; }
if (mmax > 3.99) throw new Error('a bone stretches too far for the pack (' + mmax.toFixed(2) + '): does the animation scale its bones?');
tr = Math.ceil(tr + 0.5);
const clips = {};
for (const cn in raw) { const r = raw[cn], b = Buffer.alloc(r.fr.length * 2); for (let i = 0; i < r.fr.length; i++) { const v = i % 12 < 9 ? r.fr[i] * 8192 : (r.fr[i] / tr) * 32767; b.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(v))), i * 2); }
  clips[cn] = { dur: r.dur, loop: r.loop, nf: r.nf, d: b.toString('base64') }; }

// ---- check, as the page will read it: skin every splat at the idle's start and compare with the model's own skinning
let worst = 0, top = 0, wide = 0;
{ const fr = raw.idle.fr; let i = 0, kk = 0, c2 = 0.5;
  for (const t of tris) { c2 += (t.area / area) * COUNT; const cnt = Math.floor(c2); c2 -= cnt;
    for (let c = 0; c < cnt; c++, i++) { kk++; if (i % 5) continue; let a = (kk * 0.7548776662466927) % 1, b = (kk * 0.5698402909980532) % 1; if (a + b > 1) { a = 1 - a; b = 1 - b; }
      const w = [1 - a - b, a, b], s = S[i], q = i * 17, x = (buf.readInt16LE(q) / 32767) * range, y = (buf.readInt16LE(q + 2) / 32767) * range, z = (buf.readInt16LE(q + 4) / 32767) * range;
      const P = b1 => { const o = b1 * 12, m = e => (e < 9 ? Math.round(fr[o + e] * 8192) / 8192 : (Math.round((fr[o + e] / tr) * 32767) / 32767) * tr); return [m(0) * x + m(1) * y + m(2) * z + m(9), m(3) * x + m(4) * y + m(5) * z + m(10), m(6) * x + m(7) * y + m(8) * z + m(11)]; };
      let p = P(s.b1); if (s.w2 > 0) { const p2 = P(s.b2), ww = Math.round(s.w2 * 255) / 255; p = p.map((v, e) => v + (p2[e] - v) * ww); }
      const tv = [0, 1, 2].map(e => t.q[0][e] * w[0] + t.q[1][e] * w[1] + t.q[2][e] * w[2]), want = at(N, ...tv);
      worst = Math.max(worst, Math.hypot(p[0] - want[0], p[1] - want[1], p[2] - want[2])); top = Math.max(top, p[1]); wide = Math.max(wide, Math.abs(p[2]), Math.abs(p[0]) * 0); } } }
const pack = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
pack[NAME] = { n, nb: NB, range, rmax: +rad.toFixed(4), tr, lift: 0, fps: FPS, d: buf.toString('base64'), clips };
fs.writeFileSync(OUT, JSON.stringify(pack));
console.log(NAME + ': ' + n + ' splats, ' + NB + ' bones, radius ' + rad.toFixed(3) + ', range ' + range + ', tr ' + tr + ', clips from "' + IDLE.name + '" (idle, ' + idleDur + ' s) and "' + ATTACK.name + '" (attack); the file has ' + anims.map(a => a.name).join(', '));
console.log('furthest a splat lands from the model\'s own skinning (two bones a splat, where the model may use four): ' + worst.toFixed(3) + ' game units');
console.log('for game/monsters.json: "top": ' + (top + 0.6).toFixed(1) + ', "mid": ' + (top * 0.5).toFixed(1) + ', "rad": ' + Math.max(1.5, wide + 0.4).toFixed(1));
console.log('wrote ' + OUT + ' (' + fs.statSync(OUT).size + ' bytes)');
