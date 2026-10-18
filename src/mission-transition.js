/** Authored camera rails, in scene metres. They illustrate arrival, not historical footage. */
export const MISSION_VIEWS = {
  desk: { camera: [4.8, 4.4, 6.4], target: [0, 1.35, -.15] },
  radio: { camera: [-3.35, 2.55, 2.2], target: [-1.55, 1.45, -.45] },
  rotors: { camera: [1.65, 3.35, 2.9], target: [-.2, 1.48, .3] },
  plugs: { camera: [.85, 1.72, 3.2], target: [-.2, 1.1, 1.15] },
  bombe: { camera: [3.35, 2.85, 1.8], target: [2.05, 1.95, -1.12] },
};
export const STAGE_VIEWS = ['radio', 'desk', 'plugs', 'rotors', 'bombe', 'rotors', 'desk', 'desk'];
const captions = [
  '截收员留下了三份记录。先找到值得检验的线索。',
  '一个猜测落在纸上。让每一格字母接受规则的检查。',
  '来到接线板前。一根线的两端，必须相互一致。',
  '掀开密码机的盖板，把已知条件交给转子。',
  '机房已经准备好。让机器重复检查，让人解释结果。',
  '机器留下一个候选。回到工作桌，用整条消息核验它。',
  '窗外天色将明。把已知、时间与不确定，一起交给团队。',
  '天亮了。你留下的不只是一份译文，还有一条完整证据链。',
];
const ease = t => t * t * (3 - 2 * t);
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const clamp = t => Math.max(0, Math.min(1, t));

/** Camera rails have no physics integration: never stretch their duration at a low frame rate. */
export function advanceTransitionTime(elapsed, now, previous) {
  return elapsed + (previous ? Math.max(0, now - previous) / 1000 : 0);
}
const arrival = [
  { at: 0, camera: [4.8, 3.5, 7.2], target: [-.5, 1.85, -.8], caption: '1941 年，布莱切利园。天亮之前，一份截报送到了桌上。' },
  { at: 3.2, ...MISSION_VIEWS.desk, caption: '你是艾伦·图灵。推开盖板，走进一场由许多人接力的破译。' },
  { at: 6.5, ...MISSION_VIEWS.rotors, caption: '字母、转子、一根接线。每一件工具，都在等待一个清楚的问题。' },
  { at: 10, ...MISSION_VIEWS.radio, caption: captions[0] },
];

export function transitionFrame({ kind = 'arrival', stage = 0 }, seconds) {
  const duration = kind === 'arrival' ? 10 : 2.4;
  const elapsed = Math.max(0, Math.min(duration, Number.isFinite(seconds) ? seconds : 0));
  const progress = elapsed / duration;
  if (kind !== 'arrival') {
    const destination = MISSION_VIEWS[STAGE_VIEWS[stage] || 'desk'];
    return { ...destination, progress, duration, blend: ease(progress), done: progress === 1, lidOpen: 1, caption: captions[stage] || captions[7] };
  }
  const right = arrival.findIndex((s, i) => i > 0 && elapsed <= s.at);
  const b = arrival[right < 0 ? arrival.length - 1 : right], a = arrival[Math.max(0, arrival.indexOf(b) - 1)];
  const t = ease(clamp((elapsed - a.at) / (b.at - a.at)));
  return {
    camera: mix(a.camera, b.camera, t), target: mix(a.target, b.target, t),
    caption: progress === 1 ? b.caption : a.caption, progress, duration, done: progress === 1,
    lidOpen: ease(clamp((elapsed - 1.2) / 3.5)),
  };
}
