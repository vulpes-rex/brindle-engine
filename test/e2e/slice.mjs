// node test/e2e/slice.mjs [url]
// Plays the first slice in a headless browser: walk and talk in the village, take the road to Lighthouse rock (the other look),
// climb to the keeper, row back, reload and continue from the save, then win the battle under the bluff.
// Needs Playwright (or playwright-core, a dev dependency, with the Chrome installed on this machine); set PLAYWRIGHT (module
// path) and CHROME (binary) if they are not in the usual places.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const load = names => {
  for (const n of names)
    try {
      return [require(n), n];
    } catch (e) {}
  throw new Error('Playwright is not installed: npm install, or set PLAYWRIGHT');
};
const [{ chromium }, pwName] = load(process.env.PLAYWRIGHT ? [process.env.PLAYWRIGHT] : ['playwright', 'playwright-core']);
// (playwright-core brings no browser of its own: use the installed Chrome)
const browser = process.env.CHROME ? { executablePath: process.env.CHROME } : pwName === 'playwright-core' ? { channel: 'chrome' } : {};
const URL = process.argv[2] || 'http://localhost:8080/index.html',
  SHOTS = process.env.SHOTS || null;
let failed = 0;
const ok = (c, m) => {
  console.log((c ? 'PASS ' : 'FAIL ') + m);
  if (!c) failed++;
};

const br = await chromium.launch({ ...browser, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
const pg = await ctx.newPage();
const errs = [];
pg.on('pageerror', e => errs.push(e.message));
pg.on('console', m => {
  if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text());
});
const info = () => pg.evaluate(() => window.__game.info());
const shot = async name => SHOTS && (await pg.screenshot({ path: SHOTS + '/' + name + '.png' }));
const ready = () => pg.waitForFunction('window.__ready||window.__err', null, { timeout: 180000 });
// advance the game clock until something is true (the page's own clock keeps running too)
const until = async (expr, secs = 30) => {
  for (let i = 0; i < secs * 5; i++) {
    if (await pg.evaluate(expr)) return true;
    await pg.evaluate(() => window.__game.step(0.2));
    await pg.waitForTimeout(20);
  }
  return false;
};
// read every line; a question is answered by tapping its first answer (or the one given)
const talkThrough = async (answer = 0) => {
  for (let i = 0; i < 40 && (await pg.evaluate(() => window.__game.info().talking)); i++) {
    if (await pg.evaluate(() => window.__game.ui.asking())) await pg.click('#cho button[data-k="' + answer + '"]');
    else await pg.evaluate(() => (window.__game.ui.advance(), window.__game.ui.advance()));
    await pg.waitForTimeout(30);
  }
};
const use = async (kind, id) => {
  await pg.evaluate(([kind, id]) => { const g = window.__game, th = g.field[kind].find(t => t.id === id); g.field.goThing(th); }, [kind, id]);
  return until('window.__game.info().talking', 40);
};

await pg.goto(URL);
await ready();
ok(await pg.evaluate('window.__ready===1&&!window.__err'), 'a new game starts (' + (await pg.evaluate('String(window.__err||"")')) + ')');
let i = await info();
ok(i.area === 'brindlebrook' && i.look === 'gen' && i.items.tonic === 3, 'in the village, generated look, three tonics');
await pg.waitForTimeout(600);
await shot('1-village');
ok(await pg.evaluate(() => !document.getElementById('px').disabled), 'the Pixel switch works in the village');

// a real tap on the ground walks the leader
const box = await pg.$eval('#cv', e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
await pg.touchscreen.tap(box.x + box.w * 0.62, box.y + box.h * 0.42);
await pg.evaluate(() => window.__game.step(1.5));
const j = await info();
ok(Math.hypot(j.x - i.x, j.z - i.z) > 3 && j.flags.includes('moved'), 'tapping the ground walks there (' + Math.hypot(j.x - i.x, j.z - i.z).toFixed(1) + ' units)');

// talk to the elder: she asks; "Not just now" leaves the quest alone, "I'll find the key" takes it, and that is saved
ok(await use('actors', 'elder'), 'the leader walks up to the elder and a conversation opens');
await talkThrough(1);
i = await info();
ok(!i.flags.includes('asked') && !i.busy, 'turning the elder down sets nothing');
ok(await use('actors', 'elder'), 'she asks again');
for (let k = 0; k < 10 && !(await pg.evaluate(() => window.__game.ui.asking())); k++) await pg.evaluate(() => (window.__game.ui.advance(), window.__game.step(0.5)));
ok(await pg.evaluate(() => [...document.querySelectorAll('#cho button')].map(b => b.textContent).join('|') === "I'll find the key.|Not just now."), 'her question comes with two answers');
await shot('2-elder');
await talkThrough(0);
i = await info();
ok(i.flags.includes('asked') && !i.busy, 'taking the quest set its flag and the script ended');
ok(await pg.evaluate(() => { const s = window.__game.store.load(); return !!s && s.flags.asked === true && s.area === 'brindlebrook'; }), 'that was saved');

// the field menu: what the party carries and who they are, with the world holding still meanwhile
await pg.click('#mn');
ok(await pg.evaluate(() => window.__game.menu.open && /Tonic\s*×3/.test(document.querySelector('#menu .mbody').innerText)), 'the menu opens on the items: three tonics');
await pg.click('#menu [data-m="party"]');
ok(await pg.evaluate(() => document.querySelectorAll('#menu .chip').length === 1 && document.querySelectorAll('#menu img.face').length === 1 && /Lastmade/.test(document.querySelector('#menu .mbody').innerText)), 'the party page shows the Lastmade, alone');
await shot('2b-menu');
ok(await pg.evaluate(() => { const g = window.__game, h = g.field.hero, a = [h.x, h.z]; g.field.keys.ArrowUp = true; g.step(1); g.field.keys.ArrowUp = false; return h.x === a[0] && h.z === a[1]; }), 'nobody moves while it is open');
await pg.keyboard.press('Escape');
ok(await pg.evaluate(() => !window.__game.menu.open), 'Escape closes it');

// the road: a door to the other area, drawn by the other look
ok(await use('props', 'road'), 'the road by the south gate can be used');
// (it forks: the pilgrim road to the cathedral, the shore road to the rock)
await talkThrough(1);
ok(await pg.waitForFunction(() => { const q = window.__game.info(); return q.area === 'lighthouse' && !q.busy; }, null, { timeout: 120000 }).then(() => true, () => false), 'travelled to Lighthouse rock');
await pg.waitForTimeout(900);
i = await info();
ok(i.look === 'ink' && Math.abs(i.y - 4.6) < 0.3, 'drawn by the ink look, standing on the jetty (height ' + i.y.toFixed(2) + ')');
await shot('3-jetty');
// a real tap works here too
const before = await info();
await pg.touchscreen.tap(box.x + box.w * 0.3, box.y + box.h * 0.5);
await pg.evaluate(() => window.__game.step(1.2));
i = await info();
ok(Math.hypot(i.x - before.x, i.z - before.z) > 2, 'tapping the ground walks there in this look too (' + Math.hypot(i.x - before.x, i.z - before.z).toFixed(1) + ' units)');
// keys walk by the camera's own left and right (one of the two ways may be the jetty's edge), and the camera follows
const walkKey = key => pg.evaluate(key => { const g = window.__game, h = g.field.hero, a = [h.x, h.z]; g.field.keys[key] = true; g.step(0.6); g.field.keys[key] = false; g.step(1);
  const ax = g.look.axes(g.cam.yaw); return (h.x - a[0]) * ax.right[0] + (h.z - a[1]) * ax.right[1]; }, key);
const wl = await walkKey('ArrowLeft'), wr = await walkKey('ArrowRight');
ok(wl < 0.2 && wr > -0.2 && (wl < -1 || wr > 1), 'the arrow keys walk toward the left and right of the picture (' + wl.toFixed(1) + ', ' + wr.toFixed(1) + ' units)');
// (where the leader lands on the picture is read from the camera of the last frame drawn: let a frame or two be drawn first)
await pg.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
const hp = await pg.evaluate(() => { const g = window.__game, h = g.field.hero; return g.look.project(h.x, h.y, h.z); });
ok(Math.abs(hp[0]) < 0.25 && hp[1] > -0.6 && hp[1] < 0.2, 'the camera follows the leader (' + hp.map(v => v.toFixed(2)).join(', ') + ')');
ok(await pg.evaluate(() => document.getElementById('px').disabled), 'the Pixel switch is off here: this look is always pixel art');
await pg.evaluate(() => window.__game.rot(1));
await pg.evaluate(() => window.__game.step(1));
await shot('4-turned');
ok(await use('actors', 'keeper'), 'the leader climbs the three flights to the keeper');
i = await info();
ok(i.y > 28, 'up on the top tier (height ' + i.y.toFixed(1) + ')');
await pg.waitForTimeout(300);
await shot('5-keeper');
await talkThrough();
i = await info();
ok(i.items.tonic === 5 && i.flags.includes('oil'), 'the keeper gave two tonics');
ok(await use('props', 'boat'), 'back down to the rowboat');
await talkThrough();
ok(await pg.waitForFunction(() => { const q = window.__game.info(); return q.area === 'brindlebrook' && !q.busy; }, null, { timeout: 60000 }).then(() => true, () => false), 'rowed back to the village');
i = await info();
ok(Math.abs(i.z + 52) < 3, 'arrived at the south gate');

// saving: reload the page and carry on
await pg.waitForTimeout(500);
await pg.evaluate(() => window.__game.save(false));
await pg.reload();
await pg.waitForSelector('#title:not(.off) button', { timeout: 30000 });
await shot('6-continue');
await pg.click('#tbtn button:first-child');
await ready();
i = await info();
ok(i.area === 'brindlebrook' && i.items.tonic === 5 && ['asked', 'moved', 'oil'].every(f => i.flags.includes(f)) && Math.abs(i.z + 52) < 3, 'Continue restores the place, the flags and the tonics');

// play a battle out with plain attacks; returns how many rounds it took
const fightOut = async () => {
  let rounds = 0;
  for (let n = 0; n < 400; n++) {
    const st = await pg.evaluate(() => ({ mode: window.__game.mode, phase: window.__game.battle.B.phase, menu: window.__game.battle.B.menu, round: window.__game.battle.B.round, talking: window.__game.ui.talking() }));
    if (st.mode !== 'battle') break;
    rounds = st.round;
    if (st.phase === 'command') {
      if (st.menu === 'root') await pg.click('#bcmd button[data-c="attack"]');
      else if (st.menu === 'foe') await pg.click('#bcmd button[data-t]');
    } else if (st.phase === 'end') {
      await pg.click('#bcmd button');
      await pg.waitForFunction(() => window.__game.mode !== 'battle', null, { timeout: 20000 });
    }
    else await pg.evaluate(() => window.__game.step(0.4));
    await pg.waitForTimeout(15);
  }
  return rounds;
};

// a foe of the map: the wisp before the door comes for the leader, and is fought where they meet
await pg.evaluate(() => window.__game.host.set('key', true));
await pg.waitForFunction(() => !!window.__game.rigs.wisp, null, { timeout: 60000 });
ok(await pg.evaluate(() => { const g = window.__game, w = g.field.foes.find(f => f.id === 'doorwisp'); return !!w && !w.beaten && !g.flags.wisp; }), 'a wisp hangs on the way to the door under the bluff');
await pg.evaluate(() => { const g = window.__game; g.field.goThing(g.field.props.find(t => t.id === 'door')); });
ok(await until('window.__game.mode === "battle"', 60), 'it comes for the leader and a fight begins');
i = await info();
ok(await pg.evaluate(() => { const g = window.__game; return g.battle.B.here && g.shown === g.area && g.area.id === 'brindlebrook'; }), 'it is fought in place: no arena, the village stays on screen');
ok(await pg.waitForFunction(() => window.__game.info().phase === 'command', null, { timeout: 60000 }).then(() => true, () => false), 'the party is asked for its first command');
{
  const v = await pg.evaluate(() => { const g = window.__game, B = g.battle.B, nav = g.area.nav; return { tilt: g.look.viewTilt, free: B.units.every(u => !nav.blocked(u.hx, u.hz)), east: Math.min(...B.units.filter(u => u.side === 'hero').map(u => u.hx)) > Math.max(...B.units.filter(u => u.side === 'foe').map(u => u.hx)) }; });
  ok(Math.abs(v.tilt - 0.36) < 0.03, 'the camera has come down to the battle’s view (' + v.tilt.toFixed(2) + ')');
  ok(v.free && v.east, 'everyone stands on free ground, the party on the side the village is seen from');
}
await pg.waitForTimeout(200);
await shot('7-fight-in-place');
await fightOut();
await pg.waitForFunction(() => window.__game.mode === 'field', null, { timeout: 20000 }).catch(() => {});
await talkThrough();
i = await info();
ok(i.mode === 'field' && !i.busy && i.flags.includes('wisp'), 'won: back on the field where they stood, and the wisp is gone for good');
ok(await pg.evaluate(() => { const g = window.__game; return Math.abs(g.look.viewTilt - 0.576) < 0.01 && document.getElementById('opts').style.display !== 'none' && g.field.foes.find(f => f.id === 'doorwisp').beaten; }), 'the field has its view and its buttons back');

// the battle, through the door script
ok(await use('props', 'door'), 'the door under the bluff can be used');
await talkThrough();
ok(await pg.waitForFunction(() => window.__game.info().mode === 'battle' && window.__game.info().phase === 'command', null, { timeout: 120000 }).then(() => true, () => false), 'the battle starts');
ok(await pg.evaluate(() => !window.__game.battle.B.here && window.__game.shown !== window.__game.area), 'this one has its arena');
await pg.waitForTimeout(300);
await shot('8-battle');
const rounds = await fightOut();
await pg.waitForFunction(() => window.__game.mode === 'field' && window.__game.ui.talking(), null, { timeout: 20000 }).catch(() => {});
i = await info();
const won = i.flags.includes('won');
console.log('battle over after', rounds, 'rounds:', won ? 'won' : 'lost');
ok(i.mode === 'field', 'back in the village after the battle');
await talkThrough();
i = await info();
ok(!i.busy && i.area === 'brindlebrook' && i.look === 'gen', 'the battle’s closing script ran and the game is free again');
ok(await pg.evaluate(w => { const s = window.__game.store.load(); return !!s && !!s.flags.open && !!s.flags.won === w; }, won), 'the outcome was saved');
await pg.waitForTimeout(400);
await shot('9-after');

// past the hall: the door now leads down the Dark Stair, an area seen side-on and no other way, with jumping
if (won) {
  ok(await use('props', 'door'), 'with the hall won the door can still be used');
  await talkThrough(0);
  ok(await pg.waitForFunction(() => { const q = window.__game.info(); return q.area === 'darkstair' && !q.busy; }, null, { timeout: 120000 }).then(() => true, () => false), 'it leads down to the Dark Stair');
  await pg.waitForTimeout(800);
  ok(await pg.evaluate(() => { const g = window.__game; return !!g.look.strip && !!g.look.hd && document.getElementById('hd').hidden && document.getElementById('pad').classList.contains('on') && g.field.jumps; }), 'which is side-on at once, the stick and buttons on the picture and no view button');
  await pg.keyboard.press(' ');
  ok(await until('window.__game.field.hero.air', 2), 'the space bar jumps there');
  ok(await until('!window.__game.field.hero.air && window.__game.field.hero.y === 2', 3), 'and the leader comes down again');
  // a slab over the chasm is where its ledge is, moving
  const a0 = await pg.evaluate(() => window.__game.field.plat.ledges[0].z0);
  await pg.evaluate(() => window.__game.step(1));
  ok(Math.abs((await pg.evaluate(() => window.__game.field.plat.ledges[0].z0)) - a0) > 0.5, 'the slabs over the chasm glide');
  await shot('10-dark-stair');
  ok(await use('props', 'up'), 'the stair up can be used');
  await talkThrough(0);
  ok(await pg.waitForFunction(() => { const q = window.__game.info(); return q.area === 'brindlebrook' && !q.busy; }, null, { timeout: 60000 }).then(() => true, () => false), 'and leads back to the village');
  await pg.waitForTimeout(600);
  ok(await pg.evaluate(() => { const g = window.__game; return !g.look.strip && !g.look.hd && !document.getElementById('hd').hidden && !document.getElementById('pad').classList.contains('on'); }), 'where the view is the one it was left in');
}
// the other fork of the road: the cathedral, a second area seen side-on only, with no jumping
ok(await use('props', 'road'), 'the road again');
await talkThrough(0);
ok(await pg.waitForFunction(() => { const q = window.__game.info(); return q.area === 'cathedral' && !q.busy; }, null, { timeout: 120000 }).then(() => true, () => false), 'the pilgrim road leads to the cathedral');
await pg.waitForTimeout(800);
ok(await pg.evaluate(() => { const g = window.__game; return !!g.look.strip && !!g.look.hd && document.getElementById('hd').hidden && !g.field.jumps && document.title === 'Underhymn'; }), 'it is side-on, without jumping');
ok(await use('actors', 'verger'), 'the verger can be spoken to');
await talkThrough();
await shot('11-cathedral');
ok(await use('props', 'out'), 'the south door can be used');
await talkThrough(0);
ok(await pg.waitForFunction(() => { const q = window.__game.info(); return q.area === 'brindlebrook' && !q.busy; }, null, { timeout: 60000 }).then(() => true, () => false), 'and leads back down to the village');
ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 4).join(' | ') : ''));
await br.close();
process.exit(failed ? 1 : 0);
