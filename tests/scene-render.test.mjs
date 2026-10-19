import test from 'node:test';
import assert from 'node:assert/strict';
import { createPostStack } from '../src/post.js';

function renderer() {
  return { calls: 0, render() { this.calls++; }, setSize() {}, getPixelRatio() { return 1; } };
}

test('post stack falls back to the renderer and exposes stable inspection', () => {
  const target = renderer();
  const stack = createPostStack({ renderer: target, scene: {}, camera: {}, container: { clientWidth: 640, clientHeight: 360 } });
  assert.equal(stack.inspect().active, false);
  stack.render(.016);
  assert.equal(target.calls, 1);
  stack.setEnabled(false);
  assert.equal(stack.inspect().enabled, false);
  stack.dispose(); stack.dispose();
  assert.equal(stack.inspect().disposed, true);
});

test('post stack resize and running intensity are safe without WebGL', () => {
  const target = renderer();
  const stack = createPostStack({ renderer: target, scene: {}, camera: {}, container: { clientWidth: 1280, clientHeight: 720 } });
  stack.resize(); stack.setRunning(true); assert.equal(stack.inspect().running, true);
  stack.setRunning(false); assert.equal(stack.inspect().running, false);
  stack.dispose();
});
