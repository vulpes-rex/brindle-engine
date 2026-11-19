// The engine's front door. start(content) takes a game (its data and its sprite sheet) and runs it: it loads areas through
// whichever look each one asks for, switches between walking and fighting, runs scripts, saves, and drives the frame loop.
//
// content: { game, areas, scenes, heroes, skills, monsters, foeActions, battles, makeSprites }  (see game/ for a worked example)
import { createUI } from './ui.js';
import { texture } from './gl.js';
import { GenLook } from './look-gen.js';
import { InkLook } from './look-ink.js';
import { createField } from './field.js';
import { createBattle } from './battle.js';
import { runScript, test } from './script.js';
import { SaveStore } from './save.js';
import { decodeMonster } from './monsters.js';

const ZERO = new Float32Array(9);

export function start(content) {
  const ui = createUI(document),
    $ = ui.$,
    cv = ui.el.cv,
    stage = ui.el.stage,
    gl = cv.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) return ui.fail('This needs WebGL 2, which this browser or device does not offer.');
  const SP = content.makeSprites(),
    atlas = texture(gl, SP.w, SP.h, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(SP.data.buffer));
  for (const id in content.areas) content.areas[id].id = id;

  // g: the running game, shared by the field, the battle and the looks
  const g = {
    content,
    ui,
    SP,
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
        looks[kind] = kind === 'ink' ? new InkLook(gl, cv, stage, atlas) : new GenLook(gl, cv, stage, atlas, content.scenes);
      } catch (e) {
        throw new Error('the graphics shaders failed to start on this device (' + e.message + ')');
      }
    }
    return looks[kind];
  };

  // An area, loaded once: { id, def, look, scene, nav, poi, scale, yaw0 }
  g.loadArea = (id, onProgress) => {
    if (!areas[id]) {
      const def = content.areas[id];
      if (!def) return Promise.reject(new Error('there is no area called "' + id + '"'));
      areas[id] = (async () => {
        const look = lookFor(def.look),
          scene = await look.load(def, onProgress);
        return { id, def, look, scene, nav: scene.nav, poi: scene.poi, scale: look.kind === 'ink' ? scene.scale : 1, yaw0: scene.yaw0 };
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
      h = list.find(x => test(x[0], g.host));
    ui.hint(h ? h[1] : '');
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
    if (g.mode !== 'field' || !g.area || g.busy) return false;
    const h = g.field.hero,
      ok = store.save({ area: g.area.id, x: h.x, z: h.z, yaw: g.cam.yawT, flags: g.flags, items: g.items });
    unsaved = false;
    sinceSave = 0;
    if (announce) ui.toast(ok ? 'Saved' : 'This browser would not keep a save');
    return ok;
  }

  // ---- scripts
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
    battle: (id, cb) => g.battle.start(id, cb),
    go: (id, at, cb) => travel(id, at, cb)
  };

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
    stepAnims(dt);
    if (g.mode === 'battle') g.battle.update(dt);
    else {
      g.field.update(dt);
      sinceSave += dt;
      if (sinceSave > 12 && !g.busy) save(false);
    }
  }

  function draw() {
    const bt = g.mode === 'battle',
      c = g.cam,
      fr = { t: g.t, cam: { focus: c.focus, yaw: c.yaw, still: c.yaw === c.yawT, shake: bt ? c.shake : 0 }, anim: bt ? ZERO : g.anim, models: [], blobs: [], rings: [], sprites: [] };
    if (bt) g.battle.build(fr);
    else g.field.build(fr);
    g.look.draw(fr);
    if (bt) g.battle.overlay();
  }

  g.field = createField(g);
  g.battle = createBattle(g);

  // ---- input
  const tap = (nx, ny) => {
    if (!live) return;
    if (ui.talking()) return ui.advance();
    if (g.mode === 'battle') g.battle.tap(nx, ny);
    else if (!g.busy) g.field.tap(nx, ny);
  };
  const rot = d => {
    if (live && g.mode === 'field') g.cam.yawT += (d * Math.PI) / 4;
  };
  let pd = null;
  const ndc = e => {
    const r = cv.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * 2 - 1, 1 - ((e.clientY - r.top) / r.height) * 2];
  };
  stage.addEventListener('pointerdown', e => {
    // (buttons laid over the stage keep their own clicks: capturing the pointer would take them away)
    if (e.target.closest('button')) return;
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
    if (g.mode === 'field' && Math.abs(dx) > 34 && Math.abs(dx) > Math.abs(dy) * 1.2) return rot(dx > 0 ? 1 : -1);
    if (Math.hypot(dx, dy) < 14) {
      const p = ndc(e);
      if (Math.abs(p[0]) <= 1 && Math.abs(p[1]) <= 1) tap(p[0], p[1]);
    }
  });
  stage.addEventListener('pointercancel', () => (pd = null));
  $('rl').addEventListener('click', () => rot(-1));
  $('rr').addEventListener('click', () => rot(1));
  $('sv').addEventListener('click', () => {
    if (live && !save(true) && (g.mode !== 'field' || g.busy)) ui.toast('Not just now');
  });
  $('px').addEventListener('click', () => {
    if (!g.look || !g.look.canSmooth) return;
    pixel = !pixel;
    $('px').classList.toggle('on', pixel);
    $('px').setAttribute('aria-pressed', pixel ? 'true' : 'false');
    cv.classList.toggle('smooth', !pixel);
    g.look.setPixel(pixel);
  });
  window.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') {
      if (ui.talking()) {
        ui.advance();
        e.preventDefault();
      }
      return;
    }
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
