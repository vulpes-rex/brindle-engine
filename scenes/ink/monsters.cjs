'use strict';
/* Two original battle monsters authored with Ink Studio (sculpt -> bake -> puppet), posed by a small state object so that an
   exporter can sample any clip at any time: st = { clip: 'idle' | 'attack' | 'hurt' | 'defeat', t: seconds } */
const PAL = [
  0x0b1114,
  0x2b2a38, 0x4b4a5a, 0x7b7b8c, 0xb1b1bc, // 1-4 stone
  0x1c3a26, 0x2f6238, 0x5a9646, 0xa3d168, // 5-8 moss
  0x0f4a4e, 0x1f9c90, 0x74f2da, 0xdcfff6, // 9-12 teal crystal
  0x3b2619, 0x6d452a, 0xa46e3e, 0xdcaa62, // 13-16 hide
  0xffae2e, 0xffeaa6, // 17-18 amber eye
  0x16306a, 0x2f6ad0, 0x6fc0ff, 0xe4f8ff, // 19-22 wisp flame
  0x4a4338, 0x8a7f6a, 0xc9bea2, 0xf4ecd6, // 23-26 bone
  0x7a3cff, 0xd9b8ff, // 27-28 violet
  0x15131c // 29 near black
];
const TAU = Math.PI * 2;
const CLIPS = { idle: { dur: 2.4, loop: true }, attack: { dur: 0.8 }, hurt: { dur: 0.55 }, defeat: { dur: 0.7 } };
const grabNormals = B => {
  const n = B.count(),
    out = new Float32Array(n * 3),
    chk = (grabNormals.chk = new Float32Array(n * 3)),
    d = new Array(10);
  for (let i = 0; i < n; i++) {
    const r = B.dabAt(i, d);
    if (r) {
      chk[i * 3] = r[0];
      chk[i * 3 + 1] = r[1];
      chk[i * 3 + 2] = r[2];
      out[i * 3] = r[3];
      out[i * 3 + 1] = r[4];
      out[i * 3 + 2] = r[5];
    }
  }
  return out;
};
const set = (pose, part, ch, v) => {
  (pose[part] || (pose[part] = {}))[ch] = v;
};

function mossback(kit, st, sun) {
  const { makeBuilder, makeSculpt, KIT: K } = kit;
  const B = makeBuilder(11, PAL),
    S = K.sculpt(makeSculpt(B));
  S.res = 0.118;
  if (sun) S.sun = B.norm(sun);
  const tags = K.deform.tags(S);
  const stone = { r: [1, 2, 3, 4], by: [{ a: 'up', from: 0.45, to: 0.8, ramp: [5, 6, 7, 8], edge: 0.9 }] },
    plain = { r: [1, 2, 3, 4] },
    hide = { r: [13, 14, 15, 16] },
    cry = { r: [10, 11, 12], em: true },
    eye = { r: [17, 18], em: true },
    tusk = { r: [24, 25, 26] };
  // belly and shell
  S.ball([0.05, 0.98, 0], [1.42, 0.86, 1.16], hide, { tag: 'body' });
  S.ball([-0.18, 1.3, 0], [1.4, 0.86, 1.2], stone, { tag: 'body', bump: [0.05, 2.2] });
  for (const q of [[-0.2, 2.05, 0.1, 0.34], [0.55, 1.9, -0.5, 0.26], [-0.85, 1.8, 0.55, 0.3], [-0.7, 1.85, -0.6, 0.24], [0.45, 1.85, 0.62, 0.22]])
    S.rock([q[0], q[1], q[2]], q[3], stone, { tag: 'body' });
  for (const q of [[-0.25, 0, 0.9, 0.1, 0.2], [-0.75, -0.3, 0.7, -0.25, 0.15], [0.2, 0.25, 0.62, 0.3, 0.13]])
    S.tube([[q[0], 2.0, q[1]], [q[0] + q[3] * 0.6, 2.0 + q[2], q[1] + q[3]]], q[4], 0.03, cry, { tag: 'body' });
  // head, jaw, eyes
  S.ball([1.5, 0.98, 0], [0.64, 0.56, 0.6], hide, { tag: 'head', whole: true });
  S.ball([1.42, 1.34, 0], [0.62, 0.3, 0.62], plain, { tag: 'head' });
  S.ball([1.72, 0.62, 0], [0.5, 0.24, 0.46], hide, { tag: 'jaw', whole: true });
  for (const s of [-1, 1]) {
    S.ball([1.98, 1.06, 0.3 * s], 0.14, eye, { tag: 'head' });
    S.tube([[1.9, 0.6, 0.36 * s], [2.16, 0.98, 0.42 * s]], 0.1, 0.03, tusk, { tag: 'jaw' });
    S.tube([[1.2, 1.5, 0.42 * s], [0.95, 1.95, 0.62 * s]], 0.13, 0.03, tusk, { tag: 'head' });
  }
  // legs and tail
  const legs = { 'leg-fl': [0.82, 0.95], 'leg-fr': [0.82, -0.95], 'leg-bl': [-0.9, 1.0], 'leg-br': [-0.9, -1.0] };
  for (const name in legs) {
    const [x, z] = legs[name],
      s = z > 0 ? 1 : -1;
    S.tube([[x, 0.8, z], [x + 0.12, 0.38, z + 0.2 * s], [x + 0.2, 0.06, z + 0.24 * s]], 0.36, 0.42, hide, { tag: name, whole: true });
    for (const c of [-0.16, 0.16]) S.ball([x + 0.6, 0.1, z + 0.24 * s + c], 0.1, tusk, { tag: name });
  }
  S.tube([[-1.3, 0.98, 0], [-1.85, 0.8, 0], [-2.3, 1.0, 0]], 0.34, 0.11, hide, { tag: 'tail', whole: true });
  S.ball([-2.4, 1.06, 0], 0.2, cry, { tag: 'tail' });
  S.bake();
  const NRM = grabNormals(B);
  const W = B.finish({ cam: { target: [0, 1.1, 0], dist: 11, pitch: 0.5, yaw: 0.75 }, detail: 13, dither: 0.2 });
  const u = 0.022,
    atk = K.acts.clip('attack', { part: 'body', unit: u, dur: CLIPS.attack.dur, gain: 1.5 }),
    hurt = K.acts.clip('hurt', { part: 'body', unit: u * 0.8, dur: CLIPS.hurt.dur, gain: 1.3 }),
    dft = K.acts.clip('defeat', { part: 'body', unit: u * 0.9, dur: CLIPS.defeat.dur, gain: 1.4 });
  const parts = {
    body: { ids: tags.body, pivot: [0, 0, 0], slices: 6 },
    head: { ids: tags.head, pivot: [1.05, 1.0, 0], parent: 'body' },
    jaw: { ids: tags.jaw, pivot: [1.3, 0.72, 0], parent: 'head' },
    tail: { ids: tags.tail, pivot: [-1.3, 0.98, 0], parent: 'body' }
  };
  for (const name in legs) parts[name] = { ids: tags[name], pivot: [legs[name][0], 0.85, legs[name][1]], parent: 'body' };
  K.puppet(W, {
    parts,
    pose(_t, _dt, p) {
      const t = st.t,
        P = p.pose,
        w = Math.sin((TAU * t) / CLIPS.idle.dur);
      if (st.clip === 'idle') {
        set(P, 'body', 'stretch', 1 + 0.035 * w);
        set(P, 'head', 'rot', [0, 7 * Math.sin((TAU * t) / CLIPS.idle.dur + 1), 3 * w]);
        set(P, 'jaw', 'rot', [0, 0, -3 - 3 * w]);
        set(P, 'tail', 'rot', [0, 16 * Math.sin((TAU * 2 * t) / CLIPS.idle.dur), 4 * w]);
      } else if (st.clip === 'attack') {
        atk.sample(t, P);
        const k = t / CLIPS.attack.dur,
          bite = Math.max(0, 1 - Math.abs(k - 0.3) / 0.17),
          rear = Math.max(0, 1 - Math.abs(k - 0.1) / 0.12);
        set(P, 'head', 'rot', [0, 0, 14 * rear - 10 * bite]);
        set(P, 'jaw', 'rot', [0, 0, -34 * rear - 6 + 20 * bite]);
        set(P, 'tail', 'rot', [0, 0, 20 * rear + 12 * bite]);
        set(P, 'leg-fl', 'rot', [0, 0, -18 * rear + 22 * bite]);
        set(P, 'leg-fr', 'rot', [0, 0, -18 * rear + 22 * bite]);
      } else {
        (st.clip === 'hurt' ? hurt : dft).sample(Math.min(t, 0.55), P);
        const k = Math.min(1, t / 0.3),
          f = Math.sin(Math.PI * Math.min(1, t / 0.5));
        set(P, 'head', 'rot', [0, 0, 16 * f]);
        set(P, 'jaw', 'rot', [0, 0, -26 * f]);
        set(P, 'tail', 'rot', [0, 0, -18 * f]);
        if (st.clip === 'defeat') {
          const d = Math.min(1, t / CLIPS.defeat.dur),
            e = d * d * (3 - 2 * d);
          set(P, 'body', 'stretch', 1 - 0.3 * e);
          set(P, 'body', 'rot', [8 * e, 0, -6 * e]);
          set(P, 'head', 'rot', [0, 0, -22 * e + 16 * f * (1 - e)]);
          set(P, 'jaw', 'rot', [0, 0, -30 * e]);
          for (const n in legs) set(P, n, 'rot', [(legs[n][1] > 0 ? -1 : 1) * 30 * e, 0, 0]);
        }
        void k;
      }
    }
  });
  W.nrm = NRM;
  W.chk = grabNormals.chk;
  return W;
}

function wisp(kit, st, sun) {
  const { makeBuilder, makeSculpt, KIT: K } = kit;
  const B = makeBuilder(23, PAL),
    S = K.sculpt(makeSculpt(B));
  S.res = 0.075;
  if (sun) S.sun = B.norm(sun);
  const tags = K.deform.tags(S);
  const flame = { r: [21], em: true, rf: (x, y, z) => { const h = y + 0.5 * (B.n3(x * 2.1, y * 1.4, z * 2.1) - 0.5) + 0.35 * Math.hypot(x, z); return h < 0.95 ? [19] : h < 1.6 ? [20] : h < 2.75 ? [21] : [22]; } },
    core = { r: [21, 22], em: true },
    bone = { r: [23, 24, 25, 26] },
    stone = { r: [1, 2, 3, 4] },
    dark = { r: [29, 29] },
    vio = { r: [27, 28], em: true };
  // the flame body: a teardrop with a trailing wick
  S.ball([0, 1.95, 0], [0.66, 0.84, 0.66], flame, { tag: 'body', whole: true });
  S.tube([[0, 1.55, 0], [-0.1, 0.95, 0.05], [0.08, 0.5, -0.04], [-0.05, 0.16, 0]], 0.5, 0.05, flame, { tag: 'body' });
  S.tube([[0, 2.6, 0], [-0.12, 3.0, 0.04], [0.05, 3.32, 0]], 0.3, 0.04, flame, { tag: 'body' });
  // a bone mask on the front, with two hollow eyes and a mark
  S.ball([0.5, 2.0, 0], [0.24, 0.56, 0.5], bone, { tag: 'mask', whole: true });
  for (const s of [-1, 1]) {
    S.ball([0.7, 2.12, 0.2 * s], [0.1, 0.13, 0.12], dark, { tag: 'mask' });
    S.ball([0.74, 2.12, 0.2 * s], 0.055, vio, { tag: 'mask' });
    S.tube([[0.42, 2.45, 0.34 * s], [0.5, 2.95, 0.6 * s], [0.74, 3.2, 0.5 * s]], 0.1, 0.025, bone, { tag: 'mask' });
  }
  S.box([0.73, 1.72, 0], [0.04, 0.14, 0.05], dark, { tag: 'mask' });
  S.ball([0, 1.95, 0], 0.3, core, { tag: 'body' });
  // four stone shards that circle it
  const shards = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + 0.4,
      r = 1.32,
      y = 1.55 + 0.5 * (i % 2);
    shards.push('shard' + i);
    S.rock([Math.cos(a) * r, y, Math.sin(a) * r], 0.26 - 0.03 * (i % 2), stone, { tag: 'shard' + i, whole: true });
    S.ball([Math.cos(a) * r, y + 0.02, Math.sin(a) * r], 0.1, vio, { tag: 'shard' + i });
  }
  S.bake();
  const NRM = grabNormals(B);
  const W = B.finish({ cam: { target: [0, 1.8, 0], dist: 12, pitch: 0.4, yaw: 0.75 }, detail: 13, dither: 0.2 });
  const u = 0.024,
    atk = K.acts.clip('attack', { part: 'body', unit: u, dur: CLIPS.attack.dur, gain: 1.6 }),
    hurt = K.acts.clip('hurt', { part: 'body', unit: u, dur: CLIPS.hurt.dur, gain: 1.4 });
  const parts = { body: { ids: tags.body, pivot: [0, 0.15, 0], slices: 7 }, mask: { ids: tags.mask, pivot: [0.3, 2.0, 0], parent: 'body' } };
  for (const n of shards) parts[n] = { ids: tags[n], pivot: [0, 1.8, 0] };
  K.puppet(W, {
    parts,
    pose(_t, _dt, p) {
      const t = st.t,
        P = p.pose,
        ph = (TAU * t) / CLIPS.idle.dur;
      let bob = 0.16 * Math.sin(ph),
        spin = (360 * t) / CLIPS.idle.dur,
        spread = 1,
        dx = 0;
      if (st.clip === 'idle') {
        set(P, 'body', 'pos', [0, bob, 0]);
        set(P, 'body', 'stretch', 1 + 0.05 * Math.sin(ph * 2));
        set(P, 'body', 'rot', [0, 0, 4 * Math.sin(ph)]);
        set(P, 'mask', 'rot', [0, 6 * Math.sin(ph), 3 * Math.sin(ph * 2)]);
      } else if (st.clip === 'attack') {
        atk.sample(t, P);
        const k = t / CLIPS.attack.dur,
          flare = Math.max(0, 1 - Math.abs(k - 0.3) / 0.2);
        dx = P.body.pos[0];
        spin = 900 * k * k * (3 - 2 * k);
        spread = 1 - 0.45 * Math.max(0, 1 - Math.abs(k - 0.12) / 0.12) + 0.5 * flare;
        set(P, 'mask', 'rot', [0, 0, -12 * flare]);
        set(P, 'body', 'inflate', 0.12 * flare);
      } else {
        hurt.sample(Math.min(t, 0.55), P);
        const f = Math.sin(Math.PI * Math.min(1, t / 0.5));
        dx = P.body.pos[0];
        spread = 1 + 0.6 * f;
        spin = 200 * t;
        set(P, 'mask', 'rot', [0, 0, 20 * f]);
        if (st.clip === 'defeat') {
          const d = Math.min(1, t / CLIPS.defeat.dur),
            e = d * d * (3 - 2 * d);
          set(P, 'body', 'stretch', 1 - 0.55 * e);
          set(P, 'body', 'pos', [P.body.pos[0], -0.2 * e, 0]);
          set(P, 'mask', 'rot', [0, 0, 20 * f * (1 - e) - 50 * e]);
          set(P, 'mask', 'pos', [0.1 * e, -0.5 * e, 0]);
          spread = 1 + 0.6 * f + 1.2 * e;
          bob = -1.3 * e;
        }
      }
      for (let i = 0; i < shards.length; i++) {
        set(P, shards[i], 'rot', [0, spin, 0]);
        set(P, shards[i], 'pos', [dx, (st.clip === 'defeat' ? bob : bob * 0.6) + 0.12 * Math.sin(ph * 2 + i * 1.7), 0]);
        set(P, shards[i], 'scale', 1);
        if (spread !== 1) {
          const a = (i / 4) * TAU + 0.4 + (spin * Math.PI) / 180;
          P[shards[i]].pos[0] += Math.cos(a) * 1.32 * (spread - 1);
          P[shards[i]].pos[2] += -Math.sin(a) * 1.32 * (spread - 1);
        }
      }
    }
  });
  W.nrm = NRM;
  W.chk = grabNormals.chk;
  return W;
}
module.exports = { PAL, CLIPS, mossback, wisp };
