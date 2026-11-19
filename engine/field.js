// Field mode: the leader walks an area, talks to its people and uses its things. Everything here is in game units and knows
// nothing about how the area is drawn: it asks the look where a tap lands and which way the camera faces, and hands back a
// list of sprites, shadows and rings to draw.
import { test } from './script.js';

// which sprite row and mirror to show for a heading, seen from the camera: eight ways from five drawn facings
const FACE = [[2, 0], [3, 0], [4, 0], [3, 1], [2, 1], [1, 1], [0, 0], [1, 0]];
export function facing(hx, hz, ax) {
  const a = Math.atan2(hx * ax.fwd[0] + hz * ax.fwd[1], hx * ax.right[0] + hz * ax.right[1]);
  return FACE[((Math.round(a / 0.7854) % 8) + 8) % 8];
}

const SPEED = 13, // game units a second
  LIFT = 4.2; // the camera looks this far above the leader's feet

export function createField(g) {
  const SP = g.SP,
    hero = { x: 0, z: 0, y: 0, hx: 0, hz: 1, fr: 1, dist: 0, path: null, pi: 0, cb: null, moving: false },
    keys = {};
  let rt = null,
    nav = null,
    actors = [],
    props = [],
    reach = null,
    mark = null;

  // where an actor, prop or spawn is: a named place of the area, or "at" in the area's own world units
  function place(o) {
    if (o.poi) {
      const p = rt.poi[o.poi];
      if (!p) throw new Error(rt.id + ': no place called "' + o.poi + '"');
      return [p[0] + (o.d ? o.d[0] : 0), p[1] + (o.d ? o.d[1] : 0), p.length > 2 ? p[2] : undefined];
    }
    return [o.at[0] / rt.scale, o.at[1] / rt.scale, o.y === undefined ? undefined : o.y / rt.scale];
  }

  function enter(area, at) {
    rt = area;
    nav = rt.nav;
    actors = [];
    props = [];
    mark = null;
    const def = rt.def,
      free = new Uint8Array(nav.NU * nav.NU);
    for (let j = 0; j < free.length; j++) free[j] = nav.BL[j] ? 0 : 1;
    // the ground's height at a spot, or at the nearest walkable one if the spot itself has none
    const groundAt = (x, z) => {
      const gy = nav.gh(x, z);
      if (gy > -900) return gy;
      const f = nav.nearFree(x, z, 8, free);
      return f ? nav.gh(f[0], f[1]) : 0;
    };
    for (const a of def.actors || []) {
      const p = place(a),
        f = a.face || [0, -1],
        l = Math.hypot(f[0], f[1]) || 1,
        ci = SP.names.indexOf(a.sprite);
      if (ci < 0) throw new Error(rt.id + ': no sprite called "' + a.sprite + '"');
      const n = { id: a.id, ci, name: a.name, x: p[0], z: p[1], y: groundAt(p[0], p[1]), fx: f[0] / l, fz: f[1] / l, wander: !!a.wander, wait: 2, hx0: p[0], hz0: p[1], script: a.script, talk: false, moving: false, dist: 0, tx: null, tz: null };
      actors.push(n);
      // (someone who stays put is in the way)
      if (!n.wander)
        for (let dz = -1; dz <= 1; dz++)
          for (let dx = -1; dx <= 1; dx++) {
            const j = nav.cell(n.x + dx, n.z + dz);
            if (j >= 0) nav.BL[j] = 1;
          }
    }
    for (const p of def.props || []) {
      const q = place(p),
        gy = q[2] !== undefined ? q[2] : groundAt(q[0], q[1]);
      props.push({ id: p.id, x: q[0], z: q[1], y: gy + (p.dy || 0), h: p.h || 3, r: p.r || 2.5, hr: p.hit || 14, script: p.script, icon: p.icon || 'talk', show: p.show });
    }
    let x = at.x,
      z = at.z;
    if (nav.blocked(x, z)) {
      // (a spawn or a saved spot that is not free: the nearest cell that is)
      for (let j = 0; j < free.length; j++) free[j] = nav.BL[j] ? 0 : 1;
      const f = nav.nearFree(x, z, 8, free);
      if (f) [x, z] = f;
    }
    Object.assign(hero, { x, z, y: nav.gh(x, z), path: null, pi: 0, cb: null, moving: false, fr: 1 });
    if (at.face) {
      const l = Math.hypot(at.face[0], at.face[1]) || 1;
      hero.hx = at.face[0] / l;
      hero.hz = at.face[1] / l;
    }
    reach = nav.flood(hero.x, hero.z);
    g.cam.focus = [hero.x, hero.y + LIFT, hero.z];
  }

  const spawn = (area, name) => {
    const sp = (area.def.spawns || {})[name];
    if (!sp) throw new Error(area.id + ': no spawn called "' + name + '"');
    const keep = rt;
    rt = area;
    const p = place(sp);
    rt = keep;
    return { x: p[0], z: p[1], face: sp.face };
  };

  function walkTo(x, z, cb) {
    const path = nav.route([hero.x, hero.z], [x, z], reach);
    if (!path) return false;
    hero.path = path;
    hero.pi = 0;
    hero.cb = cb || null;
    return true;
  }

  function interact(th) {
    hero.path = null;
    hero.moving = false;
    const dx = th.x - hero.x,
      dz = th.z - hero.z,
      l = Math.hypot(dx, dz) || 1;
    hero.hx = dx / l;
    hero.hz = dz / l;
    if (th.name !== undefined) {
      th.fx = -dx / l;
      th.fz = -dz / l;
      th.talk = true;
    }
    const script = (rt.def.scripts || {})[th.script];
    if (!script) throw new Error(rt.id + ': no script called "' + th.script + '"');
    g.run(script, () => (th.talk = false));
  }

  // walk up to a person or thing, to a spot that looks right from where the camera is, then use it
  function goThing(th) {
    const person = th.name !== undefined,
      r = person ? 0 : th.r,
      d0 = Math.hypot(th.x - hero.x, th.z - hero.z);
    if (d0 < r + 4.5 && (!person || d0 > 2.6)) return interact(th);
    const ax = g.look.axes(g.cam.yawT);
    let best = null,
      bd = 1e9;
    for (let dz = -7 - r; dz <= 7 + r; dz++)
      for (let dx = -7 - r; dx <= 7 + r; dx++) {
        const j = nav.cell(th.x + dx, th.z + dz);
        if (j < 0 || !reach[j]) continue;
        const c = nav.center(j),
          d = Math.hypot(c[0] - th.x, c[1] - th.z);
        if (d < r + 2.2 || d > r + 6) continue;
        let score;
        if (person) {
          // (beside them as the camera sees it, a little nearer the eye, with nothing between)
          const rx = c[0] - th.x,
            rz = c[1] - th.z,
            sr = rx * ax.right[0] + rz * ax.right[1],
            sd = rx * ax.fwd[0] + rz * ax.fwd[1];
          score = Math.abs(Math.abs(sr) - 3.6) * 2 + Math.abs(sd + 0.6) * 1.6 + Math.hypot(c[0] - hero.x, c[1] - hero.z) * 0.12 + (nav.los(c[0], c[1], th.x + rx * 0.45, th.z + rz * 0.45) ? 0 : 6);
        } else score = d * 2 + Math.hypot(c[0] - hero.x, c[1] - hero.z) * 0.2;
        if (score < bd) {
          bd = score;
          best = c;
        }
      }
    if (best && walkTo(best[0], best[1], () => interact(th))) mark = null;
  }

  const shown = th => th.name !== undefined || th.show === undefined || test(th.show, g.host);

  function hitThing(nx, ny) {
    const u = g.look.px;
    let best = null,
      bz = 1e9;
    for (const th of actors.concat(props)) {
      let hit;
      if (th.name !== undefined) {
        const p = g.look.project(th.x, th.y, th.z);
        hit = Math.abs(nx - p[0]) < 15 * u && ny > p[1] - 5 * u && ny < p[1] + 34 * u;
      } else {
        const q = g.look.project(th.x, th.y + th.h, th.z);
        hit = Math.hypot(nx - q[0], ny - q[1]) < th.hr * u;
      }
      if (hit) {
        const d = Math.hypot(th.x - hero.x, th.z - hero.z);
        if (d < bz) {
          bz = d;
          best = th;
        }
      }
    }
    return best;
  }

  function tap(nx, ny) {
    const th = hitThing(nx, ny);
    if (th) return goThing(th);
    const p = g.look.pick(nx, ny, nav);
    if (!p) return;
    const j = nav.cell(p[0], p[1]),
      f = !nav.blocked(p[0], p[1]) && reach[j] ? p : nav.nearFree(p[0], p[1], 6, reach);
    if (!f) return;
    if (walkTo(f[0], f[1], null)) {
      mark = [f[0], f[1], g.t];
      g.host.set('moved', true);
    }
  }

  function stepHero(dt) {
    const kx = (keys.ArrowRight || keys.d ? 1 : 0) - (keys.ArrowLeft || keys.a ? 1 : 0),
      ky = (keys.ArrowUp || keys.w ? 1 : 0) - (keys.ArrowDown || keys.s ? 1 : 0);
    if ((kx || ky) && !g.busy) {
      hero.path = null;
      mark = null;
      const ax = g.look.axes(g.cam.yaw),
        l = Math.hypot(kx, ky),
        mx = (kx * ax.right[0] + ky * ax.fwd[0]) / l,
        mz = (kx * ax.right[1] + ky * ax.fwd[1]) / l,
        sp = SPEED * dt;
      let nx = hero.x + mx * sp,
        nz = hero.z + mz * sp;
      if (nav.blocked(nx, nz)) {
        if (!nav.blocked(nx, hero.z)) nz = hero.z;
        else if (!nav.blocked(hero.x, nz)) nx = hero.x;
        else {
          nx = hero.x;
          nz = hero.z;
        }
      }
      const d = Math.hypot(nx - hero.x, nz - hero.z);
      hero.x = nx;
      hero.z = nz;
      hero.hx = mx;
      hero.hz = mz;
      hero.dist += d;
      hero.moving = d > 0.001;
      g.host.set('moved', true);
    } else if (hero.path && !g.busy) {
      let left = SPEED * dt;
      hero.moving = true;
      while (left > 0 && hero.path) {
        const p = hero.path[hero.pi],
          dx = p[0] - hero.x,
          dz = p[1] - hero.z,
          d = Math.hypot(dx, dz);
        if (d <= left) {
          hero.x = p[0];
          hero.z = p[1];
          hero.dist += d;
          left -= d;
          hero.pi++;
          if (hero.pi >= hero.path.length) {
            hero.path = null;
            hero.moving = false;
            const cb = hero.cb;
            hero.cb = null;
            if (cb) cb();
          }
        } else {
          hero.hx = dx / d;
          hero.hz = dz / d;
          hero.x += (dx / d) * left;
          hero.z += (dz / d) * left;
          hero.dist += left;
          left = 0;
        }
      }
    } else hero.moving = false;
    hero.fr = hero.moving ? Math.floor(hero.dist / 1.55) % 4 : 1;
    const gy = nav.gh(hero.x, hero.z);
    if (gy > -900) hero.y += (gy - hero.y) * Math.min(1, dt * 16);
  }

  function stepActor(n, dt) {
    if (!n.wander || n.talk || g.busy) return;
    if (n.tx != null) {
      const dx = n.tx - n.x,
        dz = n.tz - n.z,
        d = Math.hypot(dx, dz),
        sp = 5.5 * dt;
      if (d <= sp) {
        n.x = n.tx;
        n.z = n.tz;
        n.tx = null;
        n.wait = 1.5 + Math.random() * 3;
        n.moving = false;
      } else {
        n.fx = dx / d;
        n.fz = dz / d;
        n.x += (dx / d) * sp;
        n.z += (dz / d) * sp;
        n.dist += sp;
        n.moving = true;
      }
    } else {
      n.wait -= dt;
      if (n.wait <= 0) {
        const a = Math.random() * 6.283,
          r = 2 + Math.random() * 5,
          tx = n.hx0 + Math.cos(a) * r,
          tz = n.hz0 + Math.sin(a) * r;
        if (!nav.blocked(tx, tz) && nav.los(n.x, n.z, tx, tz) && Math.hypot(tx - hero.x, tz - hero.z) > 3) {
          n.tx = tx;
          n.tz = tz;
        } else n.wait = 0.4;
      }
    }
    n.y = nav.gh(n.x, n.z);
  }

  function update(dt) {
    stepHero(dt);
    for (const n of actors) stepActor(n, dt);
    const c = g.cam,
      k = 1 - Math.exp(-dt * 7);
    c.yaw += (c.yawT - c.yaw) * (1 - Math.exp(-dt * 11));
    if (Math.abs(c.yawT - c.yaw) < 0.0015) c.yaw = c.yawT;
    c.focus[0] += (hero.x - c.focus[0]) * k;
    c.focus[1] += (hero.y + LIFT - c.focus[1]) * k;
    c.focus[2] += (hero.z - c.focus[2]) * k;
    if (mark && !window.__hold && (!hero.path || g.t - mark[2] > 6)) mark = null;
  }

  // what to draw this frame
  function build(fr) {
    const ax = g.look.axes(g.cam.yaw),
      SW = SP.SW,
      SH = SP.SH,
      body = (ci, frame, hx, hz) => {
        const f = facing(hx, hz, ax);
        return { rect: [(ci * SP.FR + frame) * SW, f[0] * SH, SW, SH], flip: f[1] };
      };
    fr.blobs.push({ x: hero.x, y: hero.y + 0.25, z: hero.z, r: 1.3 });
    for (const n of actors) fr.blobs.push({ x: n.x, y: n.y + 0.25, z: n.z, r: 1.3 });
    if (mark) {
      const a = 0.5 + 0.5 * Math.sin(g.t * 10);
      fr.rings.push({ x: mark[0], y: nav.gh(mark[0], mark[1]) + 0.3, z: mark[1], r: 1.45 + 0.3 * a, col: [1, 0.93 + 0.05 * a, 0.62 + 0.25 * a] });
    }
    fr.sprites.push(Object.assign(body(g.leader, hero.fr, hero.hx, hero.hz), { x: hero.x, y: hero.y, z: hero.z, tint: g.tintAt(hero.x, hero.z), offY: -1, bias: 0.66, sil: true }));
    for (const n of actors) fr.sprites.push(Object.assign(body(n.ci, n.moving ? Math.floor(n.dist / 1.3) % 4 : 1, n.fx, n.fz), { x: n.x, y: n.y, z: n.z, tint: g.tintAt(n.x, n.z), offY: -1, bias: 0.66 }));
    if (!g.busy) {
      // the little bobbing mark over what can be used nearby
      const bob = Math.floor(g.t * 2.2) % 2;
      for (const th of actors.concat(props)) {
        if (Math.hypot(th.x - hero.x, th.z - hero.z) > 17 || !shown(th)) continue;
        const person = th.name !== undefined;
        fr.sprites.push({ rect: SP.icons[person ? 'talk' : th.icon], flip: 0, x: th.x, y: th.y + (person ? 0 : th.h), z: th.z, tint: [1, 1, 1], offY: (person ? 33 : 6) + bob, bias: 5.5 });
      }
    }
  }

  return {
    hero,
    keys,
    enter,
    spawn,
    update,
    tap,
    build,
    walkTo,
    goThing,
    stop() {
      hero.path = null;
      hero.moving = false;
      mark = null;
    },
    // the walk map changed under the party (a gate shut, a wall moved): work out again where it can go
    reflood() {
      hero.path = null;
      reach = nav.flood(hero.x, hero.z);
    },
    // put the party somewhere else in the same area, at once
    place(x, z) {
      Object.assign(hero, { x, z, y: nav.gh(x, z), path: null, moving: false });
      reach = nav.flood(x, z);
    },
    setMark(x, z) {
      mark = [x, z, g.t + 99];
    },
    get actors() {
      return actors;
    },
    get props() {
      return props;
    },
    get reach() {
      return reach;
    }
  };
}
