import test from 'node:test';
import assert from 'node:assert/strict';
import { transitionFrame, advanceTransitionTime } from '../src/mission-transition.js';

test('arrival ends in the radio task with an open machine and clamped time', () => {
  const start = transitionFrame({ kind: 'arrival', stage: 0 }, -2);
  assert.equal(start.progress, 0); assert.equal(start.done, false);
  const end = transitionFrame({ kind: 'arrival', stage: 0 }, 100);
  assert.equal(end.progress, 1); assert.equal(end.done, true); assert.equal(end.lidOpen, 1);
  assert.ok(end.camera.every(Number.isFinite));
});

test('arrival camera path is continuous and model transforms stay bounded', () => {
  let prior = transitionFrame({ kind: 'arrival', stage: 0 }, 0);
  for (let t = .02; t <= 10.02; t += .02) {
    const frame = transitionFrame({ kind: 'arrival', stage: 0 }, t);
    assert.ok(Math.hypot(...frame.camera.map((v, i) => v - prior.camera[i])) < .15);
    assert.ok(frame.lidOpen >= 0 && frame.lidOpen <= 1);
    prior = frame;
  }
});

test('all task transitions have a finite endpoint, preserve open lid and readable captions', () => {
  for (let stage = 1; stage <= 7; stage++) {
    const frame = transitionFrame({ kind: 'stage', stage }, 3);
    assert.equal(frame.done, true); assert.equal(frame.lidOpen, 1);
    assert.ok(frame.caption.length > 5); assert.ok(frame.target.every(Number.isFinite));
  }
});

test('slow frames preserve the authored duration and a resumed clock ignores paused time', () => {
  assert.equal(advanceTransitionTime(1, 2600, 1000), 2.6);
  assert.equal(advanceTransitionTime(2.6, 9000, 0), 2.6);
  assert.equal(advanceTransitionTime(2.6, 8800, 9000), 2.6);
});

test('world rails cover the seven spaces and the fifteen internal beats', async () => {
  const { MISSION_VIEWS, STAGE_VIEWS } = await import('../src/mission-transition.js');
  assert.ok(['entry', 'radio', 'archive', 'analysis', 'machine', 'map', 'handoff'].every(id => MISSION_VIEWS[id]));
  assert.equal(STAGE_VIEWS.length, 15);
  for (let stage = 0; stage < STAGE_VIEWS.length; stage++) {
    const frame = transitionFrame({ kind: 'stage', stage }, 3);
    assert.equal(frame.done, true);
    assert.ok(frame.camera.every(Number.isFinite));
    assert.ok(frame.target.every(Number.isFinite));
    assert.ok(frame.zone, `transition zone ${stage}`);
  }
  for (const zone of ['entry', 'radio', 'archive', 'analysis', 'machine', 'map', 'handoff']) {
    const frame = transitionFrame({ kind: 'zone', zone }, 3);
    assert.equal(frame.zone, zone);
    assert.equal(frame.done, true);
  }
  assert.equal(transitionFrame({ kind: 'handoff' }, 4).zone, 'handoff');
});
