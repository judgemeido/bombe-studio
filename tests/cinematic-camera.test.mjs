import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createCinematicCamera, CINEMATIC_CUES } from '../src/cinematic-camera.js';

function fixture(reduced = false) {
  const camera = new THREE.PerspectiveCamera(33, 16 / 9, .1, 220);
  camera.position.set(11, 7, 16);
  const controls = { target: new THREE.Vector3(0, 3.2, 0), update() {} };
  const product = {
    rotorCount: 108,
    getBounds() { return new THREE.Box3(new THREE.Vector3(-3.8, 0, -1.2), new THREE.Vector3(3.8, 6.6, 1.2)); },
    getRotorAnchor(index) { return new THREE.Vector3((index % 12 - 5.5) * .545, 5.15 + Math.floor(index / 12) * .2, 1.1); },
    getAnchor(id) { return id === 'board' ? new THREE.Vector3(0, 3.35, -1.1) : new THREE.Vector3(); },
  };
  return { camera, controls, product, controller: createCinematicCamera({ camera, controls, product, getAspect: () => camera.aspect, reduced: () => reduced }) };
}

test('cinematic camera exposes authored beats and completes a full rail', () => {
  const { camera, controls, controller } = fixture();
  assert.equal(CINEMATIC_CUES.length, 5);
  assert.equal(controller.isActive, false);
  controller.start();
  assert.equal(controller.isActive, true);
  assert.equal(controller.currentCue, 'wide');
  controller.update(2.5);
  assert.equal(controller.currentCue, 'rotor');
  controller.update(3.5);
  assert.equal(controller.currentCue, 'sweep');
  controller.update(3.5);
  assert.equal(controller.currentCue, 'rear');
  controller.update(2.5);
  assert.equal(controller.currentCue, 'return');
  controller.update(3.1);
  assert.equal(controller.isActive, false);
  assert.ok(camera.position.length() > 1);
  assert.ok(controls.target.y > 0);
  controller.dispose();
});

test('manual interruption preserves the current pose and repeated starts do not drift', () => {
  const { camera, controls, controller } = fixture();
  controller.start(); controller.update(1.2);
  const position = camera.position.clone(), target = controls.target.clone();
  controller.interrupt();
  assert.equal(controller.isActive, false);
  assert.ok(camera.position.distanceTo(position) < .000001);
  assert.ok(controls.target.distanceTo(target) < .000001);
  controller.start(); controller.update(15.1); controller.start(); controller.update(15.1);
  assert.ok(camera.position.distanceTo(position) > .001);
  controller.dispose();
});

test('reduced motion settles at the rotor beat without starting an animation loop', () => {
  const { camera, controls, product, controller } = fixture(true);
  controller.start();
  assert.equal(controller.isActive, false);
  const rotor = product.getRotorAnchor(84);
  assert.ok(controls.target.distanceTo(rotor) < .001);
  assert.ok(camera.position.distanceTo(controls.target) > 2);
  controller.dispose();
});
