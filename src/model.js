import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { EXHIBIT_PALETTE as P } from './exhibit-palette.js';

// Display units, not surveyed CAD dimensions. Y is up; +Z faces the drums.
export const DIM = Object.freeze({ width: 7.6, height: 6.6, depth: 2.05, columns: 12, banks: 3, rows: 3, drumRadius: .218, columnPitch: .545 });
export const PARTS = Object.freeze([
  { id: 'frame', index: '01', name: '钢制机架', english: 'THE FRAME', short: '机架', color: P.paint, subtitle: '给精密逻辑，一个坚实的骨架。', description: '钢制框架承载鼓轮、传动机构与后部接线。打开结构，可以看到各系统如何围绕同一副骨架协同工作。', note: '外壳、尺寸与拆分路径均为展示性重建。', anchor: [-3.75, 5.7, .8] },
  { id: 'drums', index: '02', name: '鼓轮阵列', english: 'THE DRUMS', short: '鼓轮', color: P.bronze, subtitle: '108 个鼓轮，铺开可能性。', description: '三组阵列，每组三行、每行十二个鼓轮。每一竖列的三个鼓轮对应一台 Enigma 的转子组，整机共对应 36 组。', note: '颜色与细部经过艺术化整理；转速仅作教学演示。', anchor: [2.8, 5.5, 1.2] },
  { id: 'drive', index: '03', name: '机械传动', english: 'THE DRIVE', short: '传动', color: P.brass, subtitle: '把一次旋转，传给整面阵列。', description: '主轴、横轴与齿轮把电机的运动传给鼓轮。真实机器以机械联动改变鼓轮位置，在各个位置检验电路条件。', note: '传动几何与步进已简化，不表示真实齿比。', anchor: [3.15, 4, -.1] },
  { id: 'board', index: '04', name: '接线与对角板', english: 'THE CONNECTIONS', short: '接线', color: P.brass, subtitle: '把线索，连接成电路。', description: '操作员依据推测明文形成的“菜单”连接后部插线。Welchman 的对角板利用插线关系的互易性，帮助排除更多错误设置。', note: '接线板在拆解时翻转，便于观察；不执行密码分析。', anchor: [2.7, 5.4, -1.1] },
  { id: 'motor', index: '05', name: '电机与底座', english: 'THE MOTOR', short: '电机', color: P.blue, subtitle: '让抽象的推理，开始运动。', description: '底部电机提供机械动力，驱动机构进行连续搜索。停机提示的是值得进一步检查的候选设置，仍需要后续人工与机器验证。', note: '电机与底座为示意造型，未复刻原机电路。', anchor: [1.9, .85, .4] },
]);

export function createProduct({ textures = {} } = {}) {
  const root = new THREE.Group(); root.name = 'Turing–Welchman Bombe';
  const geometries = new Set(), materials = new Set();
  const material = (o) => { const m = new THREE.MeshStandardMaterial(o); materials.add(m); return m; };
  const mats = {
    paint: material({ color: P.paint, metalness: .55, roughness: .4, map: textures.paint || null }),
    edge: material({ color: P.edge, metalness: .72, roughness: .34 }),
    bronze: material({ color: P.brass, metalness: .8, roughness: .4 }),
    metal: material({ color: P.steel, metalness: .9, roughness: .33, map: textures.metal || null }),
    dark: material({ color: P.sea, metalness: .55, roughness: .5 }),
    bakelite: material({ color: P.ink, metalness: .12, roughness: .55 }),
    red: material({ color: P.bronze, metalness: .42, roughness: .37 }),
    green: material({ color: P.blue, metalness: .4, roughness: .39 }),
    gold: material({ color: P.brass, metalness: .5, roughness: .36 }),
    face: material({ color: P.paper, metalness: .45, roughness: .4, map: textures.rotorFace || textures.drum || null }),
    wire: material({ color: P.brass, metalness: .15, roughness: .65 }),
    wireDark: material({ color: P.edge, roughness: .75 }),
    lamp: material({ color: '#d9b86f', emissive: '#7b3f18', emissiveIntensity: .9, metalness: .18, roughness: .3 }),
    signalAmber: material({ color: P.signalAmber, emissive: P.signalAmber, emissiveIntensity: .9, metalness: .28, roughness: .28 }),
    signalCyan: material({ color: P.signalCyan, emissive: P.signalCyan, emissiveIntensity: .55, metalness: .22, roughness: .3 }),
  };
  const parts = PARTS.map(record => {
    const group = new THREE.Group(); group.name = record.id; group.userData.partId = record.id;
    group.userData.basePosition = group.position.clone();
    root.add(group); return group;
  });
  const [frame, drums, drive, board, motor] = parts;
  const detailGroups = {
    frontControlDeck: new THREE.Group(),
    indicatorBank: new THREE.Group(),
    serviceHatches: new THREE.Group(),
    cableLoom: new THREE.Group(),
    driveBelt: new THREE.Group(),
    rotorDetail: new THREE.Group(),
    rotorSignal: new THREE.Group(),
    cameraAnchor: new THREE.Group(),
  };
  detailGroups.frontControlDeck.name = 'front-control-deck';
  detailGroups.indicatorBank.name = 'indicator-bank';
  detailGroups.serviceHatches.name = 'service-hatches';
  detailGroups.cableLoom.name = 'cable-loom';
  detailGroups.driveBelt.name = 'drive-belt';
  detailGroups.rotorDetail.name = 'rotor-detail';
  detailGroups.rotorSignal.name = 'rotor-signal';
  detailGroups.cameraAnchor.name = 'camera-anchor';
  frame.add(detailGroups.frontControlDeck, detailGroups.indicatorBank, detailGroups.serviceHatches);
  board.add(detailGroups.cableLoom);
  drive.add(detailGroups.driveBelt);
  drums.add(detailGroups.rotorDetail, detailGroups.rotorSignal, detailGroups.cameraAnchor);
  const batches = new Map();
  function batch(group, geometry, mat, position = [0, 0, 0], rotation = [0, 0, 0]) {
    if (geometry.index) { const original = geometry; geometry = original.toNonIndexed(); original.dispose(); }
    geometry.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...position), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)), new THREE.Vector3(1, 1, 1)));
    const key = group.name + ':' + mat.uuid;
    if (!batches.has(key)) batches.set(key, { group, mat, geometries: [] });
    batches.get(key).geometries.push(geometry);
  }
  function box(g, size, mat, pos, radius = .035) { batch(g, new RoundedBoxGeometry(...size, 2, radius), mat, pos); }
  function cylinder(g, radius, height, mat, pos, rot = [Math.PI / 2, 0, 0], segments = 20) { batch(g, new THREE.CylinderGeometry(radius, radius, height, segments), mat, pos, rot); }
  function torus(g, radius, tube, mat, pos, rot = [0, 0, 0]) { batch(g, new THREE.TorusGeometry(radius, tube, 6, 32), mat, pos, rot); }
  function instances(g, geometry, mat, transforms) {
    geometries.add(geometry); const mesh = new THREE.InstancedMesh(geometry, mat, transforms.length);
    mesh.castShadow = mesh.receiveShadow = true;
    transforms.forEach((t, i) => mesh.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(...t.position), new THREE.Quaternion().setFromEuler(new THREE.Euler(...(t.rotation || [0, 0, 0]))), new THREE.Vector3(1, 1, 1))));
    mesh.instanceMatrix.needsUpdate = true; g.add(mesh); return mesh;
  }
  // Cabinet; front carriers belong to the removable drum assembly.
  box(frame, [DIM.width, .27, DIM.depth], mats.paint, [0, 6.43, 0], .065);
  box(frame, [DIM.width, .3, DIM.depth], mats.edge, [0, .3, 0], .055);
  for (const x of [-3.62, 3.62]) {
    box(frame, [.36, 5.95, 2.05], mats.paint, [x, 3.34, 0], .05);
    box(frame, [.075, 5.8, .09], mats.edge, [x + Math.sign(x) * .17, 3.35, 1.03], .018);
    for (let y = .7; y < 6.4; y += .42) cylinder(frame, .034, .03, mats.metal, [x, y, 1.042], undefined, 8);
    for (const y of [1.3, 4.6]) {
      box(frame, [.09, .08, .66], mats.metal, [x + Math.sign(x) * .22, y, 0]);
      for (const z of [-.29, .29]) box(frame, [.09, .32, .08], mats.metal, [x + Math.sign(x) * .22, y, z]);
    }
  }
  for (const y of [2.42, 4.36]) box(frame, [6.95, .13, .15], mats.edge, [0, y, .97]);
  for (let x = -2.7; x <= 2.7; x += .15) box(frame, [.055, .035, 1.12], mats.dark, [x, 6.574, -.1], .01);
  const plaqueMaterial = material({ color: '#d6c69e', metalness: .4, roughness: .6, map: textures.plaque || null });
  box(frame, [1.86, .25, .025], plaqueMaterial, [0, 6.43, 1.04], .015);
  for (const x of [-3.1, 3.1]) for (const z of [-.62, .62]) {
    box(frame, [.25, .22, .26], mats.metal, [x, .17, z], .025);
    cylinder(frame, .165, .13, mats.dark, [x, .12, z], [0, 0, Math.PI / 2]);
  }
  // Small operator-facing controls make the cabinet read as a machine, not a flat drum wall.
  const control = detailGroups.frontControlDeck;
  box(control, [6.72, .34, .12], mats.edge, [0, .76, 1.055], .035);
  box(control, [6.36, .08, .035], mats.bronze, [0, .96, 1.12], .015);
  for (let col = 0; col < 12; col++) {
    const x = (col - 5.5) * DIM.columnPitch;
    box(control, [.39, .18, .045], col % 2 ? mats.dark : mats.bakelite, [x, .87, 1.14], .018);
    cylinder(control, .066, .055, mats.bronze, [x, .91, 1.18], [Math.PI / 2, 0, 0], 16);
    box(control, [.16, .025, .025], mats.metal, [x, 1.01, 1.18], .006);
  }
  for (const x of [-3.22, 3.22]) {
    box(control, [.18, .26, .08], mats.metal, [x, .84, 1.13], .02);
    cylinder(control, .035, .11, mats.dark, [x, .91, 1.19], [Math.PI / 2, 0, 0], 12);
  }
  // Three status lamps sit above the array and make the machine state legible at a glance.
  const lampPositions = [-2.55, 0, 2.55].map(x => ({ position: [x, 6.12, 1.08] }));
  const lampMeshes = instances(detailGroups.indicatorBank, new THREE.SphereGeometry(.095, 16, 10), mats.lamp, lampPositions);
  lampMeshes.name = 'status-lamps';
  const lampBezels = instances(detailGroups.indicatorBank, new THREE.TorusGeometry(.12, .018, 6, 20), mats.metal, lampPositions);
  lampBezels.name = 'lamp-bezels';
  for (const x of [-2.55, 0, 2.55]) {
    box(detailGroups.indicatorBank, [.68, .045, .035], mats.bronze, [x, 5.9, 1.08], .008);
    box(detailGroups.indicatorBank, [.055, .16, .025], mats.edge, [x - .24, 6.08, 1.08], .005);
    box(detailGroups.indicatorBank, [.055, .16, .025], mats.edge, [x + .24, 6.08, 1.08], .005);
  }
  // Removable service hatches and real fasteners establish scale at the lower corners.
  for (const x of [-2.75, 2.75]) {
    box(detailGroups.serviceHatches, [1.18, .58, .045], mats.paint, [x, .92, 1.075], .028);
    box(detailGroups.serviceHatches, [1.02, .035, .02], mats.edge, [x, 1.13, 1.11], .008);
    for (const dx of [-.46, .46]) for (const y of [.75, 1.09]) {
      cylinder(detailGroups.serviceHatches, .027, .025, mats.metal, [x + dx, y, 1.115], [Math.PI / 2, 0, 0], 10);
    }
  }
  // 3 banks × 3 rows × 12 columns. Shared instancing keeps the drum detail inexpensive.
  const positions = [], colorTransforms = { red: [], green: [], gold: [] }, rowColors = ['red', 'green', 'gold'];
  for (let bank = 0; bank < DIM.banks; bank++) {
    const bottom = 1.01 + bank * 1.94;
    box(drums, [6.75, 1.72, .105], mats.bakelite, [0, bottom + .54, .66], .025);
    for (let row = 0; row < DIM.rows; row++) for (let col = 0; col < DIM.columns; col++) {
      const p = [(col - 5.5) * DIM.columnPitch, bottom + row * .535, .935]; positions.push({ position: p, row, bank });
      colorTransforms[rowColors[(row + bank) % 3]].push({ position: [p[0], p[1], .84], rotation: [Math.PI / 2, 0, 0] });
      cylinder(drive, .045, 1.35, mats.metal, [p[0], p[1], .04]);
      cylinder(drums, .245, .035, mats.dark, [p[0], p[1], .73]);
    }
    for (let col = 0; col < 12; col++) box(drums, [.17, .055, .015], mats.bronze, [(col - 5.5) * DIM.columnPitch, bottom - .31, .725], .008);
  }
  for (const [color, transforms] of Object.entries(colorTransforms)) instances(drums, new THREE.CylinderGeometry(DIM.drumRadius, DIM.drumRadius, .235, 40), mats[color], transforms);
  const faceMesh = instances(drums, new THREE.CircleGeometry(.202, 40), mats.face, positions.map(p => ({ position: [p.position[0], p.position[1], .964] })));
  faceMesh.name = 'rotor-faces';
  const faceRingGroup = new THREE.Group(); faceRingGroup.name = 'rotor-face-rings'; detailGroups.rotorDetail.add(faceRingGroup);
  const hubGroup = new THREE.Group(); hubGroup.name = 'rotor-hubs'; detailGroups.rotorDetail.add(hubGroup);
  const contactGroup = new THREE.Group(); contactGroup.name = 'rotor-contact-rings'; detailGroups.rotorDetail.add(contactGroup);
  const indexGroup = new THREE.Group(); indexGroup.name = 'rotor-index-markers'; detailGroups.rotorDetail.add(indexGroup);
  const fastenerGroup = new THREE.Group(); fastenerGroup.name = 'rotor-fasteners'; detailGroups.rotorDetail.add(fastenerGroup);
  const signalGroup = new THREE.Group(); signalGroup.name = 'signal-layer'; detailGroups.rotorSignal.add(signalGroup);
  const faceRings = instances(faceRingGroup, new THREE.TorusGeometry(.205, .012, 6, 40), mats.bronze, positions.map(p => ({ position: [p.position[0], p.position[1], .97] })));
  faceRings.name = 'face-ring-instances';
  const hubs = instances(hubGroup, new THREE.CylinderGeometry(.055, .068, .06, 12), mats.metal, positions.map(p => ({ position: [p.position[0], p.position[1], 1.005], rotation: [Math.PI / 2, 0, 0] })));
  hubs.name = 'hub-instances';
  const contactRings = instances(contactGroup, new THREE.TorusGeometry(.184, .006, 6, 24), mats.metal, positions.map(p => ({ position: [p.position[0], p.position[1], 1.012] })));
  contactRings.name = 'contact-ring-instances';
  const handles = instances(indexGroup, new RoundedBoxGeometry(.122, .026, .032, 2, .009), mats.metal, positions.map(p => ({ position: [p.position[0], p.position[1], 1.045] })));
  handles.name = 'index-marker-instances';
  const screws = [];
  for (const p of positions) for (let a = 0; a < 8; a++) screws.push({ position: [p.position[0] + Math.cos(a * Math.PI / 4) * .127, p.position[1] + Math.sin(a * Math.PI / 4) * .127, .973], rotation: [Math.PI / 2, 0, 0] });
  const fasteners = instances(fastenerGroup, new THREE.CylinderGeometry(.009, .009, .01, 6), mats.dark, screws);
  fasteners.name = 'fastener-instances';
  const signalPulse = instances(signalGroup, new THREE.TorusGeometry(.238, .009, 6, 28), mats.signalAmber, positions.map(p => ({ position: [p.position[0], p.position[1], 1.02] })));
  signalPulse.name = 'signal-pulse';
  signalPulse.visible = false;
  // Simplified transmission.
  cylinder(drive, .075, 5.3, mats.metal, [3.13, 3.2, -.27], [0, 0, 0]);
  const gearShape = new THREE.Shape();
  for (let i = 0; i <= 64; i++) {
    const a = i / 64 * Math.PI * 2, r = i % 4 === 1 || i % 4 === 2 ? .17 : .143;
    if (i === 0) gearShape.moveTo(Math.cos(a) * r, Math.sin(a) * r); else gearShape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  gearShape.closePath(); const gears = [];
  for (let bank = 0; bank < 3; bank++) {
    const y = 1.55 + bank * 1.94;
    cylinder(drive, .045, 6.4, mats.metal, [0, y, -.5], [0, 0, Math.PI / 2]);
    box(drive, [6.6, .1, .14], mats.paint, [0, y - .28, -.15]);
    for (let col = 0; col < 12; col++) {
      const x = (col - 5.5) * DIM.columnPitch;
      box(drive, [.14, 1.5, .1], mats.bronze, [x, y, -.42], .015); gears.push({ position: [x, y, -.55] });
      cylinder(drive, .09, .12, mats.bronze, [x, y, -.6]);
    }
  }
  instances(drive, new THREE.ExtrudeGeometry(gearShape, { depth: .045, bevelEnabled: true, bevelSize: .005, bevelThickness: .005, bevelSegments: 1, steps: 1 }), mats.bronze, gears);
  // Three visible belt loops connect the main shaft to the stepped banks.
  for (const y of [1.55, 3.49, 5.43]) {
    torus(detailGroups.driveBelt, .34, .035, mats.wireDark, [3.13, y, -.72], [0, Math.PI / 2, 0]);
    torus(detailGroups.driveBelt, .285, .018, mats.bronze, [3.13, y, -.72], [0, Math.PI / 2, 0]);
  }
  box(detailGroups.driveBelt, [.78, 1.1, .06], mats.dark, [3.13, 3.45, -.72], .02);
  box(detailGroups.driveBelt, [.57, .04, .025], mats.metal, [3.13, 3.45, -.755], .006);
  // Rear socket strips and menu cables. Connections are illustrative.
  box(board, [6.62, 5.45, .09], mats.paint, [0, 3.35, -.86], .03);
  const sockets = [], pins = [];
  for (let col = 0; col < 9; col++) {
    const x = (col - 4) * .7;
    box(board, [.53, 5.03, .1], col % 3 === 0 ? mats.bakelite : mats.dark, [x, 3.35, -.96], .025);
    for (let row = 0; row < 26; row++) { const p = [x, 1.04 + row * .183, -1.043]; sockets.push({ position: p }); pins.push({ position: [p[0], p[1], -1.058], rotation: [0, Math.PI, 0] }); }
  }
  instances(board, new THREE.TorusGeometry(.05, .011, 6, 12), mats.metal, sockets);
  instances(board, new THREE.CircleGeometry(.036, 12), mats.dark, pins);
  for (let i = 0; i < 25; i++) {
    const x1 = ((i % 9) - 4) * .7, x2 = (((i * 4 + 2) % 9) - 4) * .7;
    const y1 = 1.25 + ((i * 7) % 24) * .183, y2 = 1.25 + ((i * 11 + 3) % 24) * .183, d = .25 + (i % 4) * .08;
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(x1, y1, -1.08), new THREE.Vector3(x1, y1 - .1, -1.32 - d), new THREE.Vector3((x1 + x2) / 2, Math.min(y1, y2) - d, -1.45 - d), new THREE.Vector3(x2, y2 - .1, -1.32 - d), new THREE.Vector3(x2, y2, -1.08)]);
    batch(board, new THREE.TubeGeometry(curve, 28, .019, 5, false), i % 3 === 0 ? mats.wireDark : mats.wire);
    for (const [x, y] of [[x1, y1], [x2, y2]]) cylinder(board, .048, .13, mats.bakelite, [x, y, -1.12]);
  }
  // A restrained loom collects the rear menu cables before they enter the cabinet.
  for (let i = 0; i < 5; i++) {
    const x = -2.85 + i * 1.42;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, 5.85, -1.08),
      new THREE.Vector3(x + .05, 4.8, -1.28),
      new THREE.Vector3(x - .06, 3.45, -1.34),
      new THREE.Vector3(x + .04, 2.1, -1.24),
      new THREE.Vector3(x, .95, -1.08),
    ]);
    batch(detailGroups.cableLoom, new THREE.TubeGeometry(curve, 24, .027, 6, false), i % 2 ? mats.wire : mats.wireDark);
  }
  box(motor, [5.75, .14, 1.54], mats.paint, [0, .53, 0], .04);
  cylinder(motor, .16, 1.18, mats.paint, [.55, .73, 0], [0, 0, Math.PI / 2], 32);
  for (let i = 0; i < 12; i++) cylinder(motor, .18, .028, mats.edge, [.06 + i * .09, .73, 0], [0, 0, Math.PI / 2], 32);
  cylinder(motor, .145, .07, mats.metal, [-.1, .73, 0], [0, 0, Math.PI / 2], 32);
  box(motor, [.56, .1, .32], mats.dark, [.55, .86, 0]); box(motor, [1.4, .1, .6], mats.bronze, [.55, .65, 0]);
  for (const x of [-1.8, 2]) { box(motor, [.56, .25, .7], mats.dark, [x, .735, 0]); box(motor, [.45, .07, .53], mats.metal, [x, .895, 0]); }
  torus(motor, .16, .025, mats.dark, [1.32, .73, 0], [0, Math.PI / 2, 0]);
  // Static geometry is merged only within its own movement group and material.
  for (const { group, mat, geometries: gs } of batches.values()) {
    const geometry = mergeGeometries(gs, false); geometries.add(geometry); gs.forEach(g => g.dispose());
    const mesh = new THREE.Mesh(geometry, mat); mesh.castShadow = mesh.receiveShadow = true; group.add(mesh);
  }
  let disposed = false, phase = 0, explode = 0;
  const matrix = new THREE.Matrix4(), rotorQ = new THREE.Quaternion(), hubBaseQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), hubQ = new THREE.Quaternion(), scale = new THREE.Vector3(1, 1, 1), signalScale = new THREE.Vector3(), point = new THREE.Vector3(), z = new THREE.Vector3(0, 0, 1);
  const boardPivot = new THREE.Vector3(0, 3.35, -.86), rotatedPivot = new THREE.Vector3();
  const ramp = (p, start, end) => THREE.MathUtils.smoothstep(p, start, end);
  function setExplode(value) {
    explode = Number.isFinite(value) ? THREE.MathUtils.clamp(value, 0, 1) : 0;
    for (const part of parts) { part.position.copy(part.userData.basePosition); part.rotation.set(0, 0, 0); }
    // Reversible choreography: extract along clear axes before rearranging.
    // 1. Front drums and rear wiring leave the cabinet without lateral motion.
    drums.position.z = 3 * ramp(explode, 0, .28);
    board.position.z = -4 * ramp(explode, 0, .28);
    // 2. Lift the extracted drums; move the drive out through the open back.
    drums.position.y = 9 * ramp(explode, .28, .62);
    drive.position.z = -3 * ramp(explode, .28, .58) * (1 - ramp(explode, .9, 1));
    drive.position.y = 2.5 * ramp(explode, .62, .9);
    motor.position.z = 6 * ramp(explode, .4, .62);
    // 3. Park the frame and connections in separate display bays.
    frame.position.set(-9 * ramp(explode, .62, .88), 3 * ramp(explode, .62, .88), 0);
    board.position.x = 9 * ramp(explode, .4, .74);
    board.position.y = 3 * ramp(explode, .62, .88);
    board.position.z += 4 * ramp(explode, .76, 1);
    // Rotation starts only after the board is outside the cabinet; its own
    // centre is the pivot, so it never sweeps through the drive or frame.
    board.rotation.y = Math.PI * ramp(explode, .76, 1);
    rotatedPivot.copy(boardPivot).applyAxisAngle(new THREE.Vector3(0, 1, 0), board.rotation.y);
    board.position.add(boardPivot).sub(rotatedPivot);
    root.updateMatrixWorld(true);
  }
  function poseDrums(reset = false) {
    positions.forEach((p, i) => {
      rotorQ.setFromAxisAngle(z, reset ? 0 : phase / [1, 26, 676][p.row] + p.bank * .17);
      point.set(p.position[0], p.position[1], .964); matrix.compose(point, rotorQ, scale); faceMesh.setMatrixAt(i, matrix);
      point.z = .97; matrix.compose(point, rotorQ, scale); faceRings.setMatrixAt(i, matrix);
      point.z = 1.012; matrix.compose(point, rotorQ, scale); contactRings.setMatrixAt(i, matrix);
      point.z = 1.045; matrix.compose(point, rotorQ, scale); handles.setMatrixAt(i, matrix);
      hubQ.copy(rotorQ).multiply(hubBaseQ); point.z = 1.005; matrix.compose(point, hubQ, scale); hubs.setMatrixAt(i, matrix);
      const pulse = reset ? 1 : .8 + .2 * (.5 + .5 * Math.sin(phase * .05 + p.bank * 1.4 + p.row * .7));
      signalScale.set(pulse, pulse, pulse); point.z = 1.02; matrix.compose(point, rotorQ, signalScale); signalPulse.setMatrixAt(i, matrix);
    });
    faceMesh.instanceMatrix.needsUpdate = handles.instanceMatrix.needsUpdate = faceRings.instanceMatrix.needsUpdate = hubs.instanceMatrix.needsUpdate = contactRings.instanceMatrix.needsUpdate = signalPulse.instanceMatrix.needsUpdate = true;
  }
  const rotorAnchors = positions.map((position, index) => {
    const anchor = new THREE.Object3D(); anchor.name = `rotor-anchor-${String(index + 1).padStart(3, '0')}`;
    anchor.position.set(position.position[0], position.position[1], 1.1); detailGroups.cameraAnchor.add(anchor); return anchor;
  });
  return {
    root, parts, drumCount: positions.length, rotorCount: positions.length, detailCount: Object.keys(detailGroups).length,
    detailStats: Object.freeze({ faceRings: positions.length, hubs: positions.length, contactRings: positions.length, indexMarkers: positions.length, fasteners: screws.length, signals: positions.length }), setExplode,
    setFocus(id) { const selected = parts.find(p => p.name === id); parts.forEach(p => { p.visible = !selected || p === selected; }); },
    update(dt, running) { if (!running || !Number.isFinite(dt) || dt <= 0) return; signalPulse.visible = true; phase = (phase + Math.min(dt, .1) * .8) % (Math.PI * 2 * 676); poseDrums(); },
    resetMotion() { phase = 0; signalPulse.visible = false; poseDrums(true); },
    get phase() { return phase; }, get explode() { return explode; },
    getAnchor(id) { const i = PARTS.findIndex(p => p.id === id); return i < 0 ? null : parts[i].localToWorld(new THREE.Vector3(...PARTS[i].anchor)); },
    getRotorAnchor(index = 0) {
      const anchor = rotorAnchors[THREE.MathUtils.clamp(Math.trunc(index), 0, rotorAnchors.length - 1)];
      return anchor ? anchor.getWorldPosition(new THREE.Vector3()) : null;
    },
    getBounds(id) { const part = id ? parts.find(p => p.name === id) : root; return part ? new THREE.Box3().setFromObject(part) : null; },
    dispose() {
      if (disposed) return; disposed = true;
      root.traverse(o => { if (o.isInstancedMesh) o.dispose(); });
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); new Set(Object.values(textures)).forEach(t => t?.dispose()); root.removeFromParent();
    },
  };
}
