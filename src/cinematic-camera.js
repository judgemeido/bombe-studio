import * as THREE from 'three';

export const CINEMATIC_CUES = Object.freeze([
  { id: 'wide', duration: 2.5 },
  { id: 'rotor', duration: 3.5 },
  { id: 'sweep', duration: 3.5 },
  { id: 'rear', duration: 2.5 },
  { id: 'return', duration: 3 },
]);

const ease = value => value * value * (3 - 2 * value);
const shortestTurn = (from, to) => THREE.MathUtils.euclideanModulo(to - from + Math.PI, Math.PI * 2) - Math.PI;

function buildCues(product) {
  const bounds = product.getBounds();
  const centre = bounds.getCenter(new THREE.Vector3());
  const rotor = product.getRotorAnchor(Math.min(product.rotorCount - 1, 84));
  const sweep = product.getRotorAnchor(Math.min(product.rotorCount - 1, 95));
  const board = product.getAnchor('board');
  return [
    { ...CINEMATIC_CUES[0], position: centre.clone().add(new THREE.Vector3(9.2, 4.3, 15.8)), target: centre.clone().add(new THREE.Vector3(0, -.15, 0)) },
    { ...CINEMATIC_CUES[1], position: rotor.clone().add(new THREE.Vector3(3.1, 1.35, 5.2)), target: rotor.clone() },
    { ...CINEMATIC_CUES[2], position: sweep.clone().add(new THREE.Vector3(-3.3, 1.1, 5.8)), target: sweep.clone().add(new THREE.Vector3(0, -.35, 0)) },
    { ...CINEMATIC_CUES[3], position: board.clone().add(new THREE.Vector3(-4.1, 2.6, -5.5)), target: board.clone().add(new THREE.Vector3(0, .25, 0)) },
    { ...CINEMATIC_CUES[4], position: centre.clone().add(new THREE.Vector3(9.2, 4.3, 15.8)), target: centre.clone().add(new THREE.Vector3(0, -.15, 0)) },
  ];
}

export function createCinematicCamera({ camera, controls, product, getAspect = () => camera.aspect, reduced = () => false } = {}) {
  if (!camera || !controls || !product) throw new TypeError('cinematic camera requires camera, controls, and product');
  let active = false, disposed = false, cueIndex = 0, elapsed = 0, currentCue = null;
  let frames = [], fromPosition = new THREE.Vector3(), fromTarget = new THREE.Vector3(), toPosition = new THREE.Vector3(), toTarget = new THREE.Vector3();
  const offsetA = new THREE.Vector3(), offsetB = new THREE.Vector3(), nextTarget = new THREE.Vector3(), spherical = new THREE.Spherical();

  function applyPose(position, target) {
    camera.position.copy(position); controls.target.copy(target); controls.update?.();
  }

  function applyInterpolated(t) {
    const eased = ease(THREE.MathUtils.clamp(t, 0, 1));
    nextTarget.lerpVectors(fromTarget, toTarget, eased);
    offsetA.copy(fromPosition).sub(fromTarget); offsetB.copy(toPosition).sub(toTarget);
    const a = new THREE.Spherical().setFromVector3(offsetA), b = new THREE.Spherical().setFromVector3(offsetB);
    spherical.radius = THREE.MathUtils.lerp(Math.max(2, a.radius), Math.max(2, b.radius), eased);
    spherical.phi = THREE.MathUtils.lerp(a.phi, b.phi, eased);
    spherical.theta = a.theta + shortestTurn(a.theta, b.theta) * eased;
    camera.position.setFromSpherical(spherical).add(nextTarget); controls.target.copy(nextTarget); controls.update?.();
  }

  function beginCue(index) {
    cueIndex = index; elapsed = 0; currentCue = frames[index]?.id || null;
    fromPosition.copy(camera.position); fromTarget.copy(controls.target);
    toPosition.copy(frames[index].position); toTarget.copy(frames[index].target);
  }

  function start() {
    if (disposed) return;
    frames = buildCues(product);
    if (reduced()) {
      applyPose(frames[1].position, frames[1].target);
      active = false; cueIndex = 1; elapsed = frames[1].duration; currentCue = frames[1].id; return;
    }
    active = true; beginCue(0);
  }

  function stop() { active = false; }
  function interrupt() { active = false; }

  function update(dt) {
    if (!active || disposed || !Number.isFinite(dt) || dt <= 0) return;
    let remaining = Math.min(dt, 30);
    while (active && remaining > 0) {
      const cue = frames[cueIndex], duration = Math.max(.001, cue.duration), step = Math.min(remaining, duration - elapsed);
      elapsed += step; remaining -= step; applyInterpolated(elapsed / duration);
      if (elapsed < duration) continue;
      applyPose(toPosition, toTarget);
      if (cueIndex >= frames.length - 1) { active = false; break; }
      beginCue(cueIndex + 1);
    }
  }

  return {
    start,
    stop,
    interrupt,
    update,
    get isActive() { return active; },
    get currentCue() { return currentCue; },
    get aspect() { return getAspect(); },
    dispose() { if (disposed) return; disposed = true; active = false; frames = []; },
  };
}
