// Field mode: the leader walks an area, talks to its people and uses its things. Everything here is in game units and knows
// nothing about how the area is drawn: it asks the look where a tap lands and which way the camera faces, and hands back a
// list of sprites, shadows and rings to draw.
import { test } from './script.js';
import { createLanes } from './lanes.js';
import { createPlat, JUMP } from './jump.js';
import { laneIntent } from './stick.js';
import { HALO } from './party.js';
import { sidePose, profile } from './pose.js';

// which sprite row to show for a heading, seen from the camera: the eighth of a turn it points to on the picture (rows run
// south, south-east, east, ... so screen-right, the first eighth, is row 2)
export function facing(hx, hz, ax) {
  const a = Math.atan2(hx * ax.fwd[0] + hz * ax.fwd[1], hx * ax.right[0] + hz * ax.right[1]);
  return (((Math.round(a / 0.7854) % 8) + 10) % 8);
}

const SPEED = 13, // game units a second
  WALK = 5, // how fast someone walks when a script sends them
  LOWER = 2.6, // how fast someone a script walks off an edge is let down
  GONE = 9, // how far down someone let down is out of sight
  MEMORY_DROP = 6, // how much lower the camera looks during a memory
  LIFT = 4.2, // the camera looks this far above the leader's feet
  TURN = 1.3, // side-on, a key takes a crossing this near along the line one is on
  ACT = 9.5, // the act button uses what is within this of the leader
  LOST = 0.35, // fallen out of the world, the leader is gone this long before standing on firm ground again,
  BLINK = 0.9, // and flickers this long after
  FIRM = 1.2, // ground is firm (somewhere to be set back on) with level ground this far each way along the walk
  ONLINE = 0.05; // nearer a walking line than this is on it

export function createField(g) {
  const SP = g.SP,
    hero = { x: 0, z: 0, y: 0, hx: 0, hz: 1, dist: 0, path: null, pi: 0, cb: null, moving: false, vy: 0, air: false, since: 0, want: 9, on: -1, extra: 0, double: false },
    keys = {};
  let rt = null,
    nav = null,
    actors = [],
    solids = [],
    props = [],
    reach = null,
    mark = null,
    lanes = null,
    samp = null,
    arrows = [],
    foes = [],
    plat = null,
    // where there is jumping: the area's own clock (its ledges move by it), which mesh is drawn for a ledge that moves and
    // for one that gives way, the last firm ground stood on, and, after a fall out of the world, how long ago that was
    clock = 0,
    back = null, // (during a memory, where the leader stood)
    parts = {},
    safe = null,
    lost = -1,
    blink = 0;
  // an analog stick's push (x across the picture, y up it, length 0..1): the game sets it from the stick drawn on the
  // picture or a controller's; the leader walks by it when no key is down
  const stick = { x: 0, y: 0 };

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
    // (an area that can be seen side-on says which lines are walked there)
    lanes = rt.def.side ? createLanes(rt.def.side) : null;
    samp = lanes ? lanes.samples(0.5) : null;
    // (and whether there is jumping there: then the ground is solid and the scene's ledges can be stood on)
    plat = lanes && rt.def.side.jump ? createPlat((x, z) => nav.gh(x, z), rt.ledges || [], { kill: rt.def.side.kill }) : null;
    clock = 0;
    parts = {};
    safe = null;
    lost = -1;
    blink = 0;
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
    solids = [];
    for (const m of def.meshes || []) {
      if (!g.meshes[m.mesh]) continue;
      // (a "part" is not stood anywhere: it is drawn for each of the scene's ledges of that kind, "move" or "crumble")
      if (m.part) {
        parts[m.part] = g.meshes[m.mesh];
        continue;
      }
      // (a "world" mesh is a whole low-poly stand-in for the scene, in the scene's own units: shown only when the look's
      // splats are switched off, look.hideWorld, so the two can be compared from the same spot)
      if (m.world) {
        solids.push({ mesh: g.meshes[m.mesh], x: 0, y: 0, z: 0, size: 1, yaw: 0, tint: [1, 1, 1], world: true });
        continue;
      }
      const p = place(m),
        x = p[0] + (m.off ? m.off[0] : 0),
        z = p[1] + (m.off ? m.off[1] : 0);
      solids.push({ mesh: g.meshes[m.mesh], x, y: groundAt(x, z) + (m.lift || 0), z, size: m.size || 6, yaw: ((m.yaw || 0) * Math.PI) / 180, tint: g.tintAt ? g.tintAt(x, z) : [1, 1, 1] });
    }
    for (const a of def.actors || []) {
      const p = place(a),
        f = a.face || [0, -1],
        l = Math.hypot(f[0], f[1]) || 1,
        ci = SP.names.indexOf(a.sprite);
      if (ci < 0) throw new Error(rt.id + ': no sprite called "' + a.sprite + '"');
      const n = { id: a.id, ci, name: a.name, x: p[0], z: p[1], y: groundAt(p[0], p[1]), fx: f[0] / l, fz: f[1] / l, f0: [f[0] / l, f[1] / l], wander: !!a.wander, wait: 2, hx0: p[0], hz0: p[1], script: a.script, talk: false, moving: false, dist: 0, tx: null, tz: null, memory: !!a.memory, goal: null, gone: false };
      actors.push(n);
      // (someone who stays put is in the way; someone in a memory is not there to be in it)
      if (!n.wander && !n.memory)
        for (let dz = -1; dz <= 1; dz++)
          for (let dx = -1; dx <= 1; dx++) {
            const j = nav.cell(n.x + dx, n.z + dz);
            if (j >= 0) nav.BL[j] = 1;
          }
    }
    // foes that live on the map (as in Chrono Trigger): each wanders about its place, comes for the leader on seeing them,
    // and is fought where they meet (its "battle", one fought "here")
    foes = [];
    for (const f of def.foes || []) {
      const p = place(f),
        m = g.content.monsters[f.type];
      if (!m) throw new Error(rt.id + ': no monster called "' + f.type + '"');
      foes.push({ id: f.id, m, x: p[0], z: p[1], y: groundAt(p[0], p[1]), hx0: p[0], hz0: p[1], roam: f.roam === undefined ? 4 : f.roam, sight: f.sight || 13, speed: f.speed || 7, battle: f.battle, show: f.show, chase: false, wait: 1, tx: null, tz: null, calm: 0, fx: 1, fz: 0, beaten: false, inFight: false, t0: Math.random() * 3 });
    }
    for (const p of def.props || []) {
      const q = place(p),
        gy = q[2] !== undefined ? q[2] : groundAt(q[0], q[1]);
      props.push({ id: p.id, x: q[0], z: q[1], y: gy + (p.dy || 0), h: p.h || 3, r: p.r || 2.5, hr: p.hit || 14, script: p.script, icon: p.icon || 'talk', show: p.show });
    }
    let x = at.x,
      z = at.z;
    // (in an area that is all climb, any ground is somewhere to stand: a block between two pits is no path, but it is a place)
    if (nav.blocked(x, z) && !(plat && rt.def.side.only && nav.gh(x, z) > -900)) {
      // (a spawn or a saved spot that is not free: the nearest cell that is)
      for (let j = 0; j < free.length; j++) free[j] = nav.BL[j] ? 0 : 1;
      const f = nav.nearFree(x, z, 8, free);
      if (f) [x, z] = f;
    }
    Object.assign(hero, { x, z, y: nav.gh(x, z), path: null, pi: 0, cb: null, moving: false, vy: 0, air: false, since: 0, want: 9, on: -1, extra: 0 });
    if (at.face) {
      const l = Math.hypot(at.face[0], at.face[1]) || 1;
      hero.hx = at.face[0] / l;
      hero.hz = at.face[1] / l;
    }
    reach = nav.flood(hero.x, hero.z);
    if (plat) safe = { x: hero.x, z: hero.z, hx: hero.hx, hz: hero.hz };
    g.cam.focus = [hero.x, eye(), hero.z];
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

  // Side-on, where the area has walking lines, the leader keeps to them (see lanes.js); from any other view the ground is free.
  // (An area may be seen no other way, "only": then it is walked so from the moment it is entered.)
  const laned = () => !!lanes && (!!g.look.strip || !!rt.def.side.only);
  // and there, where the area says so, the leader can jump (see jump.js)
  const jumps = () => !!plat && laned();
  // Up where the other views could not walk them down from: in the air, on a ledge, or on ground cut off from the rest.
  // (Where there is no other view, only the ground itself is somewhere to take a save up again.)
  const aloft = () => {
    if (!jumps()) return false;
    if (rt.def.side.only) return hero.air || hero.on >= 0 || lost >= 0;
    if (hero.air || hero.y > nav.gh(hero.x, hero.z) + 0.5) return true;
    const f = nav.nearFree(hero.x, hero.z, 3, reach);
    return !f || Math.abs(nav.gh(f[0], f[1]) - hero.y) > 1.5;
  };

  // How high the camera looks: a little above the leader's feet. It does not follow a fall out of the world down, nor, in
  // an area with a "ceil", the leader up past that (a hall's wall goes only so high).
  const eye = () => {
    const sd = rt.def.side || {};
    let y = hero.y;
    if (plat && plat.kill > -1e8) y = Math.max(y, plat.kill + 7);
    if (sd.ceil !== undefined && laned()) y = Math.min(y, sd.ceil);
    // (a memory is watched from lower down, so that its people stand clear of the words at the foot of the picture)
    return y + LIFT - (remembering() ? MEMORY_DROP : 0);
  };

  // the ordinary way onto the lines from somewhere off them (as when the view has just been changed)
  const joinPath = to => nav.route([hero.x, hero.z], to, reach) || [to];

  function walkTo(x, z, cb) {
    let path;
    if (laned()) {
      const r = lanes.route([hero.x, hero.z], [x, z]);
      if (!r) return false;
      path = r.off > ONLINE ? joinPath(r.start).concat(r.path) : r.path;
    } else path = nav.route([hero.x, hero.z], [x, z], reach);
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
    const ax = g.look.axes(g.cam.yawT),
      side = laned(),
      // (on the lines there is less choice of where to stand, so nearer a thing will do)
      lo = side && !person ? r + 0.3 : r + 2.2,
      spots = [];
    if (side) for (const q of samp) spots.push(q);
    else
      for (let dz = -7 - r; dz <= 7 + r; dz++)
        for (let dx = -7 - r; dx <= 7 + r; dx++) {
          const j = nav.cell(th.x + dx, th.z + dz);
          if (j >= 0 && reach[j]) spots.push(nav.center(j));
        }
    let best = null,
      bd = 1e9;
    for (const c of spots) {
      const d = Math.hypot(c[0] - th.x, c[1] - th.z);
      if (d < lo || d > r + 6) continue;
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

  // (in a memory only the people marked "memory" are there, and nothing can be used; out of one they are not there)
  const remembering = () => !!(g.memory && g.memory.on),
    shown = th => (th.name !== undefined ? !!th.memory === remembering() && !th.gone : !remembering() && (th.show === undefined || test(th.show, g.host)));

  // Over rolling ground (the side view) what is far sinks behind the ground nearer the eye: is this point out of sight
  // behind it? Such a thing cannot be tapped, though a tap may land where it would draw.
  function sunk(x, y, z) {
    if (!g.look.roll) return false;
    const ax = g.look.axes(g.cam.yaw),
      p = g.look.project(x, y, z);
    for (let d = 2; d <= 70; d += 2) {
      const X = x - ax.fwd[0] * d,
        Z = z - ax.fwd[1] * d;
      if (nav.cell(X, Z) < 0) break;
      const gy = nav.gh(X, Z);
      if (gy > -900 && g.look.project(X, gy, Z)[1] > p[1]) return true;
    }
    return false;
  }

  function hitThing(nx, ny) {
    // (a person is hit on their figure; a thing within its "hit", which is counted in fifths of a game unit)
    const u = g.look.px,
      fifth = (u * SP.ppu) / 5;
    let best = null,
      bz = 1e9;
    for (const th of actors.concat(props)) {
      if (!shown(th)) continue;
      // (through a lens what is far is drawn small, and is as small to tap)
      const k = g.look.scaleAt ? g.look.scaleAt(th.x, th.y, th.z) : 1;
      let hit;
      if (th.name !== undefined) {
        const p = g.look.project(th.x, th.y, th.z);
        hit = Math.abs(nx - p[0]) < (SP.wide / 2 + 7) * u * k && ny > p[1] - 5 * u * k && ny < p[1] + (SP.tall + 4) * u * k && !sunk(th.x, th.y + 2, th.z);
      } else {
        const q = g.look.project(th.x, th.y + th.h, th.z);
        hit = Math.hypot(nx - q[0], ny - q[1]) < th.hr * fifth * k && !sunk(th.x, th.y + th.h, th.z);
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
    if (laned()) return tapLaned(nx, ny);
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

  // Side-on, a tap is a walk along the lane one is on, to the point of it drawn nearest the tap; from part-way along a
  // column, to a lane that column meets. Changing lane is what the arrows are for: lanes lie too close on the picture to
  // tell which of them a finger means.
  function tapLaned(nx, ny) {
    const here = lanes.on(hero.x, hero.z),
      lane = here.find(s => !s.col),
      col = here.find(s => s.col),
      mine = lane ? s => s === lane : col ? s => !s.col && col.cross.some(k => k.s === s) : () => true;
    let best = null,
      bd = 1e9;
    for (const q of samp) {
      if (!mine(q[2])) continue;
      const p = g.look.project(q[0], nav.gh(q[0], q[1]), q[1]),
        d = (p[0] - nx) * (p[0] - nx) + (p[1] - ny) * (p[1] - ny);
      if (d < bd) {
        bd = d;
        best = q;
      }
    }
    if (best && walkTo(best[0], best[1], null)) {
      mark = [best[0], best[1], g.t];
      g.host.set('moved', true);
    }
  }

  // The changes of line on offer, side-on: on a lane, at each column it meets; on a column, at the leader's feet. Each is
  // { x, z, up, to }: where it starts, whether it goes away from the eye (1) or toward it (-1), and the next stop that way.
  function ways() {
    const out = [];
    if (!laned()) return out;
    const here = lanes.on(hero.x, hero.z),
      lane = here.find(s => !s.col),
      col = here.find(s => s.col),
      // (where there is jumping, only a change that can be walked from the height one is at: not one into a cliff's foot)
      walks = (x, z, to) => {
        if (!plat) return true;
        const d = Math.hypot(to[0] - x, to[1] - z),
          n = Math.max(1, Math.ceil(d / 0.5));
        let y = plat.floor(x, z, hero.y + JUMP.step);
        for (let i = 1; i <= n; i++) {
          const px = x + ((to[0] - x) * i) / n,
            pz = z + ((to[1] - z) * i) / n;
          if (!plat.open(px, pz, y)) return false;
          y = plat.floor(px, pz, y + JUMP.step);
        }
        return true;
      },
      add = (s, x, z) => {
        for (const up of [1, -1]) {
          const t = lanes.next(s, x, -up);
          if (t !== null && walks(x, z, lanes.pt(s, t))) out.push({ x, z, up, to: lanes.pt(s, t) });
        }
      };
    if (lane) for (const k of lane.cross) add(k.s, lane.c, k.t);
    else if (col) add(col, hero.x, hero.z);
    return out;
  }

  // walk to where a change of line starts, then along its column to the next stop
  function take(w) {
    if (g.busy || !laned()) return false;
    const r = lanes.route([hero.x, hero.z], [w.x, w.z]);
    if (!r) return false;
    hero.path = (r.off > ONLINE ? joinPath(r.start) : []).concat(r.path, [w.to]);
    hero.pi = 0;
    hero.cb = null;
    mark = [w.to[0], w.to[1], g.t];
    g.host.set('moved', true);
    return true;
  }

  // a swipe up or down the picture takes the nearest change of line that way, if one is close
  function swipe(up) {
    let best = null,
      bd = 9;
    for (const w of ways()) {
      const d = Math.hypot(w.x - hero.x, w.z - hero.z);
      if (w.up === up && d < bd) {
        bd = d;
        best = w;
      }
    }
    return !!best && take(best);
  }

  // Side-on, the keys walk the lines: left and right along a lane, up and down along a column, turning where they cross.
  function keyLaned(kx, ky, dt, speed) {
    // (with two keys down, keep to the kind of line last walked for as long as it goes on)
    const tries = [];
    if (kx) tries.push([false, kx]);
    if (ky) tries.push([true, -ky]);
    if (tries.length > 1 && hero.col) tries.reverse();
    let left = speed * dt,
      moved = 0;
    // (part-way along a column, a push across goes to the nearest lane that runs that way, however far, and on along it:
    // there is nothing else across could mean there)
    const lost = !lanes.on(hero.x, hero.z).some(q => !q.col);
    for (const [col, dir] of tries) {
      const w = lanes.turn(hero.x, hero.z, col, dir, !col && lost ? 1e9 : TURN);
      if (!w) continue;
      if (w.via) {
        // (first to the crossing, along the line one is on)
        const dx = w.via[0] - hero.x,
          dz = w.via[1] - hero.z,
          d = Math.hypot(dx, dz),
          m = Math.min(d, left);
        if (d > 1e-6) {
          hero.x += (dx / d) * m;
          hero.z += (dz / d) * m;
          hero.hx = dx / d;
          hero.hz = dz / d;
        }
        left -= m;
        moved += m;
        if (left <= 0) break;
        hero.x = w.via[0];
        hero.z = w.via[1];
      }
      const s = w.s,
        t0 = s.col ? hero.x : hero.z,
        t1 = Math.max(s.a, Math.min(s.b, t0 + dir * left));
      if (s.col) {
        hero.x = t1;
        hero.z = s.c;
        hero.hx = dir;
        hero.hz = 0;
      } else {
        hero.x = s.c;
        hero.z = t1;
        hero.hx = 0;
        hero.hz = dir;
      }
      hero.col = s.col;
      moved += Math.abs(t1 - t0);
      break;
    }
    hero.dist += moved;
    hero.moving = moved > 0.001;
  }

  // is this firm ground: the ground itself, level for a little way each side along the walk
  function firm() {
    if (hero.air || hero.on >= 0) return false;
    for (const d of [-FIRM, FIRM]) if (Math.abs(nav.gh(hero.x + hero.hx * d, hero.z + hero.hz * d) - hero.y) > 0.6) return false;
    return true;
  }

  function stepHero(dt) {
    if (plat) {
      clock += dt;
      plat.tick(clock);
      hero.double = !!rt.def.side.double && test(rt.def.side.double, g.host);
      blink = Math.max(0, blink - dt);
      if (lost >= 0) {
        // (fallen out of the world: gone for a moment, then back on the last firm ground)
        lost += dt;
        if (lost >= LOST) {
          Object.assign(hero, { x: safe.x, z: safe.z, y: nav.gh(safe.x, safe.z), hx: safe.hx, hz: safe.hz, path: null, pi: 0, cb: null, moving: false, vy: 0, air: false, since: 0, want: 9, on: -1, extra: 0 });
          lost = -1;
          blink = BLINK;
        }
        return;
      }
    }
    const side = laned(),
      astray = side && lanes.snap(hero.x, hero.z).d > ONLINE,
      jm = side && !!plat,
      ox = hero.x,
      oz = hero.z;
    // The keys walk at full pace. With none down a stick walks as hard as it is pushed: any way over open ground, and
    // side-on either along the lane or, pushed well up or down, onto a column.
    let kx = (keys.ArrowRight || keys.d ? 1 : 0) - (keys.ArrowLeft || keys.a ? 1 : 0),
      ky = (keys.ArrowUp || keys.w ? 1 : 0) - (keys.ArrowDown || keys.s ? 1 : 0),
      amt = 1,
      byPath = false;
    if (!kx && !ky && (stick.x || stick.y)) {
      if (side) ({ kx, ky, amt } = laneIntent(stick.x, stick.y));
      else {
        kx = stick.x;
        ky = stick.y;
        amt = Math.min(1, Math.hypot(kx, ky));
      }
    }
    // (just set back after a fall, the leader stands a moment whatever is held: long enough to let go)
    if (blink > BLINK - 0.3) kx = ky = 0;
    const speed = (jm && hero.air ? JUMP.air : SPEED) * amt;
    // (side-on and off the lines: onto the nearest of them before anything else)
    if (astray && !hero.path && !g.busy) {
      const s = lanes.snap(hero.x, hero.z);
      hero.path = joinPath([s.x, s.z]);
      hero.pi = 0;
      hero.cb = null;
    }
    if ((kx || ky) && !g.busy && side && !astray) {
      hero.path = null;
      mark = null;
      keyLaned(kx, ky, dt, speed);
      g.host.set('moved', true);
    } else if ((kx || ky) && !g.busy && !side) {
      hero.path = null;
      mark = null;
      const ax = g.look.axes(g.cam.yaw),
        l = Math.hypot(kx, ky),
        mx = (kx * ax.right[0] + ky * ax.fwd[0]) / l,
        mz = (kx * ax.right[1] + ky * ax.fwd[1]) / l,
        sp = speed * dt;
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
      let left = speed * dt;
      byPath = true;
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
    if (jm) {
      // Where there is jumping, what the keys or the walk asked for is a step of a body: a wall stops it (and ends a walk),
      // and it rises and falls.
      let dx = hero.x - ox,
        dz = hero.z - oz;
      const d = Math.hypot(dx, dz);
      hero.x = ox;
      hero.z = oz;
      // (a walk someone asked for with a tap stops short of a drop out of the world: only a push or a jump goes over one)
      if (byPath && d > 0 && !hero.air && plat.kill > -1e8 && plat.floor(ox + dx + (dx / d) * 0.75, oz + dz + (dz / d) * 0.75, hero.y + JUMP.step) < plat.kill) {
        dx = dz = 0;
        hero.path = null;
        hero.cb = null;
        mark = null;
      }
      const flying = hero.air;
      if (plat.step(hero, dx, dz, dt) && hero.path) {
        hero.path = null;
        hero.cb = null;
        mark = null;
      }
      // (when they touched down: a side-view set has a landing pose)
      if (flying && !hero.air) hero.landed = clock;
      if (Math.hypot(hero.x - ox, hero.z - oz) < 1e-4) hero.moving = false;
      if (firm()) safe = { x: hero.x, z: hero.z, hx: hero.hx, hz: hero.hz };
      else if (hero.y < plat.kill && safe) {
        lost = 0;
        hero.path = null;
        hero.cb = null;
        hero.moving = false;
        mark = null;
      }
      return;
    }
    hero.air = false;
    hero.vy = 0;
    const gy = nav.gh(hero.x, hero.z);
    if (gy > -900) hero.y += (gy - hero.y) * Math.min(1, dt * 16);
  }

  function stepActor(n, dt) {
    // (a walk a script asked for: straight there, and then the script goes on; ground walked off is lowered down to, as
    // on a rope)
    if (n.goal) {
      const q = n.goal,
        dx = q.x - n.x,
        dz = q.z - n.z,
        d = Math.hypot(dx, dz),
        sp = q.speed * dt;
      if (d <= sp) {
        n.x = q.x;
        n.z = q.z;
        n.moving = false;
      } else {
        n.fx = dx / d;
        n.fz = dz / d;
        n.x += (dx / d) * sp;
        n.z += (dz / d) * sp;
        n.dist += sp;
        n.moving = true;
      }
      const gy = nav.gh(n.x, n.z);
      if (gy > -900) n.y = gy >= n.y ? gy : Math.max(gy, n.y - LOWER * dt);
      // (there, and on the ground; or, someone who is to be gone, let down far enough to be out of sight)
      if ((!n.moving && Math.abs(n.y - (gy > -900 ? gy : n.y)) < 0.01) || (q.gone && n.y < q.y0 - GONE)) {
        n.goal = null;
        if (q.face) {
          const l = Math.hypot(q.face[0], q.face[1]) || 1;
          n.fx = q.face[0] / l;
          n.fz = q.face[1] / l;
        }
        if (q.gone) n.gone = true;
        if (q.cb) q.cb();
      }
      return;
    }
    if (!n.wander || n.talk || g.busy) return;
    if (n.tx != null) {
      const dx = n.tx - n.x,
        dz = n.tz - n.z,
        d = Math.hypot(dx, dz),
        sp = (n.flee ? 12 : 5.5) * dt;
      if (d <= sp) {
        n.x = n.tx;
        n.z = n.tz;
        n.tx = null;
        n.flee = false;
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

  const foeShown = n => !n.beaten && (n.show === undefined || test(n.show, g.host));

  // a foe's step toward a point, round what is in the way if it can
  function foeMove(n, tx, tz, sp) {
    const dx = tx - n.x,
      dz = tz - n.z,
      d = Math.hypot(dx, dz);
    if (d < 1e-4) return true;
    const m = Math.min(d, sp);
    let nx = n.x + (dx / d) * m,
      nz = n.z + (dz / d) * m;
    if (nav.blocked(nx, nz)) {
      if (!nav.blocked(nx, n.z)) nz = n.z;
      else if (!nav.blocked(n.x, nz)) nx = n.x;
      else return false;
    }
    n.x = nx;
    n.z = nz;
    n.fx = dx / d;
    n.fz = dz / d;
    return d <= sp;
  }

  function stepFoe(n, dt) {
    if (g.busy || !foeShown(n)) return;
    n.calm = Math.max(0, n.calm - dt);
    const d = Math.hypot(hero.x - n.x, hero.z - n.z),
      strayed = Math.hypot(n.x - n.hx0, n.z - n.hz0);
    if (!n.chase && !n.calm && d < n.sight && nav.los(n.x, n.z, hero.x, hero.z)) n.chase = true;
    else if (n.chase && (d > n.sight * 1.7 || strayed > n.sight * 2)) {
      // (lost them, or too far from home: back it goes, and it leaves them be for a while)
      n.chase = false;
      n.calm = 4;
      n.tx = n.hx0;
      n.tz = n.hz0;
    }
    if (n.chase) {
      if (d < 2.6 + n.m.rad * 0.3) {
        if (g.fight(n.battle, { x: n.x, z: n.z, foe: n })) return;
        // (nowhere to fight just here: it backs off and comes again)
        n.chase = false;
        n.calm = 1.5;
      } else foeMove(n, hero.x, hero.z, n.speed * dt);
    } else if (n.tx != null) {
      if (foeMove(n, n.tx, n.tz, n.speed * 0.5 * dt) || (n.stuck = (n.stuck || 0) + dt) > 3) {
        n.tx = null;
        n.stuck = 0;
        n.wait = 1 + Math.random() * 2.5;
      }
    } else {
      n.wait -= dt;
      if (n.wait <= 0) {
        const a = Math.random() * 6.283,
          r = Math.random() * n.roam,
          tx = n.hx0 + Math.cos(a) * r,
          tz = n.hz0 + Math.sin(a) * r;
        if (!nav.blocked(tx, tz) && nav.los(n.x, n.z, tx, tz)) {
          n.tx = tx;
          n.tz = tz;
        } else n.wait = 0.4;
      }
    }
    const gy = nav.gh(n.x, n.z);
    if (gy > -900) n.y = gy;
  }

  function update(dt) {
    stepHero(dt);
    for (const n of actors) stepActor(n, dt);
    for (const n of foes) stepFoe(n, dt);
    const c = g.cam,
      k = 1 - Math.exp(-dt * 7);
    c.yaw += (c.yawT - c.yaw) * (1 - Math.exp(-dt * 11));
    if (Math.abs(c.yawT - c.yaw) < 0.0015) c.yaw = c.yawT;
    c.focus[0] += (hero.x - c.focus[0]) * k;
    c.focus[1] += (eye() - c.focus[1]) * k;
    c.focus[2] += (hero.z - c.focus[2]) * k;
    if (mark && !window.__hold && (!hero.path || g.t - mark[2] > 6)) mark = null;
  }

  // What the act button would use: the nearest person or thing within reach that can be used (and, where there is
  // jumping, that is not up on another level).
  function actTarget() {
    let best = null,
      bd = ACT;
    for (const th of actors.concat(props)) {
      if (!shown(th)) continue;
      const d = Math.hypot(th.x - hero.x, th.z - hero.z) - (th.name !== undefined ? 0 : th.r);
      if (d < bd && !(plat && laned() && Math.abs(nav.gh(th.x, th.z) - hero.y) > 6)) {
        bd = d;
        best = th;
      }
    }
    return best;
  }

  // what to draw this frame. During a battle fought in place (`fight`) the area and its people stay on screen, and the
  // battle draws the party and whoever it is fighting.
  function build(fr, fight) {
    for (const m of solids)
      if (!m.world || g.look.hideWorld) {
        fr.meshes.push(m);
        // (the HD-2D trial: soft shadows under the mesh's things, where the baker says)
        if (g.look.hd) for (const s of m.mesh.meta.shadows || []) fr.blobs.push({ x: s[0], y: s[1], z: s[2], r: s[3] });
      }
    // the ledges that move or give way, where they are now: one that is giving way shudders, then drops and is gone, and
    // shows faintly again just before it is back
    if (plat)
      for (const l of plat.ledges) {
        const mesh = parts[l.move ? 'move' : l.crumble ? 'crumble' : ''];
        if (!mesh) continue;
        let x = (l.x0 + l.x1) / 2,
          y = l.y,
          k = 1;
        if (l.gone >= 0) {
          const fell = clock - (l.gone - l.back),
            due = l.gone - clock;
          if (fell < 0.7) y -= 30 * fell * fell;
          else if (due < 0.3) k = 0.35 + 0.65 * (1 - due / 0.3);
          else continue;
        } else if (l.stood >= 0) {
          x += 0.08 * Math.sin(clock * 75);
          y -= 0.05 + 0.04 * Math.sin(clock * 53);
        }
        fr.meshes.push({ mesh, x, y, z: (l.z0 + l.z1) / 2, size: 1, yaw: 0, tint: [k, k, k] });
      }
    const ax = g.look.axes(g.cam.yaw),
      body = (ci, moving, dist, hx, hz) => ({ rect: SP.frame(ci, facing(hx, hz, ax), moving, dist), flip: 0, size: SP.size(ci) }),
      // (fallen out of the world the leader is not there; just set back, they flicker)
      here = !fight && lost < 0 && !remembering() && !(blink > 0 && Math.floor(blink * 12) % 2);
    if (lost >= 0) fr.dim = 0.5 * Math.sin((Math.PI * lost) / LOST);
    if (here) fr.blobs.push({ x: hero.x, y: (jumps() ? plat.floor(hero.x, hero.z, hero.y + 0.01) : hero.y) + 0.25, z: hero.z, r: hero.air ? 1 : 1.3 });
    for (const n of actors) if (shown(n)) fr.blobs.push({ x: n.x, y: n.y + 0.25, z: n.z, r: 1.3 });
    for (const n of foes) {
      const rig = g.rigs[n.m.rig];
      if (!rig || n.inFight || !foeShown(n)) continue;
      // (monsters are baked facing +x; this one faces the leader once it has seen them, else the way it drifts)
      const see = n.chase || Math.hypot(hero.x - n.x, hero.z - n.z) < n.sight,
        hx = see ? hero.x - n.x : n.fx,
        hz = see ? hero.z - n.z : n.fz;
      fr.models.push({ rig, clip: 'idle', time: g.t + n.t0, x: n.x, y: n.y, z: n.z, dis: 0, flash: 0, flashC: [1, 1, 1], yaw: Math.atan2(-hz, hx) });
      fr.blobs.push({ x: n.x + (n.m.shadowDx || 0), y: n.y + 0.25, z: n.z, r: n.m.rad });
    }
    if (mark && !fight) {
      const a = 0.5 + 0.5 * Math.sin(g.t * 10);
      fr.rings.push({ x: mark[0], y: nav.gh(mark[0], mark[1]) + 0.3, z: mark[1], r: 1.45 + 0.3 * a, col: [1, 0.93 + 0.05 * a, 0.62 + 0.25 * a] });
    }
    if (here) {
      // Seen side-on, a leader with a side-view set is drawn from it when facing along the lane: in profile, running,
      // standing, rising, falling or landing (pose.js). Otherwise it is the walk cycle: in the air, caught mid-stride.
      const side = laned(),
        row = side ? profile(facing(hero.hx, hero.hz, ax)) : facing(hero.hx, hero.hz, ax),
        pose = side && SP.anim(g.leader, 'run', row, 0) ? sidePose(hero, clock, name => SP.animLength(g.leader, name)) : null,
        an = pose ? SP.anim(g.leader, pose.anim, row, pose.k) : null,
        rect = an ? an.rect : SP.frame(g.leader, row, hero.moving || hero.air, hero.air ? SP.strideAt : hero.dist);
      fr.sprites.push({ rect, flip: 0, size: SP.size(g.leader), x: hero.x, y: hero.y, z: hero.z, tint: g.tintAt(hero.x, hero.z), offY: an ? an.offY : SP.offY, bias: 0.66, sil: true, pose: an ? pose.anim : null });
    }
    // (a leader with a "halo" in heroes.json wears a thin ring of light over their head)
    if (here && g.hero(g.party()[0]).halo) fr.rings.push({ x: hero.x, y: hero.y + HALO, z: hero.z, r: 0.95, col: [1, 0.9, 0.56] });
    for (const n of actors) if (shown(n)) fr.sprites.push(Object.assign(body(n.ci, n.moving, n.dist, n.fx, n.fz), { x: n.x, y: n.y, z: n.z, tint: g.tintAt(n.x, n.z), offY: SP.offY, bias: 0.66 }));
    // (a memory is drawn faded into the past: engine/look-gen.js)
    if (g.memory && g.memory.k > 0) {
      fr.past = g.memory.k;
      fr.pastT = g.t;
    }
    if (!g.busy && !fight) {
      // the little bobbing mark over what can be used nearby; with the stick and buttons on the picture, a ring at the
      // feet of what the act button would use
      const bob = Math.floor(g.t * 2.2) % 2,
        tg = g.padShown ? actTarget() : null;
      if (tg) fr.rings.push({ x: tg.x, y: nav.gh(tg.x, tg.z) + 0.3, z: tg.z, r: (tg.name !== undefined ? 1.7 : tg.r + 0.6) + 0.15 * Math.sin(g.t * 5), col: [1, 0.95, 0.7] });
      for (const th of actors.concat(props)) {
        if (Math.hypot(th.x - hero.x, th.z - hero.z) > 17 || !shown(th)) continue;
        const person = th.name !== undefined;
        fr.sprites.push({ rect: SP.icons[person ? 'talk' : th.icon], flip: 0, x: th.x, y: th.y + (person ? 0 : th.h), z: th.z, tint: [1, 1, 1], offY: (person ? SP.tall + 3 : 6) + bob, bias: 5.5 });
      }
    }
  }

  // Arrows laid over the picture where the line can be changed, side-on: tap one to walk to it and along its column to the
  // next stop. Called once the frame is drawn, so they sit where the picture puts their places.
  function overlay() {
    const list = g.busy || g.mode !== 'field' || (g.menu && g.menu.open) ? [] : ways(),
      ov = g.ui.$('ov');
    let n = 0;
    for (const w of list) {
      const gy = nav.gh(w.x, w.z),
        p = g.look.project(w.x, gy + (w.up > 0 ? 7.6 : -2.4), w.z);
      if (Math.abs(p[0]) > 0.94 || Math.abs(p[1]) > 0.94) continue;
      let b = arrows[n];
      if (!b) {
        b = arrows[n] = document.createElement('button');
        b.className = 'way';
        b.addEventListener('click', () => b.way && take(b.way));
      }
      // (a battle clears whatever is laid over the picture)
      if (b.parentNode !== ov) ov.appendChild(b);
      n++;
      const q = g.ui.toStage(p),
        near = Math.hypot(w.x - hero.x, w.z - hero.z) < TURN;
      b.way = w;
      b.textContent = w.up > 0 ? '\u25B2' : '\u25BC';
      b.setAttribute('aria-label', w.up > 0 ? 'Walk up to the next lane' : 'Walk down to the next lane');
      b.classList.toggle('near', near);
      b.style.display = 'block';
      b.style.left = q[0] + 'px';
      b.style.top = q[1] + 'px';
    }
    for (let i = n; i < arrows.length; i++) arrows[i].style.display = 'none';
  }

  return {
    hero,
    keys,
    enter,
    spawn,
    update,
    tap,
    build,
    overlay,
    ways,
    take,
    swipe,
    walkTo,
    goThing,
    get lanes() {
      return lanes;
    },
    stick,
    // the act button: walk up to the nearest person or thing in reach and use it. True if there was one.
    act() {
      const th = g.busy ? null : actTarget();
      if (th) goThing(th);
      return !!th;
    },
    // ask for a jump (it is made if the leader is standing, or as soon as they land)
    jump() {
      if (jumps() && !g.busy && lost < 0) hero.want = 0;
    },
    get jumps() {
      return jumps();
    },
    get aloft() {
      return aloft();
    },
    get plat() {
      return plat;
    },
    // (the area's clock, by which its ledges move; whether the leader has just fallen out of the world; the firm ground kept)
    get clock() {
      return clock;
    },
    get lost() {
      return lost >= 0;
    },
    get safe() {
      return safe;
    },
    get laned() {
      return laned();
    },
    stop() {
      hero.path = null;
      hero.moving = false;
      mark = null;
    },
    setMark(x, z) {
      mark = [x, z, g.t + 99];
    },
    // A memory (engine/script.js): `at`, a spawn of this area, is where it is watched from: the leader (not drawn) is put
    // there, the people of the memory stand in their places, and the camera is there at once. Called again with nothing,
    // the leader is back where they stood. (Called while the picture is faded out.)
    remember(at) {
      if (at) {
        back = { x: hero.x, z: hero.z, y: hero.y, hx: hero.hx, hz: hero.hz };
        const sp = (rt.def.spawns || {})[at];
        if (!sp) throw new Error(rt.id + ': no spawn called "' + at + '"');
        const p = place(sp);
        Object.assign(hero, { x: p[0], z: p[1], y: nav.gh(p[0], p[1]), path: null, pi: 0, cb: null, moving: false, vy: 0, air: false, on: -1 });
        for (const n of actors)
          if (n.memory) Object.assign(n, { x: n.hx0, z: n.hz0, y: nav.gh(n.hx0, n.hz0), fx: n.f0[0], fz: n.f0[1], goal: null, gone: false, moving: false, dist: 0 });
      } else if (back) {
        Object.assign(hero, back, { path: null, pi: 0, cb: null, moving: false, vy: 0, air: false, on: -1 });
        back = null;
      }
      mark = null;
      g.cam.focus = [hero.x, eye(), hero.z];
    },
    // someone walks to `to` (a place, or [x, z] in game units), then faces `o.face`, or is gone (`o.gone`); then `cb`
    moveActor(id, to, o, cb) {
      const n = actors.find(a => a.id === id);
      if (!n) throw new Error(rt.id + ': no one called "' + id + '"');
      const p = typeof to === 'string' ? place({ poi: to }) : [to[0], to[1]];
      n.goal = { x: p[0], z: p[1], speed: o.speed || WALK, face: o.face, gone: o.gone, y0: n.y, cb };
    },
    // after a battle fought in place: the leader stands at (x, z), facing `face` if given; a foe that won goes home and
    // leaves them be for a while
    settle(x, z, face, foe) {
      Object.assign(hero, { x, z, y: nav.gh(x, z), path: null, pi: 0, cb: null, moving: false, vy: 0, air: false, on: -1, extra: 0 });
      if (face && Math.hypot(face[0], face[1]) > 0.01) {
        const l = Math.hypot(face[0], face[1]);
        hero.hx = face[0] / l;
        hero.hz = face[1] / l;
      }
      // (and stays put a moment before it drifts about again)
      if (foe) Object.assign(foe, { x: foe.hx0, z: foe.hz0, chase: false, calm: 10, tx: null, tz: null, wait: 2.5 });
      mark = null;
    },
    // A fight is about to be had round (x, z), out to r, seen from the side `cam` points to ([x, z], a direction): whoever
    // wanders there, or between it and the camera, hurries out of the way, to beyond the fight and never to the camera's
    // side of it. They are stepped by `bystand` while it lasts, and wander home again afterwards.
    clear(x, z, r, cam) {
      const ca = Math.atan2(cam[1], cam[0]),
        turn = a => Math.atan2(Math.sin(a), Math.cos(a));
      for (const n of actors) {
        const d = Math.hypot(n.x - x, n.z - z),
          toward = d > 0.01 ? ((n.x - x) * cam[0] + (n.z - z) * cam[1]) / d : 0;
        if (!n.wander || (d > r && !(d < r + 14 && toward > 0.75))) continue;
        // (out the far side: to the left or the right of it, whichever they are nearer)
        const side = turn(Math.atan2(n.z - z, n.x - x) - ca) >= 0 ? 1 : -1,
          away = ca + side * 2.2;
        let best = null;
        for (let k = 0; k < 9 && !best; k++) {
          // (that way first, then further and further round it, but never back toward the camera)
          const a = away + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.3;
          if (Math.abs(turn(a - ca)) < 1.3) continue;
          for (const out of [r + 3, r + 6]) {
            const tx = x + Math.cos(a) * out,
              tz = z + Math.sin(a) * out;
            if (!nav.blocked(tx, tz) && nav.los(n.x, n.z, tx, tz)) {
              best = [tx, tz];
              break;
            }
          }
        }
        if (best) Object.assign(n, { tx: best[0], tz: best[1], flee: true, talk: false });
      }
    },
    bystand(dt) {
      for (const n of actors) if (n.flee) stepActor(n, dt);
    },
    // where the camera looks when the leader stands at (x, z)
    focusOf: (x, z) => [x, nav.gh(x, z) + LIFT, z],
    get foes() {
      return foes;
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
