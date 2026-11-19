// The "gen" look: areas built in the browser by the scene generator (engine/gen), drawn as soft round splats under a fixed-tilt
// orthographic camera that turns in eighths. Pixel mode draws to a small buffer shown in whole device pixels; smooth mode to a
// large one. Game units are world units here (scale 1).
import { program, buffer } from './gl.js';
import * as G from './shaders-gen.js';
import { genMain } from './gen/genmain.js';
import { binTiles } from './gen/bintiles.js';
import { Nav } from './nav.js';
import { skinMonster } from './monsters.js';

const TILT = (33 * Math.PI) / 180,
  cT = Math.cos(TILT),
  sT = Math.sin(TILT),
  TT = 10, // tiles a side, for skipping what is off screen
  WC = 80; // half the world's width

export class GenLook {
  constructor(gl, cv, stage, atlas) {
    Object.assign(this, { kind: 'gen', scale: 1, canSmooth: true, gl, cv, stage, atlas });
    this.P1 = program(gl, G.VS, G.FS); // splats
    this.P2 = program(gl, G.VS, G.FA); // glows and motes
    this.P3 = program(gl, G.PV, G.PF); // finishing pass
    this.P4 = program(gl, G.SV, G.SF); // sprites
    this.P5 = program(gl, G.DV, G.DF); // ground decals
    this.corner = buffer(gl, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]));
    this.quad = gl.createVertexArray();
    gl.bindVertexArray(this.quad);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.corner);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    this.pv = gl.createVertexArray();
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
  // Generate scene `index`, off the main thread where workers are allowed. Jobs run one at a time.
  generate(index, onProgress) {
    return new Promise((res, rej) => {
      this.jobs.push({ index, onProgress, res, rej });
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
          finish(binTiles(genMain(job.index, () => {}), TT, WC));
        } catch (e) {
          finish(null, e);
        }
      }, 30);
    if (this.noWorker) return local();
    try {
      if (!this.worker) {
        const src =
          'const genMain=' + genMain.toString() + ';const binTiles=' + binTiles.toString() +
          ';onmessage=function(e){const si=e.data,r=binTiles(genMain(si,function(m){postMessage({p:m});}),' + TT + ',' + WC + ');' +
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
      w.postMessage(job.index);
    } catch (e) {
      this.noWorker = true;
      local();
    }
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

  // Load an area: { scene: index }. Returns what the engine needs: a handle to draw, the walk map and named places.
  async load(def, onProgress) {
    const gl = this.gl,
      r = await this.generate(def.scene, onProgress),
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
      dpr = Math.min(window.devicePixelRatio || 1, 3),
      dev = Math.max(240, Math.round(cw * dpr));
    let w, cw2, css;
    if (this.pixel) {
      const k = Math.max(1, Math.round(dev / 232));
      w = Math.floor(dev / k) & ~1;
      cw2 = w;
      css = (w * k) / dpr + 'px';
    } else {
      cw2 = Math.min(1200, dev) & ~1;
      w = Math.max(240, Math.round(cw2 * this.quality)) & ~1;
      css = '100%';
    }
    if (cv.width !== cw2 || cv.height !== cw2) cv.width = cv.height = cw2;
    if (cv.style.width !== css) cv.style.width = cv.style.height = css;
    this.S = Math.max(1, Math.round(w / 232));
    this.uScale = (this.S * 10) / w;
    if (w === this.fw) return;
    this.fw = w;
    if (this.fbo) {
      gl.deleteFramebuffer(this.fbo);
      gl.deleteTexture(this.tc);
      gl.deleteTexture(this.td);
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
    this.tc = mk(gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, this.pixel || w === cw2 ? gl.NEAREST : gl.LINEAR);
    this.td = mk(gl.DEPTH_COMPONENT24, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, gl.NEAREST);
    this.fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tc, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.td, 0);
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
      Z = dz * c - dx * s;
    return [X * this.uScale, (dy * cT + Z * sT) * this.uScale];
  }

  // the size of one sprite pixel on the picture (-1..1 units)
  get px() {
    return (2 * this.S) / this.fw;
  }

  // a place on the picture -> the ground under it, or null
  pick(nx, ny, nav) {
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
    gl.uniform4f(P.u('uCam'), Math.cos(this.ry), Math.sin(this.ry), cT, sT);
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

  // ---- one frame. fr: { t, cam: {focus, yaw, still, shake}, anim (Float32Array 9), models, blobs, rings, sprites }
  draw(fr) {
    const gl = this.gl,
      sc = this.scene,
      t = fr.t,
      { P1, P2, P3, P4, P5 } = this;
    this.resize();
    const S = this.S,
      fw = this.fw;
    this.ry = fr.cam.yaw;
    {
      const c = Math.cos(this.ry),
        s = Math.sin(this.ry);
      let [fx, fy, fz] = fr.cam.focus;
      if (fr.cam.shake > 0) {
        fx += Math.sin(t * 71) * 0.55 * fr.cam.shake;
        fy += Math.sin(t * 93) * 0.35 * fr.cam.shake;
      }
      if (this.pixel && fr.cam.still) {
        // (the focus sits on a whole art pixel, so the ground does not swim under the sprites)
        const u = 1 / (5 * S);
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
      if (tl.k < TT * TT && !this.tileVisible(tl)) continue;
      gl.bindVertexArray(tl.vao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, tl.n);
      drawn += tl.n;
    }
    // monsters, posed for this frame
    for (const m of fr.models) {
      const r = m.rig;
      skinMonster(r, m.clip, m.time, m.x, m.y, m.z, m.dis);
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
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.atlas);
    gl.uniform1i(P4.u('uT'), 0);
    const sprite = (s, sil) => {
      const q = s.rect;
      gl.uniform3f(P4.u('uPos'), s.x, s.y, s.z);
      gl.uniform4f(P4.u('uRect'), q[0], q[1], q[2], q[3]);
      gl.uniform2f(P4.u('uSize'), q[2] * S, q[3] * S);
      gl.uniform2f(P4.u('uOff'), 0, s.offY * S);
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
    if (sc.n2) {
      setWorld(P2);
      gl.bindVertexArray(sc.vao2);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, sc.n2);
    }
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    // finish to the screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.cv.width, this.cv.height);
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
    gl.bindVertexArray(this.pv);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  }
}
