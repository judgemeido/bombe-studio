import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createMissionModel } from './mission-model.js';
import { missionFrame } from './mission-animation.js';

export function createMissionScene(canvas, { motion, onUnavailable = () => {}, onSignal = () => {} } = {}) {
  const view = canvas.ownerDocument.defaultView;
  let renderer, model, controls, observer, raf = 0, active = false, disposed = false, lost = false, state;
  let clock = 0, last = 0, searchStart = null, decodeStart = null;
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#142832');
  const camera = new THREE.PerspectiveCamera(40, 1, .1, 60);
  const frames = { desk: [[5.7, 4.5, 7.6], [0, 1.45, -.3]], rotors: [[2.15, 3.55, 3.95], [-.22, 1.43, .08]], bombe: [[4.4, 3.1, 3.6], [1.6, 1.9, -.9]] };
  const targetPosition = new THREE.Vector3(), targetLook = new THREE.Vector3(); let following = false;
  function labelTexture(content, color, background) {
    const c = canvas.ownerDocument.createElement('canvas'); c.width = 512; c.height = 256;
    const ctx = c.getContext('2d'); ctx.fillStyle = background; ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lines = content.split('\n'); ctx.font = `${content.length === 1 ? 170 : 35}px Georgia, serif`;
    lines.forEach((line, i) => ctx.fillText(line, 256, 128 + (i - (lines.length - 1) / 2) * 59));
    const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 2; return texture;
  }
  function resize() {
    if (disposed || !renderer) return;
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height, false);
    draw();
  }
  function setView(name, immediate = motion?.matches) {
    const [p, t] = frames[name] || frames.desk; targetPosition.set(...p); targetLook.set(...t);
    following = !immediate;
    if (immediate) { camera.position.copy(targetPosition); controls.target.copy(targetLook); controls.update(); }
    draw();
  }
  function draw() {
    if (!active || disposed || lost || !state) return;
    const reduced = Boolean(motion?.matches);
    const projection = missionFrame(state, clock, { searchStart, decodeStart, reduced });
    if (!state.paused) model.update(state, clock, { reduced, ...projection });
    onSignal(projection);
    renderer.render(scene, camera);
  }
  function frame(now) {
    raf = 0;
    if (!active || disposed || lost || motion?.matches || state?.paused || canvas.ownerDocument.hidden) return;
    clock += Math.min((now - (last || now)) / 1000, .05); last = now;
    if (following) {
      camera.position.lerp(targetPosition, .055); controls.target.lerp(targetLook, .055);
      if (camera.position.distanceTo(targetPosition) < .015) following = false;
    }
    controls.update(); draw(); raf = view.requestAnimationFrame(frame);
  }
  function schedule() { if (!raf && active && !lost && !disposed && !motion?.matches && !state?.paused && !canvas.ownerDocument.hidden) { last = 0; raf = view.requestAnimationFrame(frame); } }
  function contextLost(event) { event.preventDefault(); lost = true; view.cancelAnimationFrame(raf); raf = 0; onUnavailable(true); }
  function restored() { lost = false; onUnavailable(false); resize(); schedule(); }
  function visibility() { if (canvas.ownerDocument.hidden) { view.cancelAnimationFrame(raf); raf = 0; } else { schedule(); draw(); } }
  const stopFollowing = () => { following = false; };
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(view.devicePixelRatio || 1, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene.add(new THREE.HemisphereLight('#d0e4e7', '#544333', 2.5));
    const key = new THREE.DirectionalLight('#fff2d3', 3.1); key.position.set(-3, 7, 5); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -4, far: 20 }); key.shadow.bias = -.001; scene.add(key);
    const fill = new THREE.DirectionalLight('#a7c9e0', 1.8); fill.position.set(3, 4, -2); scene.add(fill);
    const lamp = new THREE.PointLight('#ffd091', 4, 4, 2); lamp.position.set(1.25, 1.78, .7); scene.add(lamp);
    model = createMissionModel({ labelTexture }); scene.add(model.root);
    controls = new OrbitControls(camera, canvas); controls.enableDamping = !motion?.matches; controls.enablePan = false;
    controls.minDistance = 2; controls.maxDistance = 13; controls.minPolarAngle = .25; controls.maxPolarAngle = Math.PI / 2.04;
    controls.minAzimuthAngle = -Math.PI / 2.1; controls.maxAzimuthAngle = Math.PI / 2.1;
    controls.addEventListener('start', stopFollowing); controls.addEventListener('change', draw);
    setView('desk', true);
    observer = new view.ResizeObserver(resize); observer.observe(canvas);
    canvas.addEventListener('webglcontextlost', contextLost); canvas.addEventListener('webglcontextrestored', restored);
    canvas.ownerDocument.addEventListener('visibilitychange', visibility);
  } catch (error) { observer?.disconnect(); controls?.dispose(); model?.dispose(); renderer?.dispose(); throw error; }
  return {
    setState(next) {
      if (!state?.results.length && next.results.length) searchStart = clock;
      if (!state?.decoded && next.decoded) decodeStart = clock;
      if (!next.results.length) searchStart = null;
      if (!next.decoded) decodeStart = null;
      state = next; controls.enabled = !next.paused; controls.enableDamping = !motion?.matches;
      draw(); schedule();
    },
    setView,
    setActive(value) { active = value; controls.enabled = value && !state?.paused; if (!value) { view.cancelAnimationFrame(raf); raf = 0; } else { resize(); schedule(); } },
    inspect() { return { ready: !lost, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures, clock }; },
    dispose() {
      if (disposed) return; disposed = true; view.cancelAnimationFrame(raf); observer.disconnect();
      canvas.removeEventListener('webglcontextlost', contextLost); canvas.removeEventListener('webglcontextrestored', restored); canvas.ownerDocument.removeEventListener('visibilitychange', visibility);
      controls.removeEventListener('start', stopFollowing); controls.removeEventListener('change', draw); controls.dispose(); model.dispose(); renderer.dispose(); scene.clear();
    },
  };
}
