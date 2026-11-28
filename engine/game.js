// The engine's front door. start(content) takes a game (its data and its sprite sheet) and runs it: it loads areas through
// whichever look each one asks for, switches between walking and fighting, runs scripts, saves, and drives the frame loop.
//
// content: { game, areas, scenes, heroes, skills, monsters, foeActions, battles }  (see game/ for a worked example); the cast's
// sprites are a pack the game names (game.sprites, baked by tools/bake-sprites.mjs)
import { createUI } from './ui.js';
import { texture } from './gl.js';
import { GenLook } from './look-gen.js';
import { InkLook } from './look-ink.js';
import { createField } from './field.js';
import { createBattle } from './battle.js';
import { loadSheetFx } from './sheetfx.js';
import { loadMeshes } from './meshes.js';
import { createMenu } from './menu.js';
import { runScript, test } from './script.js';
import { partyNow, heroNow } from './party.js';
import { SaveStore } from './save.js';
import { decodeMonster } from './monsters.js';
import { loadSprites } from './sprites.js';
import { stickAt, push } from './stick.js';

const ZERO = new Float32Array(9);

export async function start(content) {
  const ui = createUI(document),
    $ = ui.$,
    cv = ui.el.cv,
    stage = ui.el.stage,
    gl = cv.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) return ui.fail('This needs WebGL 2, which this browser or device does not offer.');
  let SP;
  try {
    SP = await loadSprites(content.game.sprites);
  } catch (e) {
    return ui.fail('Could not load the sprites: ' + e.message);
  }
  const atlas = texture(gl, SP.w, SP.h, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, SP.data);
  // drawn effects: whichever sheets the skills and foe actions name (game.effects is their folder)
  const wanted = new Set();
  for (const acts of [content.skills, content.foeActions]) for (const id in acts || {}) for (const h of acts[id].hits || []) if (h.sheet) wanted.add(h.sheet);
  const sheets = content.game.effects && wanted.size ? await loadSheetFx(content.game.effects, [...wanted]) : {};
  // textured meshes (a trial): whichever the areas stand about (game.meshes is their folder)
  const meshNames = new Set();
  for (const id in content.areas) for (const m of content.areas[id].meshes || []) meshNames.add(m.mesh);
  const meshes = content.game.meshes && meshNames.size ? await loadMeshes(gl, content.game.meshes, [...meshNames]) : {};
  for (const n in sheets) sheets[n].tex = texture(gl, sheets[n].w, sheets[n].h, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, sheets[n].data);
  for (const id in content.areas) content.areas[id].id = id;

  // g: the running game, shared by the field, the battle and the looks
  const g = {
    content,
    ui,
    SP,
    sheets,
    meshes,
    flags: {},
    items: {},
    t: 0,
    mode: 'boot', // 'field' | 'battle'
    busy: false, // a script is running
    cam: { focus: [0, 5, 0], yaw: 0, yawT: 0, shake: 0 },
    area: null, // the area being walked
    shown: null, // the area on screen (the arena, during a battle)
    look: null,
    rigs: {},
    anim: new Float32Array(9),
    leader: SP.names.indexOf(content.game.leader)
  };
  const looks = {},
    areas = {},
    animNow = {};
  let depth = 0,
    unsaved = false,
    live = false,
    pixel = true,
    sinceSave = 0,
    monsters = null;

  const lookFor = kind => {
    if (!looks[kind]) {
      try {
        looks[kind] = kind === 'ink' ? new InkLook(gl, cv, stage, atlas, { ppu: SP.ppu }) : new GenLook(gl, cv, stage, atlas, { scenes: content.scenes, ppu: SP.ppu });
      } catch (e) {
        throw new Error('the graphics shaders failed to start on this device (' + e.message + ')');
      }
    }
    return looks[kind];
  };

  // An area, loaded once: { id, def, look, scene, nav, poi, ledges, scale, yaw0 }
  g.loadArea = (id, onProgress) => {
    if (!areas[id]) {
      const def = content.areas[id];
      if (!def) return Promise.reject(new Error('there is no area called "' + id + '"'));
      areas[id] = (async () => {
        const look = lookFor(def.look),
          scene = await look.load(def, onProgress);
        return { id, def, look, scene, nav: scene.nav, poi: scene.poi, ledges: scene.ledges || [], scale: look.kind === 'ink' ? scene.scale : 1, yaw0: scene.yaw0 };
      })();
      areas[id].catch(() => delete areas[id]);
    }
    return areas[id];
  };

  g.loadMonsters = () => {
    if (!monsters) {
      monsters = (async () => {
        const r = await fetch(content.game.monsterPack);
        if (!r.ok) throw new Error(content.game.monsterPack + ': ' + r.status);
        const data = await r.json(),
          look = lookFor('gen');
        for (const k in data) g.rigs[k] = look.rig(decodeMonster(data[k]));
      })();
      monsters.catch(() => (monsters = null));
    }
    return monsters;
  };

  // put an area on screen
  g.show = rt => {
    g.shown = rt;
    g.look = rt.look;
    rt.look.use(rt.scene);
    rt.look.setPixel(pixel);
    $('px').disabled = !rt.look.canSmooth;
    cv.classList.toggle('smooth', rt.look.canSmooth && !pixel);
  };

  g.tintAt = (x, z) => {
    const rt = g.area;
    if (rt.def.tint) return rt.def.tint;
    const s = rt.nav.shade(x, z),
      k = 0.6 + 0.4 * s;
    return [k * 1.02, k, (0.68 + 0.32 * s) * 0.98];
  };

  function refreshHint() {
    const list = (g.area && g.area.def.hints) || [],
      h = list.find(x => test(x[0], g.host)),
      // (side-on along walking lines, the opening hint says how those are walked)
      side = g.area && g.area.def.side;
    ui.hint(h ? (h[0] === null && side && side.hint && g.field && g.field.laned ? side.hint : h[1]) : '');
  }

  // ---- saving
  const storage = (() => {
    try {
      return window.localStorage;
    } catch (e) {
      return null;
    }
  })();
  const store = new SaveStore(storage, content.game.saveKey, Object.keys(content.areas));
  function save(announce) {
    // (not from up a climb: a save is taken up again on the ground, in whatever view)
    if (g.mode !== 'field' || !g.area || g.busy || g.field.aloft) return false;
    const h = g.field.hero,
      ok = store.save({ area: g.area.id, x: h.x, z: h.z, yaw: g.cam.yawT, flags: g.flags, items: g.items });
    unsaved = false;
    sinceSave = 0;
    if (announce) ui.toast(ok ? 'Saved' : 'This browser would not keep a save');
    return ok;
  }

  // ---- scripts
  // who is in the party now, and a hero as they are now: both read off the flags (engine/party.js)
  g.party = () => partyNow(content.game, g.host);
  g.hero = id => heroNow(content.heroes, id, g.host);
  g.host = {
    flag: n => !!g.flags[n],
    set(n, v) {
      if (!!g.flags[n] === !!v) return;
      if (v) g.flags[n] = true;
      else delete g.flags[n];
      unsaved = true;
      refreshHint();
    },
    has: i => g.items[i] || 0,
    give(i, n) {
      g.items[i] = Math.max(0, (g.items[i] || 0) + n);
      unsaved = true;
    },
    say: (lines, cb) => ui.say(lines, cb),
    choose: (q, answers, cb) => ui.ask(q, answers, cb),
    battle: (id, cb) => g.battle.start(id, cb),
    go: (id, at, cb) => travel(id, at, cb),
    // a memory: faded in at a spawn of this area, or (false) out again to where the leader stood
    memory: (at, cb) =>
      ui.fade(
        () => {
          g.memory.on = !!at;
          g.memory.k = at ? 1 : 0;
          g.field.remember(at || null);
        },
        cb
      ),
    move: (id, to, o, cb) => g.field.moveActor(id, to, o, cb),
    wait: (s, cb) => {
      waits.push({ t: s, cb });
    }
  };
  // (a memory is not kept in a save: it is only ever the middle of a script)
  g.memory = { on: false, k: 0 };
  const waits = [];

  // run a script; scripts can nest (a battle's closing script runs inside the one that started the battle)
  g.run = (script, done) => {
    depth++;
    g.busy = true;
    runScript(script, g.host, () => {
      depth--;
      g.busy = depth > 0;
      if (!g.busy) {
        refreshHint();
        if (unsaved) save(true);
      }
      if (done) done();
    });
  };

  // ---- areas
  function enterArea(rt, pos, yaw) {
    g.area = rt;
    g.memory.on = false;
    g.memory.k = 0;
    g.mode = 'field';
    g.show(rt);
    g.field.enter(rt, pos);
    g.cam.yaw = g.cam.yawT = yaw === undefined ? rt.yaw0 : yaw;
    g.cam.shake = 0;
    g.anim.fill(0);
    for (const a of rt.def.anims || []) if (a.flag) animNow[a.group] = g.flags[a.flag] ? a.to : 0;
    ui.subtitle(rt.def.name);
    refreshHint();
  }

  async function travel(id, at, cb) {
    let rt;
    try {
      rt = await g.loadArea(id, m => ui.loading(m + '…'));
    } catch (e) {
      return ui.fail('Could not load ' + id + ': ' + e.message);
    }
    ui.loading(null);
    ui.fade(
      () => enterArea(rt, g.field.spawn(rt, at)),
      () => {
        unsaved = true;
        if (cb) cb();
      }
    );
  }

  // doors, lids and sails of generated areas: a turning group follows a flag, or spins
  function stepAnims(dt) {
    for (const a of (g.area && g.area.def.anims) || []) {
      if (a.spin !== undefined) g.anim[a.group] = g.t * a.spin;
      else {
        const to = g.flags[a.flag] ? a.to : 0;
        animNow[a.group] += (to - animNow[a.group]) * (1 - Math.exp(-dt * a.rate));
        g.anim[a.group] = animNow[a.group];
      }
    }
  }

  // ---- the frame
  function step(dt) {
    g.t += dt;
    ui.type(dt);
    // (pauses a script asked for)
    for (let i = waits.length - 1; i >= 0; i--)
      if ((waits[i].t -= dt) <= 0) {
        const w = waits.splice(i, 1)[0];
        w.cb();
      }
    stepAnims(dt);
    if (g.mode === 'battle') g.battle.update(dt);
    else if (!g.menu.open) {
      g.field.update(dt);
      sinceSave += dt;
      if (sinceSave > 12 && !g.busy) save(false);
    }
  }

  function draw() {
    const bt = g.mode === 'battle',
      c = g.cam,
      // (a battle fought in place keeps the area on screen: its turning doors and sails, its people, its mesh)
      here = bt && g.battle.B.here,
      fr = { t: g.t, cam: { focus: c.focus, yaw: c.yaw, still: c.yaw === c.yawT, shake: bt ? c.shake : 0 }, anim: bt && !here ? ZERO : g.anim, models: [], blobs: [], rings: [], sprites: [], sheets: [], fxRings: [], meshes: [] };
    if (g.syncHD) g.syncHD(bt, here);
    if (here) g.field.build(fr, true);
    if (bt) g.battle.build(fr);
    else g.field.build(fr);
    g.look.draw(fr);
    if (bt) g.battle.overlay();
    g.field.overlay();
    pad(!bt && live && g.field.laned && !g.busy && !g.menu.open);
  }

  // Side-on, a controller is drawn on the picture: an analog stick on the left, which walks as hard as it is pushed and,
  // pushed well up or down, changes lane; and on the right A, which jumps where there is jumping, and B, which talks to
  // or uses whatever is nearest (the field rings it). A real controller does the same in any view (its left stick or
  // d-pad, its A and B), and answers what is asked; a keyboard has the arrows, the space bar and E.
  const thumb = { id: null, x: 0, y: 0 },
    stickEl = $('stick'),
    knob = stickEl.firstElementChild,
    REACH = 30, // how far the knob travels, in page pixels: a push of 1
    held = { a: false, b: false, up: false, down: false };
  let padOn = false;
  const letGo = () => {
    thumb.id = null;
    thumb.x = thumb.y = 0;
    knob.style.transform = '';
    stickEl.classList.remove('down');
  };
  const lean = e => {
    const r = stickEl.getBoundingClientRect(),
      s = stickAt(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2), REACH);
    thumb.x = s.x;
    thumb.y = s.y;
    knob.style.transform = 'translate(' + s.knob[0].toFixed(1) + 'px,' + s.knob[1].toFixed(1) + 'px)';
  };
  stickEl.addEventListener('pointerdown', e => {
    e.preventDefault();
    thumb.id = e.pointerId;
    try {
      stickEl.setPointerCapture(e.pointerId);
    } catch (_) {
      /* without capture the stick is let go when the thumb leaves it */
    }
    stickEl.classList.add('down');
    lean(e);
  });
  stickEl.addEventListener('pointermove', e => e.pointerId === thumb.id && lean(e));
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) stickEl.addEventListener(ev, e => e.pointerId === thumb.id && letGo());
  stickEl.addEventListener('pointerleave', e => e.pointerId === thumb.id && !stickEl.hasPointerCapture(e.pointerId) && letGo());
  stickEl.addEventListener('contextmenu', e => e.preventDefault());
  for (const [id, act] of [['pa', () => g.field.jump()], ['pb', () => g.field.act()]]) {
    const b = $(id);
    b.addEventListener('pointerdown', e => {
      e.preventDefault();
      b.classList.add('down');
      act();
    });
    for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, () => b.classList.remove('down'));
    b.addEventListener('contextmenu', e => e.preventDefault());
  }
  const pad = on => {
    if (on) $('pa').hidden = !g.field.jumps;
    if (on === padOn) return;
    padOn = g.padShown = on;
    $('pad').classList.toggle('on', on);
    if (!on) letGo();
  };
  // a controller that is plugged in, as { v: its push, a, b }, or null
  const controller = () => {
    const p = navigator.getGamepads ? Array.from(navigator.getGamepads()).find(q => q && q.connected) : null;
    if (!p) return null;
    const down = i => !!(p.buttons[i] && p.buttons[i].pressed);
    let x = p.axes[0] || 0,
      y = -(p.axes[1] || 0);
    if (down(14)) x = -1;
    if (down(15)) x = 1;
    if (down(12)) y = 1;
    if (down(13)) y = -1;
    return { v: push(x, y), a: down(0), b: down(1) || down(2) };
  };
  // each frame: what the sticks say, and a controller's buttons as they go down
  const inputs = () => {
    const c = controller(),
      v = c && Math.hypot(c.v.x, c.v.y) > Math.hypot(thumb.x, thumb.y) ? c.v : thumb;
    g.field.stick.x = v.x;
    g.field.stick.y = v.y;
    if (!c) return;
    const a = c.a && !held.a,
      b = c.b && !held.b,
      up = c.v.y > 0.6 && !held.up,
      dn = c.v.y < -0.6 && !held.down;
    Object.assign(held, { a: c.a, b: c.b, up: c.v.y > 0.6, down: c.v.y < -0.6 });
    if (ui.talking()) {
      if (ui.asking()) {
        if (up) ui.key('ArrowUp');
        if (dn) ui.key('ArrowDown');
        if (a) ui.key('Enter');
      } else if (a || b) ui.advance();
    } else if (g.mode === 'field' && !g.busy && !g.menu.open) {
      if (a) g.field.jumps ? g.field.jump() : g.field.act();
      if (b) g.field.act();
    }
  };
  // a foe of the field has reached the leader: fight its battle on the spot, if that can be done there
  g.fight = (id, at) => g.mode === 'field' && !g.busy && !g.menu.open && g.battle.startHere(id, at, null);
  g.field = createField(g);
  g.battle = createBattle(g);
  g.menu = createMenu(g, save);

  // ---- input
  const tap = (nx, ny) => {
    if (!live || g.menu.open) return;
    if (ui.talking()) return ui.advance();
    if (g.mode === 'battle') g.battle.tap(nx, ny);
    else if (!g.busy) g.field.tap(nx, ny);
  };
  const rot = d => {
    if (live && g.mode === 'field' && !g.menu.open) g.cam.yawT += (d * Math.PI) / 4;
  };
  let pd = null;
  const ndc = e => {
    const r = cv.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * 2 - 1, 1 - ((e.clientY - r.top) / r.height) * 2];
  };
  stage.addEventListener('pointerdown', e => {
    // (buttons laid over the stage keep their own clicks: capturing the pointer would take them away)
    if (e.target.closest('button, #menu, #stick')) return;
    pd = { x: e.clientX, y: e.clientY, id: e.pointerId };
    try {
      stage.setPointerCapture(e.pointerId);
    } catch (_) {
      /* some browsers refuse capture; taps still work */
    }
  });
  stage.addEventListener('pointerup', e => {
    if (!pd || pd.id !== e.pointerId) return;
    const dx = e.clientX - pd.x,
      dy = e.clientY - pd.y;
    pd = null;
    if (!live) return;
    if (ui.talking()) return ui.advance();
    // (side-on along walking lines there is no turning the view: a swipe up or down changes lane instead)
    if (g.mode === 'field' && g.field.laned) {
      if (Math.abs(dy) > 34 && Math.abs(dy) > Math.abs(dx) * 1.2 && !g.busy && !g.menu.open) return void g.field.swipe(dy < 0 ? 1 : -1);
    } else if (g.mode === 'field' && Math.abs(dx) > 34 && Math.abs(dx) > Math.abs(dy) * 1.2) return rot(dx > 0 ? 1 : -1);
    if (Math.hypot(dx, dy) < 14) {
      const p = ndc(e);
      if (Math.abs(p[0]) <= 1 && Math.abs(p[1]) <= 1) tap(p[0], p[1]);
    }
  });
  stage.addEventListener('pointercancel', () => (pd = null));
  $('rl').addEventListener('click', () => rot(-1));
  $('rr').addEventListener('click', () => rot(1));
  $('mn').addEventListener('click', () => {
    if (!live) return;
    if (g.menu.open) g.menu.hide();
    else if (!g.menu.show()) ui.toast('Not just now');
  });
  // the HD-2D trial: where the area has a mesh stand-in for its scene, a button steps through three views: the splats; the
  // mesh drawn sharp with a lens, lamps and bloom (HD-2D); and that seen low and side-on over rolling ground (Side). It only
  // holds in the field and in a battle fought in place there; a battle in an arena keeps its own look.
  let view = 0,
    yawWas = null;
  const SIDE = Math.PI / 2;
  $('hd').addEventListener('click', () => {
    // (from up a climb the other views have no way down: they walk the ground only)
    if (view === 2 && g.mode === 'field' && g.field.aloft) return ui.toast('Come down to change the view');
    view = (view + 1) % 3;
    $('hd').classList.toggle('on', view > 0);
    $('hd').setAttribute('aria-pressed', view > 0 ? 'true' : 'false');
    $('hd').textContent = view === 2 ? 'Side' : 'HD-2D';
  });
  let syncedArea = null;
  g.syncHD = (bt, here) => {
    // (an area may be one that is seen side-on and no other way: there the button is not offered and the choice it holds
    // is left alone for the areas that have one)
    const def = g.area && g.area.def,
      sd = (def && def.side) || null,
      only = !!sd && !!sd.only,
      can = (!bt || here) && !!g.look && g.look.kind === 'gen' && !!def && (def.meshes || []).some(m => m.world && g.meshes[m.mesh]),
      v = only ? 2 : view,
      want = v > 0 && can,
      side = v === 2 && can;
    if (g.area !== syncedArea) {
      // (the yaw kept for leaving the side view was the last area's)
      syncedArea = g.area;
      yawWas = null;
    }
    if ($('hd').hidden === (can && !only)) $('hd').hidden = !(can && !only);
    if (g.look && !!g.look.hd !== want) {
      g.look.hd = g.look.hideWorld = want;
      g.look.setPixel(want ? false : pixel);
      cv.classList.toggle('smooth', want || (g.look.canSmooth && !pixel));
      $('px').disabled = want || !g.look.canSmooth;
    }
    if (g.look && !!g.look.strip !== side) {
      g.look.strip = side;
      $('rl').disabled = $('rr').disabled = side;
      if (side) yawWas = g.cam.yawT;
      else if (!bt) g.cam.yaw = g.cam.yawT = yawWas !== null ? yawWas : g.area.yaw0;
      if (side && sd) ui.toast('Stick walks' + (sd.jump ? ', A jumps' : '') + ', B acts' + ((sd.columns || []).length ? ' \u2022 push up or down at an arrow to change lane' : ''));
      refreshHint();
    }
    if (g.look) {
      // (how far the ground rolls away side-on, and what lies behind it, are the area's to say: a hall is flat, under rock)
      g.look.stripRoll = side && sd && sd.roll !== undefined ? sd.roll : undefined;
      g.look.cave = side && !!sd && sd.sky === 'cave';
    }
    // the side view always looks across the square from the east
    if (side && !bt) g.cam.yaw = g.cam.yawT = SIDE;
  };
  $('px').addEventListener('click', () => {
    if (!g.look || !g.look.canSmooth) return;
    pixel = !pixel;
    $('px').classList.toggle('on', pixel);
    $('px').setAttribute('aria-pressed', pixel ? 'true' : 'false');
    cv.classList.toggle('smooth', !pixel);
    g.look.setPixel(pixel);
  });
  window.addEventListener('keydown', e => {
    if (ui.key(e.key)) return e.preventDefault(); // answering a question
    if (e.key === 'Escape' || e.key === 'm') {
      if (live && g.mode === 'field') g.menu.toggle();
      return;
    }
    if (g.menu.open) return; // (the menu's own buttons take Enter and Space)
    if (e.key === ' ' || e.key === 'Enter') {
      if (ui.talking()) {
        ui.advance();
        e.preventDefault();
      } else if (e.key === ' ' && live && g.mode === 'field' && g.field.jumps) {
        // (side-on where there is jumping, the space bar jumps)
        if (!e.repeat) g.field.jump();
        e.preventDefault();
      }
      return;
    }
    // (E is the act button: talk to or use what is nearest)
    if ((e.key === 'e' || e.key === 'E') && live && g.mode === 'field' && !g.menu.open && !e.repeat) return void g.field.act();
    if (e.key === 'q') return rot(-1);
    if (e.key === 'e') return rot(1);
    g.field.keys[e.key] = true;
    if (e.key.indexOf('Arrow') === 0) e.preventDefault();
  });
  window.addEventListener('keyup', e => (g.field.keys[e.key] = false));
  cv.addEventListener('webglcontextlost', e => {
    e.preventDefault();
    live = false;
    ui.fail('The drawing surface was taken away. Reload the page to carry on from your last save.');
  });

  // ---- start-up: carry on from a save, or begin
  async function begin(s) {
    g.flags = s ? s.flags : {};
    g.items = s ? s.items : Object.assign({}, content.game.start.items);
    const id = s ? s.area : content.game.start.area;
    ui.loading('Preparing…');
    const rt = await g.loadArea(id, m => ui.loading(m + '…'));
    enterArea(rt, s ? { x: s.x, z: s.z } : g.field.spawn(rt, content.game.start.spawn), s ? s.yaw : undefined);
    ui.loading(null);
    live = true;
    window.__ready = 1;
    // (the rest is fetched or built quietly, so doors open at once)
    for (const other of content.game.preload || []) g.loadArea(other).catch(() => {});
    g.loadMonsters().catch(() => {});
  }
  const boot = s => begin(s).catch(e => ui.fail('Could not start: ' + ((e && e.message) || e)));
  const saved = store.load();
  if (saved)
    ui.choose('Welcome back.', ['Continue', 'New game'], i => {
      if (i === 1) store.clear();
      boot(i === 0 ? saved : null);
    });
  else boot(null);

  let last = performance.now();
  (function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (live) {
      inputs();
      if (!window.__pause) step(dt);
      draw();
      g.look.tick(dt);
    }
    requestAnimationFrame(loop);
  })(last);

  // for tests and for poking about in the console
  Object.assign(g, {
    step: s => {
      for (let i = 0; i < Math.round(s / 0.02); i++) step(0.02);
    },
    tap,
    rot,
    save,
    store,
    areasLoaded: () => Object.keys(areas),
    info: () => ({ mode: g.mode, area: g.area && g.area.id, look: g.look && g.look.kind, fw: g.look && g.look.fw, S: g.look && g.look.S, busy: g.busy, talking: ui.talking(), x: g.field.hero.x, z: g.field.hero.z, y: g.field.hero.y, yaw: g.cam.yaw, drawn: g.look && g.look.drawn, phase: g.battle.B.phase, flags: Object.keys(g.flags).sort(), items: Object.assign({}, g.items) })
  });
  window.__game = g;
}
