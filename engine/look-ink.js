// The "ink" look: areas sculpted in Ink Studio and baked to a pack (tools/bake-ink-area.cjs). The pack's dabs are drawn into a
// small buffer of who-is-in-front; a port of Ink Studio's pixel stage colours that buffer; sprites and ground decals go on top.
// The camera is a long lens that follows the party, so a sprite pixel is one art pixel where the party stands. The scene is
// only redrawn when the view moves; its light and water tick at twelve frames a second.
import { program, buffer, texture, artSize } from './gl.js';
import * as K from './shaders-ink.js';
import { SF, DF } from './shaders-gen.js';
import { loadPng } from './png.js';
import { Nav } from './nav.js';

// a sprite: an upright card at a point in the world, snapped to whole art pixels
const SV = `#version 300 es
precision highp float;
layout(location=0) in vec2 aC;
uniform vec3 uEye,uCX,uCY,uCZ,uPos;uniform vec2 uRes,uSize,uOff;uniform float uF,uNear,uFar,uFlip,uBias;
out vec2 vUV;
void main(){vec3 p=uPos-uEye,c=vec3(dot(uCX,p),dot(uCY,p),dot(uCZ,p));float zc=-c.z;
vec2 px=floor(uF*c.xy/zc+0.5*uRes+0.5)+uOff;
vec2 q=vec2(aC.x*0.5*uSize.x,(aC.y*0.5+0.5)*uSize.y);
float up=max(q.y+uOff.y,0.0)*zc/(uF*max(uCY.y,0.2));
gl_Position=vec4((px+q)/(0.5*uRes)-1.0,2.0*(zc-uCZ.y*up-uNear)/(uFar-uNear)-1.0-uBias,1.0);
float u=aC.x*0.5+0.5;vUV=vec2(uFlip>0.5?1.0-u:u,0.5-aC.y*0.5);}`;
// a decal lying on the ground
const DV = `#version 300 es
precision highp float;
layout(location=0) in vec2 aC;
uniform vec3 uEye,uCX,uCY,uCZ,uPos;uniform vec2 uRes;uniform float uF,uNear,uFar,uR,uB;
out vec2 vUV;
void main(){vec3 p=uPos+vec3(aC.x*uR,0.0,aC.y*uR)-uEye,c=vec3(dot(uCX,p),dot(uCY,p),dot(uCZ,p));float zc=-c.z;
gl_Position=vec4(uF*c.xy/zc/(0.5*uRes),2.0*(zc-uNear)/(uFar-uNear)-1.0-uB,1.0);vUV=aC;}`;

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export class InkLook {
  constructor(gl, cv, stage, atlas) {
    Object.assign(this, { kind: 'ink', scale: 1, canSmooth: false, gl, cv, stage, atlas });
    this.pS = program(gl, K.VS, K.FS); // dabs -> who is in front
    this.pA = program(gl, K.QV, K.PA); // the pixel stage
    this.pC = program(gl, K.QV, K.PC); // the clean-up
    this.pSp = program(gl, SV, SF);
    this.pD = program(gl, DV, DF);
    this.corner = buffer(gl, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]));
    this.quad = gl.createVertexArray();
    gl.bindVertexArray(this.quad);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.corner);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    this.pv = gl.createVertexArray();
    this.fw = 0;
    this.S = 1;
    this.scene = null;
    this.cam = null;
    this.key = '';
    this.tick12 = -1;
    this.drawn = 0;
  }

  // Load an area: { pack: url of the pack's folder, camera: {pitch, dist}, beam }. Returns the handle, walk map and places.
  async load(def, onProgress) {
    const gl = this.gl,
      base = def.pack;
    if (onProgress) onProgress('Fetching ' + (def.name || 'the area'));
    const res = await fetch(base + '/pack.json');
    if (!res.ok) throw new Error(base + '/pack.json: ' + res.status);
    const meta = await res.json(),
      [spl, lut, nv] = await Promise.all([
        loadPng(gl, base + '/splats.png', meta.sum),
        loadPng(gl, base + '/lut.png', meta.lsum),
        meta.nav ? loadPng(gl, base + '/nav.png', meta.nav.sum) : null
      ]);
    // the dabs: 16 bytes each (position and colour row as shorts; facing, size, light; ramp, cell key)
    const M = meta.n,
      rgb = spl.rgb,
      pl = meta.tw * meta.th * 3,
      inst = new Uint8Array(M * 16),
      u16 = new Uint16Array(inst.buffer);
    for (let k = 0; k < M; k++) {
      const o = k * 3,
        b = k * 16;
      u16[k * 8] = (rgb[o] << 8) | rgb[pl + o];
      u16[k * 8 + 1] = (rgb[o + 1] << 8) | rgb[pl + o + 1];
      u16[k * 8 + 2] = (rgb[o + 2] << 8) | rgb[pl + o + 2];
      u16[k * 8 + 3] = rgb[3 * pl + o] | (rgb[3 * pl + o + 1] << 8);
      inst[b + 8] = rgb[2 * pl + o];
      inst[b + 9] = rgb[2 * pl + o + 1];
      inst[b + 10] = rgb[2 * pl + o + 2];
      inst[b + 11] = rgb[3 * pl + o + 2];
      inst[b + 12] = rgb[4 * pl + o];
      inst[b + 13] = rgb[4 * pl + o + 1];
      inst[b + 14] = rgb[4 * pl + o + 2];
    }
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.corner);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    buffer(gl, inst);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.UNSIGNED_SHORT, false, 16, 0);
    gl.vertexAttribDivisor(1, 1);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.UNSIGNED_BYTE, true, 16, 8);
    gl.vertexAttribDivisor(2, 1);
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 4, gl.UNSIGNED_BYTE, true, 16, 12);
    gl.vertexAttribDivisor(3, 1);
    gl.bindVertexArray(null);
    const palB = new Uint8Array(64 * 3);
    meta.pal.forEach((h, i) => {
      palB[i * 3] = (h >> 16) & 255;
      palB[i * 3 + 1] = (h >> 8) & 255;
      palB[i * 3 + 2] = h & 255;
    });
    const rampB = new Uint8Array(8 * 32);
    meta.ramps.forEach((r, i) => {
      rampB[i * 8] = r.length;
      r.forEach((c, k) => (rampB[i * 8 + 1 + k] = c));
    });
    let nav = null;
    const scale = meta.nav ? meta.nav.scale : 1;
    if (nv) {
      const n = meta.nav.n,
        nu = meta.nav.nu,
        GH = new Float32Array(n * n),
        BL = new Uint8Array(nu * nu);
      for (let j = 0; j < n * n; j++) {
        const v = nv.rgb[j * 3] | (nv.rgb[j * 3 + 1] << 8);
        GH[j] = v ? (v - 1) / meta.nav.hq : -999;
      }
      for (let z = 0; z < nu; z++) for (let x = 0; x < nu; x++) BL[z * nu + x] = nv.rgb[(z * 2 * n + x * 2) * 3 + 2] & 1;
      nav = new Nav({ NU: nu, C: meta.nav.c, N: n, RS: meta.nav.rs, BL, GH });
    }
    const cam = def.camera || {};
    return {
      look: this,
      vao,
      n: M,
      meta,
      scale,
      tLUT: texture(gl, lut.w, lut.h, gl.RGB8, gl.RGB, gl.UNSIGNED_BYTE, lut.rgb),
      tPal: texture(gl, 64, 1, gl.RGB8, gl.RGB, gl.UNSIGNED_BYTE, palB),
      tRamp: texture(gl, 8, 32, gl.R8, gl.RED, gl.UNSIGNED_BYTE, rampB),
      pitch: cam.pitch === undefined ? 0.62 : cam.pitch,
      dist: cam.dist || 8,
      beam: !!(def.beam && meta.lantern),
      nav,
      poi: {},
      yaw0: cam.yaw === undefined ? meta.cam.yaw : cam.yaw
    };
  }

  use(scene) {
    this.scene = scene;
    this.scale = scene.scale;
    this.key = '';
  }

  setPixel() {}
  tick() {}

  resize() {
    const gl = this.gl,
      cv = this.cv,
      a = artSize(this.stage, 232),
      w = a.w;
    if (cv.width !== w || cv.height !== w) cv.width = cv.height = w;
    if (cv.style.width !== a.css) cv.style.width = cv.style.height = a.css;
    this.S = Math.max(1, Math.round(w / 232));
    if (w === this.fw) return;
    this.fw = w;
    this.key = '';
    for (const t of ['tG0', 'tG1', 'tD', 'tC', 'tS', 'tO']) if (this[t]) gl.deleteTexture(this[t]);
    for (const f of ['fbG', 'fbC', 'fbS', 'fbO']) if (this[f]) gl.deleteFramebuffer(this[f]);
    const rgba = () => texture(gl, w, w, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, null);
    this.tG0 = rgba();
    this.tG1 = rgba();
    this.tC = rgba();
    this.tS = rgba();
    this.tO = rgba();
    this.tD = texture(gl, w, w, gl.DEPTH_COMPONENT24, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
    const fb = (cols, depth) => {
      const f = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      cols.forEach((t, i) => gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0));
      if (depth) gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depth, 0);
      gl.drawBuffers(cols.map((t, i) => gl.COLOR_ATTACHMENT0 + i));
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('This device could not set up the drawing surface.');
      return f;
    };
    this.fbG = fb([this.tG0, this.tG1], this.tD); // who is in front
    this.fbC = fb([this.tC]); // coloured
    this.fbS = fb([this.tS]); // cleaned: the finished scene, kept between frames
    this.fbO = fb([this.tO], this.tD); // scene + sprites, on its way to the screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  // ---- the camera
  axes(yaw) {
    const c = Math.cos(yaw),
      s = Math.sin(yaw);
    return { right: [c, -s], fwd: [-s, -c] };
  }

  // focus (game units) and yaw -> the eye and its axes, in world units
  camOf(focus, yaw, still) {
    const sc = this.scene,
      s = sc.scale,
      cp = Math.cos(sc.pitch),
      sp = Math.sin(sc.pitch),
      dist = sc.dist,
      F = (5 * this.S * dist) / s,
      Z = [cp * Math.sin(yaw), sp, cp * Math.cos(yaw)],
      X = [Math.cos(yaw), 0, -Math.sin(yaw)],
      Y = [Z[1] * X[2], Z[2] * X[0] - Z[0] * X[2], -Z[1] * X[0]];
    let T = [focus[0] * s, focus[1] * s, focus[2] * s];
    if (still) {
      // (the focus sits on a whole art pixel across the picture, so the ground does not swim under the sprites)
      const u = dist / F,
        tx = Math.round(dot(T, X) / u) * u,
        ty = Math.round(dot(T, Y) / u) * u,
        tz = dot(T, Z);
      T = [X[0] * tx + Y[0] * ty + Z[0] * tz, X[1] * tx + Y[1] * ty + Z[1] * tz, X[2] * tx + Y[2] * ty + Z[2] * tz];
    }
    return { X, Y, Z, F, dist, eye: [T[0] + dist * Z[0], T[1] + dist * Z[1], T[2] + dist * Z[2]], near: Math.max(0.3, 0.12 * dist), far: dist + sc.meta.radius + 3 };
  }

  project(x, y, z) {
    const c = this.cam,
      s = this.scale,
      p = [x * s - c.eye[0], y * s - c.eye[1], z * s - c.eye[2]],
      zc = -dot(c.Z, p),
      k = c.F / (Math.max(zc, 1e-3) * 0.5 * this.fw);
    return [dot(c.X, p) * k, dot(c.Y, p) * k];
  }

  get px() {
    return (2 * this.S) / this.fw;
  }

  pick(nx, ny, nav) {
    const c = this.cam,
      s = this.scale,
      vx = (nx * 0.5 * this.fw) / c.F,
      vy = (ny * 0.5 * this.fw) / c.F,
      d = [c.X[0] * vx + c.Y[0] * vy - c.Z[0], c.X[1] * vx + c.Y[1] * vy - c.Z[1], c.X[2] * vx + c.Y[2] * vy - c.Z[2]],
      l = Math.hypot(d[0], d[1], d[2]),
      st = 0.2 / l,
      t0 = c.near / s;
    return nav.march([c.eye[0] / s + (d[0] / l) * t0, c.eye[1] / s + (d[1] / l) * t0, c.eye[2] / s + (d[2] / l) * t0], [d[0] * st, d[1] * st, d[2] * st], Math.ceil((c.far / s - t0) / 0.2));
  }

  camUniforms(P, c) {
    const gl = this.gl;
    gl.uniform3fv(P.u('uEye'), c.eye);
    gl.uniform3fv(P.u('uCX'), c.X);
    gl.uniform3fv(P.u('uCY'), c.Y);
    gl.uniform3fv(P.u('uCZ'), c.Z);
    gl.uniform2f(P.u('uRes'), this.fw, this.fw);
    gl.uniform1f(P.u('uF'), c.F);
    gl.uniform1f(P.u('uNear'), c.near);
    gl.uniform1f(P.u('uFar'), c.far);
  }

  bind(P, list) {
    const gl = this.gl;
    list.forEach(([name, t], i) => {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.uniform1i(P.u(name), i);
    });
    gl.activeTexture(gl.TEXTURE0);
  }

  // ---- one frame. fr: { t, cam: {focus, yaw, still}, blobs, rings, sprites } (monsters are not drawn in this look yet)
  draw(fr) {
    const gl = this.gl,
      sc = this.scene,
      meta = sc.meta,
      { pS, pA, pC, pSp, pD } = this;
    this.resize();
    const w = this.fw,
      s = sc.scale,
      c = (this.cam = this.camOf(fr.cam.focus, fr.cam.yaw, fr.cam.still)),
      key = c.eye.join() + '|' + fr.cam.yaw + '|' + w,
      tick = Math.floor(fr.t * 12);
    let fresh = false;
    if (key !== this.key) {
      this.key = key;
      fresh = true;
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbG);
      gl.viewport(0, 0, w, w);
      gl.disable(gl.BLEND);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LESS);
      gl.depthMask(true);
      gl.clearColor(0, 0, 0, 0);
      gl.clearDepth(1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(pS.p);
      this.camUniforms(pS, c);
      gl.uniform3fv(pS.u('uO'), meta.o);
      gl.uniform1f(pS.u('uQ'), 1 / meta.q);
      gl.uniform1f(pS.u('uSig'), meta.sigMax);
      gl.uniform1f(pS.u('uThr'), 2 * Math.log(2 * meta.al));
      gl.bindVertexArray(sc.vao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, sc.n);
      this.drawn = sc.n;
    }
    if (fresh || tick !== this.tick12) {
      this.tick12 = tick;
      const t12 = tick / 12,
        lv = Math.pow(2, Math.round(-Math.log2(c.F / c.dist / meta.detail)));
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.bindVertexArray(this.pv);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbC);
      gl.viewport(0, 0, w, w);
      gl.useProgram(pA.p);
      this.camUniforms(pA, c);
      this.bind(pA, [['uG0', this.tG0], ['uG1', this.tG1], ['uD', this.tD], ['uLUT', sc.tLUT], ['uRamp', sc.tRamp], ['uPal', sc.tPal]]);
      gl.uniform3fv(pA.u('uLan'), meta.lantern || [0, -100, 0]);
      gl.uniform1f(pA.u('uDist'), c.dist);
      gl.uniform1f(pA.u('uRad'), meta.radius);
      gl.uniform1f(pA.u('uT'), t12);
      gl.uniform1f(pA.u('uBeamA'), 0.4 + (t12 * Math.PI) / 3);
      gl.uniform1f(pA.u('uBeam'), sc.beam ? 1 : 0);
      gl.uniform1f(pA.u('uWaterY'), meta.water ? meta.water.y : -100);
      gl.uniform1f(pA.u('uCell'), (7 / meta.detail) * lv);
      gl.uniform1f(pA.u('uLeaf'), (4 / meta.detail) * lv);
      gl.uniform1f(pA.u('uLitMax'), meta.litMax);
      gl.uniform1i(pA.u('uNP'), meta.pal.length);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbS);
      gl.useProgram(pC.p);
      this.bind(pC, [['uC', this.tC]]);
      gl.uniform2f(pC.u('uRes'), w, w);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    // the kept scene, then decals and sprites over it, tested against the dabs' depth (never written: it is kept too)
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.fbS);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.fbO);
    gl.blitFramebuffer(0, 0, w, w, 0, 0, w, w, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbO);
    gl.viewport(0, 0, w, w);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.depthFunc(gl.LEQUAL);
    gl.bindVertexArray(this.quad);
    const zb = b => (b * s * 2) / (c.far - c.near); // a depth bias given in game units
    gl.useProgram(pD.p);
    this.camUniforms(pD, c);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.DST_COLOR, gl.ZERO);
    gl.uniform1f(pD.u('uMode'), 0);
    gl.uniform4f(pD.u('uCol'), 0.56, 0.58, 0.72, 1);
    gl.uniform1f(pD.u('uB'), zb(0.9));
    for (const b of fr.blobs) {
      gl.uniform1f(pD.u('uR'), b.r * s);
      gl.uniform3f(pD.u('uPos'), b.x * s, b.y * s, b.z * s);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    gl.disable(gl.BLEND);
    gl.uniform1f(pD.u('uMode'), 1);
    gl.uniform1f(pD.u('uB'), zb(2.2));
    for (const r of fr.rings) {
      gl.uniform1f(pD.u('uR'), r.r * s);
      gl.uniform4f(pD.u('uCol'), r.col[0], r.col[1], r.col[2], 1);
      gl.uniform3f(pD.u('uPos'), r.x * s, r.y * s, r.z * s);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    gl.useProgram(pSp.p);
    this.camUniforms(pSp, c);
    this.bind(pSp, [['uT', this.atlas]]);
    const S = this.S,
      depth = sp => -dot(c.Z, [sp.x * s - c.eye[0], sp.y * s - c.eye[1], sp.z * s - c.eye[2]]),
      sprite = (sp, sil) => {
        const q = sp.rect;
        gl.uniform3f(pSp.u('uPos'), sp.x * s, sp.y * s, sp.z * s);
        gl.uniform4f(pSp.u('uRect'), q[0], q[1], q[2], q[3]);
        gl.uniform2f(pSp.u('uSize'), q[2] * S * (s.scale || 1), q[3] * S * (s.scale || 1));
        gl.uniform2f(pSp.u('uOff'), 0, sp.offY * S);
        gl.uniform1f(pSp.u('uFlip'), sp.flip);
        gl.uniform3f(pSp.u('uTint'), sil ? 1 : sp.tint[0], sil ? 1 : sp.tint[1], sil ? 1 : sp.tint[2]);
        gl.uniform1f(pSp.u('uBias'), zb(sil ? 3.3 : sp.bias));
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      };
    // (far to near, since the sprites do not write depth)
    const eff = sp => depth(sp) - sp.bias * s,
      order = fr.sprites.slice().sort((a, b) => eff(b) - eff(a));
    gl.depthFunc(gl.LESS);
    gl.uniform1f(pSp.u('uSil'), 0);
    for (const sp of order) sprite(sp, false);
    gl.depthFunc(gl.GREATER);
    gl.uniform1f(pSp.u('uSil'), S);
    for (const sp of order) if (sp.sil) sprite(sp, true);
    gl.depthFunc(gl.LESS);
    gl.depthMask(true);
    gl.disable(gl.DEPTH_TEST);
    gl.bindVertexArray(null);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.fbO);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.blitFramebuffer(0, 0, w, w, 0, 0, w, w, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
}
