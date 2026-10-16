import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
export function createStage(canvas, container) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.23;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(33, 1, .1, 100), target = new THREE.Vector3(0, 3.2, 0);
  camera.position.set(9.2, 6.6, 16.5);
  const controls = new OrbitControls(camera, canvas); controls.target.copy(target); controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = .07;
  controls.minDistance = 10; controls.maxDistance = 48; controls.minPolarAngle = .35; controls.maxPolarAngle = Math.PI / 2 - .035; controls.rotateSpeed = .65;
  const envScene = new RoomEnvironment(), pmrem = new THREE.PMREMGenerator(renderer), environment = pmrem.fromScene(envScene, .04);
  scene.environment = environment.texture; scene.environmentIntensity = .85; envScene.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xfaf3dd, 0x666958, 2));
  const key = new THREE.DirectionalLight(0xfff4de, 3.5); key.position.set(-6, 12, 10); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 40 }); key.shadow.normalBias = .025; key.shadow.bias = -.0002; key.shadow.radius = 4; scene.add(key);
  const fill = new THREE.DirectionalLight(0xd4e1da, 2.2); fill.position.set(8, 6, -4); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffefd2, 1.6); rim.position.set(-4, 7, -6); scene.add(rim);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ color: 0x47523c, opacity: .13 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.07; floor.receiveShadow = true; scene.add(floor);
  const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = shadowCanvas.height = 128;
  const c = shadowCanvas.getContext('2d'), gradient = c.createRadialGradient(64, 64, 3, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(42,51,36,.22)'); gradient.addColorStop(.5, 'rgba(42,51,36,.11)'); gradient.addColorStop(1, 'rgba(42,51,36,0)'); c.fillStyle = gradient; c.fillRect(0, 0, 128, 128);
  const contactTexture = new THREE.CanvasTexture(shadowCanvas), contact = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), new THREE.MeshBasicMaterial({ map: contactTexture, transparent: true, depthWrite: false }));
  contact.rotation.x = -Math.PI / 2; contact.position.y = -.055; scene.add(contact);
  let pose = null, explode = 0, expansion = 1; controls.addEventListener('start', () => { pose = null; });
  function adjustExpansion() {
    const next = 1 + explode * (camera.aspect < 1.1 ? .6 : .26), factor = next / expansion; expansion = next;
    camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);
    if (pose) pose.position.sub(target).multiplyScalar(factor).add(target);
  }
  function resize() {
    const { width, height } = container.getBoundingClientRect(); if (!width || !height) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, width < 600 ? 1.5 : 1.75)); renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); adjustExpansion();
  }
  const observer = new ResizeObserver(resize); observer.observe(container); resize(); controls.update();
  function setView(view = 'three-quarter', immediate = false) {
    const poses = { 'three-quarter': [9.2, 6.6, 16.5], front: [0, 4.8, 18], back: [-8.5, 6, -17] };
    const position = new THREE.Vector3(...(poses[view] || poses['three-quarter'])).sub(target).multiplyScalar(expansion).add(target);
    pose = { position, target: target.clone() };
    if (immediate) { camera.position.copy(position); controls.target.copy(target); pose = null; controls.update(); }
  }
  return {
    scene, camera, renderer, controls, resize, setView,
    setExplode(value) { explode = value; adjustExpansion(); },
    zoom(direction) { pose = null; const radius = camera.position.distanceTo(controls.target), next = THREE.MathUtils.clamp(radius * (direction > 0 ? .85 : 1.18), 10, 48); camera.position.sub(controls.target).multiplyScalar(next / radius).add(controls.target); controls.update(); },
    update(dt, immediate) {
      if (pose) { const t = immediate ? 1 : 1 - Math.exp(-7 * dt); camera.position.lerp(pose.position, t); controls.target.lerp(pose.target, t); if (camera.position.distanceTo(pose.position) < .005) { camera.position.copy(pose.position); pose = null; } }
      controls.update(dt); renderer.render(scene, camera);
    },
    dispose() { observer.disconnect(); controls.dispose(); key.shadow.map?.dispose(); environment.dispose(); floor.geometry.dispose(); floor.material.dispose(); contact.geometry.dispose(); contact.material.dispose(); contactTexture.dispose(); renderer.dispose(); },
  };
}
