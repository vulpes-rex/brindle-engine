// node tools/genmap.mjs <scene index> [x0,z0,x1,z1]   prints a generated scene's named places and a window of its walk map
import { genMain } from '../engine/gen/genmain.js';
import { Nav } from '../engine/nav.js';
const si = +process.argv[2], t0 = Date.now(), r = genMain(si, () => {}), w = r.walk;
console.log(r.meta.name, 'splats', r.n, 'ms', Date.now() - t0, 'yaw0', r.meta.ry0);
if (!w) process.exit(0);
const nav = new Nav({ NU: w.NU, C: w.C, N: w.N, RS: w.RS, BL: w.BL, GH: w.GH, SH: w.SH });
for (const k in w.poi) console.log(k, w.poi[k].map(v => +v.toFixed(2)).join(','), 'blocked', nav.blocked(w.poi[k][0], w.poi[k][1]));
const reach = nav.flood(w.poi.start[0], w.poi.start[1]);
const [x0, z0, x1, z1] = (process.argv[3] || '-30,-60,30,-36').split(',').map(Number);
for (let z = z1; z >= z0; z--) { let row = ''; for (let x = x0; x <= x1; x++) { const j = nav.cell(x, z); row += j < 0 ? ' ' : Math.abs(x - w.poi.start[0]) < 0.6 && Math.abs(z - w.poi.start[1]) < 0.6 ? 'S' : reach[j] ? '.' : w.BL[j] ? '#' : 'o'; } console.log(String(z).padStart(4), row); }
