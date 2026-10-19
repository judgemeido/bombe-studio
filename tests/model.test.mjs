import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createProduct, DIM, PARTS } from '../src/model.js';

test('108 drums and five systems form a finite, grounded cabinet', () => {
  const product = createProduct();
  const box = new THREE.Box3().setFromObject(product.root);
  const size = box.getSize(new THREE.Vector3());
  assert.equal(product.drumCount, DIM.banks * DIM.rows * DIM.columns);
  assert.equal(product.drumCount, 108);
  assert.deepEqual(product.parts.map(p => p.name), PARTS.map(p => p.id));
  assert.ok(size.x >= DIM.width && size.x < DIM.width + .4);
  assert.ok(size.y > 6.5 && size.y < 6.9);
  assert.ok(size.z > DIM.depth && size.z < 3.5);
  assert.ok(box.min.y >= -.1);
  product.root.traverse(o => { if (o.isMesh) for (const v of o.geometry.attributes.position.array) assert.ok(Number.isFinite(v)); });
  product.dispose();
});

test('the cabinet exposes a readable front detail kit', () => {
  const product = createProduct();
  const names = new Set();
  product.root.traverse(object => { if (object.name) names.add(object.name); });
  for (const name of ['front-control-deck', 'indicator-bank', 'service-hatches', 'cable-loom', 'drive-belt']) {
    assert.ok(names.has(name), `missing detail component: ${name}`);
  }
  assert.ok(product.detailCount >= 5);
  product.dispose();
});

test('the rotor contract exposes named motion layers and camera anchors', () => {
  const product = createProduct();
  const names = new Set();
  product.root.traverse(object => { if (object.name) names.add(object.name); });
  for (const name of ['rotor-detail', 'rotor-signal', 'camera-anchor']) {
    assert.ok(names.has(name), `missing rotor contract group: ${name}`);
  }
  assert.equal(product.rotorCount, 108);
  assert.ok(product.getRotorAnchor(0).isVector3);
  assert.ok(product.getRotorAnchor(107).isVector3);
  product.dispose();
});

test('rotor details expose component counts and animate as one phase', () => {
  const product = createProduct();
  const names = new Set();
  product.root.traverse(object => { if (object.name) names.add(object.name); });
  for (const name of ['rotor-face-rings', 'rotor-hubs', 'rotor-contact-rings', 'rotor-index-markers', 'rotor-fasteners', 'signal-pulse']) {
    assert.ok(names.has(name), `missing rotor detail component: ${name}`);
  }
  assert.deepEqual(product.detailStats, { faceRings: 108, hubs: 108, contactRings: 108, indexMarkers: 108, fasteners: 864, signals: 108 });
  const signal = product.parts.find(part => part.name === 'drums').getObjectByName('signal-pulse');
  const before = signal.instanceMatrix.array.slice();
  product.update(.05, true);
  assert.notDeepEqual(signal.instanceMatrix.array, before);
  const phase = product.phase;
  const running = signal.instanceMatrix.array.slice();
  product.update(1, false);
  assert.equal(product.phase, phase);
  assert.deepEqual(signal.instanceMatrix.array, running);
  product.resetMotion();
  assert.deepEqual(signal.instanceMatrix.array, before);
  product.dispose();
});

test('repeated explode and restore preserve base transforms without drift', () => {
  const product = createProduct();
  const base = product.parts.map(p => p.position.clone());
  const before = new THREE.Box3().setFromObject(product.root).getSize(new THREE.Vector3()).x;
  product.setExplode(1);
  assert.ok(new THREE.Box3().setFromObject(product.root).getSize(new THREE.Vector3()).x > before + 5);
  assert.ok(Math.abs(product.parts.find(p => p.name === 'board').rotation.y - Math.PI) < .00001);
  for (let i = 0; i < 100; i++) { product.setExplode(.7); product.setExplode(0); }
  product.parts.forEach((p, i) => assert.ok(p.position.equals(base[i])));
  assert.equal(product.parts.find(p => p.name === 'board').rotation.y, 0);
  product.dispose();
});

test('explosion clamps invalid input and anchors follow their own part', () => {
  const product = createProduct();
  const before = product.getAnchor('drums'); product.setExplode(2);
  assert.equal(product.explode, 1);
  const after = product.getAnchor('drums'); assert.ok(after.distanceTo(before) > 3);
  product.setExplode(NaN); assert.equal(product.explode, 0);
  product.setExplode(-.1); assert.equal(product.explode, 0);
  assert.ok(product.getAnchor('drums').distanceTo(before) < .000001);
  assert.equal(product.getAnchor('missing'), null); product.dispose();
});

test('running advances the drum pose, pause is stable, reset is exact', () => {
  const product = createProduct();
  const faces = product.parts.find(p => p.name === 'drums').children.find(o => o.isInstancedMesh && o.geometry.type === 'CircleGeometry');
  const initial = faces.instanceMatrix.array.slice();
  product.update(.05, true); assert.ok(product.phase > 0);
  assert.notDeepEqual(faces.instanceMatrix.array, initial);
  const phase = product.phase; product.update(1, false); assert.equal(product.phase, phase);
  product.update(NaN, true); assert.equal(product.phase, phase);
  product.resetMotion(); assert.equal(product.phase, 0); assert.deepEqual(faces.instanceMatrix.array, initial);
  product.dispose();
});

test('dispose releases shared resources once and detaches the model', () => {
  const product = createProduct(), scene = new THREE.Scene(); scene.add(product.root);
  const resources = new Set();
  product.root.traverse(o => { if (o.isMesh) { resources.add(o.geometry); resources.add(o.material); } });
  const counts = new Map([...resources].map(r => [r, 0]));
  for (const r of resources) r.addEventListener('dispose', () => counts.set(r, counts.get(r) + 1));
  product.dispose(); product.dispose();
  assert.equal(product.root.parent, null);
  for (const count of counts.values()) assert.equal(count, 1);
});
