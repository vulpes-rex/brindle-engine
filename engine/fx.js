// Battle effects in the manner of Golden Sun's Psynergy: short-lived glows, sparks, streaks, crystals, beams and ground
// glyphs in world units, added onto the picture, with the scene dimmed behind them and the odd white flash. A battle plays
// named presets; the look draws what emit() hands back. Pure: no DOM, no WebGL.
//
//   fx.play(name, { at: [x, y, z], from, h, r, color: '#b48cff' | [r, g, b], right: [x, z] })
//     at: where it lands (feet), from: where it starts (for shard), h: how tall the target is, r: how wide,
//     right: the camera's screen-right on the ground (so slashes and bolts cross the picture, not run into it)

export const KIND = { glow: 0, star: 1, streak: 2, crystal: 3, beam: 4, ring: 5, glyph: 6, shock: 7 };

export function hexColor(c) {
  if (Array.isArray(c)) return c;
  let h = String(c || '#fff').replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const v = parseInt(h, 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}

// each preset's colour when the data names none
const TINT = { cast: '#ffe896', slash: '#8fd0ff', hit: '#fff', burst: '#7ff', bolts: '#b48cff', heal: '#8ff5c8', ward: '#9cc8ff', shard: '#9ff', quake: '#c8a070', hum: '#9ff', defeat: '#ffd890' };

const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k],
  WHITE = [1, 1, 1];

export function createFx(random) {
  const rnd = random || Math.random,
    parts = [],
    timers = [];
  let t = 0,
    data = new Float32Array(1024 * 14),
    dim = 0,
    dimT = 0,
    flash = [1, 1, 1, 0];

  // one particle: { kind, a: [x, y, z], b?, v?, g, drag, w, h, w1?, h1?, grow?, rot, vr, alpha, life, fadeIn, fadeOut, col, over,
  //   flicker }  (w1 and h1: the size it grows to, over `grow` seconds or its whole life)
  function add(p) {
    const q = Object.assign({ age: 0, life: 0.5, v: [0, 0, 0], g: 0, drag: 0, w: 1, h: null, rot: 0, vr: 0, alpha: 1, fadeIn: 0.04, fadeOut: 0.4, col: WHITE, kind: KIND.glow, over: false, flicker: 0 }, p);
    q.a = q.a.slice();
    if (q.b) q.b = q.b.slice();
    if (q.h === null) q.h = q.w;
    parts.push(q);
    return q;
  }
  const later = (dt, fn) => timers.push({ at: t + dt, fn });
  const ang = () => rnd() * Math.PI * 2;

  // ---- the presets
  const P = {
    // the caster gathers power: a turning glyph underfoot, a column of light and sparks rising
    cast(o) {
      const c = o.col,
        [x, y, z] = o.at,
        d = o.dur || 0.7;
      add({ kind: KIND.glyph, a: [x, y + 0.15, z], w: 0.5, w1: 3.6, grow: 0.22, life: d + 0.35, vr: 2.2, col: c, alpha: 1, fadeIn: 0.06, fadeOut: 0.3 });
      add({ kind: KIND.beam, a: [x, y, z], w: 2.2, h: 11, life: d + 0.2, col: c, alpha: 0.3, fadeIn: 0.15 });
      add({ kind: KIND.glow, a: [x, y + 3.5, z], w: 3.6, life: d + 0.2, col: c, alpha: 0.35, fadeIn: 0.15 });
      for (let i = 0; i < Math.round(d / 0.03); i++)
        later(i * 0.03, () => {
          const an = ang(),
            r = 1 + rnd() * 1.4;
          add({ kind: KIND.star, a: [x + Math.cos(an) * r, y + rnd() * 1.5, z + Math.sin(an) * r], v: [0, 6 + rnd() * 6, 0], w: 0.35 + rnd() * 0.25, life: 0.55, col: mix(c, WHITE, rnd() * 0.6), rot: rnd() });
        });
      for (let i = 0; i < 2; i++) later(i * 0.3, () => add({ kind: KIND.ring, a: [x, y + 0.2, z], w: 0.6, w1: 3.8, life: 0.45, col: c, alpha: 0.9 }));
    },
    // a blade: a bright arc swept across the target, then sparks
    slash(o) {
      const c = o.col,
        [x, y, z] = o.at,
        h = o.h || 6,
        R = Math.max(3.2, (o.r || 2) * 1.35),
        rx = o.right[0],
        rz = o.right[1],
        cy = y + h * 0.55,
        pt = a => [x + rx * Math.cos(a) * R, cy + Math.sin(a) * R, z + rz * Math.cos(a) * R],
        n = 10;
      for (let i = 0; i < n; i++) {
        const a0 = 0.95 - (i / n) * 2.9,
          a1 = 0.95 - ((i + 1) / n) * 2.9,
          th = 0.18 + 0.5 * Math.sin((Math.PI * (i + 0.5)) / n);
        later(i * 0.012, () => {
          add({ kind: KIND.streak, a: pt(a0), b: pt(a1), w: th * 2.6, life: 0.3, col: c, alpha: 0.75, over: true });
          add({ kind: KIND.streak, a: pt(a0), b: pt(a1), w: th * 0.8, life: 0.24, col: WHITE, alpha: 1, over: true });
        });
      }
      later(0.08, () => P.hit({ at: [x, y, z], h, col: c, big: true }));
    },
    // a strike lands: a flash and a spray of sparks
    hit(o) {
      const [x, y, z] = o.at,
        cy = y + (o.h || 6) * 0.5,
        c = o.col || WHITE,
        k = o.big ? 1.5 : 1;
      add({ kind: KIND.glow, a: [x, cy, z], w: 2.6 * k, life: 0.18, col: mix(c, WHITE, 0.5), alpha: 1, over: true, fadeIn: 0 });
      add({ kind: KIND.star, a: [x, cy, z], w: 2.2 * k, life: 0.2, col: WHITE, alpha: 1, over: true, fadeIn: 0, rot: rnd() });
      for (let i = 0; i < 8 * k; i++) {
        const an = ang(),
          up = rnd() * 2 - 0.6,
          sp = 9 + rnd() * 9;
        add({ kind: KIND.star, a: [x, cy, z], v: [Math.cos(an) * sp, up * sp * 0.6, Math.sin(an) * sp], drag: 4, g: -10, w: 0.35 + rnd() * 0.3, life: 0.4 + rnd() * 0.2, col: mix(c, WHITE, rnd()), over: true });
      }
    },
    // a burst of magic on the target
    burst(o) {
      const [x, y, z] = o.at,
        c = o.col,
        cy = y + (o.h || 6) * 0.5;
      add({ kind: KIND.glow, a: [x, cy, z], w: 4.5, life: 0.35, col: c, alpha: 1, over: true, fadeIn: 0 });
      add({ kind: KIND.shock, a: [x, cy, z], w: 1, w1: 7, life: 0.35, col: mix(c, WHITE, 0.4), over: true });
      add({ kind: KIND.ring, a: [x, y + 0.2, z], w: 1, w1: 6, life: 0.5, col: c });
      for (let i = 0; i < 18; i++) {
        const an = ang(),
          el = rnd() * 1.4 - 0.4,
          sp = 8 + rnd() * 12;
        add({ kind: KIND.star, a: [x, cy, z], v: [Math.cos(an) * Math.cos(el) * sp, Math.sin(el) * sp, Math.sin(an) * Math.cos(el) * sp], drag: 3, g: -6, w: 0.4 + rnd() * 0.4, life: 0.5 + rnd() * 0.3, col: mix(c, WHITE, rnd() * 0.7), over: true });
      }
    },
    // lightning called down, and crystals of light bursting up around the target (Golden Sun's Ray)
    bolts(o) {
      const [x, y, z] = o.at,
        c = o.col,
        h = o.h || 6,
        R = (o.r || 2) + 0.8,
        rx = o.right[0],
        rz = o.right[1];
      for (let b = 0; b < 4; b++)
        later(b * 0.1, () => {
          const off = (rnd() - 0.5) * R,
            pts = [];
          for (let i = 0; i <= 7; i++) {
            const k = i / 7,
              j = i === 0 || i === 7 ? 0 : (rnd() - 0.5) * 2.4;
            pts.push([x + rx * (off * (1 - k) + j), y + h * 0.5 + (1 - k) * 30, z + rz * (off * (1 - k) + j)]);
          }
          for (let i = 0; i < 7; i++) {
            add({ kind: KIND.streak, a: pts[i], b: pts[i + 1], w: 1.1, life: 0.24, col: c, alpha: 0.75, flicker: 0.6, over: true, fadeIn: 0 });
            add({ kind: KIND.streak, a: pts[i], b: pts[i + 1], w: 0.32, life: 0.2, col: WHITE, alpha: 1, flicker: 0.5, over: true, fadeIn: 0 });
          }
          add({ kind: KIND.glow, a: [x, y + h * 0.5, z], w: 5, life: 0.2, col: mix(c, WHITE, 0.4), alpha: 1, over: true, fadeIn: 0 });
        });
      for (let i = 0; i < 13; i++) {
        const an = (i / 13) * Math.PI * 2 + rnd() * 0.4,
          r = R * (0.45 + rnd() * 0.85),
          px = x + Math.cos(an) * r,
          pz = z + Math.sin(an) * r,
          tall = 5 + rnd() * 8;
        later(0.05 + i * 0.035, () => {
          add({ kind: KIND.crystal, a: [px, y - 0.2, pz], w: 1 + rnd() * 0.6, h: 0.5, h1: tall, life: 0.8, col: c, alpha: 0.95, rot: (rnd() - 0.5) * 0.5, fadeIn: 0.02, fadeOut: 0.3 });
          later(0.55, () => {
            for (let k = 0; k < 4; k++) add({ kind: KIND.star, a: [px, y + rnd() * tall, pz], v: [(rnd() - 0.5) * 8, 4 + rnd() * 6, (rnd() - 0.5) * 8], g: -14, w: 0.35, life: 0.45, col: mix(c, WHITE, 0.5) });
          });
        });
      }
      add({ kind: KIND.ring, a: [x, y + 0.2, z], w: 1, w1: R * 2.4, life: 0.6, col: c });
    },
    // healing: a soft column, sparkles drifting down and rings rising (Golden Sun's Cure)
    heal(o) {
      const [x, y, z] = o.at,
        c = o.col;
      add({ kind: KIND.beam, a: [x, y, z], w: 2.2, h: 14, life: 1.0, col: c, alpha: 0.7, fadeIn: 0.2 });
      add({ kind: KIND.glyph, a: [x, y + 0.15, z], w: 2.6, life: 1.0, vr: -1.6, col: c, alpha: 0.8, fadeIn: 0.15 });
      for (let i = 0; i < 26; i++)
        later(rnd() * 0.6, () => {
          const an = ang(),
            r = rnd() * 2;
          add({ kind: KIND.star, a: [x + Math.cos(an) * r, y + 9 + rnd() * 5, z + Math.sin(an) * r], v: [0, -6 - rnd() * 4, 0], w: 0.3 + rnd() * 0.35, life: 0.9, col: mix(c, WHITE, rnd() * 0.8), rot: rnd() });
        });
      for (let i = 0; i < 3; i++) later(0.15 + i * 0.2, () => add({ kind: KIND.ring, a: [x, y + 0.3, z], v: [0, 7, 0], w: 2.4, w1: 1.6, life: 0.7, col: mix(c, WHITE, 0.3), alpha: 0.9 }));
    },
    // a guard of light rises around someone
    ward(o) {
      const [x, y, z] = o.at,
        c = o.col;
      add({ kind: KIND.ring, a: [x, y + 0.2, z], w: 0.6, w1: 2.6, life: 0.4, col: WHITE, alpha: 1 });
      add({ kind: KIND.beam, a: [x, y, z], w: 2.6, h: 9, life: 0.8, col: c, alpha: 0.6, fadeIn: 0.1 });
      for (let i = 0; i < 4; i++) later(i * 0.12, () => add({ kind: KIND.ring, a: [x, y + 0.3, z], v: [0, 9, 0], w: 2.6, life: 0.55, col: c, alpha: 0.9 }));
      for (let i = 0; i < 10; i++) {
        const an = ang();
        add({ kind: KIND.star, a: [x + Math.cos(an) * 2.4, y + rnd() * 2, z + Math.sin(an) * 2.4], v: [0, 5 + rnd() * 5, 0], w: 0.35, life: 0.6, col: mix(c, WHITE, 0.6) });
      }
    },
    // a thrown shard: a bright point streaking from `from` to `at`, with a trail, bursting where it lands
    shard(o) {
      const a = o.from,
        b = [o.at[0], o.at[1] + (o.h || 6) * 0.5, o.at[2]],
        c = o.col,
        T = 0.17;
      add({ kind: KIND.star, a, v: [(b[0] - a[0]) / T, (b[1] - a[1]) / T, (b[2] - a[2]) / T], w: 1.1, life: T, col: WHITE, vr: 20, over: true, fadeOut: 0 });
      for (let i = 0; i < 8; i++) {
        const k = i / 8;
        later(k * T, () => add({ kind: KIND.glow, a: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k], w: 1.2, w1: 0.2, life: 0.25, col: c, over: true }));
      }
      later(T, () => P.burst({ at: o.at, h: o.h, col: c }));
    },
    // the ground heaves: shock rings from the stomp, and dirt thrown up under each target
    quake(o) {
      const [x, y, z] = o.from || o.at,
        c = o.col;
      for (let i = 0; i < 3; i++) later(i * 0.1, () => add({ kind: KIND.ring, a: [x, y + 0.2, z], w: 2, w1: 26, life: 0.6, col: c, alpha: 0.8 }));
      for (const at of o.targets || [o.at])
        for (let i = 0; i < 12; i++) {
          const an = ang(),
            r = rnd() * 2;
          later(0.1 + rnd() * 0.15, () => add({ kind: KIND.glow, a: [at[0] + Math.cos(an) * r, at[1] + 0.3, at[2] + Math.sin(an) * r], v: [Math.cos(an) * 3, 7 + rnd() * 7, Math.sin(an) * 3], g: -26, w: 0.5 + rnd() * 0.5, life: 0.6, col: mix(c, [0.4, 0.3, 0.2], rnd() * 0.5), alpha: 0.8 }));
        }
    },
    // a piercing note: rings of sound rolling out from the singer
    hum(o) {
      const [x, y, z] = o.from || o.at,
        c = o.col,
        cy = y + (o.fh || 5);
      for (let i = 0; i < 5; i++) later(i * 0.09, () => add({ kind: KIND.shock, a: [x, cy, z], w: 1, w1: 16, life: 0.55, col: c, alpha: 0.9, over: true }));
      later(0.25, () => {
        for (const at of o.targets || []) P.burst({ at, h: o.h, col: c });
      });
    },
    // a foe is beaten: it flares white and comes apart in sparks
    defeat(o) {
      const [x, y, z] = o.at,
        h = o.h || 6,
        c = o.col || [1, 0.85, 0.6];
      add({ kind: KIND.glow, a: [x, y + h * 0.5, z], w: h * 0.5, life: 0.45, col: mix(c, WHITE, 0.4), alpha: 0.85, over: true, fadeIn: 0.05 });
      add({ kind: KIND.shock, a: [x, y + h * 0.5, z], w: 1, w1: h * 1.2, life: 0.45, col: c, over: true });
      for (let i = 0; i < 30; i++) {
        const an = ang(),
          r = rnd() * (o.r || 2);
        later(rnd() * 0.5, () => add({ kind: KIND.star, a: [x + Math.cos(an) * r, y + rnd() * h, z + Math.sin(an) * r], v: [Math.cos(an) * 3, 4 + rnd() * 8, Math.sin(an) * 3], drag: 1, w: 0.3 + rnd() * 0.4, life: 0.7, col: mix(c, WHITE, rnd()) }));
      }
    }
  };

  return {
    presets: Object.keys(P),
    color: hexColor,
    // play a preset now
    play(name, o) {
      const f = P[name];
      if (!f) throw new Error('Unknown effect: ' + name);
      f(Object.assign({ right: [1, 0] }, o, { col: hexColor((o && o.color) || TINT[name]) }));
    },
    // dim the scene behind the effects (0..1); it eases there
    dimTo(k) {
      dimT = k;
    },
    flash(col, k) {
      flash = hexColor(col).concat([k === undefined ? 0.6 : k]);
    },
    clear() {
      parts.length = timers.length = 0;
      dim = dimT = 0;
      flash[3] = 0;
    },
    get count() {
      return parts.length;
    },
    update(dt) {
      t += dt;
      for (let i = 0; i < timers.length; i++)
        if (timers[i].at <= t) {
          const f = timers[i].fn;
          timers.splice(i--, 1);
          f();
        }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.age += dt;
        if (p.age >= p.life) {
          parts.splice(i, 1);
          continue;
        }
        const k = Math.exp(-p.drag * dt);
        p.v[0] *= k;
        p.v[2] *= k;
        p.v[1] = p.v[1] * k + p.g * dt;
        for (let j = 0; j < 3; j++) {
          p.a[j] += p.v[j] * dt;
          if (p.b) p.b[j] += p.v[j] * dt;
        }
        p.rot += p.vr * dt;
      }
      dim += (dimT - dim) * (1 - Math.exp(-dt * 7));
      flash[3] = Math.max(0, flash[3] - dt * 3.5);
    },
    // what the look draws: { data, n, over } (the last `over` instances ignore depth), the dimming and the flash
    emit() {
      if (data.length < parts.length * 14) data = new Float32Array(parts.length * 28);
      let n = 0;
      const put = p => {
        const k = p.age / p.life,
          e = Math.min(1, p.fadeIn > 0 ? p.age / p.fadeIn : 1) * Math.min(1, p.fadeOut > 0 ? (1 - k) / p.fadeOut : 1),
          f = p.flicker ? 1 - p.flicker * rnd() : 1,
          gk = p.grow ? Math.min(1, p.age / p.grow) : k,
          ge = p.grow ? 1 - (1 - gk) * (1 - gk) : gk,
          w = p.w1 == null ? p.w : p.w + (p.w1 - p.w) * ge,
          h = p.h1 == null ? (p.w1 == null ? p.h : w) : p.h + (p.h1 - p.h) * Math.min(1, k * 4),
          b = p.b || p.a,
          o = n * 14;
        data.set([p.a[0], p.a[1], p.a[2], b[0], b[1], b[2], w, h, p.rot, p.kind, p.col[0], p.col[1], p.col[2], p.alpha * e * f], o);
        n++;
      };
      for (const p of parts) if (!p.over) put(p);
      const under = n;
      for (const p of parts) if (p.over) put(p);
      return { fx: { data, n, over: n - under }, dim, flash: flash[3] > 0 ? flash : null };
    }
  };
}
