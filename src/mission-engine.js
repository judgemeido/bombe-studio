import { encipher, ALPHABET } from './cipher.js';

const pairs = [['A', 'G']];
// The dispatch prefix is part of the transmission. Keeping it in the stream
// makes the crib alignment and the final decode use the same rotor stepping.
const plaintext = 'DXWETTERNORDHAFENFREI';
const ciphertext = encipher(plaintext, [1, 3, 5], pairs).output;

export const MISSION = {
  plaintext, ciphertext, strip: ciphertext, crib: 'WETTER', pairs,
  channels: [
    { title: '频道 A', label: '北线短呼号', text: '只出现过一次的短促呼号。没有固定时间，也没有足够长度，无法确认它属于今晚的交接。' },
    { title: '频道 B', label: '午夜交接报', text: '05:42，格式再次出现。报文总是带着同一段六字天气词；截收员标记：可能是 WETTER（天气）。' },
    { title: '频道 C', label: '机房自检', text: '每次换班都会播出。节拍和长度与密码机测试一致，属于本地设备，不是海面上的目标。' },
  ],
  stages: [
    { title: '雾里的幽灵频段', short: '截收', seconds: 90, place: '无线电桌 · 05:42 截收', speaker: '夜班截收员的耳机记录',
      story: '05:42，天还没有亮。北港外的巡逻艇等着一艘接头船，雾把海面压成一片黑。三份记录同时送来，先找出真正的交接频道。',
      goal: '从三个频道里锁定能给出稳定猜测的那一条。',
      hints: ['一次性的短呼号不能建立规律；先看时间、长度和重复格式。', '频道 B 在 05:42 重复出现，并留下 WETTER 这个待检验的词。'],
      depth: '截收阶段不负责读懂密文，只负责判断哪段信号值得投入人手。重复的业务格式会泄露用途，却不等于内容已经可信。',
      discussion: '如果交接船只有一次机会靠岸，你会先记录哪一种模式，为什么？',
      success: '你把今晚的任务锁在频道 B：05:42 的交接报。它给出一个线索，也把时间压力带进了机房。', clue: '频道 B / 05:42 / WETTER：可检验的起始线索。' },
    { title: '把天气词放回原位', short: '对齐', seconds: 120, place: '分析桌 · 对齐截报', speaker: '分析员的铅笔标记',
      story: 'WETTER 可能是德语“天气”，但它必须落在密文的正确位置。把这六个字母沿截报移动，任何自映射都会让摆法立即失效。',
      goal: '找到没有字母撞车的对齐位置，留下可继续检验的约束。',
      hints: ['Enigma 不会把一个字母加密成自己；铜红色格子就是矛盾。', '从第 3 格开始时没有自映射，但这只代表“尚未排除”。'],
      depth: '对齐是最便宜的筛选：它能快速排除错误，却不能单独证明词语正确。真正的菜单会把多组关系串起来，再交给机器检查。',
      discussion: '为什么在雾里行动时，“暂时没撞上矛盾”仍然不够？',
      success: 'WETTER 从第 3 格开始通过了不自映射检查。你得到的是一条更窄的路，不是最后答案。', clue: 'WETTER 对齐第 3 格：两处错误起点被排除。' },
    { title: '回声必须返回原点', short: '接线', seconds: 105, place: '接线板 · 回声约束', speaker: '韦尔奇曼留下的接线卡',
      story: '一条已知关系写在卡片上：A 接到 G。交接报如果从另一端回声，电流必须沿同一根线返回。补上反向端点，别让机器得到两种说法。',
      goal: '完成 A ↔ G 的双向接线，并确认两个端点只占一根线。',
      hints: ['接线是互易的关系，不是两个独立按钮。', '从 G 出发仍然会回到 A；T 和 G 都会制造冲突。'],
      depth: '接线板把字母成对交换。互易性让一个方向的证据能在回路另一端继续传播，也是后续排除候选的重要依据。',
      discussion: '如果 G 同时接到 A 和 T，哪一条记录会先暴露矛盾？',
      success: '回声沿 A ↔ G 返回原点。现在机器拥有一条可以重复检查的约束。', clue: '接线板确认 A ↔ G；端点没有重复占用。' },
    { title: '给搜索设一道窄门', short: '设轮', seconds: 135, place: 'Enigma · 交接设置单', speaker: '机房操作员的红边设置单',
      story: '不要让机器在黑暗里乱跑。设置单固定 I–II–III、环位 AAA，左轮起点 B，中轮起点 D，只有右轮留给搜索。',
      goal: '把左轮调到 B、中轮调到 D，把未知量交给后续候选搜索。',
      hints: ['按字母旁的 − / + 调整两个已知轮位；右轮保持未知。', '操作单写的是 B · D · ?，轮序 I–II–III 不需要改动。'],
      depth: '把已知条件固定下来，机器才是在回答一个问题，而不是制造一堆无法比较的结果。每次候选检查前都要从同一初始轮位开始。',
      discussion: '为什么“少给机器一个自由度”会让交接更快，而不是更慢？',
      success: '设置单已锁定 B · D · ?。机器只需回答一个清楚的问题：右轮哪一格能让 WETTER 回来？', clue: 'Enigma I–II–III / 环位 AAA / 初始轮位 B · D · ?。' },
    { title: '让机器筛掉错误名字', short: '搜索', seconds: 165, place: 'Bombe 机房 · 候选搜索', speaker: '机房值班记录',
      story: '启动 26 次候选搜索。每次都用真实 Enigma 运算，从右轮 A 到 Z 检查第 3 至 8 个字母；机器停下时，你只拿到一个名字，还没有拿到一条安全航线。',
      goal: '运行全部候选，并把停机结果当作候选，而不是结论。',
      hints: ['先让机器跑完 26 个右轮起点，观察哪一个还原完整 WETTER。', 'BDF 只说明开头匹配；要知道船能否通行，还要解密整条报文。'],
      depth: '这里是缩小后的枚举实验，不是完整战时 Bombe 的菜单搜索。机器擅长重复排除，人必须负责说明筛选条件和剩余未知。',
      discussion: '如果机器只留下一个名字，你还需要向交接班解释什么？',
      success: 'BDF 通过了 WETTER 检查。候选已留下，整条消息还在密文里等待核验。', clue: '26 个右轮起点中，BDF 是唯一通过 WETTER 的候选。' },
    { title: '让整段噪声开口', short: '解密', seconds: 165, place: '核验桌 · 连续解密', speaker: '你的交接核验单',
      story: '把机器复位到 BDF，再把完整截报送入回路。前两格 DX 也必须经过步进；跳过它们，后面的航线词就会错位。',
      goal: '解出完整报文，并读出它对北港交接的实际含义。',
      hints: ['点击“复位 BDF 并解密”，应用会保留整段连续步进。', 'NORDHAFEN 是“北港”，FREI 是“畅通 / 放行”；报文没有承诺雾会一直不散。'],
      depth: '同一套 Enigma 电路既能加密也能解密，但起点必须一致。真实核验要看整条消息的语法和上下文，不只看一个熟悉的词。',
      discussion: '如果只看到 FREI 就立刻放船，你遗漏了报文里的哪一种限制？',
      success: '报文读通了：“WETTER NORDHAFEN FREI”——北港天气允许通行。它是一次交接窗口，不是永远有效的保证。', clue: '完整明文：DX / WETTER NORDHAFEN FREI。' },
    { title: '黎明前的最后决定', short: '交接', seconds: 120, place: '情报桌 · 05:50 交接', speaker: '交接班主管的电话',
      story: '现在是 05:50，雾还没有散。报文说北港可通行，但它在 05:42 截收，潮汐、能见度和接头船位置都可能已经变化。你要把决定交给下一班。',
      goal: '选择一个既保留情报价值、又不把旧消息冒充实时保证的交接方案。',
      hints: ['把“报文说了什么”和“现在还不知道什么”分开写。', '标注 05:42，要求无线电和瞭望员交叉核验，再决定是否放行。'],
      depth: '破译完成只解决可读性；交接还要处理时效、来源和后果。一个负责任的情报结论会同时交出证据、时间戳与待确认事项。',
      discussion: '面对即将离港的船，你会把哪一个未知放在报告第一句？',
      success: '你提交了交接方案：保留 BDF 和明文，标注 05:42，并暂缓放行，直到无线电与瞭望员确认北港仍然畅通。', clue: '交接决定：标注时间，交叉核验，确认前暂缓放行。' },
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
    feedback = ['看时间和重复格式，不要被一次性呼号带走。', '当前对齐仍有同字母碰撞；从第 3 格重新检查。', '沿同一根线回到 A。A ↔ G 只能有一个互易答案。', '设置单要求左 B、中 D；右轮才是待搜索变量。'][s.stage];
  } else if (a.type === 'answer' && s.stage >= 4) {
    ok = s.stage === 4 ? s.results.length === 26 && a.value === 'candidate' : s.stage === 5 ? s.decoded === plaintext && a.value === 'route' : a.value === 'verify';
    feedback = s.stage === 4 ? s.results.length ? '机器只筛出了候选 BDF。把完整密文送入回路，确认它是否能读成一条交接消息。' : '先运行 26 个候选搜索，再判断停机结果。' : s.stage === 5 ? s.decoded ? '报文给出北港与时间窗口，不等于永远安全。请选择与明文一致的解释。' : '先复位 BDF，用整条密文完成连续解密。' : '05:42 的报文有价值，但必须标出时间并交叉核验，确认前暂缓放行。';
  } else return s;
  return ok ? { ...s, cleared: true, feedback: MISSION.stages[s.stage].success, clues: [...s.clues, MISSION.stages[s.stage].clue] } : { ...s, attempts: s.attempts + 1, feedback };
}
