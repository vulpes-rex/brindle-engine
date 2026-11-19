import test from 'node:test';
import assert from 'node:assert/strict';
import { runScript, test as cond, checkScript } from '../engine/script.js';

// a host that records what a script asked for; says, battles and travel finish on the next tick, as the real ones finish later
function host(flags = {}, items = {}) {
  const log = [];
  return {
    log,
    flags,
    items,
    flag: n => !!flags[n],
    set: (n, v) => (v ? (flags[n] = true) : delete flags[n], log.push((v ? 'set ' : 'unset ') + n)),
    has: i => items[i] || 0,
    give: (i, n) => ((items[i] = (items[i] || 0) + n), log.push('give ' + i + ' ' + n)),
    say: (lines, cb) => (log.push('say ' + lines.map(l => l[1]).join('|')), setTimeout(cb, 0)),
    battle: (id, cb) => (log.push('battle ' + id), setTimeout(cb, 0)),
    go: (area, at, cb) => (log.push('go ' + area + ' ' + at), setTimeout(cb, 0)),
    do: (st, cb) => (log.push('do ' + st.do + ' ' + (st.n || '')), setTimeout(cb, 0))
  };
}
const run = (script, h) => new Promise(res => runScript(script, h, res));

test('conditions: flags, negation, all, any, has', () => {
  const h = host({ key: true }, { tonic: 2 });
  assert.equal(cond('key', h), true);
  assert.equal(cond('!key', h), false);
  assert.equal(cond('!open', h), true);
  assert.equal(cond(null, h), true);
  assert.equal(cond({ all: ['key', '!open'] }, h), true);
  assert.equal(cond({ any: ['open', 'won'] }, h), false);
  assert.equal(cond({ has: 'tonic', n: 2 }, h), true);
  assert.equal(cond({ has: 'tonic', n: 3 }, h), false);
  assert.throws(() => cond({ nope: 1 }, h));
});

test('lines in a row are one conversation; steps between them split it', async () => {
  const h = host();
  await run([['A', 'one'], ['A', 'two'], { set: 'met' }, ['', 'three']], h);
  assert.deepEqual(h.log, ['say one|two', 'set met', 'say three']);
});

test('case takes the first branch that holds, and falls to null', async () => {
  const script = [{ case: [['won', [['', 'won']]], ['key', [['', 'key']]], [null, [['', 'else']]]] }];
  let h = host({ key: true });
  await run(script, h);
  assert.deepEqual(h.log, ['say key']);
  h = host();
  await run(script, h);
  assert.deepEqual(h.log, ['say else']);
});

test('if / else, give, battle and go run in order and wait for each other', async () => {
  const h = host({}, { tonic: 1 });
  await run([{ if: 'open', then: [['', 'no']], else: [{ give: 'tonic', n: 2 }, { battle: 'b1' }, ['', 'after'], { go: 'isle', at: 'jetty' }] }, { set: 'done' }], h);
  assert.deepEqual(h.log, ['give tonic 2', 'battle b1', 'say after', 'go isle jetty', 'set done']);
  assert.equal(h.items.tonic, 3);
});

test('stop ends the whole script from inside a branch', async () => {
  const h = host();
  await run([{ if: null, then: [['', 'a'], { stop: true }, ['', 'never']] }, ['', 'never either']], h);
  assert.deepEqual(h.log, ['say a']);
});

test('an empty script is done at once; an unknown step is an error', () => {
  let done = false;
  runScript([], host(), () => (done = true));
  assert.equal(done, true);
  assert.throws(() => runScript([{ dance: true }], host()));
});

test('checkScript finds what a script refers to that does not exist', () => {
  const known = { items: ['tonic'], battles: ['b1'], spawns: { isle: ['jetty'] } };
  assert.deepEqual(checkScript([['A', 'hi'], { give: 'tonic' }, { battle: 'b1' }, { go: 'isle', at: 'jetty' }, { case: [['x', []], [null, [{ set: 'y' }]]] }], 's', known), []);
  const bad = checkScript([['A'], { give: 'gold' }, { battle: 'b2' }, { go: 'isle', at: 'cave' }, { go: 'moon', at: 'x' }, { hop: 1 }, { if: { has: 'gem' }, then: [] }], 's', known);
  assert.equal(bad.length, 7);
});

test('a game\'s own steps run in order and are checked by name', async () => {
  const h = host();
  await new Promise(res => runScript([['', 'one'], { do: 'rest', n: 2 }, ['', 'two']], h, res));
  assert.deepEqual(h.log, ['say one', 'do rest 2', 'say two']);
  assert.deepEqual(checkScript([{ do: 'rest' }], 's', { actions: ['rest'] }), []);
  assert.equal(checkScript([{ do: 'nap' }], 's', { actions: ['rest'] }).length, 1);
});
