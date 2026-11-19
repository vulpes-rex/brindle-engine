// The walk map of an area, in game units: one cell is one unit, the area is centred on the origin. Both looks hand the engine
// the same thing: which cells are blocked, and the ground's height on a finer grid.

export class Nav {
  // NU cells a side; C cells from the edge to the origin; heights GH on an N x N grid (RS per cell), -999 where there is no ground;
  // SH (optional) how lit each cell is, 0..255
  constructor({ NU, C, N, RS, BL, GH, SH }) {
    Object.assign(this, { NU, C, N, RS, BL, GH, SH: SH || null });
  }

  cell(x, z) {
    const cx = Math.floor(x + this.C),
      cz = Math.floor(z + this.C);
    return cx < 0 || cz < 0 || cx >= this.NU || cz >= this.NU ? -1 : cz * this.NU + cx;
  }

  center(j) {
    return [(j % this.NU) + 0.5 - this.C, ((j / this.NU) | 0) + 0.5 - this.C];
  }

  blocked(x, z) {
    const j = this.cell(x, z);
    return j < 0 || this.BL[j] === 1;
  }

  // ground height, smoothed between grid points; where part of the patch has no ground, the highest corner
  gh(x, z) {
    const N = this.N,
      G = this.GH,
      fx = Math.max(0, Math.min(N - 1.001, (x + this.C) * this.RS - 0.5)),
      fz = Math.max(0, Math.min(N - 1.001, (z + this.C) * this.RS - 0.5)),
      x0 = Math.floor(fx),
      z0 = Math.floor(fz),
      ax = fx - x0,
      az = fz - z0,
      a = G[z0 * N + x0],
      b = G[z0 * N + x0 + 1],
      c = G[(z0 + 1) * N + x0],
      d = G[(z0 + 1) * N + x0 + 1];
    if (a < -900 || b < -900 || c < -900 || d < -900) return Math.max(a, b, c, d);
    return (a * (1 - ax) + b * ax) * (1 - az) + (c * (1 - ax) + d * ax) * az;
  }

  // how lit the ground is, 0..1 (1 where the area has no light map)
  shade(x, z) {
    if (!this.SH) return 1;
    const NU = this.NU,
      G = this.SH,
      fx = Math.max(0, Math.min(NU - 1.001, x + this.C - 0.5)),
      fz = Math.max(0, Math.min(NU - 1.001, z + this.C - 0.5)),
      x0 = Math.floor(fx),
      z0 = Math.floor(fz),
      ax = fx - x0,
      az = fz - z0;
    return ((G[z0 * NU + x0] * (1 - ax) + G[z0 * NU + x0 + 1] * ax) * (1 - az) + (G[(z0 + 1) * NU + x0] * (1 - ax) + G[(z0 + 1) * NU + x0 + 1] * ax) * az) / 255;
  }

  // a clear straight line between two points
  los(ax, az, bx, bz) {
    const d = Math.hypot(bx - ax, bz - az),
      n = Math.ceil(d / 0.3);
    for (let i = 1; i <= n; i++) {
      const f = i / n;
      if (this.blocked(ax + (bx - ax) * f, az + (bz - az) * f)) return false;
    }
    return true;
  }

  // A* over cells, eight ways, no cutting corners; returns the cells after the start, or null
  astar(sj, gj) {
    const NU = this.NU,
      BL = this.BL,
      n = NU * NU,
      g = new Float32Array(n).fill(1e9),
      from = new Int32Array(n).fill(-1),
      done = new Uint8Array(n),
      hf = [],
      hj = [],
      gx = gj % NU,
      gz = (gj / NU) | 0;
    const est = j => {
      const dx = Math.abs((j % NU) - gx),
        dz = Math.abs(((j / NU) | 0) - gz);
      return Math.max(dx, dz) + 0.414 * Math.min(dx, dz);
    };
    const push = (f, j) => {
      let i = hf.length;
      hf.push(f);
      hj.push(j);
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (hf[p] <= f) break;
        hf[i] = hf[p];
        hj[i] = hj[p];
        i = p;
      }
      hf[i] = f;
      hj[i] = j;
    };
    const pop = () => {
      const top = hj[0],
        f = hf.pop(),
        j = hj.pop(),
        m = hf.length;
      if (m) {
        let i = 0;
        for (;;) {
          let c = 2 * i + 1;
          if (c >= m) break;
          if (c + 1 < m && hf[c + 1] < hf[c]) c++;
          if (hf[c] >= f) break;
          hf[i] = hf[c];
          hj[i] = hj[c];
          i = c;
        }
        hf[i] = f;
        hj[i] = j;
      }
      return top;
    };
    g[sj] = 0;
    push(est(sj), sj);
    while (hf.length) {
      const j = pop();
      if (j === gj) break;
      if (done[j]) continue;
      done[j] = 1;
      const x = j % NU,
        z = (j / NU) | 0;
      for (let dz = -1; dz <= 1; dz++)
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dz) continue;
          const X = x + dx,
            Z = z + dz;
          if (X < 0 || Z < 0 || X >= NU || Z >= NU) continue;
          const k = Z * NU + X;
          if (BL[k] || done[k]) continue;
          if (dx && dz && (BL[z * NU + X] || BL[Z * NU + x])) continue;
          const c = g[j] + (dx && dz ? 1.414 : 1);
          if (c < g[k]) {
            g[k] = c;
            from[k] = j;
            push(c + est(k), k);
          }
        }
    }
    if (from[gj] < 0 && gj !== sj) return null;
    const out = [];
    for (let j = gj; j >= 0 && j !== sj; j = from[j]) out.push(j);
    out.reverse();
    return out;
  }

  // the nearest cell of a mask (1 = allowed) within R cells of a point: [x, z, cell]
  nearFree(x, z, R, mask) {
    let best = null,
      bd = 1e9;
    for (let dz = -R; dz <= R; dz++)
      for (let dx = -R; dx <= R; dx++) {
        const j = this.cell(x + dx, z + dz);
        if (j < 0 || !mask[j]) continue;
        const c = this.center(j),
          d = Math.hypot(c[0] - x, c[1] - z);
        if (d < bd) {
          bd = d;
          best = [c[0], c[1], j];
        }
      }
    return best;
  }

  // every cell that can be walked to from a point
  flood(x, z) {
    const NU = this.NU,
      BL = this.BL,
      mask = new Uint8Array(NU * NU),
      s = this.cell(x, z);
    if (s < 0) return mask;
    const st = [s];
    mask[s] = 1;
    while (st.length) {
      const j = st.pop(),
        cx = j % NU,
        cz = (j / NU) | 0;
      for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = cx + d[0],
          Z = cz + d[1];
        if (X < 0 || Z < 0 || X >= NU || Z >= NU) continue;
        const k = Z * NU + X;
        if (!mask[k] && !BL[k]) {
          mask[k] = 1;
          st.push(k);
        }
      }
    }
    return mask;
  }

  // a walkable path from one point to another as a few straight legs, or null. `mask` is the reachable set, used to
  // step off a blocked start cell.
  route(from, to, mask) {
    let sj = this.cell(from[0], from[1]);
    if (sj < 0 || this.BL[sj]) {
      const f = mask && this.nearFree(from[0], from[1], 3, mask);
      if (!f) return null;
      sj = f[2];
    }
    const gj = this.cell(to[0], to[1]);
    if (gj < 0 || this.BL[gj]) return null;
    const cells = this.astar(sj, gj);
    if (!cells) return null;
    const pts = [[from[0], from[1]]];
    for (const j of cells) pts.push(this.center(j));
    pts[pts.length - 1] = [to[0], to[1]];
    const out = [];
    let i = 0;
    while (i < pts.length - 1) {
      let k = pts.length - 1;
      while (k > i + 1 && !this.los(pts[i][0], pts[i][1], pts[k][0], pts[k][1])) k--;
      out.push(pts[k]);
      i = k;
    }
    return out;
  }

  // Follow a line of sight down to the ground: start at o, move by d each step; the first point at or under the ground.
  march(o, d, steps) {
    let x = o[0],
      y = o[1],
      z = o[2];
    for (let i = 0; i < steps; i++) {
      if (this.cell(x, z) >= 0) {
        const g = this.gh(x, z);
        if (g > -900 && y <= g) return [x, z];
      }
      x += d[0];
      y += d[1];
      z += d[2];
    }
    return null;
  }
}
