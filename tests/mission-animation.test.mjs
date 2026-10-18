import test from 'node:test';
import assert from 'node:assert/strict';
import { missionFrame } from '../src/mission-animation.js';
import { MISSION } from '../src/mission-engine.js';
import { encipher } from '../src/cipher.js';

const state = { phase: 'playing', stage: 5, paused: false, positions: [1, 3, 0], decoded: MISSION.plaintext };
test('pausing freezes the current decoded character, while reduced motion shows a static result', () => {
  const current = missionFrame(state, .8, { decodeStart: 0 });
  assert.deepEqual(missionFrame({ ...state, paused: true }, .8, { decodeStart: 0 }), current);
  const reduced = missionFrame(state, .8, { decodeStart: 0, reduced: true });
  assert.equal(reduced.outputLetter, MISSION.plaintext.at(-1));
  assert.deepEqual(reduced.positions, encipher(MISSION.ciphertext, [1, 3, 5], MISSION.pairs).positions);
});
test('search replay and lamp output cannot leak into the next stage or completion', () => {
  assert.equal(missionFrame({ ...state, stage: 6 }, .5, { searchStart: 0, decodeStart: 0 }).outputLetter, null);
  assert.equal(missionFrame({ ...state, stage: 6 }, .5, { searchStart: 0, decodeStart: 0 }).searchProgress, null);
  assert.equal(missionFrame({ ...state, phase: 'complete' }, .5, { decodeStart: 0 }).outputLetter, null);
});
