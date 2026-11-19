// node tools/pixellab.mjs balance
// node tools/pixellab.mjs make <name>... [--dry]     generate characters from art/pixellab/cast.json, with an 8-way walk
//                                                    (carries on with one made before from the same prompt; --fresh: anew)
// node tools/pixellab.mjs fetch <name>...            download a generated character again (from its meta.json)
//
// Generates the cast with PixelLab (https://api.pixellab.ai/v2) into art/pixellab/<name>/: rotations/<direction>.png, the walk
// in walk/<direction>/<n>.png, and meta.json (the character's id, the prompt, the settings, what it cost). The art is kept in
// the repository, so building the game never needs PixelLab; tools/bake-sprites.mjs then bakes it into the sprite pack.
//
// The API token comes from PIXELLAB_API_KEY, or from a file .pixellab-token at the top of the repository (git ignores it).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  API = 'https://api.pixellab.ai/v2',
  DIRS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'],
  args = process.argv.slice(2),
  dry = args.includes('--dry'),
  [cmd, ...names] = args.filter(a => !a.startsWith('--')),
  cast = JSON.parse(fs.readFileSync(path.join(root, 'art/pixellab/cast.json'), 'utf8')),
  sleep = ms => new Promise(r => setTimeout(r, ms));

function token() {
  if (process.env.PIXELLAB_API_KEY) return process.env.PIXELLAB_API_KEY.trim();
  const f = path.join(root, '.pixellab-token');
  if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8').trim();
  throw new Error('No PixelLab token: set PIXELLAB_API_KEY, or put the token in .pixellab-token (from https://www.pixellab.ai/account)');
}

let spent = { usd: 0, generations: 0 };
const count = u => {
  if (u && u.usd) spent.usd += u.usd;
  if (u && u.generations) spent.generations += u.generations;
};

async function api(method, route, body) {
  if (dry) {
    console.log('  would', method, route, body ? JSON.stringify(body).slice(0, 400) : '');
    return {};
  }
  // (an account runs a few jobs at once; when they are all busy, wait for one to come free)
  for (let tries = 0; ; tries++) {
    const r = await fetch(API + route, {
      method,
      headers: Object.assign({ Authorization: 'Bearer ' + token() }, body ? { 'Content-Type': 'application/json' } : {}),
      body: body ? JSON.stringify(body) : undefined
    });
    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { raw: text };
    }
    if (r.status === 429 && tries < 60) {
      process.stdout.write('~');
      await sleep(15000);
      continue;
    }
    if (!r.ok) throw new Error(method + ' ' + route + ': ' + r.status + ' ' + text.slice(0, 600));
    count(data.usage);
    return data;
  }
}

// wait for a background job; returns its last response
async function job(id, what) {
  if (dry) return {};
  const t0 = Date.now();
  for (;;) {
    const j = await api('GET', '/background-jobs/' + id);
    if (j.status === 'completed') return j.last_response || {};
    if (j.status === 'failed') throw new Error(what + ' failed: ' + JSON.stringify(j.last_response || j).slice(0, 600));
    if (Date.now() - t0 > 15 * 60e3) throw new Error(what + ': still not done after 15 minutes (job ' + id + ')');
    process.stdout.write('.');
    await sleep(5000);
  }
}

async function download(url, file) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(url + ': ' + r.status);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
}

// everything the character has now: its eight rotations and its walk
async function fetchCharacter(name, id) {
  const dir = path.join(root, 'art/pixellab', name),
    c = await api('GET', '/characters/' + id);
  if (dry) return;
  if (c.status !== 'completed' || !c.rotation_urls) throw new Error(name + ': the character is ' + c.status);
  for (const d of DIRS) if (c.rotation_urls[d]) await download(c.rotation_urls[d], path.join(dir, 'rotations', d + '.png'));
  const walk = (c.animations || []).find(a => /walk/i.test(a.animation_type + ' ' + (a.display_name || '')));
  if (walk) {
    fs.rmSync(path.join(dir, 'walk'), { recursive: true, force: true });
    for (const d of walk.directions) for (let i = 0; i < d.frames.length; i++) await download(d.frames[i], path.join(dir, 'walk', d.direction, i + '.png'));
  }
  console.log('  ' + name + ': 8 rotations' + (walk ? ', walk ' + walk.directions.map(d => d.frames.length).join('/') + ' frames' : ', no walk yet'));
}

async function make(name) {
  const who = cast.cast[name];
  if (!who) throw new Error('No one called "' + name + '" in art/pixellab/cast.json');
  const s = cast.settings,
    description = who.description + '. ' + cast.style,
    title = who.description.split(',')[0],
    dir = path.join(root, 'art/pixellab', name),
    metaFile = path.join(dir, 'meta.json'),
    fresh = args.includes('--fresh');
  // a character this prompt already made (a run that stopped part-way) is carried on with, unless --fresh
  let meta = !fresh && fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, 'utf8')) : null;
  if (!meta && !fresh && !dry) {
    const list = await api('GET', '/characters?limit=100'),
      had = (list.characters || []).find(c => c.name === title && (c.prompt || description) === description);
    if (had) meta = { character_id: had.id, description, settings: s, seed: who.seed, made: had.created_at };
  }
  if (meta && meta.description !== description) meta = null; // (the prompt has changed since: make it again)
  if (!meta) {
    console.log(name + ': creating');
    const made = await api('POST', '/create-character-v3', {
      description,
      name: title,
      image_size: { width: s.size, height: s.size },
      view: s.view,
      outline: s.outline,
      detail: s.detail,
      no_background: true,
      seed: who.seed
    });
    if (made.background_job_id) await job(made.background_job_id, name + ' (character)');
    meta = { character_id: made.character_id, description, settings: s, seed: who.seed, made: new Date().toISOString() };
    console.log();
  } else console.log(name + ': carrying on with ' + meta.character_id);
  if (dry) return;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(metaFile, JSON.stringify(meta, null, 2) + '\n');
  const c = await api('GET', '/characters/' + meta.character_id);
  if (!(c.animations || []).some(a => /walk/i.test(a.animation_type + ' ' + (a.display_name || '')))) {
    console.log(name + ': walking');
    const anim = await api('POST', '/characters/animations', { character_id: meta.character_id, mode: 'template', template_animation_id: 'walking', directions: DIRS });
    for (const j of anim.background_job_ids || []) await job(j, name + ' (walk)');
    console.log();
  }
  await fetchCharacter(name, meta.character_id);
}

async function main() {
  if (cmd === 'balance') {
    const b = await api('GET', '/balance');
    console.log(JSON.stringify(b, null, 2));
  } else if (cmd === 'make' || cmd === 'fetch') {
    if (!names.length) throw new Error('Name some of the cast: ' + Object.keys(cast.cast).join(', '));
    for (const n of names) {
      if (cmd === 'make') await make(n);
      else await fetchCharacter(n, JSON.parse(fs.readFileSync(path.join(root, 'art/pixellab', n, 'meta.json'), 'utf8')).character_id);
    }
  } else {
    console.log('node tools/pixellab.mjs balance | make <name>... [--dry] | fetch <name>...');
    return;
  }
  if (spent.usd || spent.generations) console.log('Spent: ' + (spent.usd ? '$' + spent.usd.toFixed(2) : '') + (spent.generations ? ' ' + spent.generations + ' generations' : ''));
}
main().catch(e => {
  console.error(e.message);
  process.exit(1);
});
