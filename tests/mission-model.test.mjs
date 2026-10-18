import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Vector3 } from 'three';
import { createMissionModel } from '../src/mission-model.js';

test('room has inspectable machines and bounded geometry; state changes animate rotors', () => {
  const model = createMissionModel();
  for (const name of ['enigma', 'radio', 'bombe', 'desk', 'window']) assert.ok(model.root.getObjectByName(name), name);
  assert.equal(model.rotors.length, 3); assert.equal(model.drums.length, 27);
  const box = new Box3().setFromObject(model.root);
  assert.ok(box.max.x - box.min.x < 12); assert.ok(Number.isFinite(box.max.y));
  const before = model.rotors.map(r => r.rotation.x);
  model.update({ stage: 3, positions: [1, 3, 0], channel: 1, pair: 'A' }, 1, { reduced: true });
  assert.notDeepEqual(model.rotors.map(r => r.rotation.x), before);
  let released = 0; const geometry = model.rotors[0].children[0].geometry;
  geometry.addEventListener('dispose', () => released++);
  model.dispose(); model.dispose(); assert.equal(released, 1);
});

test('a pressed key carries its letter with it and releases as a single assembly', () => {
  const model = createMissionModel();
  try {
    const key = model.keys.find(k => k.userData.letter === 'W');
    const label = key.getObjectByName('key-letter');
    const state = { stage: 5, positions: [1, 3, 5], channel: 1, pair: 'A' };
    model.root.updateMatrixWorld(true);
    const before = label.getWorldPosition(new Vector3()).y;
    model.update(state, 1, { reduced: true, inputLetter: 'W', outputLetter: 'D' });
    model.root.updateMatrixWorld(true);
    assert.ok(label.getWorldPosition(new Vector3()).y < before - .015);
    assert.equal(model.lamps.filter(l => l.material.emissiveIntensity > 1).length, 1);
    model.update(state, 2, { reduced: true }); model.root.updateMatrixWorld(true);
    assert.equal(label.getWorldPosition(new Vector3()).y, before);
  } finally { model.dispose(); }
});

test('the arrival lid is articulated at its hinge and returns to the open inspection pose', () => {
  const model = createMissionModel();
  try {
    const state = { stage: 0, positions: [0, 0, 0], channel: null, pair: null };
    model.update(state, 0, { reduced: true, lidOpen: 0 });
    const closed = model.lid.rotation.x;
    model.update(state, 10, { reduced: true, lidOpen: 1 });
    assert.ok(Math.abs(closed - model.lid.rotation.x) > .5);
    // At the rear rotor centre, even the lowest animated lid edge clears the rotor top.
    const lidHeightAtRotor = .18 + .4 / Math.tan(closed);
    assert.ok(lidHeightAtRotor > .49 + .237);
  } finally { model.dispose(); }
});
