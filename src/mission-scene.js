import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createMissionModel } from './mission-model.js';
import { missionFrame } from './mission-animation.js';
import { MISSION_VIEWS, transitionFrame, advanceTransitionTime, inspectionBlend } from './mission-transition.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { replaceMissionEnvironment } from './mission-environment.js';

export function createMissionScene(canvas, { motion, onUnavailable = () => {}, onSignal = () => {} } = {}) {
  const view = canvas.ownerDocument.defaultView;
  let renderer, model, controls, observer, raf = 0, active = false, disposed = false, lost = false, state;
  let clock = 0, last = 0, searchStart = null, decodeStart = null, transition = null, environment;
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#142633');
  // The seven-room layout reaches well beyond the original desk vignette.
  const camera = new THREE.PerspectiveCamera(40, 1, .1, 160);
  const targetPosition = new THREE.Vector3(), targetLook = new THREE.Vector3(); let following = false;
  const fromInspection = new THREE.Vector3(), fromLook = new THREE.Vector3(); let inspectionStarted = 0;
  let selectedView = 'entry';
  function labelTexture(content, color, background, glyphs = null) {
    if (glyphs) {
      const c = canvas.ownerDocument.createElement('canvas'); c.width = c.height = 512;
      const ctx = c.getContext('2d'); ctx.fillStyle = background; ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '40px Georgia, serif';
      glyphs.forEach((g, i) => ctx.fillText(g, i % 8 * 64 + 32, Math.floor(i / 8) * 64 + 33, 56));
      const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4; return texture;
    }
    const c = canvas.ownerDocument.createElement('canvas'); c.width = content.length <= 2 ? 128 : 512; c.height = content.length <= 2 ? 128 : 256;
    const ctx = c.getContext('2d'); ctx.fillStyle = background; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lines = content.split('\n'); ctx.font = `${content.length <= 2 ? 75 : 31}px Georgia, serif`;
    lines.forEach((line, i) => ctx.fillText(line, c.width / 2, c.height / 2 + (i - (lines.length - 1) / 2) * 59, c.width * .92));
    const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4; return texture;
  }
  function resize() {
    if (disposed || !renderer) return;
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height, false);
    if (!transition) setView(selectedView, true);
    draw();
  }
  function fitPosition(p, t) {
    const target = new THREE.Vector3(...t);
    return new THREE.Vector3(...p).sub(target).multiplyScalar(Math.max(1, .95 / camera.aspect)).add(target);
  }
  function setView(name, immediate = motion?.matches || state?.paused) {
    selectedView = name;
    canvas.dataset.cameraView = name; canvas.dataset.cameraSettled = String(Boolean(immediate));
    controls.maxDistance = name === 'floor' ? 90 : 40;
    const { camera: p, target: t } = MISSION_VIEWS[name] || MISSION_VIEWS.entry; targetPosition.copy(fitPosition(p, t)); targetLook.set(...t);
    following = !immediate;
    fromInspection.copy(camera.position); fromLook.copy(controls.target); inspectionStarted = view.performance.now();
    if (immediate) { camera.position.copy(targetPosition); controls.target.copy(targetLook); controls.update(); }
    draw();
  }
  function setZone(name, immediate = motion?.matches || state?.paused) {
    model?.setZone(name);
    setView(name, immediate);
    return model?.zones?.find(zone => zone.id === name) || null;
  }
  function draw() {
    if (!active || disposed || lost || !state) return;
    const reduced = Boolean(motion?.matches);
    const projection = missionFrame(state, clock, { searchStart, decodeStart, reduced });
    if (!state.paused) model.update(state, clock, { reduced, ...projection, lidOpen: transition?.projection?.lidOpen ?? 1 });
    model.setZone(selectedView);
    onSignal(projection);
    renderer.render(scene, camera);
    const stats = `${renderer.info.render.calls} calls / ${renderer.info.render.triangles} triangles`;
    if (canvas.dataset.renderStats !== stats) canvas.dataset.renderStats = stats;
    canvas.dataset.renderResources = `${renderer.info.memory.geometries} geometries / ${renderer.info.memory.textures} textures`;
  }
  function frame(now) {
    raf = 0;
    if (!active || disposed || lost || motion?.matches || state?.paused || transition?.paused || canvas.ownerDocument.hidden) return;
    const dt = Math.min((now - (last || now)) / 1000, .05);
    if (transition) {
      transition.elapsed = advanceTransitionTime(transition.elapsed, now, last); applyTransition();
    } else clock += dt;
    last = now;
    if (following && !transition) {
      const blend = inspectionBlend(now, inspectionStarted);
      camera.position.lerpVectors(fromInspection, targetPosition, blend); controls.target.lerpVectors(fromLook, targetLook, blend);
      if (blend === 1) { following = false; canvas.dataset.cameraSettled = 'true'; }
    }
    if (!transition) controls.update(); draw();
    if (transition?.projection.done) {
      const done = transition.onComplete; transition = null; controls.enabled = active && !state?.paused;
      done?.();
    }
    if (!raf) raf = view.requestAnimationFrame(frame);
  }
  function schedule() { if (!raf && active && !lost && !disposed && !motion?.matches && !state?.paused && !transition?.paused && !canvas.ownerDocument.hidden) { last = 0; raf = view.requestAnimationFrame(frame); } }
  function applyTransition() {
    const p = transitionFrame(transition, transition.elapsed); transition.projection = p;
    const position = fitPosition(p.camera, p.target), target = new THREE.Vector3(...p.target);
    if (transition.kind === 'stage') { position.lerpVectors(transition.fromCamera, position, p.blend); target.lerpVectors(transition.fromTarget, target, p.blend); }
    camera.position.copy(position); controls.target.copy(target); camera.lookAt(target);
    transition.onFrame?.(p);
  }
  function cancelTransition() {
    transition = null; controls.enabled = active && !state?.paused;
    // Restore the inspection pose even when the intro was interrupted mid-lid motion.
    if (state) model.update(state, clock, { ...missionFrame(state, clock, { searchStart, decodeStart, reduced: Boolean(motion?.matches) }), lidOpen: 1 });
  }
  function contextLost(event) { event.preventDefault(); lost = true; view.cancelAnimationFrame(raf); raf = 0; onUnavailable(true); }
  function rebuildEnvironment() {
    environment = replaceMissionEnvironment(scene, () => {
      const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
      try { return pmrem.fromScene(room, .04); }
      finally { room.dispose(); pmrem.dispose(); }
    }, environment);
  }
  function restored() {
    try { rebuildEnvironment(); lost = false; onUnavailable(false); resize(); schedule(); }
    catch { lost = true; onUnavailable(true); }
  }
  function visibility() { if (canvas.ownerDocument.hidden) { view.cancelAnimationFrame(raf); raf = 0; } else { schedule(); draw(); } }
  const stopFollowing = () => { following = false; };
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(view.devicePixelRatio || 1, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rebuildEnvironment(); scene.environmentIntensity = .3;
    scene.add(new THREE.HemisphereLight('#bdcfda', '#6a4d32', 1.55));
    const key = new THREE.DirectionalLight('#d9e7ec', 2.5); key.position.set(-12, 22, 14); key.target.position.set(2, 0, -3); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -29, right: 29, top: 19, bottom: -19, far: 85 }); key.shadow.bias = -.00015; key.shadow.normalBias = .018; scene.add(key, key.target);
    const fill = new THREE.DirectionalLight('#f3d6a8', 1.55); fill.position.set(5, 12, 18); scene.add(fill);
    model = createMissionModel({ labelTexture }); scene.add(model.root);
    for (const anchor of model.practicals) anchor.add(new THREE.PointLight('#ffc786', 9, 7, 2));
    const lamp = new THREE.PointLight('#ffd091', 3.4, 3.5, 2); model.lampAnchor.add(lamp);
    controls = new OrbitControls(camera, canvas); controls.enableDamping = !motion?.matches; controls.enablePan = false;
    controls.minDistance = 2; controls.maxDistance = 40; controls.minPolarAngle = .2; controls.maxPolarAngle = Math.PI / 2.04;
    controls.minAzimuthAngle = -Math.PI * .92; controls.maxAzimuthAngle = Math.PI * .92;
    controls.addEventListener('start', stopFollowing); controls.addEventListener('change', draw);
    setView('entry', true);
    observer = new view.ResizeObserver(resize); observer.observe(canvas);
    canvas.addEventListener('webglcontextlost', contextLost); canvas.addEventListener('webglcontextrestored', restored);
    canvas.ownerDocument.addEventListener('visibilitychange', visibility);
  } catch (error) { observer?.disconnect(); controls?.dispose(); model?.dispose(); environment?.dispose(); renderer?.dispose(); throw error; }
  return {
    setState(next) {
      if (!state?.results.length && next.results.length) searchStart = clock;
      if (!state?.decoded && next.decoded) decodeStart = clock;
      if (!next.results.length) searchStart = null;
      if (!next.decoded) decodeStart = null;
      state = next; controls.enabled = active && !next.paused && !transition; controls.enableDamping = !motion?.matches;
      draw(); schedule();
    },
    setView,
    setZone,
    playTransition(options) {
      if (disposed || lost || !active) { options.onComplete?.(); return; }
      following = false; controls.enabled = false;
      transition = { ...options, elapsed: 0, paused: false, fromCamera: camera.position.clone(), fromTarget: controls.target.clone() };
      applyTransition(); draw(); schedule();
    },
    skipTransition() {
      if (!transition) return;
      transition.elapsed = 100; applyTransition(); draw();
      const done = transition.onComplete; cancelTransition(); done?.();
    },
    cancelTransition,
    pauseTransition(value) { if (!transition) return; transition.paused = value; if (value) { view.cancelAnimationFrame(raf); raf = 0; } else schedule(); },
    setActive(value) { active = value; controls.enabled = value && !state?.paused && !transition; if (!value) { view.cancelAnimationFrame(raf); raf = 0; } else { resize(); schedule(); } },
    inspect() { return { ready: !lost, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures, clock, transition: transition ? { kind: transition.kind, elapsed: transition.elapsed, paused: transition.paused } : null, camera: camera.position.toArray() }; },
    dispose() {
      if (disposed) return; disposed = true; transition = null; view.cancelAnimationFrame(raf); observer.disconnect();
      canvas.removeEventListener('webglcontextlost', contextLost); canvas.removeEventListener('webglcontextrestored', restored); canvas.ownerDocument.removeEventListener('visibilitychange', visibility);
      controls.removeEventListener('start', stopFollowing); controls.removeEventListener('change', draw); controls.dispose(); model.dispose(); environment.dispose(); renderer.dispose(); scene.clear();
    },
  };
}
