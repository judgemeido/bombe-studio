/** Authored camera rails, in scene metres. They illustrate arrival, not historical footage. */
export const MISSION_VIEWS = {
  // The rails are authored in world metres.  The room is deliberately wider than
  // the original teaching table so every beat has a recognisable place to land.
  entry: { camera: [-18, 6.2, 12.5], target: [-12.8, 1.5, -1.6], zone: 'entry' },
  entrance: { camera: [-18, 6.2, 12.5], target: [-12.8, 1.5, -1.6], zone: 'entry' },
  radio: { camera: [-10.2, 3.8, 7.2], target: [-8.1, 1.25, -1.2], zone: 'radio' },
  archive: { camera: [-1.8, 4.4, 7.2], target: [0, 1.35, -.15], zone: 'archive' },
  analysis: { camera: [8.8, 4.5, 6.8], target: [7.3, 1.35, -.2], zone: 'analysis' },
  machine: { camera: [16.5, 4.8, 6.6], target: [14.2, 1.65, -.8], zone: 'machine' },
  map: { camera: [11.5, 5.3, -7.5], target: [8.9, 1.45, -6.2], zone: 'map' },
  handoff: { camera: [-1.5, 4.6, -8.8], target: [-1.4, 1.45, -8.1], zone: 'handoff' },
  // Compatibility aliases for existing callers and Remotion compositions.
  desk: { camera: [-1.8, 4.4, 7.2], target: [0, 1.35, -.15], zone: 'archive' },
  rotors: { camera: [1.65, 3.35, 2.9], target: [-.2, 1.48, .3], zone: 'archive' },
  plugs: { camera: [.85, 1.72, 3.2], target: [-.2, 1.1, 1.15], zone: 'archive' },
  bombe: { camera: [16.5, 4.8, 6.6], target: [14.2, 1.65, -.8], zone: 'machine' },
};
export const STAGE_VIEWS = [
  'entry', 'radio', 'radio', 'archive', 'archive',
  'analysis', 'analysis', 'machine', 'machine', 'machine',
  'map', 'map', 'map', 'handoff', 'handoff',
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

/** Camera rails have no physics integration: never stretch their duration at a low frame rate. */
export function advanceTransitionTime(elapsed, now, previous) {
  return elapsed + (previous ? Math.max(0, now - previous) / 1000 : 0);
}
const arrival = [
  { at: 0, camera: [-18, 6.2, 12.5], target: [-12.8, 1.5, -1.6], caption: '1941 年，布莱切利园。天亮之前，一份截报送到了夜班入口。' },
  { at: 3.2, ...MISSION_VIEWS.radio, caption: '你是艾伦·图灵。推开夜班的门，先听清一条信号。' },
  { at: 6.5, ...MISSION_VIEWS.desk, caption: '把无线电纸带带到工作桌，一场由许多人接力的破译开始了。' },
  { at: 8.2, ...MISSION_VIEWS.rotors, caption: '字母、转子、一根接线。每一件工具，都在等待一个清楚的问题。' },
  { at: 10, ...MISSION_VIEWS.radio, caption: captions[0] },
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
