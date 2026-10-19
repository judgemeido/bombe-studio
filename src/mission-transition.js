/** Authored camera rails in display units. They illustrate arrival, not historical footage. */
export const MISSION_VIEWS = {
  floor: { camera: [20, 49, 48], target: [2, .3, -2.3], zone: 'floor' },
  // The rails stay outside the enlarged rooms and point through the open
  // doorways so the corridor and the working apparatus read in one frame.
  entry: { camera: [-14.8, 5.25, 8.4], target: [-17, 1.15, -.3], zone: 'entry' },
  entrance: { camera: [-14.8, 5.25, 8.4], target: [-17, 1.15, -.3], zone: 'entry' },
  radio: { camera: [-7.2, 5.3, 8.4], target: [-9, 1.35, -.4], zone: 'radio' },
  archive: { camera: [2.2, 5.4, 8.6], target: [0, 1.4, -.3], zone: 'archive' },
  analysis: { camera: [10.8, 5.25, 8.1], target: [9, 1.35, -.5], zone: 'analysis' },
  machine: { camera: [21.8, 5.7, 10.2], target: [19, 1.4, -.6], zone: 'machine' },
  map: { camera: [11.2, 5.0, -2.2], target: [9, 1.35, -9.6], zone: 'map' },
  handoff: { camera: [2.1, 4.9, -1.5], target: [0, 1.3, -9.6], zone: 'handoff' },
  // Compatibility aliases for existing callers and Remotion compositions.
  desk: { camera: [2.2, 5.4, 8.6], target: [0, 1.4, -.3], zone: 'archive' },
  rotors: { camera: [1.65, 4.4, 5.1], target: [-.2, 1.85, .3], zone: 'archive' },
  plugs: { camera: [.85, 2.25, 5.4], target: [-.2, 1.45, 1.15], zone: 'archive' },
  bombe: { camera: [20.5, 4.1, 5.8], target: [19, 1.5, -1.0], zone: 'machine' },
};
export const STAGE_VIEWS = [
  'entry', 'radio', 'radio', 'archive', 'analysis',
  'analysis', 'analysis', 'machine', 'machine', 'machine',
  'machine', 'analysis', 'map', 'map', 'handoff',
];
const captions = [
  '接班记录已经摊开。先找到值得检验的信号。',
  '把旋钮调到纸带留下的频段，确认噪声里的节拍。',
  '三张截收纸需要按时间重新归档。',
  '档案栏的日期与呼号必须互相吻合。',
  '在标记的短语里提取一组可验证的字母。',
  '把这组字母对齐到同一条基准线上。',
  '几条关系链在边缘相交，找出唯一的交点。',
  '接线板前，每一根线的两端都要留下记录。',
  '把环位和转子顺序交给密码机。',
  '机房开始重复搜索，等待候选停在同一个位置。',
  '两个候选都能发光，只有一条能解释整段纸带。',
  '逐字输入完整截获，观察输出是否保持一致。',
  '把可信的呼号钉到地图上，标出它的方向。',
  '再次交叉核验时间、位置和译文，保留异议。',
  '封存记录并拨通电话，把结论交给下一班。',
];
const ease = t => t * t * (3 - 2 * t);
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const clamp = t => Math.max(0, Math.min(1, t));

/** Inspection buttons settle in 650ms regardless of the rendering frame rate. */
export function inspectionBlend(now, started) { return ease(clamp((now - started) / 650)); }

/** Camera rails have no physics integration: never stretch their duration at a low frame rate. */
export function advanceTransitionTime(elapsed, now, previous) {
  return elapsed + (previous ? Math.max(0, now - previous) / 1000 : 0);
}
const arrival = [
  { at: 0, camera: [-17, 6.2, 11.5], target: [-17, 1.25, -.3], zone: 'entry', caption: '1941 年，布莱切利园。天亮之前，一份截报送到了夜班入口。' },
  { at: 3.2, ...MISSION_VIEWS.radio, caption: '推开夜班的门，从无线电室接过一条信号。' },
  { at: 6.5, ...MISSION_VIEWS.desk, caption: '无线电纸带、密码机和旧班档案，由同一条走廊连接。' },
  { at: 8.2, ...MISSION_VIEWS.radio, caption: '机器可以重复计算，每一份证据仍需要有人核验。' },
  { at: 10, ...MISSION_VIEWS.entry, caption: captions[0] },
];

export function transitionFrame({ kind = 'arrival', stage = 0, beat = stage, zone = null } = {}, seconds) {
  const duration = kind === 'arrival' ? 10 : kind === 'handoff' ? 3.2 : 2.4;
  const elapsed = Math.max(0, Math.min(duration, Number.isFinite(seconds) ? seconds : 0));
  const progress = elapsed / duration;
  if (kind !== 'arrival') {
    const beatIndex = Number.isFinite(stage) ? stage : Number.isFinite(beat) ? beat : 0;
    const requestedZone = zone === 'entrance' ? 'entry' : zone;
    const destinationKey = kind === 'handoff' ? 'handoff' : kind === 'zone' ? (requestedZone || 'archive') : STAGE_VIEWS[beatIndex] || 'archive';
    const destination = MISSION_VIEWS[destinationKey] || MISSION_VIEWS.archive;
    return { ...destination, progress, duration, blend: ease(progress), done: progress === 1, lidOpen: 1, zone: destination.zone || destinationKey, caption: captions[beatIndex] || captions[7] };
  }
  const right = arrival.findIndex((s, i) => i > 0 && elapsed <= s.at);
  const b = arrival[right < 0 ? arrival.length - 1 : right], a = arrival[Math.max(0, arrival.indexOf(b) - 1)];
  // Keep long cross-room rails bounded even on a 20 ms sampling cadence.  The
  // arrival lens already has several authored waypoints, so a linear blend is
  // less likely to produce a visible easing spike between distant rooms.
  const t = clamp((elapsed - a.at) / (b.at - a.at));
  return {
    camera: mix(a.camera, b.camera, t), target: mix(a.target, b.target, t),
    zone: b.zone || (b === arrival[0] ? 'entry' : 'archive'),
    caption: progress === 1 ? b.caption : a.caption, progress, duration, done: progress === 1,
    lidOpen: ease(clamp((elapsed - 1.2) / 3.5)),
  };
}
