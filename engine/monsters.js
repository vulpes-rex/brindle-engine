// Monsters: sculpted and animated in Ink Studio, baked (tools/bake-monsters.cjs) to rest splats plus bone clips, and skinned
// here on the CPU each frame. A pack entry is { n, nb, range, rmax, tr, lift, fps, d (base64 splats), clips: {name: {dur, loop, nf, d}} }.

function b64(s) {
  const b = atob(s),
    u = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
  return u;
}

// Decode one monster. F (6 floats a splat: position, two radii, turn) and NB (normal bytes) are what a look draws from.
export function decodeMonster(d) {
  const raw = b64(d.d),
    dv = new DataView(raw.buffer),
    n = d.n,
    pos = new Float32Array(n * 3),
    nrm = new Float32Array(n * 3),
    rad = new Float32Array(n),
    CB = new Uint8Array(n * 4),
    b1 = new Uint8Array(n),
    b2 = new Uint8Array(n),
    w2 = new Float32Array(n),
    rnd = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const q = i * 17;
    for (let a = 0; a < 3; a++) {
      pos[i * 3 + a] = (dv.getInt16(q + a * 2, true) / 32767) * d.range;
      nrm[i * 3 + a] = dv.getInt8(q + 6 + a) / 127;
    }
    rad[i] = (raw[q + 9] / 255) * d.rmax;
    CB[i * 4] = raw[q + 10];
    CB[i * 4 + 1] = raw[q + 11];
    CB[i * 4 + 2] = raw[q + 12];
    CB[i * 4 + 3] = raw[q + 13];
    b1[i] = raw[q + 14];
    b2[i] = raw[q + 15];
    w2[i] = raw[q + 16] / 255;
    rnd[i] = (Math.imul(i + 1, 2654435761) >>> 0) / 4294967296;
  }
  const clips = {};
  for (const name in d.clips) {
    const c = d.clips[name],
      u = b64(c.d),
      v = new DataView(u.buffer),
      fr = new Float32Array(c.nf * d.nb * 12);
    for (let i = 0; i < fr.length; i++) {
      const x = v.getInt16(i * 2, true);
      fr[i] = i % 12 < 9 ? x / 8192 : (x / 32767) * d.tr;
    }
    clips[name] = { dur: c.dur, loop: c.loop, nf: c.nf, fr };
  }
  return { n, nb: d.nb, fps: d.fps, lift: d.lift, pos, nrm, rad, b1, b2, w2, rnd, clips, CB, F: new Float32Array(n * 6), NB: new Int8Array(n * 4), BM: new Float32Array(d.nb * 12), CF: new Float32Array(d.nb * 9) };
}

// Pose monster m at time tm of a clip, standing at (ox, oy, oz); dis 0..1 dissolves it (a defeat). Fills m.F and m.NB.
export function skinMonster(m, clip, tm, ox, oy, oz, dis, yaw) {
  const c = m.clips[clip],
    nb = m.nb,
    last = c.nf - 1;
  let f = tm * m.fps;
  if (c.loop) {
    f = f % last;
    if (f < 0) f += last;
  } else if (f > last) f = last;
  if (f < 0) f = 0;
  const i0 = Math.floor(f),
    i1 = Math.min(last, i0 + 1),
    a = f - i0,
    BM = m.BM,
    CF = m.CF,
    fr = c.fr,
    o0 = i0 * nb * 12,
    o1 = i1 * nb * 12;
  for (let i = 0; i < nb * 12; i++) BM[i] = fr[o0 + i] + (fr[o1 + i] - fr[o0 + i]) * a;
  // turned about the upright axis (a hero's model faces whatever it is acting on; the foes are baked facing the party)
  if (yaw) {
    const cy = Math.cos(yaw),
      sy = Math.sin(yaw);
    for (let k = 0; k < nb; k++)
      for (const j of [0, 1, 2, 9]) {
        const q = k * 12 + j,
          r = j === 9 ? k * 12 + 11 : q + 6,
          x = BM[q],
          z = BM[r];
        BM[q] = cy * x + sy * z;
        BM[r] = cy * z - sy * x;
      }
  }
  // (normals turn by each bone's cofactor matrix, so squash and stretch keep them upright)
  for (let k = 0; k < nb; k++) {
    const q = k * 12,
      A = BM[q],
      B = BM[q + 1],
      C = BM[q + 2],
      D = BM[q + 3],
      E = BM[q + 4],
      F = BM[q + 5],
      G = BM[q + 6],
      H = BM[q + 7],
      I = BM[q + 8],
      c9 = k * 9;
    CF[c9] = E * I - F * H;
    CF[c9 + 1] = F * G - D * I;
    CF[c9 + 2] = D * H - E * G;
    CF[c9 + 3] = C * H - B * I;
    CF[c9 + 4] = A * I - C * G;
    CF[c9 + 5] = B * G - A * H;
    CF[c9 + 6] = B * F - C * E;
    CF[c9 + 7] = C * D - A * F;
    CF[c9 + 8] = A * E - B * D;
  }
  const P = m.pos,
    N = m.nrm,
    F = m.F,
    NB = m.NB,
    oyy = oy + m.lift;
  for (let i = 0; i < m.n; i++) {
    const x = P[i * 3],
      y = P[i * 3 + 1],
      z = P[i * 3 + 2],
      q = m.b1[i] * 12;
    let px = BM[q] * x + BM[q + 1] * y + BM[q + 2] * z + BM[q + 9],
      py = BM[q + 3] * x + BM[q + 4] * y + BM[q + 5] * z + BM[q + 10],
      pz = BM[q + 6] * x + BM[q + 7] * y + BM[q + 8] * z + BM[q + 11];
    const w = m.w2[i];
    if (w > 0) {
      const r = m.b2[i] * 12;
      px += (BM[r] * x + BM[r + 1] * y + BM[r + 2] * z + BM[r + 9] - px) * w;
      py += (BM[r + 3] * x + BM[r + 4] * y + BM[r + 5] * z + BM[r + 10] - py) * w;
      pz += (BM[r + 6] * x + BM[r + 7] * y + BM[r + 8] * z + BM[r + 11] - pz) * w;
    }
    const c9 = m.b1[i] * 9,
      nx = N[i * 3],
      ny = N[i * 3 + 1],
      nz = N[i * 3 + 2],
      ax = CF[c9] * nx + CF[c9 + 1] * ny + CF[c9 + 2] * nz,
      ay = CF[c9 + 3] * nx + CF[c9 + 4] * ny + CF[c9 + 5] * nz,
      az = CF[c9 + 6] * nx + CF[c9 + 7] * ny + CF[c9 + 8] * nz,
      l = Math.hypot(ax, ay, az) || 1,
      h = m.rnd[i];
    let r = m.rad[i] * Math.sqrt(l < 0.45 ? 0.45 : l > 2.2 ? 2.2 : l);
    if (dis > 0) {
      if (h < dis * 1.15) r = 0;
      else {
        py -= dis * dis * 1.6 * (0.4 + h);
        r *= 1 - 0.4 * dis;
      }
    }
    const o = i * 6;
    F[o] = ox + px;
    F[o + 1] = oyy + py;
    F[o + 2] = oz + pz;
    F[o + 3] = r;
    F[o + 4] = r;
    F[o + 5] = h * 6.283;
    NB[i * 4] = (ax / l) * 127;
    NB[i * 4 + 1] = (ay / l) * 127;
    NB[i * 4 + 2] = (az / l) * 127;
    NB[i * 4 + 3] = 0;
  }
}
