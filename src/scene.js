import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { fitCamera } from './framing.js';
export function createStage(canvas, container) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.23;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(33, 1, .1, 220), target = new THREE.Vector3(0, 3.2, 0);
  camera.position.set(9.2, 6.6, 16.5);
  const controls = new OrbitControls(camera, canvas); controls.target.copy(target); controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = .07;
  controls.minDistance = 3; controls.maxDistance = 140; controls.minPolarAngle = .35; controls.maxPolarAngle = Math.PI / 2 - .035; controls.rotateSpeed = .65;
  let environment;
  function restoreEnvironment() {
    const envScene = new RoomEnvironment(), pmrem = new THREE.PMREMGenerator(renderer);
    try {
      const next = pmrem.fromScene(envScene, .04), previous = environment;
      scene.environment = next.texture; environment = next; previous?.dispose();
    } finally { envScene.dispose(); pmrem.dispose(); }
  }
  restoreEnvironment(); scene.environmentIntensity = .85;
  // Render-target contents are lost with the context; regenerate the reflection
  // environment after Three.js restores its renderer, before the next frame.
  canvas.addEventListener('webglcontextrestored', restoreEnvironment);
  scene.add(new THREE.HemisphereLight(0xfaf3dd, 0x666958, 2));
  const key = new THREE.DirectionalLight(0xfff4de, 3.5); key.position.set(-6, 12, 10); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: .1, far: 70 }); key.shadow.normalBias = .025; key.shadow.bias = -.0002; key.shadow.radius = 4; scene.add(key);
  const fill = new THREE.DirectionalLight(0xd4e1da, 2.2); fill.position.set(8, 6, -4); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffefd2, 1.6); rim.position.set(-4, 7, -6); scene.add(rim);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ color: 0x47523c, opacity: .13 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.07; floor.receiveShadow = true; scene.add(floor);
  const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = shadowCanvas.height = 128;
  const c = shadowCanvas.getContext('2d'), gradient = c.createRadialGradient(64, 64, 3, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(42,51,36,.22)'); gradient.addColorStop(.5, 'rgba(42,51,36,.11)'); gradient.addColorStop(1, 'rgba(42,51,36,0)'); c.fillStyle = gradient; c.fillRect(0, 0, 128, 128);
  const contactTexture = new THREE.CanvasTexture(shadowCanvas), contact = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), new THREE.MeshBasicMaterial({ map: contactTexture, transparent: true, depthWrite: false }));
  contact.rotation.x = -Math.PI / 2; contact.position.y = -.055; scene.add(contact);
  let pose = null; const orbit = new THREE.Spherical(), nextOrbit = new THREE.Spherical(), offset = new THREE.Vector3();
  controls.addEventListener('start', () => { pose = null; });
  function resize() {
    const { width, height } = container.getBoundingClientRect(); if (!width || !height) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, width < 600 ? 1.5 : 1.75)); renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize); observer.observe(container); resize(); controls.update();
  return {
    scene, camera, renderer, controls, resize,
    frameBounds(bounds, view, progress, focused, immediate = false) {
      pose = fitCamera(bounds, camera.aspect, view, progress, focused);
      if (immediate) { camera.position.copy(pose.position); controls.target.copy(pose.target); controls.update(); pose = null; }
    },
    zoom(direction) { pose = null; const radius = camera.position.distanceTo(controls.target), next = THREE.MathUtils.clamp(radius * (direction > 0 ? .85 : 1.18), 3, 140); camera.position.sub(controls.target).multiplyScalar(next / radius).add(controls.target); controls.update(); },
    update(dt, immediate) {
      if (pose) {
        const t = immediate ? 1 : 1 - Math.exp(-7 * dt);
        orbit.setFromVector3(offset.copy(camera.position).sub(controls.target));
        nextOrbit.setFromVector3(offset.copy(pose.position).sub(pose.target));
        const turn = THREE.MathUtils.euclideanModulo(nextOrbit.theta - orbit.theta + Math.PI, Math.PI * 2) - Math.PI;
        orbit.theta += turn * t; orbit.phi = THREE.MathUtils.lerp(orbit.phi, nextOrbit.phi, t); orbit.radius = THREE.MathUtils.lerp(orbit.radius, nextOrbit.radius, t);
        controls.target.lerp(pose.target, t); camera.position.setFromSpherical(orbit).add(controls.target);
        if (camera.position.distanceTo(pose.position) < .005) { camera.position.copy(pose.position); controls.target.copy(pose.target); pose = null; }
      }
      controls.update(dt); renderer.render(scene, camera);
    },
    dispose() { observer.disconnect(); canvas.removeEventListener('webglcontextrestored', restoreEnvironment); controls.dispose(); key.shadow.map?.dispose(); environment.dispose(); floor.geometry.dispose(); floor.material.dispose(); contact.geometry.dispose(); contact.material.dispose(); contactTexture.dispose(); renderer.dispose(); },
  };
}
