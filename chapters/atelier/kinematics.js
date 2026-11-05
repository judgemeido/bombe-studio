// Display geometry is a photo-proportioned reconstruction in metres, not surveyed CAD.
// The discrete search is an educational 26³ odometer, not a full historical Bombe circuit.
export const D = Object.freeze({ width: 2.4, height: 2.04, depth: .72, banks: 3, rows: 3, columns: 12, radius: .074, pitchX: .174, pitchY: .167, bankPitch: .534, front: .41 });
export const COUNT = D.banks * D.rows * D.columns;
export const SPACE = 26 ** 3;
export const TAU = Math.PI * 2;
export const mod = (x, n) => ((x % n) + n) % n;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function stateAt(ticks) {
  const n = mod(Math.floor(ticks), SPACE);
  const positions = [Math.floor(n / 676), Math.floor(n / 26) % 26, n % 26];
  return { n, positions, letters: positions.map(p => String.fromCharCode(65 + p)), progress: n / (SPACE - 1), angles: positions.map(p => -p * TAU / 26) };
}
export function drumPositions() {
  return Array.from({length: COUNT}, (_, i) => {
    const bank = Math.floor(i / 36), row = Math.floor(i / 12) % 3, col = i % 12;
    return { bank, row, col, x: (col - 5.5) * D.pitchX, y: 1.76 - bank * D.bankPitch - row * D.pitchY, z: D.front };
  });
}
export const PARTS = [
  { id:'drums', number:'01', title:'鼓轮阵列', en:'ROTOR ASSEMBLY', sub:'108 个鼓轮 · 36 组三轮组合', description:'每一竖列的三个鼓轮模拟一组 Enigma 转子。三层鼓轮组把多个约束同时交给电路检验。彩色轮缘用于区分鼓轮类型。', detail:'观察字母刻环、锁扣、轮毂与后部触点。这里的轮位按照 26³ 示意计数器同步变化。' },
  { id:'drive', number:'02', title:'齿轮与传动', en:'DRIVE TRAIN', sub:'横向主轴 · 纵向传动轴', description:'电机经机械传动带动鼓轮，在不同轮位反复检验菜单条件。后部轴系把旋转传给整面阵列。', detail:'展示包括齿轮、轴承座、连轴器与带轮；齿形和联动比例为结构示意。' },
  { id:'wiring', number:'03', title:'接线与对角板', en:'DIAGONAL BOARD', sub:'26 × 26 互易关系', description:'后部插线根据推测明文组成“菜单”。Welchman 的对角板利用 A↔B 的互易关系，传播约束并减少错误停机。', detail:'橙色路径示意一条活动连线。接线几何可观察，本展品不执行完整密码分析。' },
  { id:'motor', number:'04', title:'电机与底盘', en:'MOTOR & CHASSIS', sub:'动力来源 · 飞轮与皮带', description:'底部电机提供机械动力。找到值得检查的候选设置时，搜索需要暂停，交由后续核验。', detail:'可观察电机散热片、端盖、接线盒、飞轮、支座及底盘紧固件。' },
  { id:'frame', number:'05', title:'钢制机架', en:'STEEL FRAME', sub:'承重框架 · 维护面板', description:'铆接与螺栓连接的钢制框架承载鼓轮、传动和电路。独立面板让维护人员接近内部机构。', detail:'开壳后可检查侧板、合页、通风口、铭牌与内部加强梁。尺寸按照片比例重建。' }
];
export const TOUR = [
 { at:0, view:'hero', part:null, explode:0, title:'整机 · 机械的逻辑' },
 { at:8, view:'front', part:'drums', explode:0, title:'鼓轮 · 并行检验约束' },
 { at:16, view:'detail', part:'drums', explode:.22, title:'近看 · 字母环与触点' },
 { at:24, view:'back', part:'drive', explode:0, title:'背面 · 运动如何传递' },
 { at:32, view:'back', part:'wiring', explode:.42, title:'接线 · 互易的关系' },
 { at:40, view:'explode', part:'motor', explode:1, title:'拆解 · 查看每一层' },
 { at:48, view:'hero', part:null, explode:0, title:'回到整机 · 轮到你探索' }
];
export function tourAt(t) { return [...TOUR].reverse().find(s => s.at <= mod(t, 56)) || TOUR[0]; }
