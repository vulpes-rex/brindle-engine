// Meshes, a trial beside the splats: models packed by a baker into <name>.bin (for each vertex x, y, z, a colour r, g, b
// and, when the mesh is textured, u, v, all float32; then the triangles as uint32), <name>.json (the counts, the floats to
// a vertex, whether there is a texture) and <name>.png (the texture: pixel art, drawn unfiltered, its clear pixels cut out).
// An area lists where they stand with "meshes": [{ mesh, poi or at, off?, size, yaw? }]; the gen look draws them into the
// same low picture as the splats, each face flat and lit in bands, the vertex colour tinting the texture.

import { pixels } from './sprites.js';
import { loadPng } from './png.js';

export async function loadMeshes(gl, base, names) {
  const out = {};
  await Promise.all(
    names.map(async n => {
      try {
        const get = async (ext, kind) => {
          const r = await fetch(base + '/' + n + ext);
          if (!r.ok) throw new Error(base + '/' + n + ext + ': ' + r.status);
          return r[kind]();
        };
        // (a packed mesh keeps its numbers as the bytes of <name>.mesh.png, three to a pixel, read back exactly)
        const meta = await get('.json', 'json'),
          buf = meta.packed ? (await loadPng(gl, base + '/' + n + '.mesh.png', meta.sum)).rgb.slice().buffer : await get('.bin', 'arrayBuffer'),
          st = meta.stride || 6,
          // (its texture is its own <name>.png, or, where "tex" names another mesh, that one's: parts of one scene share a sheet)
          img = meta.tex ? await pixels(base + '/' + (typeof meta.tex === 'string' ? meta.tex : n) + '.png') : null;
        // (a q16 mesh has 16 bytes to a vertex: int16 x, y, z in meta.scale units, a colour in bytes where 128 is 1, uint16 u, v)
        out[n] = meta.q16
          ? { name: n, q16: true, scale: meta.scale, verts: new Uint8Array(buf, 0, meta.verts * 16), tris: new Uint32Array(buf.slice(meta.verts * 16, meta.verts * 16 + meta.tris * 12)), img, meta }
          : { name: n, stride: st, verts: new Float32Array(buf, 0, meta.verts * st), tris: new Uint32Array(buf, meta.verts * st * 4, meta.tris * 3), img, meta };
      } catch (e) {
        console.warn('mesh "' + n + '" did not load: ' + e.message);
      }
    })
  );
  return out;
}
