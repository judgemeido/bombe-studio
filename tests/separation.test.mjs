import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createProduct, PARTS } from '../src/model.js';
import { fitCamera } from '../src/framing.js';

test('extraction clears the cabinet before lifting, parking or turning', () => {
  const product = createProduct();
  product.setExplode(.28);
  assert.ok(product.getBounds('drums').min.z > 3.5);
  assert.ok(product.getBounds('board').max.z < -4.5);
  assert.ok(Math.abs(product.parts[0].position.x) < 1e-9);
  assert.equal(product.parts[3].rotation.y, 0);
  product.setExplode(.4);
  assert.ok(product.getBounds('drums').min.y > product.getBounds('motor').max.y + .5);
  product.setExplode(.62);
  assert.ok(product.getBounds('drive').max.z < -2);
  assert.ok(product.getBounds('motor').min.z > 5);
  product.setExplode(.76);
  assert.equal(product.parts[3].rotation.y, 0);
  assert.equal(product.parts[3].position.x, 9);
  product.setExplode(0);
  assert.ok(product.getBounds('motor').max.y < 1.01 - .045, 'motor must remain below the lowest drum shaft');
  product.dispose();
});

test('all five systems have disjoint volumes throughout the display phase', () => {
  const product = createProduct();
  for (let sample = 62; sample <= 100; sample++) {
    product.setExplode(sample / 100);
    const boxes = PARTS.map(p => product.getBounds(p.id));
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const overlap = boxes[i].clone().intersect(boxes[j]);
      assert.ok(overlap.isEmpty(), `${PARTS[i].id} intersects ${PARTS[j].id} at ${sample}%`);
    }
  }
  product.dispose();
});

function projectBox(box, camera) {
  const projected = new THREE.Box2();
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
    const p = new THREE.Vector3(x, y, z).project(camera); projected.expandByPoint(new THREE.Vector2(p.x, p.y));
  }
  return projected;
}

test('camera fits every part during transitions and in mobile closeups', () => {
  const product = createProduct();
  for (const aspect of [.85, 1.85]) for (const progress of [0, .15, .28, .5, .7, .85, 1]) for (const view of ['front', 'three-quarter', 'back']) {
    product.setExplode(progress);
    for (const id of progress > 0 ? [null, ...PARTS.map(p => p.id)] : [null]) {
      const box = product.getBounds(id), pose = fitCamera(box, aspect, view, progress, Boolean(id));
      const camera = new THREE.PerspectiveCamera(33, aspect, .1, 220);
      camera.position.copy(pose.position); camera.lookAt(pose.target); camera.updateMatrixWorld(true);
      const rect = projectBox(box, camera);
      assert.ok(rect.min.x >= -.84 && rect.max.x <= .84 && rect.min.y >= -.79 && rect.max.y <= .79, `clipped ${id || 'overview'} ${aspect}/${progress}/${view}`);
    }
  }
  product.dispose();
});

test('every overview keeps all five projected silhouettes apart on desktop and mobile', () => {
  const product = createProduct(); product.setExplode(1);
  for (const aspect of [.85, 1.85]) for (const view of ['front', 'three-quarter', 'back']) {
    const pose = fitCamera(product.getBounds(), aspect, view, 1);
    const camera = new THREE.PerspectiveCamera(33, aspect, .1, 220);
    camera.position.copy(pose.position); camera.lookAt(pose.target); camera.updateMatrixWorld(true);
    const rects = PARTS.map(p => projectBox(product.getBounds(p.id), camera));
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
      assert.ok(rects[i].clone().intersect(rects[j]).isEmpty(), `screen overlap: ${view} ${PARTS[i].id}/${PARTS[j].id}`);
    }
  }
  product.dispose();
});
