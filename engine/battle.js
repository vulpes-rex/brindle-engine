// Battle mode: turn-based, in rounds ordered by speed. Who fights, what they can do and how each action plays out all come
// from the game's data (heroes, monsters, skills, foe actions, battles). An action is a move (how the user steps about) and a
// few timed hits: damage, healing, a shield, effects, a shake.
//
//   skill / foe action: { name, mp, target, move, dur, text, ask, cast, hits: [{ at, power, magic, heal, wall, fx, color, flash,
//                         screen, shake }] }
//   target: "foe" | "foes" | "ally" | "self"  (for heroes)   "hero" | "heroes"  (for foes)
//   move:   ["strike", x, z] run in, hop, run back   ["step", d] step forward and back   ["lunge", dx, dz] rush the target
//   cast:   a colour: the user gathers power (a glyph, a column of light) until the first hit, and the scene dims meanwhile
//   fx:     an effect from engine/fx.js played on each target (slash, burst, bolts, heal, ward, shard) or once for all of them
//           (quake, hum); color tints it, screen flashes the whole picture (0..1), flash tints the one hit
//
// It is shown the way Golden Sun shows its battles: the camera sits low behind the party and swings to whoever acts, then to
// whatever they act on; Psynergy dims the scene and plays out in light.
//
// A battle has an arena of its own ("area"), or is fought "here": on the ground where a foe of the field was met, as in
// Chrono Trigger. Then the area stays on screen, the party steps out from its leader and the foe to its place, and the
// camera comes down from the field's view to the battle's and goes back up afterwards (startHere, engine/ground.js).
import { facing } from './field.js';
import { createFx } from './fx.js';
import { sheetFrame } from './sheetfx.js';
import { createTimed, timedDamage, TIMED } from './timed.js';
import { HALO } from './party.js';
import { tile, row } from './icons.js';
import { fightAt, standsOf } from './ground.js';

const TILT = 0.36, // the battle camera: lower than the field's,
  PERSP = 1 / 70, // with some perspective,
  SKEW = 0.42, // turned so the foes sit up and to the left of the party,
  ZOOM = 1.3, // and closer in
  ONCE = { quake: 1, hum: 1 }; // effects played once for all the targets, not on each

export function createBattle(g) {
  const ui = g.ui,
    $ = ui.$,
    SP = g.SP,
    fx = createFx(),
    B = { on: false, busy: false, units: [], fx };
  let def = null,
    GY = 1,
    back = null,
    after = null,
    yaw0 = 0,
    here = null, // a battle fought in place: { at, to, y, th, c, s, foe, from } (its layout set down on the area)
    skew = SKEW;
  // the camera, now and where it is heading (persp: how strong its lens is; strip: how much of the side view it keeps)
  const cam = { f: [0, 5, 0], yaw: 0, zoom: 1, tilt: TILT, persp: PERSP, strip: 0 },
    aim = { f: [0, 5, 0], yaw: 0, zoom: 1, tilt: TILT, persp: PERSP, strip: 0, rate: 4 };
  // A battle is laid out in units of its own, the foes toward -x of the party. In an arena those are the arena's; in place
  // W takes a spot of the layout to the area's ground, and D a step.
  const W = (x, z) => (here ? here.to(x, z) : [x, z]),
    D = (x, z) => (here ? [x * here.c - z * here.s, x * here.s + z * here.c] : [x, z]),
    turnTo = (a, to) => a + Math.round((to - a) / (2 * Math.PI)) * 2 * Math.PI; // the same heading as a, nearest to
  const bmsg = s => ($('bmsg').textContent = s),
    items = () => g.content.game.items || {},
    living = side => B.units.filter(u => u.side === side && u.hp > 0),
    fmt = (text, u, tg) => text.replace('{user}', u.name).replace('{target}', tg ? (tg === u ? 'themself' : tg.name) : ''),
    centre = list => {
      const n = list.length || 1;
      return [list.reduce((s, u) => s + u.x, 0) / n, list.reduce((s, u) => s + u.z, 0) / n];
    },
    side = s => (living(s).length ? living(s) : B.units.filter(u => u.side === s)),
    feet = u => [u.x, GY, u.z],
    tall = u => (u.side === 'foe' ? u.top : 6.4),
    right = () => g.look.axes(cam.yaw).right;

  // ---- setting up and tearing down
  function setup(id) {
    def = g.content.battles[id];
    GY = here ? here.y : def.ground === undefined ? 1 : def.ground;
    Object.assign(B, { on: true, here: !!here, units: [], round: 0, wall: 0, shake: 0, act: null, end: null, menu: null, pend: null, cur: null, phase: 'intro', timer: 1.7, order: [], oi: 0, enter: null, leave: null });
    for (const id2 of g.party()) {
      const h = g.hero(id2),
        p = here ? here.at[B.units.length] : h.at;
      B.units.push(Object.assign({ side: 'hero', x: p[0], z: p[1], hx: p[0], hz: p[1], fl: 0, flc: [1, 1, 1], kb: 0, hop: 0, dist: 0, run: false, guard: false, ko: false, hp: h.mhp, mp: h.mmp, glow: null }, h, { id: id2, ci: SP.names.indexOf(h.sprite), skills: h.skills.map(s => Object.assign({ id: s }, g.content.skills[s])) }));
    }
    for (const f of def.foes) {
      const m = g.content.monsters[f.type],
        p = here ? here.at[B.units.length] : f.at;
      B.units.push(Object.assign({ side: 'foe', x: p[0], z: p[1], hx: p[0], hz: p[1], fl: 0, flc: [1, 1, 1], clip: 'idle', ct: Math.random() * 2, dis: 0, gone: false, boom: false, jit: 0, n: 0, hp: m.mhp }, m, { id: f.type }));
    }
    B.units.forEach((u, i) => (u.i = i));
    // the camera looks from behind the party towards the foes, which sit up and to the left; it starts wide and swings in
    const H = centre(side('hero')),
      F = centre(side('foe'));
    // (in place the two sides stand closer: the camera comes further round, so that the foes still sit clear of the party)
    skew = here ? Math.max(SKEW, Math.asin(Math.min(0.8, 8 / Math.hypot(F[0] - H[0], F[1] - H[1])))) : SKEW;
    yaw0 = Math.atan2(F[1] - H[1], F[0] - H[0]) - Math.PI / 2 - skew;
    fx.clear();
    drawn.length = floor.length = 0;
    if (here) {
      // in place: everyone starts where they were on the field (the party as one, at its leader) and goes to their place
      // while the camera comes down from where the field had it; whoever is wandering there gets out of the way
      const fh = g.field.hero,
        M = centre(B.units);
      g.field.clear(M[0], M[1], Math.max(...B.units.map(u => Math.hypot(u.x - M[0], u.z - M[1]))) + 3, [Math.sin(yaw0), -Math.cos(yaw0)]);
      for (const u of B.units) {
        const from = u.side === 'hero' ? [fh.x, fh.z] : here.from;
        Object.assign(u, { sx: from[0], sz: from[1], x: from[0], z: from[1] });
      }
      B.enter = { t: 0, dur: 0.8 };
      Object.assign(cam, { f: g.cam.focus.slice(), yaw: turnTo(g.cam.yaw, yaw0), zoom: 1, tilt: back.tilt, persp: back.persp, strip: back.strip });
    } else Object.assign(cam, { f: [F[0], GY + 6, F[1]], yaw: yaw0 + 1.5, zoom: 0.8, tilt: 0.75, persp: PERSP, strip: 0 });
    g.cam.shake = 0;
    ui.el.hint.style.display = 'none';
    ui.el.opts.style.display = 'none';
    $('bp').classList.remove('off');
    const ov = ui.el.ov;
    ov.innerHTML = '';
    for (const f of B.units)
      if (f.side === 'foe') {
        f.el = document.createElement('div');
        f.el.className = 'ebar';
        f.el.innerHTML = '<i></i>';
        ov.appendChild(f.el);
        f.nm = document.createElement('div');
        f.nm.className = 'enm';
        f.nm.textContent = f.name;
        ov.appendChild(f.nm);
      }
    B.curEl = document.createElement('div');
    B.curEl.className = 'cur';
    B.curEl.textContent = '▼';
    B.curEl.style.display = 'none';
    ov.appendChild(B.curEl);
    bmsg(def.intro);
    $('bcmd').innerHTML = '';
    renderParty();
  }

  // Fight battle `id`; cb(won) once the party is back where it was and the battle's own closing script has run.
  async function start(id, cb) {
    if (B.busy || B.on) return;
    B.busy = true;
    const d = g.content.battles[id];
    back = { area: g.area, focus: g.cam.focus.slice(), yaw: g.cam.yawT };
    after = cb;
    ui.loading('Getting ready…');
    let arena;
    try {
      [arena] = await Promise.all([g.loadArea(d.area), g.loadMonsters()]);
    } catch (e) {
      return ui.fail('Could not set up the battle: ' + e.message);
    }
    ui.loading(null);
    ui.fade(
      () => {
        g.mode = 'battle';
        g.show(arena);
        setup(id);
      },
      () => (B.busy = false)
    );
  }

  // Fight battle `id` on the spot, against a foe of the field met at `at` ({ x, z, foe }). Returns false if it cannot be
  // fought here just now (no level ground near, or the foes' models not yet loaded); cb(won) as for start.
  function startHere(id, at, cb) {
    if (B.busy || B.on || !g.area || g.look.kind !== 'gen') return false;
    const d = g.content.battles[id],
      fh = g.field.hero;
    if (d.foes.some(f => !g.rigs[g.content.monsters[f.type].rig])) return false;
    const stands = standsOf(g.content.heroes, g.party(), d),
      // which way the party's side lies from the foes', and so where the camera sits: as the area says (it knows from
      // where its ground can be seen), or as they met
      v = (g.area.def.fight && g.area.def.fight.from) || [fh.x - at.x, fh.z - at.z],
      th = Math.atan2(v[1], v[0]),
      c = Math.cos(th),
      sn = Math.sin(th),
      // the nearest ground that will hold the two sides
      spot = fightAt(g.area.nav, stands, [fh.x, fh.z], [at.x, at.z], th);
    if (!spot) return false;
    here = { at: spot.at, to: spot.to, y: spot.y, th, c, s: sn, foe: at.foe, from: [at.x, at.z] };
    back = { area: g.area, yaw: g.cam.yawT, tilt: g.look.viewTilt === undefined ? TILT : g.look.viewTilt, persp: g.look.persp || 0, strip: g.look.viewStrip || 0, pos: [fh.x, fh.z] };
    after = cb;
    g.field.stop();
    if (at.foe) at.foe.inFight = true;
    g.mode = 'battle';
    setup(id);
    return true;
  }

  // out of a battle fought in place, back to the field with the leader at (x, z); returns what is still to do, the
  // battle's closing script
  function endHere(won, x, z) {
    const foe = here.foe,
      F = centre(B.units.filter(u => u.side === 'foe'));
    g.mode = 'field';
    B.on = B.here = false;
    B.leave = null;
    here = null;
    fx.clear();
    drawn.length = floor.length = 0;
    ui.el.ov.innerHTML = '';
    $('bp').classList.add('off');
    $('bparty').innerHTML = '';
    ui.el.hint.style.display = '';
    ui.el.opts.style.display = '';
    g.cam.shake = 0;
    if (foe) {
      foe.inFight = false;
      if (won) foe.beaten = true;
    }
    g.field.settle(x, z, won ? [F[0] - x, F[1] - z] : null, won ? null : foe);
    g.cam.focus = g.field.focusOf(x, z);
    g.cam.yaw = g.cam.yawT = back.yaw;
    B.busy = false;
    const cb = after,
      script = (won ? def.won : def.lost) || [];
    after = null;
    return () => g.run(script, () => cb && cb(won));
  }

  function finish(won) {
    if (B.busy) return;
    if (here && won) {
      // won in place: the others fall in behind the leader again while the camera goes back up to the field's view
      const lead = B.units.find(u => u.side === 'hero' && u.ci === g.leader) || B.units.find(u => u.side === 'hero');
      B.busy = true;
      B.phase = 'leave';
      B.leave = { t: 0, dur: 0.7, x: lead.hx, z: lead.hz, f: g.field.focusOf(lead.hx, lead.hz) };
      for (const u of B.units) Object.assign(u, { sx: u.x, sz: u.z });
      $('bcmd').innerHTML = '';
      return;
    }
    if (here) {
      // lost in place: a blink, and the party is back where it stood before the fight
      B.busy = true;
      let then = null;
      return ui.fade(
        () => (then = endHere(false, back.pos[0], back.pos[1])),
        () => then()
      );
    }
    B.busy = true;
    ui.fade(
      () => {
        g.mode = 'field';
        g.show(back.area);
        B.on = false;
        fx.clear();
        ui.el.ov.innerHTML = '';
        $('bp').classList.add('off');
        $('bparty').innerHTML = '';
        ui.el.hint.style.display = '';
        ui.el.opts.style.display = '';
        g.cam.focus = back.focus;
        g.cam.yaw = g.cam.yawT = back.yaw;
      },
      () => {
        B.busy = false;
        const cb = after;
        after = null;
        g.run((won ? def.won : def.lost) || [], () => cb && cb(won));
      }
    );
  }

  // ---- the panel, in Golden Sun's blue windows: a status window for each hero over the picture, and below it the
  // message and command windows
  function renderParty() {
    let h = '';
    const gauge = (v, m, cls) => '<span class="gg' + cls + '"><i style="width:' + Math.round((100 * v) / m) + '%"></i></span>';
    for (const u of B.units)
      if (u.side === 'hero') {
        const act = u === B.cur && B.phase === 'command',
          low = u.hp <= 0 ? ' ko' : u.hp < u.mhp * 0.25 ? ' low' : '';
        h += '<div class="gs st' + (act ? ' act' : '') + low + '"><b>' + u.name + (u.guard ? ' ◆' : '') + '</b><span class="sv"><i>HP</i>' + u.hp + '</span>' + gauge(u.hp, u.mhp, '') + '<span class="sv"><i>MP</i>' + u.mp + '</span>' + gauge(u.mp, u.mmp, ' mp') + '</div>';
      }
    $('bparty').innerHTML = h;
  }

  function menu(kind) {
    B.menu = kind;
    const u = B.cur,
      tonic = g.items.tonic || 0;
    let h = '';
    if (kind === 'root') h = tile('attack', 'data-c="attack"', 'Attack') + tile('skill', 'data-c="skill"', 'Skill') + tile('item', 'data-c="item"', 'Tonic ×' + tonic, !tonic) + tile('guard', 'data-c="guard"', 'Guard');
    else if (kind === 'skill') {
      for (const s of u.skills) h += row('data-s="' + s.id + '"', s.name, s.mp + ' MP', u.mp < s.mp);
      h += row('data-c="back"', 'Back');
    } else if (kind === 'foe') {
      B.units.forEach((f, i) => {
        if (f.side === 'foe' && f.hp > 0) h += row('data-t="' + i + '"', f.name);
      });
      h += row('data-c="back"', 'Back');
    } else if (kind === 'ally') {
      B.units.forEach((f, i) => {
        if (f.side === 'hero' && f.hp > 0) h += row('data-t="' + i + '"', f.name, f.hp + '/' + f.mhp + ' HP');
      });
      h += row('data-c="back"', 'Back');
    }
    $('bcmd').className = 'gs ' + (kind === 'root' ? 'tiles' : 'list');
    $('bcmd').innerHTML = h;
  }

  // ---- turns
  function newRound() {
    B.round++;
    if (B.wall > 0) B.wall--;
    B.order = B.units.filter(u => u.hp > 0).sort((a, b) => b.spd - a.spd);
    B.oi = 0;
  }

  function nextTurn() {
    for (let guard = 0; guard < 12; guard++) {
      B.oi++;
      if (B.oi >= B.order.length) newRound();
      const u = B.order[B.oi];
      if (!u || u.hp <= 0) continue;
      B.cur = u;
      u.guard = false;
      if (u.side === 'hero') {
        B.phase = 'command';
        B.pend = null;
        menu('root');
        bmsg(u.name + ': choose an action.' + (B.wall > 0 ? ' (Shield Wall is up.)' : ''));
      } else {
        B.phase = 'act';
        foeAct(u);
      }
      renderParty();
      return;
    }
  }

  function damage(a, power, d, magic) {
    let v = ((magic ? a.mag || a.atk : a.atk) * power - (magic ? d.mdf : d.def) * 0.5) * (0.9 + 0.2 * Math.random());
    if (d.guard) v *= 0.5;
    if (d.side === 'hero' && B.wall > 0) v *= 0.5;
    return Math.max(1, Math.round(v));
  }

  // ---- timed hits (engine/timed.js): a press as a blow lands. blow() is a damaging hit with the timing counted in
  const timed = createTimed();
  let hints = 0;
  function press() {
    if (g.mode === 'battle' && B.on && B.phase === 'act') timed.press(g.t);
  }
  document.addEventListener('pointerdown', press);
  window.addEventListener('keydown', e => (e.key === ' ' || e.key === 'Enter') && !e.repeat && press());
  function blow(u, x, power, magic, col, quiet, grade) {
    const byHero = u.side === 'hero',
      who = byHero ? u : x;
    hit(x, timedDamage(damage(u, power, x, magic), who.side === 'hero' ? grade : 0, byHero), col, quiet);
    if (grade && who.side === 'hero') {
      pop(who, TIMED.word[grade], 'txt timed');
      who.fl = 1;
      who.flc = [1, 0.95, 0.6];
      if (grade === 2) fx.flash('#fff', 0.12);
    }
  }

  // ---- effects laid over the picture
  const upos = (u, h) => ui.toStage(g.look.project(u.x, GY + (h === undefined ? (u.side === 'foe' ? u.mid : 4) : h), u.z));
  // a number (or a word) that springs up over a unit and stays with it while the camera moves
  const pops = [];
  function pop(u, text, cls) {
    const e = document.createElement('div'),
      q = { e, u, dx: Math.random() * 16 - 8 };
    e.className = 'num ' + (cls || '');
    e.textContent = text;
    ui.el.ov.appendChild(e);
    pops.push(q);
    place(q);
    setTimeout(() => {
      e.remove();
      if (pops.includes(q)) pops.splice(pops.indexOf(q), 1);
    }, 1150);
  }
  function place(q) {
    const p = upos(q.u, q.u.side === 'foe' ? q.u.mid + 2 : 7.5);
    q.e.style.left = p[0] + q.dx + 'px';
    q.e.style.top = p[1] + 'px';
  }
  // an effect on a unit (or, with `to`, from one unit to the others)
  // a drawn effect (engine/sheetfx.js) on a unit, if it loaded: each part a card at its own place round the unit
  const drawn = [],
    floor = [];
  function playSheet(name, u) {
    const s = g.sheets[name];
    if (!s) return false;
    const r = u.side === 'foe' ? u.rad + 0.4 : 1.6;
    for (const p of s.parts) drawn.push({ s, sh: s.sheets[p.sheet], u, r, t0: g.t + p.t, at: p.at, flip: p.flip, lift: p.lift === 'mid' ? (u.side === 'foe' ? u.mid : 3.2) : 0 });
    for (const q of s.rings) floor.push({ u, r, t0: g.t + q.t, dur: q.dur, r0: q.r[0], r1: q.r[1], c0: fx.color(q.color), c1: fx.color(q.to || q.color) });
    if (B.act) {
      for (const k of s.hits) if (k.shake) B.act.steps.push({ at: B.act.t + k.t, fn: () => (B.shake = Math.max(B.shake || 0, k.shake * 0.15)) });
      B.act.steps.sort((a, b) => a.at - b.at);
    }
    return true;
  }
  function play(name, u, o) {
    fx.play(name, Object.assign({ at: feet(u), h: tall(u), r: u.side === 'foe' ? u.rad : 1.4, right: right() }, o));
  }

  // quiet: the action's own effect already shows the blow
  // a hero's pose: one of the sprite pack's battle animations (attack, cast, hurt) played once over dur seconds, or held on
  // its last frame until the action ends
  const pose = (u, name, dur, hold) => u.side === 'hero' && (u.pose = { name, t0: g.t, dur, hold: !!hold });

  function hit(tg, v, col, quiet) {
    tg.hp = Math.max(0, tg.hp - v);
    tg.fl = 1;
    tg.flc = col || [1, 1, 1];
    pop(tg, String(v), '');
    if (!quiet) play('hit', tg, { color: col || [1, 1, 1] });
    if (tg.side === 'foe') {
      tg.clip = tg.hp > 0 ? 'hurt' : 'defeat';
      tg.ct = 0;
      tg.jit = 1;
    } else {
      tg.kb = 1;
      if (tg.hp <= 0) {
        tg.ko = true;
        tg.guard = false;
      } else pose(tg, 'hurt', 0.45);
    }
    renderParty();
  }
  function heal(tg, v) {
    const b = tg.hp;
    tg.hp = Math.min(tg.mhp, tg.hp + v);
    pop(tg, '+' + (tg.hp - b), 'heal');
    renderParty();
  }

  // ---- actions
  // who: { user, targets, cast } for the camera and the casting glow
  function run(moves, steps, dur, text, who) {
    B.phase = 'act';
    B.menu = null;
    $('bcmd').innerHTML = '';
    const w = who || {},
      first = steps.length ? Math.min(...steps.map(s => s.at)) : 0;
    B.act = { t: 0, i: 0, moves, steps: steps.sort((a, b) => a.at - b.at), dur, user: w.user || null, targets: w.targets || [], cast: w.cast || null, castEnd: w.cast ? first : 0 };
    if (w.cast) {
      const u = w.user,
        c = w.cast;
      play('cast', u, { color: c, dur: first });
      fx.dimTo(0.55);
      u.glow = c;
      pose(u, 'cast', Math.max(0.35, first * 0.7), true);
      steps.push({ at: first, fn: () => (u.glow = null) }, { at: Math.max(first, dur - 0.3), fn: () => fx.dimTo(0) });
      B.act.steps.sort((a, b) => a.at - b.at);
    }
    timed.reset();
    bmsg(text + (steps.some(s => s.cue) && hints++ < 3 ? ' Tap as the ring closes!' : ''));
    renderParty();
  }
  const strike = (u, tx, tz) => [
    { u, a: [u.hx, u.hz], b: [tx, tz], t0: 0, t1: 0.32 },
    { u, a: [tx, tz], b: [tx + D(-0.9, 0)[0], tz + D(-0.9, 0)[1]], t0: 0.32, t1: 0.52, hop: 1.3 },
    { u, a: [tx + D(-0.9, 0)[0], tz + D(-0.9, 0)[1]], b: [u.hx, u.hz], t0: 0.62, t1: 0.96 }
  ];
  const stepIn = (u, d) => {
    const q = D(-d, 0),
      to = [u.hx + q[0], u.hz + q[1]];
    return [
      { u, a: [u.hx, u.hz], b: to, t0: 0, t1: 0.22 },
      { u, a: to, b: to, t0: 0.22, t1: 0.5, hop: 0.9 },
      { u, a: to, b: [u.hx, u.hz], t0: 0.6, t1: 0.85 }
    ];
  };
  function movesOf(spec, u, tg) {
    if (!spec) return [];
    if (spec[0] === 'strike') return strike(u, ...W(spec[1], spec[2]));
    if (spec[0] === 'step') return stepIn(u, spec[1]);
    if (spec[0] === 'lunge') {
      const q = D(spec[1], spec[2]),
        tx = tg.x + q[0],
        tz = tg.z + q[1];
      return [
        { u, a: [u.hx, u.hz], b: [tx, tz], t0: 0.02, t1: 0.27 },
        { u, a: [tx, tz], b: [u.hx, u.hz], t0: 0.6, t1: 1.02 }
      ];
    }
    throw new Error('Unknown move: ' + spec[0]);
  }

  // play an action from the data: user u, chosen target tg (if the action has one)
  function perform(u, act, tg) {
    const t = act.target,
      targets = () => (t === 'foes' ? living('foe') : t === 'heroes' ? living('hero') : t === 'self' ? [u] : [tg]),
      steps = (act.hits || []).map(h => ({
        at: h.at,
        cue: h.power ? targets : null,
        fn() {
          const list = targets().filter(x => x.hp > 0),
            grade = h.power ? timed.grade(g.t) : 0;
          if (h.shake) B.shake = h.shake;
          if (h.screen) fx.flash(h.color || '#fff', h.screen);
          if (h.fx && ONCE[h.fx]) play(h.fx, u, { color: h.color, from: feet(u), fh: tall(u) * 0.6, targets: list.map(feet), h: 6.4 });
          if (h.wall) {
            B.wall = h.wall;
            for (const a of living('hero')) {
              pop(a, 'Wall', 'txt');
              play('ward', a, { color: h.color || '#9cc8ff' });
            }
          }
          for (const x of list) {
            const drew = h.sheet && playSheet(h.sheet, x);
            if (!drew && h.fx && !ONCE[h.fx]) play(h.fx, x, { color: h.color, from: [u.x, GY + (u.side === 'foe' ? u.mid : 4), u.z] });
            if (h.power) blow(u, x, h.power, !!h.magic, h.flash, !!h.fx, grade);
            if (h.heal) heal(x, h.heal);
          }
        }
      }));
    if (act.move && act.move[0] === 'strike') steps.push({ at: 0.28, fn: () => pose(u, 'attack', 0.45) });
    run(movesOf(act.move, u, tg), steps, act.dur, fmt(act.text, u, tg), { user: u, targets: targets(), cast: act.cast });
  }

  function doAttack(u, f) {
    const q = D(f.rad + 1.8, 0.4);
    run(strike(u, f.x + q[0], f.z + q[1]), [{ at: 0.28, fn: () => pose(u, 'attack', 0.45) }, { at: 0.42, cue: () => [f], fn: () => (play('slash', f), blow(u, f, 1, false, null, true, timed.grade(g.t))) }], 1.15, u.name + ' attacks the ' + f.name + '.', { user: u, targets: [f] });
  }
  function doGuard(u) {
    u.guard = true;
    u.mp = Math.min(u.mmp, u.mp + 2);
    run([], [{ at: 0.05, fn: () => (pop(u, 'Guard', 'txt'), play('ward', u, { color: '#cfd8ff' })) }], 0.6, u.name + ' braces. (+2 MP)', { user: u, targets: [u] });
  }
  function doItem(u, tg) {
    g.items.tonic = Math.max(0, (g.items.tonic || 0) - 1);
    run(stepIn(u, 1.2), [{ at: 0.05, fn: () => pose(u, 'cast', 0.4) }, { at: 0.25, fn: () => play('heal', tg, { color: '#8ff58a' }) }, { at: 0.45, fn: () => heal(tg, items().tonic.heal) }], 1.3, u.name + ' uses a Tonic on ' + (tg === u ? 'themself' : tg.name) + '.', { user: u, targets: [tg] });
  }
  function doSkill(u, sk, tg) {
    u.mp -= sk.mp;
    perform(u, sk, tg);
  }
  function foeAct(f) {
    const hs = living('hero'),
      h = hs[Math.floor(Math.random() * hs.length)];
    f.n++;
    f.clip = 'attack';
    f.ct = 0;
    let use = null;
    for (const r of f.ai) {
      if (r.every && f.n % r.every !== 0) continue;
      if (r.minTargets && hs.length < r.minTargets) continue;
      if (r.chance !== undefined && Math.random() >= r.chance) continue;
      use = r.use;
      break;
    }
    perform(f, g.content.foeActions[use], h);
  }

  function afterAct() {
    if (!living('foe').length) Object.assign(B, { phase: 'ending', timer: 1.9, end: 'won', cur: null }), bmsg('Victory!');
    else if (!living('hero').length) Object.assign(B, { phase: 'ending', timer: 1.3, end: 'lost', cur: null }), bmsg('The party is overwhelmed...');
    else return nextTurn();
    renderParty();
  }

  function choose(tg) {
    const u = B.cur,
      p = B.pend;
    if (!p || B.phase !== 'command' || !tg || tg.hp <= 0) return;
    if (p.type === 'attack') doAttack(u, tg);
    else if (p.type === 'item') doItem(u, tg);
    else doSkill(u, p.sk, tg);
  }

  // a tap on the picture picks a target while one is being asked for
  function tap(nx, ny) {
    if (B.phase !== 'command' || (B.menu !== 'foe' && B.menu !== 'ally')) return;
    const want = B.menu === 'foe' ? 'foe' : 'hero',
      k = g.look.px;
    let best = null,
      bd = 1e9;
    for (const u of B.units) {
      if (u.side !== want || u.hp <= 0) continue;
      const p = g.look.project(u.x, GY + (u.side === 'foe' ? u.mid : 3.5), u.z),
        d = Math.hypot(nx - p[0], ny - p[1]);
      if (d < (u.side === 'foe' ? (30 * SP.ppu) / 5 : SP.tall * 0.7) * k && d < bd) {
        bd = d;
        best = u;
      }
    }
    if (best) choose(best);
  }

  $('bcmd').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || b.disabled || g.mode !== 'battle') return;
    const u = B.cur;
    if (B.phase === 'end') return finish(B.end === 'won');
    if (B.phase !== 'command') return;
    const c = b.dataset.c,
      s = b.dataset.s,
      ti = b.dataset.t;
    if (c === 'back') {
      B.pend = null;
      menu('root');
      bmsg(u.name + ': choose an action.');
    } else if (c === 'attack') {
      B.pend = { type: 'attack' };
      menu('foe');
      bmsg('Attack which one? (You can tap it.)');
    } else if (c === 'skill') menu('skill');
    else if (c === 'item') {
      B.pend = { type: 'item' };
      menu('ally');
      bmsg('Use a Tonic on whom? Restores ' + items().tonic.heal + ' HP.');
    } else if (c === 'guard') doGuard(u);
    else if (s) {
      const sk = u.skills.find(k => k.id === s);
      B.pend = { type: 'skill', sk };
      if (sk.target === 'foe') {
        menu('foe');
        bmsg(sk.ask || sk.name + ': which one?');
      } else if (sk.target === 'ally') {
        menu('ally');
        bmsg(sk.ask || sk.name + ': who?');
      } else doSkill(u, sk, null);
    } else if (ti !== undefined) choose(B.units[+ti]);
  });

  // ---- the camera: where it should be for what is happening now
  function shoot() {
    const H = centre(side('hero')),
      F = centre(side('foe')),
      at = (p, k) => [p[0], GY + (k || 3.6), p[1]],
      between = k => at([H[0] + (F[0] - H[0]) * k, H[1] + (F[1] - H[1]) * k]),
      set = (f, yaw, zoom, rate) => Object.assign(aim, { f, yaw: yaw0 + yaw, zoom: zoom * ZOOM, tilt: TILT, persp: PERSP, strip: 0, rate: rate || 4 }),
      a = B.act;
    // (leaving a battle fought in place: back to the view the field had)
    if (B.phase === 'leave') return Object.assign(aim, { f: B.leave.f, yaw: turnTo(back.yaw, cam.yaw), zoom: 1, tilt: back.tilt, persp: back.persp, strip: back.strip, rate: 7 });
    if (B.phase === 'intro') return set(between(0.62), 0, 1, 2.4);
    if (B.phase === 'command') {
      if (B.menu === 'foe') return set(between(0.75), -0.12, 1.08);
      if (B.menu === 'ally') return set(between(0.35), 0.12, 1.0);
      return set(between(0.62), 0.05 * Math.sin(g.t * 0.35), 1);
    }
    if (a && a.user) {
      const u = a.user,
        tg = a.targets.length ? a.targets : [u],
        T = centre(tg),
        toFoes = tg[0].side === 'foe';
      // a caster first, close up; then what the power falls on
      if (a.cast && a.t < a.castEnd) return set(at([u.x, u.z], 3.2), u.side === 'hero' ? 0.16 : -0.3, 1.25, 5);
      if (u.side === 'foe' && !a.cast && a.t < 0.32) return set(at([u.x, u.z], u.mid), -0.28, 1.15, 5);
      if (tg.length === 1 && tg[0] === u) return set(at([u.x, u.z], 3.2), 0.2, 1.2);
      return set(at([u.x + (T[0] - u.x) * 0.8, u.z + (T[1] - u.z) * 0.8]), toFoes ? -0.22 : 0.24, tg.length > 1 ? 1.0 : 1.18);
    }
    if (B.phase === 'ending' || B.phase === 'end') {
      if (B.end === 'won') return set(at(H, 3.2), 0.12 * Math.sin(g.t * 0.4), 1.15, 1.5);
      return set(between(0.4), 0, 0.85, 1.5);
    }
    return set(between(0.62), 0, 1);
  }

  function update(dt) {
    shoot();
    const k = 1 - Math.exp(-dt * aim.rate);
    for (let i = 0; i < 3; i++) cam.f[i] += (aim.f[i] - cam.f[i]) * k;
    cam.yaw += (aim.yaw - cam.yaw) * k;
    cam.zoom += (aim.zoom - cam.zoom) * k;
    cam.tilt += (aim.tilt - cam.tilt) * k;
    cam.persp += (aim.persp - cam.persp) * k;
    cam.strip += (aim.strip - cam.strip) * k;
    g.cam.focus = cam.f;
    g.cam.yaw = g.cam.yawT = cam.yaw;
    fx.update(dt);
    for (const u of B.units) {
      u.fl = Math.max(0, u.fl - dt * 3.2);
      if (u.side === 'foe') {
        u.ct += dt;
        u.jit = Math.max(0, u.jit - dt * 3.5);
        if (u.hp <= 0) {
          // beaten: it flickers, flares and comes apart
          if (u.ct < 0.75 && !u.boom) {
            u.fl = Math.sin(u.ct * 38) > 0 ? 0.9 : 0.2;
            u.flc = [1, 0.55, 0.45];
          } else if (!u.boom) {
            u.boom = true;
            play('defeat', u);
            fx.flash('#fff', 0.2);
          }
          if (u.ct > 0.8) u.dis = Math.min(1, u.dis + dt * 1.1);
          if (u.dis >= 1) u.gone = true;
        } else if (u.clip !== 'idle' && u.ct >= g.rigs[u.rig].clips[u.clip].dur) {
          u.clip = 'idle';
          u.ct = 0;
        }
      } else u.kb = Math.max(0, u.kb - dt * 5);
    }
    B.shake = Math.max(0, B.shake - dt * 2.6);
    if (here) g.field.bystand(dt);
    if (B.enter || B.leave) {
      // a battle in place: to their places as it opens; behind the leader again as it closes, and then the field
      const m = B.enter || B.leave;
      m.t += dt;
      const k = Math.min(1, m.t / m.dur),
        e = k * k * (3 - 2 * k);
      for (const u of B.units) {
        if (B.leave && (u.side !== 'hero' || u.ko)) continue;
        const to = B.leave ? [m.x, m.z] : [u.hx, u.hz],
          px = u.x,
          pz = u.z;
        u.x = u.sx + (to[0] - u.sx) * e;
        u.z = u.sz + (to[1] - u.sz) * e;
        if (u.side === 'hero') {
          u.dist += Math.hypot(u.x - px, u.z - pz);
          u.run = k < 1 && Math.hypot(to[0] - u.sx, to[1] - u.sz) > 0.5;
          u.going = u.run ? [to[0] - u.sx, to[1] - u.sz] : null;
        }
      }
      if (B.enter && k >= 1) B.enter = null;
      else if (B.leave && m.t >= m.dur + 0.35) return endHere(true, m.x, m.z)();
    }
    if (B.phase === 'intro') {
      B.timer -= dt;
      if (B.timer <= 0) {
        newRound();
        B.oi = -1;
        nextTurn();
      }
    } else if (B.act) {
      const a = B.act;
      a.t += dt;
      for (const m of a.moves) {
        if (a.t < m.t0) continue;
        const k = Math.min(1, (a.t - m.t0) / (m.t1 - m.t0)),
          e = k * k * (3 - 2 * k),
          px = m.u.x,
          pz = m.u.z;
        m.u.x = m.a[0] + (m.b[0] - m.a[0]) * e;
        m.u.z = m.a[1] + (m.b[1] - m.a[1]) * e;
        if (m.u.side === 'hero') {
          m.u.dist += Math.hypot(m.u.x - px, m.u.z - pz);
          m.u.run = k < 1 && !m.hop;
          m.u.hop = m.hop ? Math.sin(Math.PI * k) * m.hop : 0;
        }
      }
      while (a.i < a.steps.length && a.steps[a.i].at <= a.t) a.steps[a.i++].fn();
      if (a.t >= a.dur) {
        B.act = null;
        for (const u of B.units) {
          if (u.hp > 0 || u.side === 'hero') {
            u.x = u.hx;
            u.z = u.hz;
          }
          if (u.side === 'hero') {
            u.run = false;
            u.hop = 0;
            u.glow = null;
            if (u.pose && u.pose.hold) u.pose = null;
          }
        }
        afterAct();
      }
    } else if (B.phase === 'ending') {
      B.timer -= dt;
      if (B.timer <= 0) {
        B.phase = 'end';
        bmsg(B.end === 'won' ? def.wonMsg : def.lostMsg);
        $('bcmd').className = 'gs list';
        $('bcmd').innerHTML = row('data-c="go"', 'Continue');
      }
    }
    g.cam.shake = B.shake;
  }

  // bars, names, numbers and the turn arrow follow their owners (bars and names only while choosing, as in Golden Sun).
  // Called once the frame is drawn, so they use the camera the picture was drawn with.
  function overlay() {
    // (a foe's name and bar stay clear of the status windows above the picture)
    const st = $('bparty'),
      under = st.offsetHeight ? st.offsetTop + st.offsetHeight + 30 : 0,
      from = st.offsetLeft - 40;
    for (const q of pops) place(q);
    for (const f of B.units)
      if (f.side === 'foe') {
        const on = f.hp > 0 && B.phase === 'command';
        f.el.style.display = f.nm.style.display = on ? 'block' : 'none';
        if (on) {
          const p = ui.toStage(g.look.project(f.x, GY + f.top, f.z));
          if (p[0] > from && p[1] < under) p[1] = under;
          f.el.style.left = f.nm.style.left = p[0] + 'px';
          f.el.style.top = f.nm.style.top = p[1] + 'px';
          f.el.firstChild.style.width = Math.round((100 * f.hp) / f.mhp) + '%';
        }
      }
    const c = B.cur;
    if (c && c.hp > 0 && (B.phase === 'command' || (B.phase === 'act' && c.side === 'foe'))) {
      const p = ui.toStage(g.look.project(c.x, GY + (c.side === 'foe' ? c.top + 3.4 : 8.6), c.z));
      B.curEl.style.display = 'block';
      B.curEl.style.left = p[0] + 'px';
      B.curEl.style.top = p[1] + 'px';
    } else B.curEl.style.display = 'none';
  }

  // what to draw this frame
  function build(fr) {
    const t = g.t,
      ax = g.look.axes(cam.yaw),
      F = centre(side('foe')),
      H = centre(side('hero')),
      away = [H[0] - F[0], H[1] - F[1]],
      al = Math.hypot(away[0], away[1]) || 1,
      out = fx.emit();
    Object.assign(fr.cam, { focus: cam.f, yaw: cam.yaw, still: false, tilt: cam.tilt, zoom: cam.zoom, persp: cam.persp, strip: cam.strip });
    fr.fx = out.fx;
    fr.dim = out.dim;
    fr.flash = out.flash;
    // drawn effects: the cards far to near (they do not hide one another by depth), and their rings on the ground
    for (let i = drawn.length - 1; i >= 0; i--) {
      const e = drawn[i];
      if (t < e.t0) continue;
      const q = sheetFrame(e.sh, Math.floor((t - e.t0) * e.sh.fps));
      if (!q) {
        drawn.splice(i, 1);
        continue;
      }
      const a = e.at[0] * e.r,
        b = -e.at[1] * e.r;
      fr.sheets.push({ tex: e.s.tex, colour: q.colour, light: q.light, gain: e.s.gain, flip: e.flip, near: e.at[1] * e.r + e.u.x * -ax.fwd[0] + e.u.z * -ax.fwd[1], x: e.u.x + ax.right[0] * a + ax.fwd[0] * b, y: GY + e.lift, z: e.u.z + ax.right[1] * a + ax.fwd[1] * b, offY: e.sh.pivot[1] - e.sh.cell[1] });
    }
    fr.sheets.sort((p, q) => p.near - q.near);
    // a timed hit's cue: a ring closing on whoever the blow is for, shut as it lands
    if (B.act)
      for (let i = B.act.i; i < B.act.steps.length; i++) {
        const s = B.act.steps[i],
          left = s.at - B.act.t;
        if (!s.cue || left > TIMED.cue) continue;
        const k = Math.max(0, left / TIMED.cue),
          sharp = left <= TIMED.sharp;
        for (const u of s.cue()) if (u.hp > 0) fr.fxRings.push({ x: u.x, y: GY + 0.3, z: u.z, r: (u.side === 'foe' ? u.rad + 0.6 : 2) * (1 + 1.5 * k), col: sharp ? [1, 1, 1] : left <= TIMED.early ? [1, 0.92, 0.45] : [0.75, 0.7, 0.5] });
      }
    for (let i = floor.length - 1; i >= 0; i--) {
      const e = floor[i],
        k = (t - e.t0) / e.dur;
      if (k < 0) continue;
      if (k >= 1) {
        floor.splice(i, 1);
        continue;
      }
      const o = 1 - (1 - k) * (1 - k);
      fr.fxRings.push({ x: e.u.x, y: GY + 0.3, z: e.u.z, r: (e.r0 + (e.r1 - e.r0) * o) * e.r, col: [0, 1, 2].map(j => e.c0[j] + (e.c1[j] - e.c0[j]) * k) });
    }
    for (const f of B.units) {
      if (f.side !== 'foe' || f.gone) continue;
      // (a foe that is hit shudders across the picture)
      const j = Math.sin(t * 75) * 0.5 * f.jit;
      // (the foes are baked facing the party of an arena, at +x: in place they turn with the layout)
      fr.models.push({ rig: g.rigs[f.rig], clip: f.clip, time: f.ct, x: f.x + ax.right[0] * j, y: GY, z: f.z + ax.right[1] * j, dis: f.dis, flash: f.fl * 0.7, flashC: f.flc, yaw: here ? -here.th : 0 });
    }
    for (const u of B.units) {
      if (u.side === 'hero') fr.blobs.push({ x: u.x, y: GY + 0.25, z: u.z, r: u.ko ? 1.9 : 1.3 });
      else if (u.dis < 0.5) fr.blobs.push({ x: u.x + (u.shadowDx || 0), y: GY + 0.25, z: u.z, r: u.rad });
    }
    if (B.wall > 0) for (const u of living('hero')) fr.rings.push({ x: u.x, y: GY + 0.3, z: u.z, r: 2.1 + 0.12 * Math.sin(t * 5), col: [0.62, 0.8, 1] });
    if (B.phase === 'command' && (B.menu === 'foe' || B.menu === 'ally'))
      for (const u of living(B.menu === 'foe' ? 'foe' : 'hero')) fr.rings.push({ x: u.x, y: GY + 0.3, z: u.z, r: (u.side === 'foe' ? u.rad + 0.6 : 1.9) + 0.2 * Math.sin(t * 9), col: [1, 0.95, 0.6] });
    const a = B.act;
    for (const u of B.units) {
      if (u.side !== 'hero') continue;
      // (a hero may have a colour of their own: an echo is paler than the living)
      const own = u.tint || [1, 1, 1],
        base = (u.guard ? [0.78, 0.9, 1.25] : [0.9, 0.92, 1.02]).map((v, i) => v * own[i]),
        k = u.fl,
        tint = [base[0] + (2.4 * u.flc[0] - base[0]) * k, base[1] + (2.4 * u.flc[1] - base[1]) * k, base[2] + (2.4 * u.flc[2] - base[2]) * k];
      if (u.glow) {
        // gathering power: the caster shimmers in the colour of what they call
        const c = fx.color(u.glow),
          p = 0.45 + 0.35 * Math.sin(t * 18);
        for (let i = 0; i < 3; i++) tint[i] += c[i] * p;
      }
      const k3 = g.content.heroes[u.id] && g.content.heroes[u.id].model;
      if (u.ko && k3 && g.rigs[k3.rest]) {
        fr.models.push({ rig: g.rigs[k3.rest], clip: 'defeat', time: 9, x: u.x, y: GY, z: u.z, dis: 0, flash: 0, flashC: u.flc, yaw: Math.atan2(F[0] - u.x, F[1] - u.z) });
        continue;
      }
      if (u.ko) {
        fr.sprites.push({ rect: SP.ko(u.ci), flip: 0, x: u.x, y: GY, z: u.z, tint: [0.7, 0.72, 0.86], offY: SP.koOffY(u.ci), bias: 0.66, size: SP.size(u.ci) });
        continue;
      }
      // seen from behind, facing whatever they are acting on (or the foes, and the foes while gathering power); a pose
      // plays if there is one, else they walk, or at rest breathe (the sprite pack's idle, or a little bob without one)
      const casting = a && a.user === u && a.cast && a.t < a.castEnd,
        tg = a && a.user === u && !casting && a.targets[0] && a.targets[0] !== u ? a.targets[0] : null,
        to = u.going ? u.going : tg ? [tg.x - u.x, tg.z - u.z] : [F[0] - u.x, F[1] - u.z],
        row = facing(to[0], to[1], ax),
        p = u.pose && (u.pose.hold || t - u.pose.t0 < u.pose.dur) ? u.pose : null,
        n = p ? SP.animLength(u.ci, p.name) : 0,
        idle = !u.run && !u.hop && !(a && a.user === u),
        kb = u.kb * 0.9;
      let an = p && !u.run && n ? SP.anim(u.ci, p.name, row, Math.floor(Math.min((t - p.t0) / p.dur, 0.999) * n)) : null,
        bob = 0;
      if (!an && idle && !p) {
        const m = SP.animLength(u.ci, 'idle');
        an = m ? SP.anim(u.ci, 'idle', row, Math.floor(t * 7 + u.i * 3) % m) : null;
        if (!an) bob = Math.sin(t * 3.3 + u.i * 1.9) > 0.2 ? 1 : 0;
      }
      // a hero with a model (heroes.json "model": { rest, move }) is drawn as that model, as the foes are, not as a sprite:
      // "rest" holds its idle and attack, "move" its run (as that rig's idle) and its cast (as that rig's attack)
      const h3 = g.content.heroes[u.id] && g.content.heroes[u.id].model;
      if (h3 && g.rigs[h3.rest] && g.rigs[h3.move]) {
        let rig = g.rigs[h3.rest],
          clip = 'idle',
          time = t + u.i * 0.7;
        const part = c => Math.min((t - p.t0) / p.dur, 0.999) * rig.clips[c].dur;
        if (p && p.name === 'attack') ((clip = 'attack'), (time = part('attack')));
        else if (p && p.name === 'cast') ((rig = g.rigs[h3.move]), (clip = 'attack'), (time = part('attack')));
        else if (p && p.name === 'hurt') ((clip = 'hurt'), (time = part('hurt')));
        else if (u.run) rig = g.rigs[h3.move];
        fr.models.push({ rig, clip, time, x: u.x + (away[0] / al) * kb, y: GY + (u.hop || 0), z: u.z + (away[1] / al) * kb, dis: 0, flash: u.fl * 0.7, flashC: u.flc, yaw: Math.atan2(to[0], to[1]) });
        continue;
      }
      fr.sprites.push({ rect: an ? an.rect : SP.frame(u.ci, row, u.run, u.dist), flip: 0, x: u.x + (away[0] / al) * kb, y: GY + (u.hop || 0), z: u.z + (away[1] / al) * kb, tint, offY: (an ? an.offY : SP.offY) + bob, bias: 0.66, size: SP.size(u.ci) });
      // (a hero with a "halo" wears a thin ring of light over their head)
      if (u.halo) fr.rings.push({ x: u.x + (away[0] / al) * kb, y: GY + (u.hop || 0) + HALO, z: u.z + (away[1] / al) * kb, r: 0.95, col: [1, 0.9, 0.56] });
    }
  }

  return { B, start, startHere, update, build, overlay, tap, press };
}
