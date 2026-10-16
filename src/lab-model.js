import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ALPHABET, ROTORS } from './cipher.js';

export const LAB_DIM = Object.freeze({ radius: 1.25, pitch: 3.05, drumY: 3.65, contacts: 26, portPitch: .58 });
export function createLabModel() {
  const root = new THREE.Group(), assembly = new THREE.Group(), board = new THREE.Group(), signal = new THREE.Group();
  root.name = 'Single three-rotor teaching circuit'; root.add(assembly, board, signal);
  board.userData.kind = 'wiring';
  const geometries = new Set(), materials = new Set(), textures = new Set(), batches = new Map();
  const mat = options => { const m = new THREE.MeshStandardMaterial(options); materials.add(m); return m; };
  const paint = mat({ color: '#344c3f', roughness: .34, metalness: .63 });
  const dark = mat({ color: '#29362f', roughness: .52, metalness: .4 });
  const bronze = mat({ color: '#b79a60', roughness: .32, metalness: .82 });
  const metal = mat({ color: '#c2c6ba', roughness: .28, metalness: .88 });
  const wire = mat({ color: '#9f8152', roughness: .52, metalness: .6 });
  const socket = mat({ color: '#17261e', roughness: .7, metalness: .1 });
  const outbound = mat({ color: '#da8745', emissive: '#d98032', emissiveIntensity: .8, roughness: .4 });
  const returning = mat({ color: '#719584', emissive: '#578772', emissiveIntensity: .7, roughness: .4 });
  const outboundTrail = mat({ color: '#c18b4b', transparent: true, opacity: .22, depthWrite: false, roughness: .5 });
  const returningTrail = mat({ color: '#719584', transparent: true, opacity: .22, depthWrite: false, roughness: .5 });
  function batch(parent, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0]) {
    if (geometry.index) { const old = geometry; geometry = old.toNonIndexed(); old.dispose(); }
    geometry.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...position), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)), new THREE.Vector3(1, 1, 1)));
    const key = parent.uuid + material.uuid;
    if (!batches.has(key)) batches.set(key, { parent, material, items: [] }); batches.get(key).items.push(geometry);
  }
  const box = (p, size, m, at, radius = .035, rot) => batch(p, new RoundedBoxGeometry(...size, 2, radius), m, at, rot);
  const cylinder = (p, radius, depth, m, at, rot = [Math.PI / 2, 0, 0], segments = 32) => batch(p, new THREE.CylinderGeometry(radius, radius, depth, segments), m, at, rot);
  const ring = (p, radius, thickness, m, at) => batch(p, new THREE.TorusGeometry(radius, thickness, 8, 80), m, at);
  function canvasMaterial(width, height, draw, color = '#d5cfb8') {
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; draw(canvas.getContext('2d'));
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4; textures.add(texture);
    return mat({ map: texture, color, metalness: .5, roughness: .43 });
  }
  const face = canvasMaterial(1024, 1024, c => {
    c.fillStyle = '#a6a68d'; c.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 26; i++) {
      const a = i * Math.PI * 2 / 26; c.save(); c.translate(512, 512); c.rotate(a);
      c.font = '500 48px Georgia'; c.textAlign = 'center'; c.fillStyle = '#1a3024'; c.fillText(ALPHABET[i], 0, -422);
      c.strokeStyle = '#59634b'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -468); c.lineTo(0, -486); c.stroke(); c.restore();
    }
    for (const r of [380, 478, 493]) { c.beginPath(); c.strokeStyle = '#e2ddc6'; c.lineWidth = 3; c.arc(512, 512, r, 0, Math.PI * 2); c.stroke(); }
  });
  face.metalness = .2; face.roughness = .64;
  const rotors = [], rotators = [], xPositions = [-LAB_DIM.pitch, 0, LAB_DIM.pitch];
  const colors = ['#a8664e', '#748775', '#b39b59'];
  for (let i = 0; i < 3; i++) {
    const drum = new THREE.Group(), spin = new THREE.Group(); drum.position.set(xPositions[i], LAB_DIM.drumY, 0); drum.userData = { kind: 'rotor', index: i }; drum.add(spin); assembly.add(drum); rotors.push(drum); rotators.push(spin);
    const coating = mat({ color: colors[i], metalness: .5, roughness: .36 });
    const shape = new THREE.Shape(); shape.absarc(0, 0, 1.2, 0, Math.PI * 2, false);
    const hole = new THREE.Path(); hole.absarc(0, 0, .64, 0, Math.PI * 2, true); shape.holes.push(hole);
    batch(spin, new THREE.ExtrudeGeometry(shape, { depth: .43, bevelEnabled: true, bevelSize: .035, bevelThickness: .035, bevelSegments: 2, steps: 1, curveSegments: 80 }), coating, [0, 0, -.23]);
    batch(spin, new THREE.RingGeometry(.83, 1.17, 104), face, [0, 0, .255]);
    ring(spin, 1.2, .026, metal, [0, 0, .26]); ring(spin, .83, .025, bronze, [0, 0, .28]); ring(spin, .64, .025, metal, [0, 0, -.25]);
    cylinder(spin, .23, .24, metal, [0, 0, .22]); cylinder(spin, .13, .12, dark, [0, 0, .4]);
    box(spin, [.46, .09, .1], metal, [0, 0, .5], .025);
    box(drum, [2.7, .16, 1.48], paint, [0, -1.63, -.2], .055);
    for (const x of [-.83, .83]) { box(drum, [.17, .58, .45], metal, [x, -1.36, -.2]); cylinder(drum, .055, .035, bronze, [x, -1.58, .56]); }
    // Stationary rear terminals and coloured, rotating alphabet ring stay separate.
    ring(drum, .77, .04, dark, [0, 0, -.48]);
    for (let n = 0; n < LAB_DIM.contacts; n++) {
      const a = n * Math.PI * 2 / 26, b = ALPHABET.indexOf(ROTORS[i].wiring[n]) * Math.PI * 2 / 26;
      const x = Math.sin(a), y = Math.cos(a);
      cylinder(spin, .041, .11, bronze, [x * .745, y * .745, .31], undefined, 12);
      ring(spin, .055, .009, metal, [x * .745, y * .745, .37]);
      box(spin, [.075, .1, .12], dark, [x * 1.235, y * 1.235, -.06], .012, [0, 0, -a]);
      cylinder(drum, .034, .08, bronze, [x * .77, y * .77, -.5], undefined, 10);
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(x * .745, y * .745, .24), new THREE.Vector3(x * .32, y * .32, .12 - n * .009), new THREE.Vector3(Math.sin(b) * .32, Math.cos(b) * .32, .02 - n * .009), new THREE.Vector3(Math.sin(b) * .745, Math.cos(b) * .745, -.2)]);
      batch(spin, new THREE.TubeGeometry(curve, 16, .009, 4, false), wire);
    }
    // Ivory index pointer remains stationary while the alphabet ring turns.
    box(drum, [.1, .22, .09], bronze, [0, 1.36, .28], .015);
  }
  const reflector = new THREE.Group(); reflector.userData = { kind: 'reflector' }; reflector.position.set(-5.05, 3.65, 0); assembly.add(reflector);
  box(reflector, [.6, 2.35, .6], paint, [0, 0, 0], .09);
  for (let n = 0; n < 26; n++) cylinder(reflector, .036, .055, bronze, [n % 2 ? .14 : -.14, 1 - Math.floor(n / 2) / 6, .33], undefined, 10);
  box(reflector, [.84, .13, 1.05], paint, [0, -1.6, -.1]);
  const boardFace = canvasMaterial(1536, 280, c => {
    c.fillStyle = '#405547'; c.fillRect(0, 0, 1536, 280); c.fillStyle = '#e4dfc7'; c.textAlign = 'center'; c.font = '23px Georgia';
    for (let n = 0; n < 26; n++) c.fillText(ALPHABET[n], 768 + (n % 13 - 6) * LAB_DIM.portPitch / 8.5 * 1536, 140 - ((1.1 - Math.floor(n / 13) * .6 + .22) - .9) / 1.55 * 280 + 7);
  }, '#e0e4cf');
  box(board, [8.5, 1.55, .22], paint, [0, .9, 0], .065);
  batch(board, new THREE.PlaneGeometry(8.5, 1.55), boardFace, [0, .9, .117]);
  const portPoint = index => new THREE.Vector3((index % 13 - 6) * LAB_DIM.portPitch, 1.1 - Math.floor(index / 13) * .6, .25);
  for (let n = 0; n < 26; n++) {
    const p = portPoint(n); ring(board, .095, .019, metal, p.toArray()); cylinder(board, .07, .03, socket, [p.x, p.y, .235], undefined, 20);
  }
  for (const x of [-4, 4]) for (const y of [.3, 1.48]) cylinder(board, .04, .025, bronze, [x, y, .15], undefined, 10);
  for (const { parent, material, items } of batches.values()) {
    const geometry = mergeGeometries(items, false); items.forEach(g => g.dispose()); geometries.add(geometry);
    const mesh = new THREE.Mesh(geometry, material); mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh);
  }
  batches.clear();
  const pulse = new THREE.Mesh(new THREE.SphereGeometry(.065, 16, 12), outbound); geometries.add(pulse.geometry); signal.add(pulse); pulse.visible = false;
  let paths = [], cable = null, trace = null, spread = 0, topic = 'drums', positions = [0, 0, 0], disposed = false;
  const rotorPoint = (i, n, forward = true) => { const a = n / 26 * Math.PI * 2; return new THREE.Vector3(xPositions[i] + Math.sin(a) * .745, LAB_DIM.drumY + Math.cos(a) * .745, .46 + spread * .7 + (forward ? .1 : .26)); };
  function clearPaths() { paths.forEach(p => { p.mesh.geometry.dispose(); p.mesh.removeFromParent(); }); paths = []; }
  function setTrace(value) {
    trace = value; clearPaths(); pulse.visible = false; if (!value) return;
    let previous = portPoint(ALPHABET.indexOf(value.input));
    value.stages.forEach((stage, i) => {
      let points;
      if (stage.rotor !== null) {
        const a = rotorPoint(stage.rotor, stage.input, !stage.reverse), b = rotorPoint(stage.rotor, stage.output, !stage.reverse);
        points = [previous.clone(), a, new THREE.Vector3(xPositions[stage.rotor] + (stage.reverse ? -.2 : .2), LAB_DIM.drumY, .88 + spread * .7 + (stage.reverse ? .26 : 0)), b];
      } else if (stage.id === 'reflector') {
        const terminal = n => new THREE.Vector3(-5.05 + (n % 2 ? .14 : -.14), 4.65 - Math.floor(n / 2) / 6, .4);
        points = [previous.clone(), terminal(stage.input), new THREE.Vector3(-5.35, 3.65, .8), terminal(stage.output)];
      } else {
        const a = portPoint(stage.input), b = portPoint(stage.output);
        points = [previous.clone(), new THREE.Vector3(a.x, a.y, .75), new THREE.Vector3(b.x, b.y + .14, .85), b];
        // The first plugboard pass can be an identity; retain a visible arc.
        if (a.equals(b) && i === 0) points[1].x += .18;
      }
      previous = points.at(-1).clone();
      const curve = new THREE.CatmullRomCurve3(points), mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, .022, 7, false), i < 5 ? outbound : returning);
      signal.add(mesh); paths.push({ curve, mesh, index: i }); mesh.visible = false;
    });
  }
  function setConnection(pair) {
    if (cable) { cable.geometry.dispose(); cable.removeFromParent(); cable = null; }
    if (!pair) return;
    const a = portPoint(ALPHABET.indexOf(pair[0])), b = portPoint(ALPHABET.indexOf(pair[1]));
    const curve = new THREE.CatmullRomCurve3([a, new THREE.Vector3(a.x, a.y - .15, .8), new THREE.Vector3((a.x + b.x) / 2, Math.max(.06, Math.min(a.y, b.y) - .42), 1.05), new THREE.Vector3(b.x, b.y - .15, .8), b]);
    cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, .035, 8, false), outbound); board.add(cable);
  }
  return {
    root, pickables: [assembly, board], contactCount: 26 * 3, portCount: 26,
    setPositions(value, immediate = false) { positions = [...value]; if (immediate) rotators.forEach((r, i) => { r.rotation.z = positions[i] / 26 * Math.PI * 2; }); },
    setConnection, setTrace,
    setSpread(value) { spread = THREE.MathUtils.clamp(value, 0, 1); rotators.forEach(r => { r.position.z = spread * .7; }); setTrace(trace); },
    setTopic(value) { topic = value; assembly.visible = topic !== 'wiring'; },
    getBounds() { root.updateMatrixWorld(true); const bounds = new THREE.Box3().setFromObject(board); return topic === 'wiring' ? bounds : bounds.union(new THREE.Box3().setFromObject(assembly)); },
    getAnchor(kind, i = 0) { return kind === 'rotor' ? new THREE.Vector3(xPositions[i], 5.15, .3 + spread * .7) : new THREE.Vector3(0, 1.9, .25); },
    pick(hit) {
      let parent = hit?.object; while (parent && !parent.userData.kind) parent = parent.parent;
      if (!parent) return null;
      if (parent.userData.kind === 'wiring') { const n = [...Array(26).keys()].find(n => portPoint(n).distanceTo(hit.point) < .16); return { kind: 'wiring', port: n ?? null }; }
      if (parent.userData.kind === 'reflector') return { kind: 'reflector' };
      return { kind: 'rotor', index: parent.userData.index };
    },
    update(dt, progress, immediate = false) {
      rotators.forEach((rotor, i) => { const target = positions[i] / 26 * Math.PI * 2, difference = THREE.MathUtils.euclideanModulo(target - rotor.rotation.z + Math.PI, Math.PI * 2) - Math.PI; rotor.rotation.z += difference * (immediate ? 1 : 1 - Math.exp(-9 * dt)); });
      const current = Math.min(8, Math.max(0, Math.ceil(progress) - 1)), local = Math.max(0, Math.min(1, progress - current));
      paths.forEach(p => {
        p.mesh.visible = progress >= 0 && p.index <= current && (topic !== 'wiring' || p.index === 0 || p.index === 8);
        p.mesh.material = p.index === current ? p.index < 5 ? outbound : returning : p.index < 5 ? outboundTrail : returningTrail;
      });
      pulse.visible = progress >= 0 && progress < 9 && paths.length > 0 && (topic !== 'wiring' || current === 0 || current === 8);
      if (pulse.visible) { pulse.position.copy(paths[current].curve.getPointAt(local)); pulse.material = current < 5 ? outbound : returning; }
      root.updateMatrixWorld(true);
    },
    dispose() { if (disposed) return; disposed = true; clearPaths(); if (cable) cable.geometry.dispose(); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); root.removeFromParent(); },
  };
}
