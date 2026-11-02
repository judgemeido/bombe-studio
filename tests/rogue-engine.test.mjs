import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ROGUE_ROLES,
  createRogueRun,
  reduceRogueRun,
  selectRogueNode,
  scoreRogueRun,
  applyRogueEnding,
} from '../src/rogue-engine.js';

test('same seed and role produce the same four-layer route', () => {
  const first = createRogueRun('classroom-1941', { role: 'intercept' });
  const second = createRogueRun('classroom-1941', { role: 'intercept' });

  assert.deepEqual(first, second);
  assert.equal(first.route.length, 4);
  for (const layer of first.route) assert.equal(layer.nodes.length, 2);
});

test('event choices add floor evidence and apply bounded reserve and tool rewards', () => {
  let run = { ...createRogueRun('event-loop', { role: 'intercept' }), phase: 'route' };
  assert.ok(run.evidence.some(item => item.type === 'source'));
  run = selectRogueNode(run, run.route[0].nodes[0].id);
  const choice = run.currentNode.options[0];
  run = reduceRogueRun(run, { type: 'resolve', choiceId: choice.id });

  assert.equal(run.phase, 'event-complete');
  assert.ok(run.evidence.some(item => item.type === 'source'));
  assert.ok(run.resources.reserve >= 0 && run.resources.reserve <= 3);
  assert.ok(run.inventory.length <= 2);
});

test('reserve depletion unlocks assistance but never blocks the remaining route', () => {
  let run = { ...createRogueRun('no-soft-lock', { role: 'mechanic' }), phase: 'route' };
  run = { ...run, resources: { reserve: 0 } };
  for (let depth = 0; depth < 4; depth++) {
    run = selectRogueNode(run, run.route[depth].nodes[0].id);
    run = reduceRogueRun(run, { type: 'resolve', choiceId: run.currentNode.options.find(item => !item.success).id });
    assert.equal(run.resources.reserve, 0);
    assert.equal(run.assistance, true);
    run = reduceRogueRun(run, { type: 'continue' });
  }
  assert.equal(run.phase, 'final');
});

test('tools are consumed once and inventory stays capped at two', () => {
  let run = createRogueRun('tools', { role: 'archive' });
  run = { ...run, inventory: [{ id: 'lens', effect: 'hint' }, { id: 'tea', effect: 'reserve' }] };
  run = reduceRogueRun(run, { type: 'use-tool', toolId: 'tea' });
  assert.equal(run.resources.reserve, 3);
  assert.equal(run.inventory.length, 1);
  assert.deepEqual(reduceRogueRun(run, { type: 'use-tool', toolId: 'tea' }), run);
});

test('final rotor submission decrypts the dispatch and handoff produces a replayable archive grade', () => {
  let run = { ...createRogueRun('final-case', { role: 'intercept' }), phase: 'route' };
  for (let depth = 0; depth < 4; depth++) {
    run = selectRogueNode(run, run.route[depth].nodes[0].id);
    run = reduceRogueRun(run, { type: 'resolve', choiceId: run.currentNode.options.find(item => item.success).id });
    run = reduceRogueRun(run, { type: 'continue' });
  }
  const wrongRight = (run.caseFile.solutionRight + 1) % 26;
  run = reduceRogueRun(run, { type: 'submit-right', value: String.fromCharCode(65 + wrongRight) });
  run = reduceRogueRun(run, { type: 'submit-right', value: String.fromCharCode(65 + run.caseFile.solutionRight) });
  assert.equal(run.phase, 'handoff');
  assert.equal(run.decoded, run.caseFile.plaintext);
  run = applyRogueEnding(run, 'hold');
  assert.equal(run.phase, 'complete');
  assert.equal(scoreRogueRun(run).grade, 'complete');
});

test('run creation accepts only a declared role', () => {
  assert.ok(ROGUE_ROLES.length >= 3);
  assert.throws(() => createRogueRun('seed', { role: 'cryptanalyst' }), /未知岗位/);
});

test('only a visible current-layer node can be selected', () => {
  const run = { ...createRogueRun('route-gate', { role: 'archive' }), phase: 'route' };
  const selected = selectRogueNode(run, run.route[0].nodes[0].id);

  assert.equal(selected.phase, 'event');
  assert.equal(selected.currentNode.id, run.route[0].nodes[0].id);
  assert.deepEqual(selectRogueNode(run, run.route[1].nodes[0].id), run);
  assert.deepEqual(selectRogueNode(selected, run.route[0].nodes[1].id), selected);
});
