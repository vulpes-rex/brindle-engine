// Jumping, for an area walked side-on (after Castlevania, by way of Valkyrie Profile): a body that rises and falls, the
// ground as something solid to stand on and to be stopped by, and ledges above it.
//
// A ledge is the flat top of something: [x0, x1, z0, z1, y]. One stands on it having come down onto it, and passes up
// through it from below; it never stops anyone going across. Only the ground is a wall, where it rises more than a step
// above one's feet: a cliff or the riser of a terrace, not a hillside or a stair.
//
// A ledge may do something, said in a sixth entry:
//   { move: [axis, reach, period, phase] }  it glides to and fro along 'x', 'y' or 'z', `reach` either way of where it was
//                                           put, there and back once in `period` seconds (phase: 0..1 of the way round),
//                                           and carries whoever stands on it
//   { crumble: seconds, back: seconds }     stood on, it falls away after `crumble` and is there again `back` later
// Such ledges go by the clock: call tick(t) before the bodies are stepped.

export const JUMP = {
  g: 75, // how hard a body falls, game units a second each second
  v: 28, // how fast a jump leaves the ground: it tops out v * v / (2 * g) = 5.2 up, a little over a body's height, and lasts
  // 2 * v / g = 0.75 s on the level
  step: 0.9, // what can be stepped up without jumping,
  probe: 0.5, // a riser is looked for this far ahead, so that it is a wall however small the steps it is walked at in:
  rise: 1.5, // ground that climbs more than this within the probe is one (a hillside of 2 in 1 is still walked)
  air: 8, // how fast one goes across while in the air: slower than a walk, so a running jump lands on a ledge, not past it
  coyote: 0.1, // a jump still counts this long after walking off an edge,
  buffer: 0.12, // and one asked for this long before landing is made on landing
  toe: 0.35, // coming down, a ledge whose top is this little above the feet is still landed on: a toe on its edge is enough
  second: 0.9, // a body that can jump twice makes its second jump, in the air, at this much of the first
  cliff: 3, // ground that differs by more than this within half a unit either way is a cliff,
  lip: 0.45 // all but this much at its top and at its foot being its face
};
const AROUND = [[0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5]];

// ground: (x, z) -> the ground's height there (below -900 where there is none); opts.kill: a body below this is lost
export function createPlat(given, ledges, opts) {
  // Ground comes as heights at points half a unit apart with a slope from each to the next, so a cliff is a ramp half a
  // unit long: too steep to walk, but something a falling body would come down on half-way up, and jump again from. So
  // the face of a cliff counts as its foot: a cliff is upright, and stands at its top edge.
  const ground = (x, z) => {
    const g = given(x, z);
    if (g < -900) return g;
    let lo = g,
      hi = g;
    for (const d of AROUND) {
      const q = given(x + d[0], z + d[1]);
      if (q < -900) continue;
      if (q < lo) lo = q;
      if (q > hi) hi = q;
    }
    return hi - lo > JUMP.cliff && g > lo + JUMP.lip && g < hi - JUMP.lip ? lo : g;
  };
  const kill = opts && opts.kill !== undefined && opts.kill !== null ? opts.kill : -1e9,
    L = (ledges || []).map((l, i) => {
      const o = l[5] || {},
        x0 = Math.min(l[0], l[1]),
        x1 = Math.max(l[0], l[1]),
        z0 = Math.min(l[2], l[3]),
        z1 = Math.max(l[2], l[3]);
      // (x0..y: where it is now; base: where it was put; d: how far it went at the last tick; stood: since when someone has
      // been on a crumbling one; gone: until when it is fallen away; -1 for neither)
      return { i, x0, x1, z0, z1, y: l[4], base: [x0, x1, z0, z1, l[4]], move: o.move || null, crumble: o.crumble || 0, back: o.back || 3, dyn: !!(o.move || o.crumble), d: [0, 0, 0], stood: -1, gone: -1 };
    });
  let now = 0;

  // the ledges at time t
  function tick(t) {
    now = t;
    for (const l of L) {
      if (l.move) {
        const [ax, reach, period, phase] = l.move,
          o = reach * Math.sin(2 * Math.PI * (t / period + (phase || 0))),
          b = l.base,
          was = [l.x0, l.y, l.z0];
        if (ax === 'x') ((l.x0 = b[0] + o), (l.x1 = b[1] + o));
        else if (ax === 'z') ((l.z0 = b[2] + o), (l.z1 = b[3] + o));
        else l.y = b[4] + o;
        l.d = [l.x0 - was[0], l.y - was[1], l.z0 - was[2]];
      }
      if (l.crumble) {
        if (l.gone >= 0 && t >= l.gone) l.gone = l.stood = -1;
        else if (l.gone < 0 && l.stood >= 0 && t - l.stood >= l.crumble) l.gone = t + l.back;
      }
    }
  }
  tick(0);
  for (const l of L) l.d = [0, 0, 0];

  // The highest thing to stand on at (x, z) that is not above `top`, as [height, ledge index or -1 for the ground]. Where
  // the ground itself is above `top` (a body inside a hillside) it is the ground: up and out.
  function under(x, z, top) {
    const g = ground(x, z);
    let f = g > -900 ? g : -1e9,
      at = -1;
    if (f > top) return [f, -1];
    // (a ledge on its way up may have come past a falling body since the last tick)
    for (const l of L) if (l.gone < 0 && l.y > f && l.y - Math.max(0, l.d[1]) <= top && x >= l.x0 && x <= l.x1 && z >= l.z0 && z <= l.z1) ((f = l.y), (at = l.i));
    return [f, at];
  }
  const floor = (x, z, top) => under(x, z, top)[0];

  // may a body with its feet at y go to (x, z)? Not into ground that stands more than a step above them, nor off the map
  const open = (x, z, y) => {
    const g = ground(x, z);
    return g > -900 && g <= y + JUMP.step;
  };

  // a body standing at (x, z) as near y as there is something to stand on
  const body = (x, z, y) => {
    const f = under(x, z, (y === undefined ? ground(x, z) : y) + JUMP.step);
    return { x, z, y: f[0], vy: 0, air: false, since: 0, want: 9, on: f[1], extra: 0, double: false };
  };

  const stand = (b, at) => {
    b.on = at;
    if (at >= 0 && L[at].crumble && L[at].stood < 0) L[at].stood = now;
  };

  // One step of a body { x, z, y, vy, air, since, want, on, extra, double }: carried by what it stands on, across by
  // (dx, dz) as far as no wall stops it, then up or down. `since` is how long ago it last stood on something; `want` how
  // long ago a jump was asked for (set it to 0 to ask); `on` the ledge it stands on (-1: the ground, or the air); `double`
  // whether it may jump a second time in the air, and `extra` whether that jump is still to be had. Returns true if a
  // wall stopped it. The path is the same whatever the size of the steps it is taken in.
  function step(b, dx, dz, dt) {
    if (!b.air && b.on >= 0) {
      const l = L[b.on];
      if (l.gone < 0 && (l.d[0] || l.d[2]) && open(b.x + l.d[0], b.z + l.d[2], b.y)) {
        b.x += l.d[0];
        b.z += l.d[2];
      }
    }
    const d = Math.hypot(dx, dz),
      n = Math.max(1, Math.ceil(d / 0.25)),
      ux = d > 0 ? (dx / d) * JUMP.probe : 0,
      uz = d > 0 ? (dz / d) * JUMP.probe : 0;
    let hit = false;
    for (let i = 0; i < n && d > 0; i++) {
      const nx = b.x + dx / n,
        nz = b.z + dz / n;
      // (the ground where it would stand, and a little further on: ground comes as a slope between its points, and a
      // steep one taken in small enough steps would otherwise be walked up)
      if (!open(nx, nz, b.y) || !open(nx + ux, nz + uz, b.y + JUMP.rise - JUMP.step)) {
        hit = true;
        break;
      }
      b.x = nx;
      b.z = nz;
    }
    const fresh = b.want === 0;
    b.want += dt;
    if (b.want <= JUMP.buffer && (!b.air || (b.since <= JUMP.coyote && b.vy <= 0))) {
      b.vy = JUMP.v;
      b.air = true;
      b.want = 9;
      b.since = 9;
      b.on = -1;
      b.extra = b.double ? 1 : 0;
    } else if (fresh && b.air && b.extra > 0) {
      // (the second jump: made at once, in the air, whichever way the body was going)
      b.vy = JUMP.v * JUMP.second;
      b.extra--;
      b.want = 9;
    }
    if (b.air) {
      const y0 = b.y,
        v0 = b.vy,
        y1 = y0 + v0 * dt - 0.5 * JUMP.g * dt * dt;
      b.vy = v0 - JUMP.g * dt;
      b.since += dt;
      if (b.vy <= 0) {
        // coming down (or over the top within this step): onto the highest thing passed on the way
        const peak = v0 > 0 ? y0 + (v0 * v0) / (2 * JUMP.g) : y0,
          f = under(b.x, b.z, peak + JUMP.toe);
        if (f[0] >= y1) {
          b.y = f[0];
          b.vy = 0;
          b.air = false;
          b.since = 0;
          b.extra = 0;
          stand(b, f[1]);
          return hit;
        }
      }
      b.y = y1;
    } else {
      const f = under(b.x, b.z, b.y + JUMP.step);
      if (f[0] < b.y - JUMP.step) {
        // (walked off an edge, or what it stood on is gone: a body that can jump twice still has its second jump)
        b.air = true;
        b.vy = 0;
        b.since = dt;
        b.on = -1;
        b.extra = b.double ? 1 : 0;
      } else {
        b.y = f[0];
        b.since = 0;
        stand(b, f[1]);
      }
    }
    return hit;
  }

  // another like this one, at the same moment and with the same ledges fallen: for trying out what a move would lead to
  function fork() {
    const P = createPlat(given, ledges, opts);
    P.tick(now);
    P.ledges.forEach((l, i) => ((l.stood = L[i].stood), (l.gone = L[i].gone), (l.d = L[i].d.slice())));
    return P;
  }

  return {
    ledges: L,
    kill,
    get now() {
      return now;
    },
    tick,
    ground,
    floor,
    under,
    open,
    body,
    step,
    fork
  };
}
