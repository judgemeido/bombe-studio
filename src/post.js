import { HalfFloatType, WebGLRenderTarget } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export function createPostStack({ renderer, scene, camera, container } = {}) {
  if (!renderer || !scene || !camera) throw new TypeError('post stack requires renderer, scene, and camera');
  let composer = null, target = null, enabled = true, running = false, disposed = false;
  const passes = [];
  try {
    if (!renderer.isWebGLRenderer) throw new TypeError('GPU postprocessing requires a WebGLRenderer');
    // Canvas antialiasing does not apply to a composer's offscreen buffers.
    // Multisample the beauty target instead of blurring the engraved marks.
    target = new WebGLRenderTarget(1, 1, {
      type: HalfFloatType, samples: Math.min(4, renderer.capabilities?.maxSamples || 0),
    });
    composer = new EffectComposer(renderer, target);
    passes.push(new RenderPass(scene, camera), new OutputPass());
    passes.forEach(pass => composer.addPass(pass));
  } catch {
    passes.forEach(pass => pass.dispose?.()); passes.length = 0;
    if (composer) composer.dispose(); else target?.dispose();
    composer = target = null;
  }
  function resize() {
    if (!composer || !container || disposed) return;
    // Dimensions stay in CSS pixels. Apply the renderer's DPR exactly once,
    // including when a mobile resize changes its rendering budget.
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(Math.max(1, container.clientWidth || 1), Math.max(1, container.clientHeight || 1));
  }
  function setEnabled(value) { enabled = Boolean(value); }
  function setRunning(value) {
    running = Boolean(value);
  }
  function render(dt = 0) {
    if (disposed) return;
    renderer.info?.reset();
    if (composer && enabled) composer.render(dt);
    else renderer.render(scene, camera);
  }
  function inspect() {
    return { active: Boolean(composer), enabled, running, disposed, bloomStrength: 0,
      pixelRatio: renderer.getPixelRatio(), samples: composer?.renderTarget1.samples ?? 0,
      width: composer?.renderTarget1.width ?? 0, height: composer?.renderTarget1.height ?? 0 };
  }
  resize();
  return {
    render, resize, setEnabled, setRunning, inspect,
    dispose() {
      if (disposed) return;
      disposed = true; passes.forEach(pass => pass.dispose?.()); passes.length = 0;
      composer?.dispose(); composer = target = null;
    },
  };
}
