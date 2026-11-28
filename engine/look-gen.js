// The "gen" look: areas built in the browser by the scene generator (engine/gen), drawn as soft round splats under a fixed-tilt
// orthographic camera that turns in eighths. Pixel mode draws to a small buffer shown in whole device pixels; smooth mode to a
// large one. Game units are world units here (scale 1); a game unit is ppu buffer pixels (the sprites' own scale), so the
// pixel buffer is about 46 game units across whatever the sprites' size.
import { program, buffer, artSize, presenter } from './gl.js';
import * as G from './shaders-gen.js';
import { genMain } from './gen/genmain.js';
import { binTiles } from './gen/bintiles.js';
import { Nav } from './nav.js';
import { skinMonster } from './monsters.js';

const TILT = (33 * Math.PI) / 180, // the field's camera; a battle can ask for its own tilt, zoom and perspective
  TT = 10, // tiles a side, for skipping what is off screen
  WC = 80; // half the world's width

export class GenLook {
  constructor(gl, cv, stage, atlas, opts) {
    const o = opts || {},
      ppu = o.ppu || 5;
    Object.assign(this, { kind: 'gen', scale: 1, canSmooth: true, gl, cv, stage, atlas, scenes: o.scenes || {}, ppu, base: Math.round(46.4 * ppu) });
    this.P1 = program(gl, G.VS, G.FS); // splats
    this.P2 = program(gl, G.VS, G.FA); // glows and motes
    this.P3 = program(gl, G.PV, G.PF); // finishing pass
    this.P4 = program(gl, G.SV, G.SF); // sprites
    this.P5 = program(gl, G.DV, G.DF); // ground decals
    this.P6 = program(gl, G.XV, G.XF); // battle effects
    this.P7 = program(gl, G.PV, G.MF); // dimming
    this.P8 = program(gl, G.TV, G.TF); // low-poly meshes (a trial beside the splats)
    this.meshGpu = new Map();
    this.present = presenter(gl);
    this.cT = Math.cos(TILT);
    this.sT = Math.sin(TILT);
    this.zoom = 1;
    this.persp = 0;
    this.corner = buffer(gl, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]));
    this.quad = gl.createVertexArray();
    gl.bindVertexArray(this.quad);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.corner);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    this.pv = gl.createVertexArray();
    // effects: 14 floats an instance (A, B, size, turn, kind, colour, strength), refilled each frame
    this.fxCap = 4096;
    this.fxBuf = buffer(gl, new Float32Array(this.fxCap * 14), gl.DYNAMIC_DRAW);
    this.fxVao = gl.createVertexArray();
    gl.bindVertexArray(this.fxVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.corner);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    for (const loc of [1, 2, 3, 4]) {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribDivisor(loc, 1);
    }
    this.fxFrom(0);
    gl.bindVertexArray(null);
    this.pixel = true;
    this.quality = 1;
    this.fw = 0;
    this.S = 1;
    this.uScale = 0.04;
    this.ry = 0;
    this.F3 = [0, 5, 0];
    this.scene = null;
    this.jobs = [];
    this.busy = false;
    this.worker = null;
    this.noWorker = false;
    this.slow = 0;
    this.drawn = 0;
  }

  // ---- scenes
  // Generate a scene (a scene function, see game/scenes/), off the main thread where workers are allowed. Jobs run one at a
  // time. The worker gets the scene as text, so a scene must not use anything outside itself.
  generate(scene, onProgress) {
    return new Promise((res, rej) => {
      this.jobs.push({ scene, onProgress, res, rej });
      this.pump();
    });
  }

  pump() {
    if (this.busy || !this.jobs.length) return;
    const job = this.jobs.shift();
    this.busy = true;
    const finish = (r, err) => {
      this.busy = false;
      if (err) job.rej(err);
      else job.res(r);
      this.pump();
    };
    const local = () =>
      setTimeout(() => {
        try {
          finish(binTiles(genMain(job.scene, () => {}), TT, WC));
        } catch (e) {
          finish(null, e);
        }
      }, 30);
    if (this.noWorker) return local();
    try {
      if (!this.worker) {
        const src =
          'const genMain=' + genMain.toString() + ';const binTiles=' + binTiles.toString() +
          ';const made={};onmessage=function(e){const src=e.data,scene=made[src]||(made[src]=new Function("return ("+src+")")());' +
          'const r=binTiles(genMain(scene,function(m){postMessage({p:m});}),' + TT + ',' + WC + ');' +
          'const w=r.walk,tr=[r.F.buffer,r.NB.buffer,r.CB.buffer,r.AF.buffer,r.ANB.buffer,r.ACB.buffer,r.yr.buffer,r.tiles.buffer];' +
          'if(w)tr.push(w.BL.buffer,w.B0.buffer,w.SH.buffer,w.GH.buffer);postMessage({r:r},tr);};';
        this.worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
      }
      const w = this.worker;
      w.onmessage = e => {
        if (e.data.p) {
          if (job.onProgress) job.onProgress(e.data.p);
        } else finish(e.data.r);
      };
      w.onerror = () => {
        this.worker = null;
        this.noWorker = true;
        w.terminate();
        local();
      };
      w.postMessage(job.scene.toString());
    } catch (e) {
      this.noWorker = true;
      local();
    }
  }

  // point the effects' instance attributes at instance `first` onward (the effects VAO must be bound)
  fxFrom(first) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.fxBuf);
    [[1, 3, 0], [2, 3, 12], [3, 4, 24], [4, 4, 40]].forEach(([loc, n, off]) => gl.vertexAttribPointer(loc, n, gl.FLOAT, false, 56, off + first * 56));
  }

  vao(B, first) {
    const gl = this.gl,
      v = gl.createVertexArray();
    gl.bindVertexArray(v);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.corner);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, B[0]);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, first * 24);
    gl.vertexAttribDivisor(1, 1);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 24, first * 24 + 12);
    gl.vertexAttribDivisor(2, 1);
    gl.bindBuffer(gl.ARRAY_BUFFER, B[1]);
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 4, gl.BYTE, true, 4, first * 4);
    gl.vertexAttribDivisor(3, 1);
    gl.bindBuffer(gl.ARRAY_BUFFER, B[2]);
    gl.enableVertexAttribArray(4);
    gl.vertexAttribPointer(4, 4, gl.UNSIGNED_BYTE, true, 4, first * 4);
    gl.vertexAttribDivisor(4, 1);
    gl.bindVertexArray(null);
    return v;
  }

  // Load an area: { scene: name }, one of the game's scenes. Returns what the engine needs: a handle to draw, the walk map and
  // named places.
  async load(def, onProgress) {
    const make = this.scenes[def.scene];
    if (typeof make !== 'function') throw new Error('there is no scene called "' + def.scene + '"');
    const gl = this.gl,
      r = await this.generate(make, onProgress),
      B = [buffer(gl, r.F), buffer(gl, r.NB), buffer(gl, r.CB)],
      tiles = [];
    for (let k = 0; k <= r.T * r.T; k++) {
      const a = r.tiles[k],
        n = r.tiles[k + 1] - a;
      if (n > 0) tiles.push({ k, n, vao: this.vao(B, a), y0: k < r.T * r.T ? r.yr[k * 2] - 1 : 0, y1: k < r.T * r.T ? r.yr[k * 2 + 1] + 1 : 0 });
    }
    const GC = new Float32Array(36);
    r.meta.groups.slice(0, 8).forEach((g, k) => GC.set([g[0], g[1], g[2], g[3]], (k + 1) * 4));
    const w = r.walk;
    if (w && w.C !== WC) throw new Error('walk map centre mismatch');
    return {
      look: this,
      tiles,
      vao2: this.vao([buffer(gl, r.AF), buffer(gl, r.ANB), buffer(gl, r.ACB)], 0),
      n2: r.an,
      meta: r.meta,
      GC,
      n: r.n,
      nav: w ? new Nav({ NU: w.NU, C: w.C, N: w.N, RS: w.RS, BL: w.BL, GH: w.GH, SH: w.SH }) : null,
      poi: w ? w.poi : {},
      ledges: w ? w.ledges || [] : [],
      yaw0: r.meta.ry0
    };
  }

  use(scene) {
    this.scene = scene;
  }

  // give a decoded monster its buffers
  rig(m) {
    const gl = this.gl,
      bf = buffer(gl, m.F, gl.DYNAMIC_DRAW),
      bn = buffer(gl, m.NB, gl.DYNAMIC_DRAW),
      bc = buffer(gl, m.CB);
    m.gpu = { bf, bn, vao: this.vao([bf, bn, bc], 0) };
    return m;
  }

  setPixel(p) {
    this.pixel = p;
    this.fw = 0;
  }

  // ---- the picture's size
  resize() {
    const gl = this.gl,
      cv = this.cv,
      cw = this.stage.clientWidth || 360,
      dpr = Math.min(window.devicePixelRatio || 1, this.hd ? 2 : 3), // (the HD-2D trial is heavy: it draws at most twice the page's size)
      dev = Math.max(240, Math.round(cw * dpr));
    let w, cw2, css;
    if (this.pixel) ({ w, cw: cw2, css } = artSize(this.stage, this.base));
    else {
      cw2 = Math.min(1200, dev) & ~1;
      w = Math.max(240, Math.round(cw2 * this.quality)) & ~1;
      css = '100%';
    }
    if (cv.width !== cw2 || cv.height !== cw2) cv.width = cv.height = cw2;
    if (cv.style.width !== css) cv.style.width = cv.style.height = css;
    // (in smooth mode the picture may be drawn smaller than the page shows it, when frames run slow: the art keeps the size
    // it has on the page, so the view takes in the same ground whatever the quality)
    this.S = this.pixel ? Math.max(1, Math.round(w / this.base)) : (Math.max(1, Math.round(cw2 / this.base)) * w) / cw2;
    this.uScale = (this.S * 2 * this.ppu * this.zoom) / w;
    if (w === this.fw) return;
    this.fw = w;
    if (this.fbo) {
      gl.deleteFramebuffer(this.fbo);
      gl.deleteFramebuffer(this.fbOut);
      gl.deleteTexture(this.tc);
      gl.deleteTexture(this.td);
      gl.deleteTexture(this.tOut);
    }
    const mk = (internal, format, type, filter) => {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, w, 0, format, type, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    this.tc = mk(gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.NEAREST);
    this.td = mk(gl.DEPTH_COMPONENT24, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, gl.NEAREST);
    this.tOut = mk(gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR); // the finished picture, scaled to the canvas
    this.fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tc, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.td, 0);
    this.fbOut = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbOut);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tOut, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  // smooth mode drops its resolution if frames run slow
  tick(dt) {
    this.slow = dt > 0.045 ? this.slow + 1 : Math.max(0, this.slow - 2);
    if (this.slow > 50 && this.quality > 0.5 && !this.pixel) {
      this.quality = this.quality > 0.8 ? 0.75 : 0.55;
      this.slow = 0;
      this.fw = 0;
    }
  }

  // ---- the camera, for the game's own sums
  // screen-right and screen-up (away from the eye) as directions on the ground, for a view turned by yaw
  axes(yaw) {
    const c = Math.cos(yaw),
      s = Math.sin(yaw);
    return { right: [c, s], fwd: [-s, c] };
  }

  // a point in the world -> where it is on the picture, -1..1 both ways
  project(x, y, z) {
    const dx = x - this.F3[0],
      dy = y - this.F3[1],
      dz = z - this.F3[2],
      c = Math.cos(this.ry),
      s = Math.sin(this.ry),
      X = dx * c + dz * s,
      Z = dz * c - dx * s,
      yy = dy - (this.roll || 0) * Z * Z,
      q = Math.max(1 + (Z * this.cT - yy * this.sT) * this.persp, 0.05);
    return [(X * this.uScale) / q, ((yy * this.cT + Z * this.sT) * this.uScale) / q];
  }

  // how large something at a point is drawn, against the same thing at the focus: 1 unless the view has a lens
  scaleAt(x, y, z) {
    const dx = x - this.F3[0],
      dz = z - this.F3[2],
      Z = dz * Math.cos(this.ry) - dx * Math.sin(this.ry),
      yy = y - this.F3[1] - (this.roll || 0) * Z * Z;
    return 1 / Math.max(1 + (Z * this.cT - yy * this.sT) * this.persp, 0.05);
  }

  // the size of one sprite pixel on the picture (-1..1 units), at the focus
  get px() {
    return (2 * this.S * this.zoom) / this.fw;
  }

  // a place on the picture -> the ground under it, or null (for the field's camera: no perspective)
  pick(nx, ny, nav) {
    // through a lens or over rolling ground a tap is no straight ray, and ground far off can fold back behind what is
    // near: of the ground points that draw close to the tap, take the one nearest the eye, then settle on it finely
    if (this.roll || this.persp) {
      const c = Math.cos(this.ry),
        s = Math.sin(this.ry),
        R = (1.3 * this.uScale) ** 2,
        at = (x, z) => {
          if (nav.cell(x, z) < 0) return null;
          const g = nav.gh(x, z);
          if (g <= -900) return null;
          const p = this.project(x, g, z),
            Z = (z - this.F3[2]) * c - (x - this.F3[0]) * s;
          return [(p[0] - nx) * (p[0] - nx) + (p[1] - ny) * (p[1] - ny), Z];
        };
      let best = null,
        bz = 1e9;
      for (let z = -79.5; z < 80; z++)
        for (let x = -79.5; x < 80; x++) {
          const q = at(x, z);
          if (q && q[0] < R && q[1] < bz) ((bz = q[1]), (best = [x, z]));
        }
      if (!best) return null;
      // (a low view squeezes depth, so the nearest-drawn point may lie well to one side of that first find)
      let fine = best,
        fd = 1e9;
      for (const [span, step] of [
        [9, 0.5],
        [0.75, 0.125]
      ]) {
        const [ox, oz] = fine;
        for (let dz = -span; dz <= span; dz += step)
          for (let dx = -span; dx <= span; dx += step) {
            const q = at(ox + dx, oz + dz);
            if (q && q[0] < fd && Math.abs(q[1] - bz) < 14) ((fd = q[0]), (fine = [ox + dx, oz + dz]));
          }
      }
      return fine;
    }
    const cT = this.cT,
      sT = this.sT;
    const c = Math.cos(this.ry),
      s = Math.sin(this.ry),
      X = nx / this.uScale,
      K = ny / this.uScale,
      Z0 = -80,
      o = [this.F3[0] + X * c - Z0 * s, this.F3[1] + (K - Z0 * sT) / cT, this.F3[2] + X * s + Z0 * c];
    return nav.march(o, [-s * 0.2, (-sT / cT) * 0.2, c * 0.2], 801);
  }

  setCam(P) {
    const gl = this.gl;
    gl.useProgram(P.p);
    gl.uniform4f(P.u('uCam'), Math.cos(this.ry), Math.sin(this.ry), this.cT, this.sT);
    gl.uniform1f(P.u('uPersp'), this.persp);
    gl.uniform1f(P.u('uRoll'), this.roll || 0);
    gl.uniform3f(P.u('uFocus'), this.F3[0], this.F3[1], this.F3[2]);
    gl.uniform1f(P.u('uScale'), this.uScale);
  }

  tileVisible(tl) {
    const TS = (2 * WC) / TT,
      x0 = (tl.k % TT) * TS - WC,
      z0 = ((tl.k / TT) | 0) * TS - WC,
      m = 1 + 2.5 * this.uScale;
    let a = 1e9,
      b = -1e9,
      c = 1e9,
      d = -1e9;
    for (let i = 0; i < 8; i++) {
      const p = this.project(x0 + (i & 1 ? TS : 0), i & 2 ? tl.y1 : tl.y0, z0 + (i & 4 ? TS : 0));
      if (p[0] < a) a = p[0];
      if (p[0] > b) b = p[0];
      if (p[1] < c) c = p[1];
      if (p[1] > d) d = p[1];
    }
    return b > -m && a < m && d > -m && c < m;
  }

  // ---- one frame. fr: { t, cam: {focus, yaw, still, shake, tilt?, zoom?, persp?}, anim (Float32Array 9), models, blobs, rings,
  //   sprites, fx?: {data, n, over} from engine/fx.js, dim?: 0..1, flash?: [r, g, b, strength],
  //   past?: 0..1, how far the picture is a memory, pastT: the time, for its grain }
  draw(fr) {
    const gl = this.gl,
      sc = this.scene,
      t = fr.t,
      { P1, P2, P3, P4, P5, P6, P7 } = this,
      // (the strip trial: the field seen low and side-on, the ground rolling away behind like the face of a drum. A camera
      // of its own, a battle's, may say how much of that view it wants, 0..1, to ease out of it and back)
      strip = fr.cam.strip !== undefined ? Math.max(0, Math.min(1, fr.cam.strip)) : this.strip && fr.cam.tilt === undefined ? 1 : 0,
      tilt = fr.cam.tilt !== undefined ? fr.cam.tilt : strip ? this.stripTilt || 0.17 : TILT;
    this.roll = strip * (this.stripRoll === undefined ? 0.0065 : this.stripRoll);
    // (what the picture was last drawn with, for whoever takes the camera over)
    this.viewTilt = tilt;
    this.viewStrip = strip;
    this.cT = Math.cos(tilt);
    this.sT = Math.sin(tilt);
    this.zoom = fr.cam.zoom || 1;
    this.persp = fr.cam.persp || (strip > 0.5 ? 1 / 85 : this.hd ? 1 / 150 : 0); // (the HD-2D trial looks through a lens in the field too)
    this.resize();
    const cT = this.cT,
      sT = this.sT;
    const S = this.S,
      fw = this.fw;
    this.ry = fr.cam.yaw;
    {
      const c = Math.cos(this.ry),
        s = Math.sin(this.ry);
      let [fx, fy, fz] = fr.cam.focus;
      if (strip) fy += strip * (this.stripLift === undefined ? 7 : this.stripLift); // the walk sits in the lower third
      if (fr.cam.shake > 0) {
        fx += Math.sin(t * 71) * 0.55 * fr.cam.shake;
        fy += Math.sin(t * 93) * 0.35 * fr.cam.shake;
      }
      if (this.pixel && fr.cam.still) {
        // (the focus sits on a whole art pixel, so the ground does not swim under the sprites)
        const u = 1 / (this.ppu * S);
        let X = fx * c + fz * s,
          Zc = fz * c - fx * s,
          Ys = fy * cT + Zc * sT;
        const Dp = Zc * cT - fy * sT;
        X = Math.round(X / u) * u;
        Ys = Math.round(Ys / u) * u;
        fy = Ys * cT - Dp * sT;
        Zc = Ys * sT + Dp * cT;
        fx = X * c - Zc * s;
        fz = X * s + Zc * c;
      }
      this.F3 = [fx, fy, fz];
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.viewport(0, 0, fw, fw);
    gl.clearColor(0, 0, 0, 0);
    gl.clearDepth(1);
    gl.depthMask(true);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.disable(gl.BLEND);
    const setWorld = P => {
      this.setCam(P);
      gl.uniform1f(P.u('uTime'), t);
      gl.uniform3f(P.u('uVel'), sc.meta.vel[0], sc.meta.vel[1], sc.meta.vel[2]);
      gl.uniform4fv(P.u('uGC[0]'), sc.GC);
      gl.uniform1fv(P.u('uGAn[0]'), fr.anim);
    };
    // the world, tile by tile
    setWorld(P1);
    gl.uniform1f(P1.u('uFlash'), 0);
    gl.uniform3f(P1.u('uFlashC'), 1, 1, 1);
    let drawn = 0;
    for (const tl of sc.tiles) {
      if (this.hideWorld) break; // (the mesh trial: a low-poly scene stands in for the splats)
      if (tl.k < TT * TT && !this.tileVisible(tl)) continue;
      gl.bindVertexArray(tl.vao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, tl.n);
      drawn += tl.n;
    }
    // monsters, posed for this frame
    for (const m of fr.models) {
      const r = m.rig;
      skinMonster(r, m.clip, m.time, m.x, m.y, m.z, m.dis, m.yaw || 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, r.gpu.bf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, r.F);
      gl.bindBuffer(gl.ARRAY_BUFFER, r.gpu.bn);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, r.NB);
      gl.uniform1f(P1.u('uFlash'), m.flash * 0.85);
      gl.uniform3f(P1.u('uFlashC'), m.flashC[0], m.flashC[1], m.flashC[2]);
      gl.bindVertexArray(r.gpu.vao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, r.n);
      drawn += r.n;
    }
    this.drawn = drawn;
    // low-poly meshes, into the same picture and depth as the splats
    if (fr.meshes && fr.meshes.length) {
      const P8 = this.P8;
      this.setCam(P8);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform1i(P8.u('uT'), 0);
      // Lit evenly, or, in the HD-2D trial, by a cooler evening light and lamps: those of the scene's own mesh (the one
      // in the frame that has any), for everything drawn with it. A shader takes six, so each mesh gets the six nearest:
      // the scene's mesh those nearest where the camera looks, a thing standing in it those nearest itself. The scene's
      // mesh may bring an evening of its own, "amb" (a hall under rock is dimmer and bluer).
      const src = this.hd ? fr.meshes.find(m => (m.mesh.meta.lights || []).length) : null,
        all = src ? src.mesh.meta.lights : [],
        amb = this.hd ? (src && src.mesh.meta.amb) || [0.8, 0.86, 1.0] : [1, 1, 1];
      for (const m of fr.meshes) {
        const L = new Float32Array(24),
          LC = new Float32Array(18),
          c = m.world ? fr.cam.focus : [m.x, m.y, m.z],
          lamps = all.length > 6 ? all.map(v => [v, (v[0] - c[0]) ** 2 + (v[1] - c[1]) ** 2 + (v[2] - c[2]) ** 2]).sort((p, q) => p[1] - q[1]).slice(0, 6).map(p => p[0]) : all;
        lamps.forEach((v, i) => {
          L.set(v.slice(0, 4), i * 4);
          LC.set(v.length > 6 ? v.slice(4, 7) : [1, 0.66, 0.3], i * 3);
        });
        gl.uniform3fv(P8.u('uLC[0]'), LC);
        gl.uniform4fv(P8.u('uL[0]'), L);
        gl.uniform3f(P8.u('uAmb'), amb[0], amb[1], amb[2]);
        let q = this.meshGpu.get(m.mesh);
        if (!q) {
          const vao = gl.createVertexArray(),
            vb = gl.createBuffer(),
            ib = gl.createBuffer(),
            tex = gl.createTexture(),
            st = (m.mesh.stride || 4) * 4,
            img = m.mesh.img || { w: 1, h: 1, data: new Uint8Array([255, 255, 255, 255]) };
          gl.bindVertexArray(vao);
          gl.bindBuffer(gl.ARRAY_BUFFER, vb);
          gl.bufferData(gl.ARRAY_BUFFER, m.mesh.verts, gl.STATIC_DRAW);
          gl.enableVertexAttribArray(0);
          gl.enableVertexAttribArray(1);
          if (m.mesh.q16) {
            gl.vertexAttribPointer(0, 3, gl.SHORT, false, 16, 0);
            gl.vertexAttribPointer(1, 3, gl.UNSIGNED_BYTE, true, 16, 6);
            gl.enableVertexAttribArray(2);
            gl.vertexAttribPointer(2, 2, gl.UNSIGNED_SHORT, true, 16, 10);
          } else {
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, st, 0);
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, st, 12);
            if (m.mesh.stride >= 8) {
              gl.enableVertexAttribArray(2);
              gl.vertexAttribPointer(2, 2, gl.FLOAT, false, st, 24);
            }
          }
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
          gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, m.mesh.tris, gl.STATIC_DRAW);
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, img.w, img.h, 0, gl.RGBA, gl.UNSIGNED_BYTE, img.data);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          this.meshGpu.set(m.mesh, (q = { vao, tex, n: m.mesh.tris.length }));
        }
        gl.bindVertexArray(q.vao);
        gl.bindTexture(gl.TEXTURE_2D, q.tex);
        gl.uniform3f(P8.u('uPos'), m.x, m.y, m.z);
        gl.uniform1f(P8.u('uSize'), m.size * (m.mesh.q16 ? m.mesh.scale : 1));
        gl.uniform1f(P8.u('uCK'), m.mesh.q16 ? 255 / 128 : 1);
        gl.uniform2f(P8.u('uRot'), Math.cos(m.yaw || 0), Math.sin(m.yaw || 0));
        gl.uniform3f(P8.u('uTint'), m.tint[0], m.tint[1], m.tint[2]);
        gl.drawElements(gl.TRIANGLES, q.n, gl.UNSIGNED_INT, 0);
      }
      gl.bindTexture(gl.TEXTURE_2D, this.atlas);
      gl.useProgram(P1.p);
    }
    // blob shadows, then rings on the ground
    gl.bindVertexArray(this.quad);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.DST_COLOR, gl.ZERO);
    gl.depthMask(false);
    gl.depthFunc(gl.LEQUAL);
    this.setCam(P5);
    gl.uniform1f(P5.u('uMode'), 0);
    gl.uniform4f(P5.u('uCol'), 0.5, 0.52, 0.64, 1);
    gl.uniform1f(P5.u('uB'), 0.008);
    for (const b of fr.blobs) {
      gl.uniform1f(P5.u('uR'), b.r);
      gl.uniform3f(P5.u('uPos'), b.x, b.y, b.z);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    gl.disable(gl.BLEND);
    gl.uniform1f(P5.u('uMode'), 1);
    gl.uniform1f(P5.u('uB'), 0.02);
    for (const r of fr.rings) {
      gl.uniform1f(P5.u('uR'), r.r);
      gl.uniform4f(P5.u('uCol'), r.col[0], r.col[1], r.col[2], 1);
      gl.uniform3f(P5.u('uPos'), r.x, r.y, r.z);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    // sprites: upright cards, then the dotted outline of any that asked to show through what hides them
    gl.depthMask(true);
    gl.depthFunc(gl.LESS);
    this.setCam(P4);
    gl.uniform1f(P4.u('uW'), fw);
    gl.uniform1f(P4.u('uZoom'), this.zoom);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.atlas);
    gl.uniform1i(P4.u('uT'), 0);
    const sprite = (s, sil) => {
      const q = s.rect,
        big = S * (s.size || 1);
      gl.uniform3f(P4.u('uPos'), s.x, s.y, s.z);
      gl.uniform4f(P4.u('uRect'), q[0], q[1], q[2], q[3]);
      gl.uniform2f(P4.u('uSize'), q[2] * big, q[3] * big);
      gl.uniform2f(P4.u('uOff'), 0, s.offY * big);
      gl.uniform1f(P4.u('uFlip'), s.flip);
      gl.uniform3f(P4.u('uTint'), sil ? 1 : s.tint[0], sil ? 1 : s.tint[1], sil ? 1 : s.tint[2]);
      gl.uniform1f(P4.u('uBias'), (sil ? 3.3 : s.bias) / 110);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    gl.uniform1f(P4.u('uSil'), 0);
    for (const s of fr.sprites) sprite(s, false);
    gl.depthFunc(gl.GREATER);
    gl.depthMask(false);
    gl.uniform1f(P4.u('uSil'), S);
    for (const s of fr.sprites) if (s.sil) sprite(s, true);
    gl.uniform1f(P4.u('uSil'), 0);
    gl.depthFunc(gl.LESS);
    // glows and motes
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    if (sc.n2 && (!this.hideWorld || this.hd)) {
      setWorld(P2);
      gl.bindVertexArray(sc.vao2);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, sc.n2);
    }
    // battle effects: the scene dims behind them, then they are added on, those marked 'over' on top of everything
    const dim = fr.dim || 0;
    if (dim > 0) {
      gl.disable(gl.DEPTH_TEST);
      gl.blendFunc(gl.DST_COLOR, gl.ZERO);
      gl.useProgram(P7.p);
      gl.uniform1f(P7.u('uK'), 1 - dim);
      gl.bindVertexArray(this.pv);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.enable(gl.DEPTH_TEST);
      gl.blendFunc(gl.ONE, gl.ONE);
    }
    const fx = fr.fx;
    if (fx && fx.n) {
      const n = Math.min(fx.n, this.fxCap),
        over = Math.min(fx.over, n);
      this.setCam(P6);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.fxBuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, fx.data, 0, n * 14);
      gl.bindVertexArray(this.fxVao);
      if (n > over) gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, n - over);
      if (over) {
        // (an instanced draw cannot start part-way, so the 'over' ones are reached by moving the attribute pointers)
        gl.disable(gl.DEPTH_TEST);
        this.fxFrom(n - over);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, over);
        this.fxFrom(0);
        gl.enable(gl.DEPTH_TEST);
      }
    }
    // drawn effects (engine/sheetfx.js): their thin rings flat on the ground, then each card like a sprite, its colour frame
    // and then its light added on (the battle hands the cards over far to near)
    if (fr.fxRings && fr.fxRings.length) {
      gl.disable(gl.BLEND);
      gl.depthFunc(gl.LEQUAL);
      gl.bindVertexArray(this.quad);
      this.setCam(P5);
      gl.uniform1f(P5.u('uMode'), 2);
      gl.uniform1f(P5.u('uB'), 0.02);
      for (const r of fr.fxRings) {
        gl.uniform1f(P5.u('uR'), r.r);
        gl.uniform4f(P5.u('uCol'), r.col[0], r.col[1], r.col[2], 1);
        gl.uniform3f(P5.u('uPos'), r.x, r.y, r.z);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      gl.depthFunc(gl.LESS);
      gl.enable(gl.BLEND);
    }
    if (fr.sheets && fr.sheets.length) {
      this.setCam(P4);
      gl.bindVertexArray(this.quad);
      gl.uniform1f(P4.u('uW'), fw);
      gl.uniform1f(P4.u('uZoom'), this.zoom);
      gl.uniform1f(P4.u('uSil'), 0);
      gl.uniform1f(P4.u('uBias'), 0.66 / 110);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform1i(P4.u('uT'), 0);
      for (const e of fr.sheets) {
        gl.bindTexture(gl.TEXTURE_2D, e.tex);
        gl.uniform3f(P4.u('uPos'), e.x, e.y, e.z);
        gl.uniform2f(P4.u('uSize'), e.colour[2] * S, e.colour[3] * S);
        gl.uniform2f(P4.u('uOff'), 0, e.offY * S);
        gl.uniform1f(P4.u('uFlip'), e.flip ? 1 : 0);
        for (const light of [false, true]) {
          const q = light ? e.light : e.colour,
            k = light ? e.gain : 1;
          if (light) gl.enable(gl.BLEND);
          else gl.disable(gl.BLEND);
          gl.uniform1f(P4.u('uAdd'), light ? 1 : 0);
          gl.uniform4f(P4.u('uRect'), q[0], q[1], q[2], q[3]);
          gl.uniform3f(P4.u('uTint'), k, k, k);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
      }
      gl.uniform1f(P4.u('uAdd'), 0);
      gl.uniform1f(P4.u('uFlip'), 0);
      gl.bindTexture(gl.TEXTURE_2D, this.atlas);
    }
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    // finish (at the picture's own size), then show it on the canvas
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbOut);
    gl.viewport(0, 0, fw, fw);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(P3.p);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tc);
    gl.uniform1i(P3.u('uC'), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.td);
    gl.uniform1i(P3.u('uD'), 1);
    gl.activeTexture(gl.TEXTURE0);
    const bg = sc.meta.bg;
    gl.uniform2f(P3.u('uPx'), 1 / fw, 1 / fw);
    gl.uniform3f(P3.u('uBg'), bg[0] / 255, bg[1] / 255, bg[2] / 255);
    gl.uniform1f(P3.u('uPix'), this.pixel ? 1 : 0);
    gl.uniform1f(P3.u('uHD'), this.hd ? fw / 1110 : 0);
    gl.uniform2f(P3.u('uStrip'), this.viewStrip, this.viewStrip ? (this.F3[0] * Math.cos(this.ry) + this.F3[2] * Math.sin(this.ry)) * 0.012 : 0);
    gl.uniform1f(P3.u('uCave'), this.cave ? 1 : 0); // (its blur and bloom are sized for a picture 1110 across)
    gl.uniform1f(P3.u('uDim'), dim);
    gl.uniform2f(P3.u('uPast'), fr.past || 0, fr.pastT || 0);
    const fl = fr.flash || [0, 0, 0, 0];
    gl.uniform4f(P3.u('uFlash'), fl[0], fl[1], fl[2], fl[3]);
    gl.bindVertexArray(this.pv);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
    this.present(this.tOut, fw, this.cv, this.pixel);
  }
}
