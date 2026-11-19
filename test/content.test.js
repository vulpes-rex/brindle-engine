import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkContent } from '../tools/check-content.mjs';

test('the game data refers only to things that exist', async () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  assert.deepEqual(await checkContent(root), []);
});
