import { encipher, ALPHABET } from './cipher.js';

const pairs = [['A', 'G']];
// Keep the dispatch prefix in the stream. The crib alignment and final decode
// must use the same continuously stepped Enigma path.
const plaintext = 'DXWETTERNORDHAFENFREI';
const ciphertext = encipher(plaintext, [1, 3, 5], pairs).output;
const beatId = index => `S${String(index + 1).padStart(2, '0')}`;

const action = (type, label, values = []) => ({ type, label, values });
const transition = (from, to, cue) => ({ from, to, cue });

const beats = [
  {
    id: 'S01', zone: 'entrance', place: '夜班入口 · 外廊', speaker: '交班耳机里的值守员', seconds: 60,
    story: '05:42，雾贴着窗缝。耳机里只剩一声短促的载波，交班记录还没有落下时间。先把这一刻固定下来。',
    goal: '接起耳机，确认时间锚点和当前雾况。',
    actions: [action('checkin', '接起耳机并确认值守', ['ready'])], control: 'checkin',
    success: '耳机接通。05:42 被写入交班纸，雾况成为之后每条判断的时间背景。',
    clue: '时间锚点：05:42，雾况记录为待核验。', hints: ['先确认记录时间，再判断信号内容。', '值守员只需要确认接班，不要替后面的报文作结论。'],
    discussion: '一条没有时间的截收记录，之后还能证明它属于哪一次交接吗？',
    transition: transition('entrance', 'radio', '耳机里的载波把你引向无线电室。'),
  },
  {
    id: 'S02', zone: 'radio', place: '无线电室 · 接收台', speaker: '夜班截收员的抄录', seconds: 60,
    story: '三段频率同时亮起：一段只来过一次，一段在 05:42 重复，还有一段是机房自检。稳定重复的格式才值得继续追。',
    goal: '调谐三段频率，锁定重复出现的交接信号。',
    actions: [action('channel', '选择重复出现的交接频道', [0, 1, 2]), action('submit', '锁定频段')], control: 'channel',
    success: '频道 B 的时间和报头重复出现。它留下了一个可检验的天气词。',
    clue: '频道 B / 05:42：重复报头成为主线。', hints: ['一次性的短呼号不能建立规律。', '机房自检会重复，但不会带来海上交接格式。'],
    discussion: '稳定出现的格式能说明信号用途，却还不能证明内容真实。',
    transition: transition('radio', 'radio', '抄报灯把你带到排纸台。'),
  },
  {
    id: 'S03', zone: 'radio', place: '无线电室 · 排纸台', speaker: '截收纸边缘的铅笔记号', seconds: 60,
    story: '纸带被雾气打湿，三张截收纸的顺序散了。时间、长度和报头必须重新排成一条能复核的记录。',
    goal: '按时间和报文长度恢复截收纸的先后。',
    actions: [action('order', '按时间和长度排序截收纸', ['chronological']), action('submit', '封存排序')], control: 'order',
    success: '三张纸重新排好，重复报头与 05:42 的时间锚点对齐。',
    clue: '截收纸已按时间排序，报头顺序恢复。', hints: ['先看时间戳，再用报文长度处理并列项。', '排序不是解密，它只让后续线索拥有可追溯的来源。'],
    discussion: '如果纸张顺序错一格，后面的 crib 还能指向同一条报文吗？',
    transition: transition('radio', 'archive', '装订夹上的旧班号指向档案走廊。'),
  },
  {
    id: 'S04', zone: 'archive', place: '档案走廊 · 班次记录墙', speaker: '旧班记录的折角', seconds: 60,
    story: '旧班记录挂满走廊。只有一种报头格式曾在换班时留下六字天气词，其他纸条属于设备自检或无关短呼。',
    goal: '从旧班记录中找出与当前报头相同的通信格式。',
    actions: [action('archive', '选择同格式的旧班记录', ['weather']), action('submit', '比对档案')], control: 'archive',
    success: '旧班记录确认了天气词形。它可以作为 crib 假设，但还没有通过机器核验。',
    clue: '历史格式匹配：六字天气词，候选为 WETTER。', hints: ['找重复格式，不要被单个熟悉字母说服。', '档案只能生成假设，Enigma 自映射约束仍要检查。'],
    discussion: '档案里的相似格式如何成为线索，又如何避免变成先入为主？',
    transition: transition('archive', 'analysis', '一张标着 WETTER 的纸被送到分析室。'),
  },
  {
    id: 'S05', zone: 'analysis', place: '分析室 · 放大灯下', speaker: '分析员的圈注', seconds: 60,
    story: '短报的前八格被放大。把可能的六字 crib 圈出来，并把它和密文保持在同一条连续纸带上。',
    goal: '从短报中提取可检验的 WETTER 假设。',
    actions: [action('crib', '圈出天气词 WETTER', ['WETTER']), action('submit', '提交 crib')], control: 'crib',
    success: 'WETTER 被圈入分析记录。接下来要移动它，排除 Enigma 不允许的自映射。',
    clue: '候选 crib：WETTER，来源和时间已登记。', hints: ['保留 DX 前缀，连续步进不能从 W 开始计算。', '一个词语熟悉，不代表它落在正确位置。'],
    discussion: '为什么把来源、时间和词形放在同一张记录上很重要？',
    transition: transition('analysis', 'analysis', '放大灯下的纸带滑入对齐框。'),
  },
  {
    id: 'S06', zone: 'analysis', place: '分析室 · 对齐框', speaker: '关系图旁的红色铅笔', seconds: 60,
    story: '把 WETTER 沿着密文移动。Enigma 不会把一个字母加密成自己；任何撞车位置都应立刻标红。',
    goal: '找到没有自映射冲突的 crib 对齐位置。',
    actions: [action('align', '移动 WETTER 对齐位置', [0, 1, 2]), action('submit', '检查对齐')], control: 'align',
    success: '第 3 格对齐没有自映射冲突。它仍是约束，不是最终明文。',
    clue: 'WETTER 对齐第 3 格；两个错误起点已排除。', hints: ['铜红色格子是直接矛盾。', '暂时没撞上矛盾只意味着可以继续。'],
    discussion: '排除错误比证明正确更快，但为什么仍然不能停在这里？',
    transition: transition('analysis', 'analysis', '无冲突的字母关系被抄进约束图。'),
  },
  {
    id: 'S07', zone: 'analysis', place: '分析室 · 关系图', speaker: '关系链上的别针', seconds: 60,
    story: '把 crib 里彼此关联的字母关系连起来。关系链越完整，Bombe 的重复筛选就越有边界。',
    goal: '把 A 与 G 的关系连成可搜索的约束链。',
    actions: [action('relation', '连接 A ↔ G 关系', ['A-G', 'A↔G']), action('submit', '封存关系图')], control: 'relation',
    success: 'A ↔ G 关系链闭合。现在可以把约束带到接线工作台。',
    clue: '关系图闭合：A ↔ G 作为搜索约束。', hints: ['一条关系需要两个端点。', '图上的箭头是回路，不是单向猜测。'],
    discussion: '关系链怎样让机器少做无意义的尝试？',
    transition: transition('analysis', 'machine', '关系图上的 A 和 G 被标到接线台。'),
  },
  {
    id: 'S08', zone: 'machine', place: '机房 · 接线工作台', speaker: '韦尔奇曼留下的接线卡', seconds: 60,
    story: '接线板把字母成对交换。让 A 与 G 互易相连，任何一端进入都必须从另一端返回。',
    goal: '完成 A ↔ G 的双向接线。',
    actions: [action('pair', '接入 A 与 G', ['A']), action('submit', '核对互易接线')], control: 'pair',
    success: 'A ↔ G 接线闭合，两个端点各只占一根线。',
    clue: '接线板已固定 A ↔ G，互易约束成立。', hints: ['进入 A 就必须从 G 离开。', '不要把同一端点接到两条线上。'],
    discussion: '互易接线如何帮助另一端的约束继续传播？',
    transition: transition('machine', 'machine', '接线卡被夹到 Enigma 操作台。'),
  },
  {
    id: 'S09', zone: 'machine', place: '机房 · Enigma 操作台', speaker: '操作员的红边设置单', seconds: 60,
    story: '设置单固定 I–II–III 与 AAA 环位。左轮 B、中轮 D 已知，右轮保留给候选搜索。',
    goal: '设定左 B、中 D，把右轮留作未知量。',
    actions: [action('rotor', '调整左中轮位', ['left', 'middle']), action('submit', '封存设置单')], control: 'rotor',
    success: '设置单锁定 B · D · ?。每个候选都会从同一个初始条件重新开始。',
    clue: 'Enigma I–II–III / 环位 AAA / 初始轮位 B · D · ?。', hints: ['左轮调到 B，中轮调到 D。', '右轮不要手动猜，交给 26 次真实运算。'],
    discussion: '固定已知条件怎样让不同候选结果可以公平比较？',
    transition: transition('machine', 'machine', '设置单亮起，机房的两组鼓轮开始预热。'),
  },
  {
    id: 'S10', zone: 'machine', place: '机房 · 候选搜索台', speaker: '机房值班记录', seconds: 60,
    story: '两组鼓轮按相同设置依次运行。26 个右轮起点会被逐一检查，停机只代表值得比较。',
    goal: '启动完整的 26 个右轮候选搜索。',
    actions: [action('search', '启动 26 个候选搜索')], control: 'search',
    success: '搜索完成，机器留下 26 条结果，其中一条通过 WETTER 约束。',
    clue: '候选批次完成：BDF 进入比较清单。', hints: ['每次候选都从 B · D · A 到 Z 开始。', '停机是候选，不是放行命令。'],
    discussion: '机器把重复工作做完后，人还要解释哪一种语义风险？',
    transition: transition('machine', 'machine', '两条停机纸带被送到比较灯箱。'),
  },
  {
    id: 'S11', zone: 'machine', place: '机房 · 比较灯箱', speaker: '比较员的红蓝铅笔', seconds: 60,
    story: '灯箱上有两条停机结果。对照开头约束和整段语义，剔除只在局部匹配的噪声，保留可复核的 BDF。',
    goal: '比较停机结果，选择需要送入整段核验的候选。',
    actions: [action('compare', '保留 BDF 作为候选', ['candidate', 'BDF']), action('answer', '确认候选仍需核验', ['candidate'])], control: 'compare',
    success: 'BDF 被保留为唯一候选。整段密文还没有读通，核验室正在等它。',
    clue: '候选设置：BDF；局部匹配尚未升级为行动结论。', hints: ['不要把“机器留下”写成“已经证实”。', '下一步必须输入完整密文并保留连续步进。'],
    discussion: '为什么一个漂亮的局部匹配仍然需要完整解密？',
    transition: transition('machine', 'analysis', 'BDF 设置单和完整纸带一起送往核验室。'),
  },
  {
    id: 'S12', zone: 'analysis', place: '核验室 · 连续解密台', speaker: '你的交接核验单', seconds: 60,
    story: '从 BDF 复位，把完整截报送入同一条 Enigma 回路。DX 前缀也必须经过步进，后面的航线词才不会错位。',
    goal: '用 BDF 连续解密完整截报，读出可复核的明文。',
    actions: [action('decode', '复位 BDF 并解密整段报文'), action('answer', '确认北港窗口含义', ['route'])], control: 'decode',
    success: '明文读通：“DX / WETTER NORDHAFEN FREI”。这是一次北港窗口，不是永久保证。',
    clue: '完整明文：DX / WETTER NORDHAFEN FREI。', hints: ['不要跳过 DX 的两次步进。', 'NORDHAFEN 是北港，FREI 表示当前窗口可通行。'],
    discussion: '读通一条消息与证明它仍然适用，中间还缺哪一步？',
    transition: transition('analysis', 'map', '明文中的北港被投到地图室的墙图上。'),
  },
  {
    id: 'S13', zone: 'map', place: '地图室 · 北港墙图', speaker: '地图值守员的图钉', seconds: 60,
    story: '把 NORDHAFEN 标到北港墙图，再把 05:42 的报文窗口贴到潮汐纸边。文字第一次落到了真实行动空间。',
    goal: '在地图上标出北港和报文有效窗口。',
    actions: [action('map', '标记北港交接窗口', ['north-harbor', 'north-harbor-window'])], control: 'map',
    success: '北港位置和 05:42 窗口已落图，地图把明文与行动位置连接起来。',
    clue: '地图标记：NORDHAFEN / 05:42 窗口。', hints: ['位置和时间要一起标记。', '地图上的点不是实时船位。'],
    discussion: '把文字放上地图后，哪些未知仍然没有被解密解决？',
    transition: transition('map', 'map', '窗边的瞭望记录刚刚送到地图室。'),
  },
  {
    id: 'S14', zone: 'map', place: '地图室 · 窗边瞭望台', speaker: '瞭望员的新到记录', seconds: 60,
    story: '新记录显示雾仍在，船位没有被报文覆盖。把 05:42 的来源、当前能见度和待确认船位并列交叉核验。',
    goal: '对照新到的瞭望记录，标出仍未确认的变量。',
    actions: [action('verify', '完成无线电与瞭望交叉核验', ['cross-check', 'verify'])], control: 'verify',
    success: '交叉核验完成：报文有价值，但时效和船位仍需交班确认。',
    clue: '待确认事项：当前能见度与接头船位置。', hints: ['报文时间必须和新记录并列。', '未知事项应该写入交接，而不是用猜测填空。'],
    discussion: '情报有效但不完整时，报告应该如何表达不确定性？',
    transition: transition('map', 'handoff', '电话铃响起，下一班正在交接室等候。'),
  },
  {
    id: 'S15', zone: 'handoff', place: '交接室 · 封存桌', speaker: '交接班主管的电话', seconds: 60,
    story: '05:50，雾还没有散。把 BDF、明文、时间戳与未确认事项写进交接表，再决定是否暂缓放行。',
    goal: '提交一份保留证据、标注时效并暂缓放行的交接结论。',
    actions: [action('handoff', '提交交接结论并暂缓放行', ['hold', 'verify'])], control: 'handoff',
    success: '交接表已封存：保留 BDF 与明文，标注 05:42，确认前暂缓放行。',
    clue: '最终交接：保留证据，标注时效，确认前暂缓放行。', hints: ['写出消息说了什么，也写出现在还不知道什么。', '有价值的线索不应因为尚未确认就被丢弃。'],
    discussion: '面对即将离港的船，你会把哪一个未知放在报告第一句？',
    transition: transition('handoff', 'handoff', '封存盒合上，窗外天色开始变亮。'),
  },
].map(beat => Object.freeze(beat));

export const MISSION = Object.freeze({
  plaintext,
  ciphertext,
  strip: ciphertext,
  crib: 'WETTER',
  pairs,
  channels: [
    { title: '频道 A', label: '一次性短呼号', text: '只出现过一次，缺少时间和长度规律。' },
    { title: '频道 B', label: '重复交接报', text: '05:42 重复出现，带着六字天气词。' },
    { title: '频道 C', label: '机房自检', text: '每次换班都会播出，属于本地设备。' },
  ],
  stages: beats,
  searchCandidates,
  alignmentConflicts,
});

export function alignmentConflicts(offset) {
  if (![0, 1, 2].includes(offset)) throw new RangeError('无效的对齐位置');
  return [...MISSION.crib].flatMap((char, index) => char === MISSION.strip[offset + index] ? [index] : []);
}

export function searchCandidates(positions) {
  return [...ALPHABET].map((_, index) => {
    const candidate = [positions[0], positions[1], index];
    const output = encipher(MISSION.ciphertext.slice(0, 8), candidate, pairs).output.slice(2);
    return { positions: candidate, key: candidate.map(value => ALPHABET[value]).join(''), output, matches: output === MISSION.crib };
  });
}

export function initialMission() {
  return {
    phase: 'briefing', stage: 0, beat: 0, beatId: 'S01', currentZone: 'entrance', paused: false,
    cleared: false, hint: 0, clues: [], evidence: [], feedback: '', attempts: 0, elapsed: 0,
    channel: null, order: null, archive: null, cribSelection: null, offset: 0, relation: null,
    pair: null, positions: [0, 0, 0], results: [], selectedCandidate: null, candidate: null,
    decoded: '', mapMarker: null, crossCheck: null, handoff: null, checkin: false,
  };
}

const same = (s, patch) => ({ ...s, feedback: '', ...patch });
const alias = type => ({
  'check-in': 'checkin', 'sort-papers': 'order', 'archive-match': 'archive', 'extract-crib': 'crib',
  link: 'relation', 'compare-candidates': 'compare', marker: 'map', 'cross-check': 'verify',
  'handoff-submit': 'handoff',
}[type] || type);

function success(s, detail = MISSION.stages[s.stage].success, patch = {}) {
  const beat = MISSION.stages[s.stage];
  const evidence = { beatId: beat.id, zone: beat.zone, clue: beat.clue, detail };
  return { ...s, ...patch, cleared: true, feedback: detail, clues: [...s.clues, beat.clue], evidence: [...s.evidence, evidence] };
}

function failure(s, message) {
  return { ...s, attempts: s.attempts + 1, feedback: message };
}

function submit(s) {
  const checks = [
    s.checkin,
    s.channel === 1,
    s.order === 'chronological',
    s.archive === 'weather',
    s.cribSelection === 'WETTER',
    alignmentConflicts(s.offset).length === 0,
    ['A-G', 'A↔G'].includes(s.relation),
    s.pair === 'A',
    s.positions[0] === 1 && s.positions[1] === 3,
  ];
  const messages = [
    '先确认耳机和时间锚点。', '重复报头才是当前主线。', '先恢复纸带顺序，再比较内容。',
    '档案只能提供格式线索。', '把 WETTER 圈进连续纸带。', '当前对齐仍有同字母冲突。',
    '关系链需要两个互相返回的端点。', '接线必须沿同一根线返回。', '设置单要求左 B、中 D。',
  ];
  return checks[s.stage] ? success(s) : failure(s, messages[s.stage]);
}

export function reduceMission(s, rawAction) {
  const a = rawAction || {};
  if (a.type === 'restart') return initialMission();
  if (a.type === 'start' && s.phase === 'briefing') return { ...s, phase: 'playing' };
  if (s.phase !== 'playing') return s;
  if (a.type === 'pause') return s.paused ? s : { ...s, paused: true };
  if (a.type === 'resume') return s.paused ? { ...s, paused: false } : s;
  if (s.paused) return s;
  if (a.type === 'tick') return Number.isFinite(a.seconds) && a.seconds > 0 && a.seconds <= 5 ? { ...s, elapsed: s.elapsed + a.seconds } : s;
  if (a.type === 'next') {
    if (!s.cleared) return s;
    if (s.stage === MISSION.stages.length - 1) return { ...s, phase: 'complete' };
    const stage = s.stage + 1;
    return { ...s, stage, beat: stage, beatId: beatId(stage), currentZone: MISSION.stages[stage].zone, cleared: false, hint: 0, feedback: '' };
  }
  if (s.cleared) return s;
  if (a.type === 'hint') return { ...s, hint: Math.min(s.hint + 1, MISSION.stages[s.stage].hints.length), feedback: '' };
  const type = alias(a.type);
  const patch = value => same(s, value);
  if (s.stage === 0 && type === 'checkin') {
    return ['ready', 'confirm', 'confirmed'].includes(a.value) ? success(s, undefined, { checkin: true }) : failure(s, '先确认耳机已经接通，再把 05:42 写入交班纸。');
  }
  if (s.stage === 1 && type === 'channel' && [0, 1, 2].includes(a.value)) return patch({ channel: a.value });
  if (s.stage === 2 && type === 'order' && ['chronological', 'time'].includes(a.value)) return patch({ order: 'chronological' });
  if (s.stage === 3 && type === 'archive' && ['weather', 'format'].includes(a.value)) return patch({ archive: 'weather' });
  if (s.stage === 4 && type === 'crib' && String(a.value).toUpperCase() === 'WETTER') return patch({ cribSelection: 'WETTER' });
  if (s.stage === 5 && type === 'align' && [0, 1, 2].includes(a.value)) return patch({ offset: a.value });
  if (s.stage === 6 && type === 'relation' && ['A-G', 'A↔G'].includes(a.value)) return patch({ relation: a.value });
  if (s.stage === 7 && type === 'pair' && ['A', 'G'].includes(a.value)) return patch({ pair: a.value });
  if (s.stage === 8 && type === 'rotor' && [0, 1].includes(a.index)) {
    const value = Number.isInteger(a.value) ? a.value : Number.isInteger(a.step) ? s.positions[a.index] + a.step : NaN;
    if (!Number.isInteger(value) || value < 0 || value > 25) return s;
    return patch({ positions: s.positions.map((current, index) => index === a.index ? value : current) });
  }
  if (s.stage === 9 && type === 'search') {
    if (s.positions[0] !== 1 || s.positions[1] !== 3) return failure(s, '先把设置单固定为左 B、中 D，再启动鼓轮搜索。');
    return success(s, '26 个右轮起点已完成真实 Enigma 筛选。', { results: searchCandidates(s.positions), selectedCandidate: null });
  }
  if (s.stage === 10 && ['answer', 'compare'].includes(type)) {
    if (s.results.length !== 26) return failure(s, '先运行完整的 26 个右轮候选搜索。');
    const candidate = s.results.find(result => result.matches);
    if (candidate && ['candidate', 'BDF', candidate.key].includes(a.value)) return success(s, undefined, { selectedCandidate: candidate.key, candidate });
    return failure(s, '停机结果只是候选；选择通过 WETTER 约束、需要整段核验的 BDF。');
  }
  if (s.stage === 11 && (type === 'decode' || (type === 'answer' && a.value === 'route'))) {
    if (type === 'answer' && !s.decoded) return s;
    const candidate = s.candidate || s.results.find(result => result.matches);
    if (!candidate) return failure(s, '先保留 BDF 候选，再把完整密文送入回路。');
    const decoded = encipher(MISSION.ciphertext, candidate.positions, pairs).output;
    if (decoded !== MISSION.plaintext) return failure({ ...s, decoded }, '这组设置没有读出完整交接报，回到候选比较。');
    return success(s, undefined, { decoded, candidate, selectedCandidate: candidate.key });
  }
  if (s.stage === 12 && type === 'map' && ['north-harbor', 'north-harbor-window', 'NORDHAFEN'].includes(a.value)) return success(s, undefined, { mapMarker: 'north-harbor-window' });
  if (s.stage === 13 && type === 'verify' && ['cross-check', 'verify'].includes(a.value)) return success(s, undefined, { crossCheck: true });
  if (s.stage === 14 && type === 'handoff' && ['hold', 'verify'].includes(a.value)) return success(s, undefined, { handoff: 'hold' });
  if (type === 'submit' && s.stage >= 0 && s.stage <= 8) return submit(s);
  return s;
}
