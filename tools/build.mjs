// node tools/build.mjs [--minify]
// Checks the game's data, bundles engine + game into one script, and writes a page that runs anywhere a folder can be served:
//   dist/index.html   the page, script inline
//   dist/packs/...    baked area packs and the monster pack, fetched as the game needs them
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkContent } from './check-content.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  out = path.join(root, 'dist');

const problems = await checkContent(root);
if (problems.length) {
  console.error('The game data has problems:\n  ' + problems.join('\n  '));
  process.exit(1);
}

const result = await build({
  entryPoints: [path.join(root, 'game/main.js')],
  bundle: true,
  format: 'iife',
  target: 'es2020',
  minify: process.argv.includes('--minify'),
  write: false,
  legalComments: 'none'
});
const js = result.outputFiles[0].text;
if (js.includes('</script>')) throw new Error('the bundle contains a closing script tag');
const shell = fs.readFileSync(path.join(root, 'game/index.html'), 'utf8');
if (shell.split('/*BUNDLE*/').length !== 2) throw new Error('game/index.html needs exactly one /*BUNDLE*/ marker');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), shell.replace('/*BUNDLE*/', () => js));

// packs: everything except working files
const files = [];
const copy = dir => {
  for (const name of fs.readdirSync(path.join(root, dir))) {
    const rel = path.join(dir, name),
      st = fs.statSync(path.join(root, rel));
    if (st.isDirectory()) copy(rel);
    else {
      fs.mkdirSync(path.join(out, dir), { recursive: true });
      fs.copyFileSync(path.join(root, rel), path.join(out, rel));
      files.push([rel, st.size]);
    }
  }
};
copy('packs');
console.log('dist/index.html', fs.statSync(path.join(out, 'index.html')).size, 'bytes');
for (const [f, n] of files) console.log('dist/' + f, n, 'bytes');
