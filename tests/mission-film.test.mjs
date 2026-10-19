import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const entry = await readFile(new URL('../tools/mission-film/src/index.jsx', import.meta.url), 'utf8');
const packageJson = JSON.parse(await readFile(new URL('../tools/mission-film/package.json', import.meta.url), 'utf8'));

test('mission film exposes optional prologue, transit, and handoff compositions', () => {
  for (const id of ['Prologue', 'ZoneTransit', 'Handoff']) assert.match(entry, new RegExp(`id=\\"${id}\\"`));
  assert.doesNotMatch(entry, /id=\"Arrival\"/);
  assert.match(entry, /useCurrentFrame/);
  assert.match(entry, /createMissionModel/);
});

test('film commands render local optional artifacts without network dependencies', () => {
  assert.match(packageJson.scripts.render, /Prologue/);
  assert.match(packageJson.scripts.still, /Prologue/);
  assert.equal(packageJson.scripts.studio, 'remotion studio src/index.jsx --no-open');
  assert.doesNotMatch(entry, /https?:\/\//);
});
