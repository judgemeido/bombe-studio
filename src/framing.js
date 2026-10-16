import * as THREE from 'three';

// Fit all eight corners, including their depth. A width-only zoom factor clips
// the tall inspection layout on mobile and cannot frame the small motor.
export function fitCamera(bounds, aspect, view = 'three-quarter', progress = 0, focused = false) {
  const centre = bounds.getCenter(new THREE.Vector3());
  const directions = { front: [0, .055, 1], 'three-quarter': [.487, .18, .874], back: [-.45, .16, -.88] };
  const direction = new THREE.Vector3(...(directions[view] || directions['three-quarter'])).normalize();
  if (!focused && view !== 'front') {
    const inspection = new THREE.Vector3(view === 'back' ? -.14 : .14, .085, view === 'back' ? -1 : 1).normalize();
    direction.lerp(inspection, THREE.MathUtils.smoothstep(progress, .2, .9)).normalize();
  }
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), direction).normalize();
  const up = new THREE.Vector3().crossVectors(direction, right).normalize();
  const tanV = Math.tan(THREE.MathUtils.degToRad(33) / 2), tanH = tanV * Math.max(.1, aspect);
  let distance = 4;
  for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
    const relative = new THREE.Vector3(x, y, z).sub(centre), depth = relative.dot(direction);
    distance = Math.max(distance, Math.abs(relative.dot(right)) / (tanH * .83) + depth, Math.abs(relative.dot(up)) / (tanV * .78) + depth);
  }
  return { target: centre, position: centre.clone().addScaledVector(direction, distance) };
}
