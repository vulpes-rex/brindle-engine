import test from 'node:test';
import assert from 'node:assert/strict';
import { makeSave, parseSave, SaveStore, SAVE_VERSION } from '../engine/save.js';

const state = { area: 'town', x: 1.23456, z: -52.004, yaw: 0.78539816, flags: { asked: true, key: true, gone: false }, items: { tonic: 5 } };

test('a save round-trips and keeps only what is set', () => {
  const s = makeSave(state);
  assert.equal(s.v, SAVE_VERSION);
  assert.deepEqual(s.flags, ['asked', 'key']);
  assert.equal(s.x, 1.23);
  const back = parseSave(JSON.stringify(s), ['town']);
  assert.deepEqual(back, { area: 'town', x: 1.23, z: -52, yaw: 0.785, flags: { asked: true, key: true }, items: { tonic: 5 }, data: {} });
});

test('saves that cannot be trusted are refused', () => {
  const s = makeSave(state);
  assert.equal(parseSave('not json'), null);
  assert.equal(parseSave(JSON.stringify(Object.assign({}, s, { v: 99 }))), null);
  assert.equal(parseSave(JSON.stringify(s), ['elsewhere']), null);
  assert.equal(parseSave(JSON.stringify(Object.assign({}, s, { x: 'left' }))), null);
  assert.equal(parseSave(JSON.stringify(Object.assign({}, s, { flags: [1] }))), null);
  assert.deepEqual(parseSave(JSON.stringify(Object.assign({}, s, { items: { tonic: -2, gem: 'many', oil: 1.9 } }))).items, { oil: 1 });
});

test('the store saves, loads and clears; storage that throws or is missing is survived', () => {
  const mem = new Map(),
    storage = { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, v), removeItem: k => mem.delete(k) },
    store = new SaveStore(storage, 'k', ['town']);
  assert.equal(store.load(), null);
  assert.equal(store.save(state), true);
  assert.equal(store.load().area, 'town');
  store.clear();
  assert.equal(store.load(), null);
  const broken = new SaveStore({ getItem() { throw new Error('no'); }, setItem() { throw new Error('full'); }, removeItem() { throw new Error('no'); } }, 'k');
  assert.equal(broken.load(), null);
  assert.equal(broken.save(state), false);
  broken.clear();
  assert.equal(new SaveStore(null, 'k').save(state), false);
});

test('a game\'s own state is saved with the rest', () => {
  const s = makeSave(Object.assign({}, state, { data: { party: [{ id: 'a', poise: 7 }], ember: 2 } }));
  assert.deepEqual(parseSave(JSON.stringify(s), ['town']).data, { party: [{ id: 'a', poise: 7 }], ember: 2 });
  assert.deepEqual(parseSave(JSON.stringify(Object.assign({}, s, { data: [1, 2] })), ['town']).data, {});
});
