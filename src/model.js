import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Display units, not surveyed CAD dimensions. Y is up; +Z faces the drums.
export const DIM = Object.freeze({ width: 7.6, height: 6.6, depth: 2.05, columns: 12, banks: 3, rows: 3, drumRadius: .218, columnPitch: .545 });
export const PARTS = Object.freeze([
  { id: 'frame', index: '01', name: '钢制机架', english: 'THE FRAME', short: '机架', color: '#506052', subtitle: '给精密逻辑，一个坚实的骨架。', description: '钢制框架承载鼓轮、传动机构与后部接线。打开结构，可以看到各系统如何围绕同一副骨架协同工作。', note: '外壳、尺寸与拆分路径均为展示性重建。', offset: [-2.7, .4, -.8], anchor: [-3.75, 5.7, .8] },
  { id: 'drums', index: '02', name: '鼓轮阵列', english: 'THE DRUMS', short: '鼓轮', color: '#a65c43', subtitle: '108 个鼓轮，铺开可能性。', description: '三组阵列，每组三行、每行十二个鼓轮。每一竖列的三个鼓轮对应一台 Enigma 的转子组，整机共对应 36 组。', note: '颜色与细部经过艺术化整理；转速仅作教学演示。', offset: [.1, .15, 2.55], anchor: [2.8, 5.5, 1.2] },
  { id: 'drive', index: '03', name: '机械传动', english: 'THE DRIVE', short: '传动', color: '#93825f', subtitle: '把一次旋转，传给整面阵列。', description: '主轴、横轴与齿轮把电机的运动传给鼓轮。真实机器以机械联动改变鼓轮位置，在各个位置检验电路条件。', note: '传动几何与步进已简化，不表示真实齿比。', offset: [0, .15, .1], anchor: [3.15, 4, -.1] },
  { id: 'board', index: '04', name: '接线与对角板', english: 'THE CONNECTIONS', short: '接线', color: '#ad7c44', subtitle: '把线索，连接成电路。', description: '操作员依据推测明文形成的“菜单”连接后部插线。Welchman 的对角板利用插线关系的互易性，帮助排除更多错误设置。', note: '接线板在拆解时翻转，便于观察；不执行密码分析。', offset: [4.5, .25, -1.75], anchor: [2.7, 5.4, -1.1] },
  { id: 'motor', index: '05', name: '电机与底座', english: 'THE MOTOR', short: '电机', color: '#526c64', subtitle: '让抽象的推理，开始运动。', description: '底部电机提供机械动力，驱动机构进行连续搜索。停机提示的是值得进一步检查的候选设置，仍需要后续人工与机器验证。', note: '电机与底座为示意造型，未复刻原机电路。', offset: [2.85, 0, 1.25], anchor: [1.9, .85, .4] },
]);

export function createProduct({ textures = {} } = {}) {
  const root = new THREE.Group(); root.name = 'Turing–Welchman Bombe';
  const geometries = new Set(), materials = new Set();
  const material = (o) => { const m = new THREE.MeshStandardMaterial(o); materials.add(m); return m; };
  const mats = {
    paint: material({ color: '#33463c', metalness: .65, roughness: .39, map: textures.paint || null }),
    edge: material({ color: '#27392f', metalness: .72, roughness: .34 }),
    bronze: material({ color: '#9b8051', metalness: .8, roughness: .4 }),
    metal: material({ color: '#bcbcb0', metalness: .9, roughness: .33 }),
    dark: material({ color: '#1d2722', metalness: .55, roughness: .5 }),
    bakelite: material({ color: '#4c3429', metalness: .12, roughness: .55 }),
    red: material({ color: '#a24e39', metalness: .42, roughness: .37 }),
    green: material({ color: '#70806a', metalness: .4, roughness: .39 }),
    gold: material({ color: '#b49752', metalness: .5, roughness: .36 }),
    face: material({ color: '#d4d0bd', metalness: .72, roughness: .4, map: textures.drum || null }),
    wire: material({ color: '#b47740', metalness: .15, roughness: .65 }),
    wireDark: material({ color: '#3b463a', roughness: .75 }),
  };
  const parts = PARTS.map(record => {
    const group = new THREE.Group(); group.name = record.id; group.userData.partId = record.id;
    group.userData.basePosition = group.position.clone(); group.userData.explodeOffset = new THREE.Vector3(...record.offset);
    root.add(group); return group;
  });
  const [frame, drums, drive, board, motor] = parts;
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
  instances(drums, new THREE.TorusGeometry(.205, .012, 6, 40), mats.bronze, positions.map(p => ({ position: [p.position[0], p.position[1], .97] })));
  instances(drums, new THREE.CylinderGeometry(.055, .068, .06, 12), mats.metal, positions.map(p => ({ position: [p.position[0], p.position[1], 1.005], rotation: [Math.PI / 2, 0, 0] })));
  const handles = instances(drums, new RoundedBoxGeometry(.122, .026, .032, 2, .009), mats.metal, positions.map(p => ({ position: [p.position[0], p.position[1], 1.045] })));
  const screws = [];
  for (const p of positions) for (let a = 0; a < 8; a++) screws.push({ position: [p.position[0] + Math.cos(a * Math.PI / 4) * .127, p.position[1] + Math.sin(a * Math.PI / 4) * .127, .973], rotation: [Math.PI / 2, 0, 0] });
  instances(drums, new THREE.CylinderGeometry(.009, .009, .01, 6), mats.dark, screws);
  // Simplified transmission.
  cylinder(drive, .075, 5.5, mats.metal, [3.13, 3.15, -.27], [0, 0, 0]);
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
  box(motor, [5.75, .14, 1.54], mats.paint, [0, .53, 0], .04);
  cylinder(motor, .29, 1.18, mats.paint, [.55, .93, 0], [0, 0, Math.PI / 2], 32);
  for (let i = 0; i < 12; i++) cylinder(motor, .32, .028, mats.edge, [.06 + i * .09, .93, 0], [0, 0, Math.PI / 2], 32);
  cylinder(motor, .24, .07, mats.metal, [-.1, .93, 0], [0, 0, Math.PI / 2], 32);
  box(motor, [.56, .19, .43], mats.dark, [.55, 1.22, 0]); box(motor, [1.4, .1, .74], mats.bronze, [.55, .65, 0]);
  for (const x of [-1.8, 2]) { box(motor, [.56, .5, .7], mats.dark, [x, .85, 0]); box(motor, [.45, .1, .53], mats.metal, [x, 1.12, 0]); }
  torus(motor, .32, .045, mats.dark, [1.32, .93, 0], [0, Math.PI / 2, 0]);
  // Static geometry is merged only within its own movement group and material.
  for (const { group, mat, geometries: gs } of batches.values()) {
    const geometry = mergeGeometries(gs, false); geometries.add(geometry); gs.forEach(g => g.dispose());
    const mesh = new THREE.Mesh(geometry, mat); mesh.castShadow = mesh.receiveShadow = true; group.add(mesh);
  }
  let disposed = false, phase = 0, explode = 0;
  const matrix = new THREE.Matrix4(), q = new THREE.Quaternion(), scale = new THREE.Vector3(1, 1, 1), point = new THREE.Vector3(), z = new THREE.Vector3(0, 0, 1);
  function setExplode(value) {
    explode = Number.isFinite(value) ? THREE.MathUtils.clamp(value, 0, 1) : 0;
    for (const part of parts) part.position.copy(part.userData.basePosition).addScaledVector(part.userData.explodeOffset, explode);
    frame.position.x -= explode * 1.2;
    drums.position.x -= explode * 1.0;
    drums.position.z += explode * .7;
    board.rotation.y = Math.PI * explode;
    root.updateMatrixWorld(true);
  }
  function poseDrums(reset = false) {
    positions.forEach((p, i) => {
      q.setFromAxisAngle(z, reset ? 0 : phase / [1, 26, 676][p.row] + p.bank * .17);
      point.set(p.position[0], p.position[1], .964); matrix.compose(point, q, scale); faceMesh.setMatrixAt(i, matrix);
      point.z = 1.045; matrix.compose(point, q, scale); handles.setMatrixAt(i, matrix);
    });
    faceMesh.instanceMatrix.needsUpdate = handles.instanceMatrix.needsUpdate = true;
  }
  return {
    root, parts, drumCount: positions.length, setExplode,
    update(dt, running) { if (!running || !Number.isFinite(dt) || dt <= 0) return; phase = (phase + Math.min(dt, .1) * .8) % (Math.PI * 2 * 676); poseDrums(); },
    resetMotion() { phase = 0; poseDrums(true); },
    get phase() { return phase; }, get explode() { return explode; },
    getAnchor(id) { const i = PARTS.findIndex(p => p.id === id); return i < 0 ? null : parts[i].localToWorld(new THREE.Vector3(...PARTS[i].anchor)); },
    dispose() {
      if (disposed) return; disposed = true;
      root.traverse(o => { if (o.isInstancedMesh) o.dispose(); });
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); new Set(Object.values(textures)).forEach(t => t?.dispose()); root.removeFromParent();
    },
  };
}
