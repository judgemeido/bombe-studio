import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene, Texture } from 'three';
import { replaceMissionEnvironment } from '../src/mission-environment.js';

test('context restoration replaces the GPU environment and releases the previous target once', () => {
  const scene = new Scene(), oldTexture = new Texture(), restoredTexture = new Texture();
  let releases = 0;
  const old = { texture: oldTexture, dispose() { releases++; } };
  const next = { texture: restoredTexture, dispose() {} };
  scene.environment = oldTexture;
  const result = replaceMissionEnvironment(scene, () => next, old);
  assert.equal(scene.environment, restoredTexture); assert.equal(result, next); assert.equal(releases, 1);
});

test('failed environment regeneration leaves ownership intact for retry or disposal', () => {
  const scene = new Scene(), texture = new Texture(); let released = false; scene.environment = texture;
  assert.throws(() => replaceMissionEnvironment(scene, () => { throw new Error('GPU unavailable'); }, { dispose() { released = true; } }));
  assert.equal(scene.environment, texture); assert.equal(released, false);
});
