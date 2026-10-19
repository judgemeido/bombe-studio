import test from 'node:test';
import assert from 'node:assert/strict';
import { initialMission, reduceMission, MISSION, searchCandidates, alignmentConflicts } from '../src/mission-engine.js';
import { encipher } from '../src/cipher.js';

const apply = (state, ...actions) => actions.reduce(reduceMission, state);
const begin = () => reduceMission(initialMission(), { type: 'start' });
function through(stage) {
  let s = begin();
  const answers = [
    [{ type: 'channel', value: 1 }, { type: 'submit' }],
    [{ type: 'align', value: 2 }, { type: 'submit' }],
    [{ type: 'pair', value: 'A' }, { type: 'submit' }],
    [{ type: 'rotor', index: 0, value: 1 }, { type: 'rotor', index: 1, value: 3 }, { type: 'submit' }],
    [{ type: 'search' }, { type: 'answer', value: 'candidate' }],
    [{ type: 'decode' }, { type: 'answer', value: 'route' }],
    [{ type: 'answer', value: 'verify' }],
  ];
  for (let i = 0; i < stage; i++) s = apply(s, ...answers[i], { type: 'next' });
  return { s, answers };
}
test('seven stages budget fifteen focused minutes and ciphertext comes from the real cipher', () => {
  assert.equal(MISSION.stages.length, 7);
  assert.equal(MISSION.stages.reduce((n, s) => n + s.seconds, 0), 900);
  assert.equal(MISSION.plaintext, 'DXWETTERNORDHAFENFREI');
  assert.match(MISSION.stages[0].story, /黎明前|交接|巡逻/);
  assert.match(MISSION.stages[6].success, /航线|交接|暂缓/);
  assert.equal(encipher(MISSION.ciphertext, [1, 3, 5], [['A', 'G']]).output, MISSION.plaintext);
  assert.notEqual(encipher(MISSION.ciphertext, [1, 3, 4], [['A', 'G']]).output, MISSION.plaintext);
});

test('alignment actually checks every position, rejecting two false offsets', () => {
  assert.ok(alignmentConflicts(0).length);
  assert.ok(alignmentConflicts(1).length);
  assert.deepEqual(alignmentConflicts(2), []);
  assert.throws(() => alignmentConflicts(-1), /对齐/);
});
test('candidate search evaluates all 26 possible right-rotor settings', () => {
  const results = searchCandidates([1, 3, 0]);
  assert.equal(results.length, 26);
  assert.deepEqual(results.filter(x => x.matches).map(x => x.key), ['BDF']);
  for (const r of results) assert.equal(r.output, encipher(MISSION.ciphertext.slice(0, 8), r.positions, [['A', 'G']]).output.slice(2));
});
test('alignment and full verification share one continuously stepped ciphertext', () => {
  assert.equal(MISSION.strip, MISSION.ciphertext);
  assert.equal(encipher(MISSION.strip, [1, 3, 5], [['A', 'G']]).output, MISSION.plaintext);
  assert.equal(MISSION.plaintext.slice(2, 8), 'WETTER');
});
test('wrong attempts are recoverable and next cannot skip unsolved stages', () => {
  let s = begin();
  assert.equal(reduceMission(s, { type: 'next' }).stage, 0);
  s = apply(s, { type: 'channel', value: 0 }, { type: 'submit' });
  assert.equal(s.cleared, false); assert.equal(s.attempts, 1); assert.ok(s.feedback);
  s = apply(s, { type: 'channel', value: 1 }, { type: 'submit' });
  assert.equal(s.cleared, true); assert.equal(s.clues.length, 1);
  assert.equal(reduceMission(s, { type: 'submit' }).clues.length, 1);
});
test('search and decode evidence are required before accepting conclusions', () => {
  let { s } = through(4);
  assert.equal(reduceMission(s, { type: 'answer', value: 'candidate' }).cleared, false);
  s = apply(s, { type: 'search' }, { type: 'answer', value: 'candidate' }, { type: 'next' });
  assert.equal(reduceMission(s, { type: 'answer', value: 'weather' }).cleared, false);
  s = apply(s, { type: 'decode' }, { type: 'answer', value: 'route' });
  assert.equal(s.decoded, MISSION.plaintext); assert.equal(s.cleared, true);
});
test('complete playthrough retains seven clues; restart clears all progress', () => {
  const { s } = through(7);
  assert.equal(s.phase, 'complete'); assert.equal(s.clues.length, 7);
  assert.equal(s.stage, 6);
  assert.deepEqual(reduceMission(s, { type: 'restart' }), initialMission());
});
test('pause blocks task actions and elapsed time, hint never advances', () => {
  let s = apply(begin(), { type: 'tick', seconds: 4 }, { type: 'pause' });
  assert.equal(s.elapsed, 4);
  for (const action of [{ type: 'tick', seconds: 50 }, { type: 'channel', value: 1 }, { type: 'submit' }, { type: 'next' }]) assert.deepEqual(reduceMission(s, action), s);
  s = apply(s, { type: 'resume' }, { type: 'hint' }, { type: 'hint' }, { type: 'hint' });
  assert.equal(s.hint, 2); assert.equal(s.stage, 0); assert.equal(s.cleared, false);
});
test('invalid inputs and actions belonging to other stages do not corrupt state', () => {
  const s = begin();
  for (const a of [{ type: 'decode' }, { type: 'search' }, { type: 'rotor', index: 9, value: 400 }, { type: 'align', value: 99 }, { type: 'channel', value: -1 }, { type: 'tick', seconds: -1 }]) assert.deepEqual(reduceMission(s, a), s);
});
