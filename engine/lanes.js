// The walking lines of an area seen side-on, after Another Eden: lanes run along the street (across the picture) and columns
// cross between them (into the picture). Someone walking keeps to these lines, and changes line only where two cross.
//
// An area declares them in its own units: "side": { "lanes": [{ "x": -20.5, "z": [-40.5, 6.5] }], "columns": [{ "z": -6,
// "x": [-20.5, 0] }] }. A lane holds x and runs along z; a column holds z and runs along x. A line is { col, c, a, b, cross }:
// the coordinate it holds, the span it runs over, and where it meets lines of the other kind. A line marked "ledge" runs over
// ledges or up a cliff, to be jumped (engine/jump.js): it is not plain ground the whole way.

const EPS = 0.05;

export function createLanes(def) {
  const segs = [];
  const add = (col, c, span, name, ledge) => {
    if (typeof c !== 'number' || !Array.isArray(span) || span.length !== 2) throw new Error('lanes: a ' + (col ? 'column' : 'lane') + ' needs the coordinate it holds and the span it runs over');
    segs.push({ col, c, a: Math.min(span[0], span[1]), b: Math.max(span[0], span[1]), name: name || '', ledge: !!ledge, cross: [] });
  };
  for (const l of def.lanes || []) add(false, l.x, l.z, l.name, l.ledge);
  for (const c of def.columns || []) add(true, c.z, c.x, c.name, c.ledge);
  // where a lane and a column meet: at `t` along this line, which is the other's held coordinate
  for (const l of segs)
    if (!l.col)
      for (const k of segs)
        if (k.col && k.c >= l.a - EPS && k.c <= l.b + EPS && l.c >= k.a - EPS && l.c <= k.b + EPS) {
          l.cross.push({ t: k.c, s: k });
          k.cross.push({ t: l.c, s: l });
        }
  for (const s of segs) s.cross.sort((p, q) => p.t - q.t);

  // the point at `t` along a line, as [x, z]
  const pt = (s, t) => (s.col ? [t, s.c] : [s.c, t]);
  // how far along a line a point is, and how far off it
  const along = (s, x, z) => (s.col ? x : z);
  const off = (s, x, z) => Math.abs((s.col ? z : x) - s.c);
  const has = (s, x, z, eps) => off(s, x, z) <= eps && along(s, x, z) >= s.a - eps && along(s, x, z) <= s.b + eps;

  // the lines a point is on
  const on = (x, z, eps) => segs.filter(s => has(s, x, z, eps === undefined ? EPS : eps));

  // the nearest point of any line: { s, t, x, z, d }
  function snap(x, z) {
    let best = null;
    for (const s of segs) {
      const t = Math.max(s.a, Math.min(s.b, along(s, x, z))),
        p = pt(s, t),
        d = Math.hypot(p[0] - x, p[1] - z);
      if (!best || d < best.d) best = { s, t, x: p[0], z: p[1], d };
    }
    return best;
  }

  // the next stop along a line from `t` going `dir` (+1 or -1): the nearest crossing that way, or the line's end; null at the end
  function next(s, t, dir) {
    let best = null;
    for (const stop of [s.a, s.b, ...s.cross.map(k => k.t)]) if ((stop - t) * dir > EPS && (best === null || (stop - best) * dir < 0)) best = stop;
    return best;
  }

  // Which line of one kind can be walked from a point, going `dir` along it: one the point is on, or one that crosses a
  // line the point is on within `reach`. Returns { s, via }: `via` is the crossing to walk to first, or null.
  function turn(x, z, col, dir, reach) {
    const here = on(x, z),
      room = (s, t) => (dir > 0 ? t < s.b - EPS : t > s.a + EPS);
    for (const s of here) if (s.col === col && room(s, along(s, x, z))) return { s, via: null };
    let best = null,
      bd = reach;
    for (const o of here) {
      if (o.col === col) continue;
      const t = along(o, x, z);
      for (const k of o.cross) {
        const d = Math.abs(k.t - t);
        if (d <= bd && room(k.s, o.c)) {
          bd = d;
          best = { s: k.s, via: pt(o, k.t) };
        }
      }
    }
    return best;
  }

  // points along every line, `step` apart, ends and crossings among them: [x, z, line]
  function samples(step) {
    const out = [];
    for (const s of segs) {
      const n = Math.max(1, Math.round((s.b - s.a) / step)),
        ts = new Set();
      for (let i = 0; i <= n; i++) ts.add(Math.round((s.a + ((s.b - s.a) * i) / n) * 1000) / 1000);
      for (const k of s.cross) ts.add(k.t);
      for (const t of [...ts].sort((p, q) => p - q)) out.push([...pt(s, t), s]);
    }
    return out;
  }

  // The way from one point to another along the lines, as the corners to walk to in turn (the last is `to`), or null. Both
  // points are taken to the nearest line first.
  function route(from, to) {
    const A = snap(from[0], from[1]),
      B = snap(to[0], to[1]);
    if (!A || !B) return null;
    const P = [[A.x, A.z], [B.x, B.z]];
    for (const s of segs) {
      for (const t of [s.a, s.b, ...s.cross.map(k => k.t)]) {
        const p = pt(s, t);
        if (!P.some(q => Math.abs(q[0] - p[0]) < EPS && Math.abs(q[1] - p[1]) < EPS)) P.push(p);
      }
    }
    const n = P.length,
      adj = P.map(() => []);
    for (const s of segs) {
      const mine = [];
      for (let i = 0; i < n; i++) if (has(s, P[i][0], P[i][1], EPS)) mine.push(i);
      mine.sort((i, j) => along(s, P[i][0], P[i][1]) - along(s, P[j][0], P[j][1]));
      for (let i = 0; i + 1 < mine.length; i++) {
        const d = Math.abs(along(s, P[mine[i]][0], P[mine[i]][1]) - along(s, P[mine[i + 1]][0], P[mine[i + 1]][1]));
        adj[mine[i]].push([mine[i + 1], d]);
        adj[mine[i + 1]].push([mine[i], d]);
      }
    }
    const dist = new Array(n).fill(1e9),
      from_ = new Array(n).fill(-1),
      done = new Array(n).fill(false);
    dist[0] = 0;
    for (;;) {
      let j = -1;
      for (let i = 0; i < n; i++) if (!done[i] && dist[i] < 1e9 && (j < 0 || dist[i] < dist[j])) j = i;
      if (j < 0 || j === 1) break;
      done[j] = true;
      for (const [k, d] of adj[j])
        if (dist[j] + d < dist[k]) {
          dist[k] = dist[j] + d;
          from_[k] = j;
        }
    }
    if (dist[1] >= 1e9) return null;
    const idx = [];
    for (let j = 1; j > 0; j = from_[j]) idx.push(j);
    idx.reverse();
    // (only the corners: a stop passed straight through is no leg of its own)
    const out = [];
    let prev = P[0];
    for (let i = 0; i < idx.length; i++) {
      const p = P[idx[i]],
        q = i + 1 < idx.length ? P[idx[i + 1]] : null;
      if (q && ((Math.abs(prev[0] - p[0]) < EPS && Math.abs(p[0] - q[0]) < EPS) || (Math.abs(prev[1] - p[1]) < EPS && Math.abs(p[1] - q[1]) < EPS))) continue;
      out.push([p[0], p[1]]);
      prev = p;
    }
    if (!out.length) out.push([B.x, B.z]);
    return { path: out, length: dist[1], start: [A.x, A.z], off: A.d };
  }

  return { segs, pt, along, on, snap, next, turn, samples, route };
}
