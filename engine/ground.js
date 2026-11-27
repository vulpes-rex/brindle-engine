// Where a fight can be had on an area's own ground (a battle "here", fought where the foe was met, as in Chrono Trigger).
//
// A battle's two sides stand in a layout of their own: the heroes at their places from heroes.json, the foes at theirs from
// the battle, with the foes toward -x of the party. To fight in place that layout is set down on the area: turned by `th`
// (the layout's +x, from the foes to the party, then points along (cos th, sin th), which is also toward the camera), and
// moved to an origin where every stand is on free, level ground.

// stands: [[x, z, 'hero' | 'foe'], ...] in the layout's own units; near: where the layout's origin would best be; k: how
// large the layout is set down (1 as in an arena; less draws the two sides closer); starts: where each of the stands' owners
// is now, if the spot should be the one they have least far to go to (else it is the one nearest `near`).
// Returns { o: [x, z], at, y, th, k, bad, move } or null if nowhere within R will do: the origin, where each stand comes
// to on the area, the ground's height there, how many spots on the way between the two sides are blocked (a lamp post to
// run round, say), and how far they go.
export function fightSpot(nav, stands, near, th, R = 14, k = 1, starts = null) {
  const c = Math.cos(th) * k,
    s = Math.sin(th) * k,
    put = (o, p) => [o[0] + p[0] * c - p[1] * s, o[1] + p[0] * s + p[1] * c],
    ROUND = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
  let best = null;
  for (let dz = -R; dz <= R; dz++)
    for (let dx = -R; dx <= R; dx++) {
      const d = Math.hypot(dx, dz);
      if (d > R) continue;
      const o = [near[0] + dx, near[1] + dz],
        at = stands.map(p => put(o, p));
      let lo = 1e9,
        hi = -1e9,
        ok = true;
      for (let i = 0; i < at.length; i++) {
        const w = at[i];
        // (free where it stands; a hero has a step's room all round as well, a foe may hang by a wall)
        if (nav.blocked(w[0], w[1]) || (stands[i][2] === 'hero' && ROUND.some(q => nav.blocked(w[0] + q[0], w[1] + q[1])))) ok = false;
        const y = ok ? nav.gh(w[0], w[1]) : -999;
        if (y < -900) ok = false;
        if (!ok) break;
        lo = Math.min(lo, y);
        hi = Math.max(hi, y);
      }
      if (!ok || hi - lo > 1) continue;
      // what stands between the two sides counts against a spot, and a step up or down between them rules it out
      let bad = 0;
      for (let i = 0; i < at.length && ok; i++)
        for (let j = 0; j < at.length && ok; j++) {
          if (stands[i][2] !== 'hero' || stands[j][2] !== 'foe') continue;
          const a = at[i],
            b = at[j],
            n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 1.5));
          for (let k = 1; k < n; k++) {
            const x = a[0] + ((b[0] - a[0]) * k) / n,
              z = a[1] + ((b[1] - a[1]) * k) / n,
              y = nav.gh(x, z);
            if (y < -900 || Math.abs(y - (lo + hi) / 2) > 1.2) ok = false;
            else if (nav.blocked(x, z)) bad++;
          }
        }
      if (!ok) continue;
      // how far they go to their places, and what they would have to go through on the way (a wall counts hard)
      let move = d,
        through = 0;
      if (starts) {
        move = 0;
        for (let i = 0; i < at.length; i++) {
          const a = starts[i],
            b = at[i],
            l = Math.hypot(b[0] - a[0], b[1] - a[1]),
            n = Math.max(1, Math.ceil(l / 1.5));
          move += l / at.length;
          for (let j = 1; j < n; j++) if (nav.blocked(a[0] + ((b[0] - a[0]) * j) / n, a[1] + ((b[1] - a[1]) * j) / n)) through++;
        }
      }
      // (and what stands close about them: a post or a tree by the party is likely to be in front of someone, and so is
      // whatever stands on the party's side of a foe, which is the camera's side)
      let clutter = 0;
      for (let i = 0; i < at.length; i++)
        for (let q = 0; q < 16; q++) {
          const a = (q * Math.PI) / 4,
            rr = q < 8 ? 2.5 : 4.5,
            hero = stands[i][2] === 'hero';
          if ((hero || Math.cos(a) * c + Math.sin(a) * s > -0.2 * k) && nav.blocked(at[i][0] + Math.cos(a) * rr, at[i][1] + Math.sin(a) * rr)) clutter++;
        }
      const score = move + bad * 1.5 + through * 6 + clutter * 0.35 + (hi - lo) * 3;
      if (!best || score < best.score) best = { o, at, y: (lo + hi) / 2, th, k, bad, through, move, score };
    }
  return best;
}

// A layout drawn in for a fight in place: the two sides k times as far apart as in an arena, each side's own formation m
// times as wide (so a party keeps its shape while the fight closes up). Returns the stands so drawn in, and `to`, which
// takes any other spot of the layout along with them.
export function drawIn(stands, k, m) {
  const mean = side => {
      const l = stands.filter(p => p[2] === side);
      return [0, 1].map(j => l.reduce((a, p) => a + p[j], 0) / (l.length || 1));
    },
    C = { hero: mean('hero'), foe: mean('foe') },
    M = [(C.hero[0] + C.foe[0]) / 2, (C.hero[1] + C.foe[1]) / 2];
  return {
    stands: stands.map(p => [0, 1].map(j => M[j] + (C[p[2]][j] - M[j]) * k + (p[j] - C[p[2]][j]) * m).concat(p[2])),
    to: (x, z) => [M[0] + (x - M[0]) * k, M[1] + (z - M[1]) * k]
  };
}

// The spot for a meeting on the field, the leader at `hero` and the foe at `foe` ([x, z] each). In place the two sides
// stand closer than in an arena (0.7 of the way apart), so that nobody has far to go; closer still where it is tight.
// Returns what fightSpot does, with `to`: where any spot of the battle's layout comes to on the area.
export function fightAt(nav, stands, hero, foe, th) {
  const starts = stands.map(p => (p[2] === 'hero' ? hero : foe)),
    c = Math.cos(th),
    s = Math.sin(th),
    mean = list => [0, 1].map(j => list.reduce((a, p) => a + p[j], 0) / list.length),
    S = mean(starts),
    worth = r => r.score + (0.7 - r.k) * 25 + (0.85 - r.m) * 30;
  let best = null;
  for (const [R, m] of [[12, 0.85], [12, 0.65], [22, 0.85], [22, 0.65]]) {
    for (const k of [0.7, 0.6, 0.5]) {
      const L = drawIn(stands, k, m),
        A = mean(L.stands),
        // (in the open, the origin that sets the middle of the layout on the middle of where they are)
        r = fightSpot(nav, L.stands, [Math.round(S[0] - (A[0] * c - A[1] * s)), Math.round(S[1] - (A[0] * s + A[1] * c))], th, R, 1, starts);
      if (!r) continue;
      Object.assign(r, { k, m, to: (x, z) => ((q => [r.o[0] + q[0] * c - q[1] * s, r.o[1] + q[0] * s + q[1] * c])(L.to(x, z))) });
      // (a closer layout is the worse for it, but better than a long way to go or a wall to go through)
      if (!best || worth(r) < worth(best)) best = r;
    }
    if (best) return best;
  }
  return null;
}

// the stands of a battle: its heroes' places and its foes'
export const standsOf = (heroes, party, battle) => party.map(id => [heroes[id].at[0], heroes[id].at[1], 'hero']).concat(battle.foes.map(f => [f.at[0], f.at[1], 'foe']));
