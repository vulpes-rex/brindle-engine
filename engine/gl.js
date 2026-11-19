// Small WebGL 2 helpers shared by both looks.

export function program(gl, vs, fs) {
  const p = gl.createProgram();
  for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    gl.attachShader(p, sh);
  }
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const cache = new Map();
  // u('name') -> uniform location, looked up once
  const u = name => {
    if (!cache.has(name)) cache.set(name, gl.getUniformLocation(p, name));
    return cache.get(name);
  };
  return { p, u };
}

export function buffer(gl, data, usage) {
  const b = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, data, usage || gl.STATIC_DRAW);
  return b;
}

export function texture(gl, w, h, internal, format, type, data, filter) {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, data);
  const f = filter || gl.NEAREST;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return t;
}

// The sizes of a pixel-art picture for a square stage: the art (`w` pixels across, about `want`) and the canvas it is shown on
// (the stage in device pixels). Where a whole number of device pixels per art pixel comes close to `want`, the art is made
// to fit exactly; otherwise it is `want` across and shown with sharp-bilinear scaling (crisp pixels, a soft seam where they
// fall between device pixels), so every screen sees about as much of the world.
export function artSize(stage, want) {
  const cw = stage.clientWidth || 360,
    dpr = Math.min(window.devicePixelRatio || 1, 3),
    dev = Math.max(240, Math.round(cw * dpr)) & ~1,
    k = Math.max(1, Math.round(dev / want)),
    fit = Math.floor(dev / k) & ~1,
    w = Math.abs(fit - want) / want < 0.12 ? fit : want & ~1;
  return { w, cw: dev, css: dev / dpr + 'px', dev, dpr };
}

// Draws a finished picture (a texture made with LINEAR filtering) over the whole canvas. sharp: pixel art, scaled by
// sharp-bilinear; otherwise plain bilinear.
const PV = `#version 300 es
out vec2 vUV;void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));vUV=p;gl_Position=vec4(p*2.0-1.0,0.0,1.0);}`;
const PF = `#version 300 es
precision highp float;
in vec2 vUV;uniform sampler2D uT;uniform float uSrc;uniform float uK;out vec4 o;
void main(){vec2 t=vUV*uSrc;vec2 c=fract(t)-0.5;float r=max(0.5-0.5/uK,0.0);vec2 f=(c-clamp(c,-r,r))*uK+0.5;
o=vec4(texture(uT,(floor(t)+f)/uSrc).rgb,1.0);}`;
export function presenter(gl) {
  const P = program(gl, PV, PF),
    vao = gl.createVertexArray();
  return (tex, src, cv, sharp) => {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, cv.width, cv.height);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.useProgram(P.p);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(P.u('uT'), 0);
    gl.uniform1f(P.u('uSrc'), src);
    gl.uniform1f(P.u('uK'), sharp ? Math.max(1, cv.width / src) : 1);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  };
}
