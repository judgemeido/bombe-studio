/** Render targets have no CPU pixels to re-upload after WebGL context restoration. */
export function replaceMissionEnvironment(scene, createTarget, previous) {
  const next = createTarget();
  scene.environment = next.texture;
  previous?.dispose();
  return next;
}
