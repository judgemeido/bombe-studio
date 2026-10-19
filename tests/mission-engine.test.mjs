import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MISSION,
  alignmentConflicts,
  initialMission,
  reduceMission,
  searchCandidates,
} from '../src/mission-engine.js';
import { encipher } from '../src/cipher.js';

const apply = (state, ...actions) => actions.reduce(reduceMission, state);
const begin = () => reduceMission(initialMission(), { type: 'start' });
const next = state => reduceMission(state, { type: 'next' });

test('mission exposes fifteen private beats across the connected world', () => {
  assert.equal(MISSION.stages.length, 15);
  assert.deepEqual(MISSION.stages.map(beat => beat.id), Array.from({ length: 15 }, (_, i) => `S${String(i + 1).padStart(2, '0')}`));
  assert.deepEqual([...new Set(MISSION.stages.map(beat => beat.zone))], [
    'entrance', 'radio', 'archive', 'analysis', 'machine', 'map', 'handoff',
  ]);
  for (const beat of MISSION.stages) {
    for (const key of ['id', 'zone', 'speaker', 'story', 'goal', 'actions', 'success', 'clue', 'hints', 'discussion', 'transition']) {
      assert.ok(beat[key] !== undefined, `${beat.id} is missing ${key}`);
    }
    assert.ok(Array.isArray(beat.actions) && beat.actions.length > 0);
    assert.ok(!('title' in beat), `${beat.id} should not expose a stage title`);
  }
  assert.equal(MISSION.stages.reduce((total, beat) => total + beat.seconds, 0), 900);
  assert.doesNotMatch(JSON.stringify(MISSION), /7 个行动节点|约 15 分钟解密游戏|可随时暂停/);
});

test('cipher data still comes from the real Enigma circuit', () => {
  assert.equal(MISSION.plaintext, 'DXWETTERNORDHAFENFREI');
  assert.equal(MISSION.strip, MISSION.ciphertext);
  assert.equal(encipher(MISSION.ciphertext, [1, 3, 5], [['A', 'G']]).output, MISSION.plaintext);
  assert.notEqual(encipher(MISSION.ciphertext, [1, 3, 4], [['A', 'G']]).output, MISSION.plaintext);
  assert.equal(MISSION.plaintext.slice(2, 8), 'WETTER');
});

test('crib alignment rejects the two false offsets', () => {
  assert.ok(alignmentConflicts(0).length);
  assert.ok(alignmentConflicts(1).length);
  assert.deepEqual(alignmentConflicts(2), []);
  assert.throws(() => alignmentConflicts(-1), /对齐/);
});

test('candidate search evaluates all 26 right rotor settings', () => {
  const results = searchCandidates([1, 3, 0]);
  assert.equal(results.length, 26);
  assert.deepEqual(results.filter(result => result.matches).map(result => result.key), ['BDF']);
  for (const result of results) {
    assert.equal(result.output, encipher(MISSION.ciphertext.slice(0, 8), result.positions, [['A', 'G']]).output.slice(2));
  }
});

test('the reducer starts at S01 and keeps the current zone in sync', () => {
  const initial = initialMission();
  assert.equal(initial.phase, 'briefing');
  assert.equal(initial.stage, 0);
  assert.equal(initial.beat, 0);
  assert.equal(initial.beatId, 'S01');
  assert.equal(initial.currentZone, 'entrance');
  const active = begin();
  assert.equal(active.phase, 'playing');
  assert.equal(active.currentZone, 'entrance');
  assert.deepEqual(active.evidence, []);
});

test('each solved beat appends evidence and next cannot skip an uncleared beat', () => {
  let state = begin();
  assert.deepEqual(reduceMission(state, { type: 'next' }), state);
  const flow = [
    [{ type: 'checkin', value: 'ready' }],
    [{ type: 'channel', value: 1 }, { type: 'submit' }],
    [{ type: 'order', value: 'chronological' }, { type: 'submit' }],
    [{ type: 'archive', value: 'weather' }, { type: 'submit' }],
    [{ type: 'crib', value: 'WETTER' }, { type: 'submit' }],
    [{ type: 'align', value: 2 }, { type: 'submit' }],
    [{ type: 'relation', value: 'A-G' }, { type: 'submit' }],
    [{ type: 'pair', value: 'A' }, { type: 'submit' }],
    [{ type: 'rotor', index: 0, value: 1 }, { type: 'rotor', index: 1, value: 3 }, { type: 'submit' }],
    [{ type: 'search' }],
    [{ type: 'answer', value: 'candidate' }],
    [{ type: 'decode' }],
    [{ type: 'map', value: 'north-harbor' }],
    [{ type: 'verify', value: 'cross-check' }],
    [{ type: 'handoff', value: 'hold' }],
  ];
  for (const [index, actions] of flow.entries()) {
    state = apply(state, ...actions);
    assert.equal(state.cleared, true, `beat ${index + 1} should clear`);
    assert.equal(state.evidence.length, index + 1);
    assert.equal(state.clues.length, index + 1);
    assert.equal(state.evidence.at(-1).beatId, `S${String(index + 1).padStart(2, '0')}`);
    if (index < flow.length - 1) {
      state = next(state);
      assert.equal(state.cleared, false);
      assert.equal(state.stage, index + 1);
      assert.equal(state.beat, index + 1);
      assert.equal(state.beatId, `S${String(index + 2).padStart(2, '0')}`);
      assert.equal(state.currentZone, MISSION.stages[index + 1].zone);
    }
  }
  state = next(state);
  assert.equal(state.phase, 'complete');
  assert.equal(state.stage, 14);
  assert.equal(state.beatId, 'S15');
  assert.equal(state.evidence.length, 15);
});

test('later beat actions are rejected until the current evidence is complete', () => {
  let state = begin();
  for (const action of [
    { type: 'decode' }, { type: 'search' }, { type: 'map', value: 'north-harbor' },
    { type: 'verify', value: 'cross-check' }, { type: 'handoff', value: 'hold' },
  ]) {
    assert.deepEqual(reduceMission(state, action), state);
  }
  state = apply(state, { type: 'checkin', value: 'ready' }, { type: 'next' });
  assert.equal(state.beatId, 'S02');
  assert.deepEqual(reduceMission(state, { type: 'order', value: 'chronological' }), state);
  assert.deepEqual(reduceMission(state, { type: 'channel', value: 0 }), { ...state, channel: 0 });
});

test('search and decode require the real candidate evidence', () => {
  let state = begin();
  const setup = [
    { type: 'checkin', value: 'ready' }, { type: 'next' },
    { type: 'channel', value: 1 }, { type: 'submit' }, { type: 'next' },
    { type: 'order', value: 'chronological' }, { type: 'submit' }, { type: 'next' },
    { type: 'archive', value: 'weather' }, { type: 'submit' }, { type: 'next' },
    { type: 'crib', value: 'WETTER' }, { type: 'submit' }, { type: 'next' },
    { type: 'align', value: 2 }, { type: 'submit' }, { type: 'next' },
    { type: 'relation', value: 'A-G' }, { type: 'submit' }, { type: 'next' },
    { type: 'pair', value: 'A' }, { type: 'submit' }, { type: 'next' },
    { type: 'rotor', index: 0, value: 1 }, { type: 'rotor', index: 1, value: 3 }, { type: 'submit' }, { type: 'next' },
  ];
  state = apply(state, ...setup);
  assert.equal(state.beatId, 'S10');
  assert.deepEqual(reduceMission(state, { type: 'answer', value: 'candidate' }), state);
  state = apply(state, { type: 'search' }, { type: 'next' });
  assert.equal(state.beatId, 'S11');
  assert.equal(state.results.length, 26);
  assert.equal(state.selectedCandidate, null);
  const wrong = reduceMission(state, { type: 'answer', value: 'finished' });
  assert.equal(wrong.cleared, false);
  assert.equal(wrong.attempts, state.attempts + 1);
  state = apply(state, { type: 'answer', value: 'candidate' }, { type: 'next' });
  assert.equal(state.beatId, 'S12');
  assert.equal(state.candidate.key, 'BDF');
  assert.deepEqual(reduceMission(state, { type: 'answer', value: 'route' }), state);
  state = apply(state, { type: 'decode' });
  assert.equal(state.decoded, MISSION.plaintext);
  assert.equal(state.cleared, true);
});

test('wrong attempts remain recoverable and pause blocks all work', () => {
  let state = begin();
  state = apply(state, { type: 'tick', seconds: 4 }, { type: 'pause' });
  assert.equal(state.elapsed, 4);
  for (const action of [
    { type: 'tick', seconds: 5 }, { type: 'checkin', value: 'ready' },
    { type: 'submit' }, { type: 'next' },
  ]) assert.deepEqual(reduceMission(state, action), state);
  state = apply(state, { type: 'resume' }, { type: 'checkin', value: 'wrong' });
  assert.equal(state.cleared, false);
  assert.equal(state.attempts, 1);
  assert.ok(state.feedback);
  state = apply(state, { type: 'checkin', value: 'ready' }, { type: 'next' });
  assert.equal(state.beatId, 'S02');
});

test('restart clears all evidence and resets the private beat cursor', () => {
  let state = apply(begin(), { type: 'checkin', value: 'ready' }, { type: 'next' });
  assert.equal(state.evidence.length, 1);
  assert.deepEqual(reduceMission(state, { type: 'restart' }), initialMission());
});
