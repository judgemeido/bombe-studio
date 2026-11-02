import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('flat 05 game stylesheet is part of the served public assets', () => {
  return readFile(new URL('../dev-server.mjs', import.meta.url), 'utf8').then(source => {
    assert.match(source, /'rogue\.css'/);
  });
});
