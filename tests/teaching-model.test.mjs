import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createLabModel, LAB_DIM } from '../src/lab-model.js';
import { pressKey } from '../src/cipher.js';

// CPU geometry checks only. The canvas stub does not claim to validate textures
// or GPU output; those require a separately authorized browser acceptance run.
function withCanvas(fn) {
  const previous = globalThis.document;
  globalThis.document = { createElement() { return { width: 0, height: 0, getContext() { return { fillRect() {}, save() {}, restore() {}, translate() {}, rotate() {}, fillText() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, arc() {} }; } }; } };
  try { fn(); } finally { if (previous === undefined) delete globalThis.document; else globalThis.document = previous; }
}
test('the retained 3D model distinguishes reflector, rotor and plugboard clicks', () => withCanvas(() => {
  const model = createLabModel(); model.root.updateMatrixWorld(true);
  const ray = new THREE.Raycaster();
  const pick = (x, y) => { ray.set(new THREE.Vector3(x, y, 10), new THREE.Vector3(0, 0, -1)); return model.pick(ray.intersectObjects(model.pickables, true)[0]); };
  assert.deepEqual(pick(-5.05, 3.65), { kind: 'reflector' });
  assert.deepEqual(pick(LAB_DIM.pitch, LAB_DIM.drumY + 1), { kind: 'rotor', index: 2 });
  assert.deepEqual(pick(-6 * LAB_DIM.portPitch, 1.1), { kind: 'wiring', port: 0 });
  assert.equal(model.pick(undefined), null); assert.equal(model.contactCount, 78); assert.equal(model.portCount, 26);
  model.setTopic('wiring'); assert.equal(model.pickables[0].visible, false); const narrow = model.getBounds();
  model.setTopic('drums'); assert.equal(model.pickables[0].visible, true); assert.ok(model.getBounds().max.y > narrow.max.y);
  model.dispose();
}));

test('question changes replace signal resources, preserve finite geometry and dispose once', () => withCanvas(() => {
  const model = createLabModel(), trace = pressKey('C', [0, 0, 0], [['A', 'C']]);
  model.setPositions(trace.positions, true); model.setConnection(['A', 'C']); model.setTrace(trace); model.update(.016, 4.5, true);
  let oldSignalGeometry;
  model.root.children[2].traverse(o => { if (o.isMesh && o.geometry.type === 'TubeGeometry') oldSignalGeometry = o.geometry; });
  let released = 0; oldSignalGeometry.addEventListener('dispose', () => released++);
  model.setTrace(null); assert.equal(released, 1);
  model.setTrace(trace); model.setSpread(1); model.setSpread(0); model.update(.016, 9, true);
  assert.ok(!model.getBounds().isEmpty());
  const resources = new Set();
  model.root.traverse(o => {
    if (!o.isMesh) return;
    for (const value of o.geometry.attributes.position.array) assert.ok(Number.isFinite(value));
    resources.add(o.geometry); resources.add(o.material); if (o.material.map) resources.add(o.material.map);
  });
  const counts = new Map([...resources].map(resource => [resource, 0]));
  for (const resource of resources) resource.addEventListener('dispose', () => counts.set(resource, counts.get(resource) + 1));
  model.dispose(); model.dispose();
  for (const count of counts.values()) assert.equal(count, 1);
}));
