import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export function createPostStack({ renderer, scene, camera, container } = {}) {
  if (!renderer || !scene || !camera) throw new TypeError('post stack requires renderer, scene, and camera');
  let composer = null, bloom = null, enabled = true, running = false, disposed = false;
  try {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass({ x: 1, y: 1 }, .08, .55, .9);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  } catch {
    composer?.dispose?.(); composer = null; bloom = null;
  }
  function resize() {
    if (!composer || !container) return;
    const width = Math.max(1, container.clientWidth || 1), height = Math.max(1, container.clientHeight || 1);
    composer.setSize(width, height);
  }
  function setEnabled(value) { enabled = Boolean(value); }
  function setRunning(value) {
    running = Boolean(value);
    if (bloom) bloom.strength = running ? .34 : .08;
  }
  function render(dt = 0) {
    if (disposed) return;
    if (composer && enabled) composer.render(dt);
    else renderer.render(scene, camera);
  }
  function inspect() { return { active: Boolean(composer), enabled, running, disposed }; }
  resize();
  return {
    render, resize, setEnabled, setRunning, inspect,
    dispose() {
      if (disposed) return;
      disposed = true; composer?.dispose?.(); composer = null; bloom = null;
    },
  };
}
