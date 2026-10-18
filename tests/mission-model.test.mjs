import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3 } from 'three';
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
