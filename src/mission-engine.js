import { encipher, ALPHABET } from './cipher.js';

const pairs = [['A', 'G']];
// DX is an invented two-letter dispatch identifier, encrypted with the body.
// Its ciphertext WW creates two invalid crib offsets without fabricated padding.
const plaintext = 'DXWETTEROSTNEBELSECHSUHR';
const ciphertext = encipher(plaintext, [1, 3, 5], pairs).output;

export const MISSION = {
  plaintext, ciphertext, strip: ciphertext, crib: 'WETTER', pairs,
  channels: [
    { title: '频道 A', label: '零散呼号', text: '…KX… Q7… 信号中断。没有可比较的固定开头。' },
    { title: '频道 B', label: '定时气象报', text: '每天相近时刻出现，格式重复。截收员推测：开头可能是 WETTER（天气）。' },
    { title: '频道 C', label: '设备试音', text: '长短声反复播放。记录注明：本地设备校验，并非敌方报文。' },
  ],
  stages: [
    { title: '噪声里的一条线索', short: '截收', seconds: 90, place: '无线电桌 · 截收记录', speaker: '截收员的便笺',
      story: '图灵先生，三份记录刚刚送到。字母本身没有说明内容，但发送时间和重复格式也许能给我们一个起点。请选择最值得检查的那一份。',
      goal: '切换频道阅读记录，锁定有规律的气象报。',
      hints: ['先找重复的时间或格式，不必理解每一个字母。', '频道 B 的定时气象格式，能提供 WETTER 这个待检验的猜测。'],
      depth: '为什么重复格式会泄露线索？加密隐藏了文字，却未必隐藏发送时间、长度和业务习惯。这里的“天气”只是猜测，必须经过约束检查，不能凭熟悉感认定。',
      discussion: '如果只看字母不看发送时间，我们会漏掉什么？',
      success: '你留下了一个可以检验的猜测：WETTER，德语“天气”。下一步，让这个猜测接受规则的检查。', clue: '规律提供猜测，不提供证明。' },
    { title: '一个不可能，胜过一百次猜测', short: '对齐', seconds: 120, place: '分析桌 · 猜测文字', speaker: '你的工作笔记',
      story: 'Enigma 的电路让一个字母不会变成它自己。把 WETTER 放到截报上：只要有一格出现相同字母，这种摆法就不可能成立。',
      goal: '移动猜测的起点，找到没有字母撞车的对齐。',
      hints: ['上下相同的字母会标成铜红色，出现一格就要排除。', '试试从第 3 格开始。通过规则只表示“暂未排除”。'],
      depth: '这是必要条件，不是充分条件。没有自映射，不能证明 WETTER 就是原文。真实分析还会把多组字母关系组织为菜单，再进行机器搜索和核验。',
      discussion: '“没有发现错误”和“已经证明正确”有什么区别？',
      success: '这一处没有矛盾，可以继续检查。你没有猜中答案，而是排除了两种不可能。', clue: 'WETTER 从截报第 3 格开始，暂未发现自映射。' },
    { title: '让一根线，说明两个方向', short: '接线', seconds: 105, place: '接线板 · 相互一致', speaker: '韦尔奇曼递来的卡片',
      story: '“别只看一个方向。”工作单已经给出 A 接到 G。同一根线反向使用时，G 必须接回哪里？在接线板上补全这条关系。',
      goal: '选择 G 的另一端，再检查接线是否一致。',
      hints: ['接线是双向的一根线，不是两个独立的指令。', '既然 A ↔ G，那么从 G 出发就应回到 A。'],
      depth: 'Enigma 接线板是成对交换，一个端点不能占用两根线。韦尔奇曼的对角接线板把互易关系用于传播更多约束；这里展示原理，不复原其全部电路。',
      discussion: '如果有人又让 G 接到 T，会和哪条证据矛盾？',
      success: 'A ↔ G 的两端一致。一个小约束也能减少许多无效假设；这正是团队改进方法的价值。', clue: '接线 A ↔ G；其余字母本次实验不接线。' },
    { title: '给机器，一个清楚的问题', short: '设轮', seconds: 135, place: 'Enigma · 初始轮位', speaker: '操作员的设置单',
      story: '团队已经缩小范围：从左到右使用 I、II、III 号转子，环位固定 AAA。左轮起点是 B，中轮是 D，右轮起点还不知道。先把已知条件设置好。',
      goal: '把左轮调到 B、中轮调到 D，右轮留给搜索。',
      hints: ['按字母旁边的 − / + 调整；右轮暂时不需要你猜。', '设置单要求 B · D · ?。轮位和转子编号是两回事。'],
      depth: '我们主动固定了轮序、环位和接线，因此只剩 26 种右轮起点。历史任务远复杂得多。每次按键前转子会步进，所以核验不同候选前必须恢复相同起点。',
      discussion: '为什么把问题说清楚，比直接启动机器更重要？',
      success: '已知条件固定了：B · D · ?。接下来把重复检查交给机器，把解释结果的责任留给人。', clue: '轮序 I–II–III；环位 AAA；初始轮位 B · D · ?。' },
    { title: '让机器排除，让人来判断', short: '搜索', seconds: 165, place: 'Bombe 示意机 · 有限候选', speaker: '机房值班记录',
      story: '启动搜索。程序会用真实 Enigma 运算，从右轮 A 到 Z 逐一检验，看第 3 至 8 个字母能否还原为 WETTER。观察机器停下后，再决定你得到了什么。',
      goal: '运行 26 个候选，然后解释停机结果。',
      hints: ['先运行搜索，留意只有哪个起点还原出了完整 WETTER。', '通过六个字母的候选还要解开整条报文，不能就此宣布全部完成。'],
      depth: '本关直接枚举缩小后的 26 个 Enigma 起点，是真实算法实验，并非历史 Bombe 的菜单与逻辑消矛盾算法。背景机器动画说明搜索工作，不表示复原了完整 Bombe。',
      discussion: '机器筛出一个候选后，下一步还需要检查什么？',
      success: '你得到候选 BDF，它通过了开头检查。我们还欠整条消息一次核验。', clue: '26 个起点中，BDF 通过 WETTER 检查。' },
    { title: '把候选，交给整条消息', short: '解密', seconds: 165, place: '核验桌 · 逐字解密', speaker: '你的核验记录',
      story: '恢复 BDF 起点，再输入整条截报。猜测之前的两格也必须经过运算，才能保留正确的步进位置。留意转子的步进和灯板输出；最后判断它究竟说了什么。',
      goal: '复位并解密，再选择报文支持的含义。',
      hints: ['点击“复位 BDF 并解密”，不需要逐个键入长报文。', 'WETTER＝天气，OST＝东，NEBEL＝雾，SECHS UHR＝六时。'],
      depth: '加密和解密使用相同起点，而不是加密后的终点。每个输入字母先引起步进，再经过接线、转子、反射器和返回回路。屏幕结果来自这个完整运算。',
      discussion: '如果忘记复位，第一位就错了，后面还能照读吗？',
      success: '完整报文可读：“气象：东侧，六时有雾。”它说明天气，没有说哪里一定安全，也没有说明敌军下一步行动。', clue: '核验原文：WETTER OST NEBEL SECHS UHR。' },
    { title: '破译之后，才是判断的开始', short: '决策', seconds: 120, place: '情报桌 · 黎明已至', speaker: '交接给下一班',
      story: '报文描述六时的雾。现在已是七时，新的侦察报告还没有到。一份航行建议正在等待天气信息。作为分析人员，你该怎样交出自己的结论？',
      goal: '选一个与证据、时效和职责相称的做法。',
      hints: ['想想：天气会变化吗？这条消息包含所有信息吗？', '标明时间和不确定性，交由团队结合最新观察核验。'],
      depth: '信息可读、信息可信、信息仍有效，是三个不同问题。真实情报工作依赖交叉核验和协作。没有一条解密消息能自动替代决策者对环境与后果的判断。',
      discussion: '如果你向家长或决策者汇报，会把哪一个“不确定”放在第一句？',
      success: '你把已知与未知一起交给了团队。任务完成：不只解开密码，也学会对证据负责。', clue: '标注“六时气象”，结合最新观察复核后再提出建议。' },
  ],
};

export function alignmentConflicts(offset) {
  if (![0, 1, 2].includes(offset)) throw new RangeError('无效的对齐位置');
  return [...MISSION.crib].flatMap((c, i) => c === MISSION.strip[offset + i] ? [i] : []);
}
export function searchCandidates(positions) {
  return [...ALPHABET].map((_, n) => {
    const candidate = [positions[0], positions[1], n];
    const output = encipher(ciphertext.slice(0, 8), candidate, pairs).output.slice(2);
    return { positions: candidate, key: candidate.map(i => ALPHABET[i]).join(''), output, matches: output === MISSION.crib };
  });
}
export function initialMission() {
  return { phase: 'briefing', stage: 0, paused: false, cleared: false, hint: 0, clues: [], feedback: '', attempts: 0, elapsed: 0, channel: null, offset: 0, pair: null, positions: [0, 0, 0], results: [], decoded: '' };
}
export function reduceMission(s, a) {
  if (a.type === 'restart') return initialMission();
  if (a.type === 'start' && s.phase === 'briefing') return { ...s, phase: 'playing' };
  if (s.phase !== 'playing') return s;
  if (a.type === 'pause') return { ...s, paused: true };
  if (a.type === 'resume') return { ...s, paused: false };
  if (s.paused) return s;
  if (a.type === 'tick') return Number.isFinite(a.seconds) && a.seconds > 0 && a.seconds <= 5 ? { ...s, elapsed: s.elapsed + a.seconds } : s;
  if (a.type === 'next') return s.cleared ? { ...s, stage: Math.min(6, s.stage + 1), phase: s.stage === 6 ? 'complete' : 'playing', cleared: false, hint: 0, feedback: '' } : s;
  if (s.cleared) return s;
  if (a.type === 'hint') return { ...s, hint: Math.min(s.hint + 1, 2) };
  const change = patch => ({ ...s, feedback: '', ...patch });
  if (a.type === 'channel' && s.stage === 0 && [0, 1, 2].includes(a.value)) return change({ channel: a.value });
  if (a.type === 'align' && s.stage === 1 && [0, 1, 2].includes(a.value)) return change({ offset: a.value });
  if (a.type === 'pair' && s.stage === 2 && ['A', 'T', 'G'].includes(a.value)) return change({ pair: a.value });
  if (a.type === 'rotor' && s.stage === 3 && [0, 1].includes(a.index) && Number.isInteger(a.value) && a.value >= 0 && a.value < 26) return change({ positions: s.positions.map((n, i) => i === a.index ? a.value : n) });
  if (a.type === 'search' && s.stage === 4) return change({ results: searchCandidates(s.positions) });
  if (a.type === 'decode' && s.stage === 5) {
    const candidate = s.results.find(r => r.matches);
    return candidate ? change({ decoded: encipher(ciphertext, candidate.positions, pairs).output }) : s;
  }
  let ok, feedback;
  if (a.type === 'submit' && s.stage < 4) {
    ok = [s.channel === 1, alignmentConflicts(s.offset).length === 0, s.pair === 'A', s.positions[0] === 1 && s.positions[1] === 3][s.stage];
    feedback = ['看看发送时间和格式：哪份记录能提出一个具体的猜测？', '有相同字母出现在上下同一格。Enigma 不会把字母变成自身，再移动一次。', '沿同一根线往回走。A 接 G，反过来 G 就应该接 A。', '再对照设置单：左轮 B，中轮 D。编号 I、II 不需要改变。'][s.stage];
  } else if (a.type === 'answer' && s.stage >= 4) {
    ok = s.stage === 4 ? s.results.length === 26 && a.value === 'candidate' : s.stage === 5 ? s.decoded === plaintext && a.value === 'weather' : a.value === 'verify';
    feedback = s.stage === 4 ? s.results.length ? '机器验证了开头，完整报文还没有核验。它现在提供的是候选。' : '先运行搜索，拿到可观察的结果再判断。' : s.stage === 5 ? s.decoded ? '只读报文实际支持的内容：天气、东侧、雾、六时。不要加入没有出现的军事行动。' : '先复位并解密，用整条原文来判断。' : '六时的雾不保证七时仍在。标明消息时间，再与最新观察核验。';
  } else return s;
  return ok ? { ...s, cleared: true, feedback: MISSION.stages[s.stage].success, clues: [...s.clues, MISSION.stages[s.stage].clue] } : { ...s, attempts: s.attempts + 1, feedback };
}
