import { seededRandom, shuffle } from './challenge-engine.js';
import { encipher, ALPHABET } from './cipher.js';
import { ROGUE_CASES, ROGUE_EVENTS, ROGUE_ROLES } from './rogue-content.js';
export { ROGUE_EVENTS, ROGUE_ROLES } from './rogue-content.js';

function buildRoute(seed) {
  const random = seededRandom(`${seed}:route`);
  return ROGUE_EVENTS.map((events, depth) => ({
    depth,
    nodes: shuffle(events, random).slice(0, 2).map((event, index) => ({
      ...event,
      id: `${depth + 1}-${index}-${event.type}`,
      options: createChoices(event.type),
    })),
  }));
}

const choicesByType = {
  signal: [['repeat', '锁定重复出现的频道', true], ['single', '采用只出现一次的呼号', false]],
  dispatch: [['dry', '先晾干原始抄报', true], ['copy', '直接抄写模糊字迹', false]],
  colleague: [['compare', '交叉比对两份值班记录', true], ['guess', '凭熟悉的呼号先作判断', false]],
  archive: [['timestamp', '按时间戳核对旧班记录', true], ['word', '只按相似词形归档', false]],
  tea: [['rest', '喝口茶，缓一缓再继续', true], ['rush', '把保温壶留给下一班', false]],
  analysis: [['align', '移动 crib，排除自映射位置', true], ['assume', '先把第一个对齐当成答案', false]],
  wire: [['loop', '沿双向关系核对接线卡', true], ['single', '只检查电流去程', false]],
  settings: [['known', '按已知条件封存设置单', true], ['guess', '凭手感猜一个轮位', false]],
  machine: [['compare', '把停机候选送去完整核验', true], ['release', '把一次停机直接当成结论', false]],
};
const EVIDENCE_BY_DEPTH = ['source', 'crib', 'constraint', 'settings'];
const TOOL_DATA = Object.freeze({
  lens: { id: 'lens', name: '放大镜', effect: 'hint' },
  tea: { id: 'tea', name: '保温茶', effect: 'reserve' },
  paper: { id: 'paper', name: '备用纸带', effect: 'retry' },
});

function createChoices(type) {
  return (choicesByType[type] || choicesByType.colleague).map(([id, label, success]) => ({
    id, label, success,
    cost: success ? 0 : 1,
    item: success ? (type === 'tea' ? null : 'lens') : (type === 'dispatch' ? 'paper' : null),
  }));
}

export function createRogueRun(seed, { role = 'intercept' } = {}) {
  if (!ROGUE_ROLES.some(item => item.id === role)) throw new RangeError('未知岗位');
  const value = String(seed);
  const hasChannelEvidence = role === 'intercept';
  return {
    seed: value,
    phase: 'briefing',
    role,
    depth: 0,
    route: buildRoute(value),
    currentNode: null,
    paused: false,
    resources: { reserve: 3 },
    evidence: hasChannelEvidence ? [{ type: 'source', quality: 'clear', text: '截收员的频道记录已夹入案件袋。' }] : [],
    inventory: [],
    abilityUsed: hasChannelEvidence,
    abilityAvailable: role !== 'intercept',
    waiveNextCost: false,
    rerollUsed: false,
    attempts: 0,
    mistakes: 0,
    assistance: false,
    caseFile: createCaseFile(seededRandom(`${value}:case`)),
    history: [],
    ending: null,
  };
}

function buildCase(random, templateIndex) {
  const template = ROGUE_CASES[templateIndex];
  const plaintext = `DX${template.plaintext}`;
  const crib = template.plaintext.slice(0, Math.min(5, template.plaintext.length));
  const knownLeft = Math.floor(random() * 26), knownMiddle = Math.floor(random() * 26);
  const [plugA, plugB] = shuffle([...ALPHABET], random).slice(0, 2);
  const solutionRight = Math.floor(random() * 26);
  const plugboard = [[plugA, plugB]];
  const positions = [knownLeft, knownMiddle, solutionRight];
  const ciphertext = encipher(plaintext, positions, plugboard).output;
  const candidates = [...ALPHABET].map((right, value) => {
    const decoded = encipher(ciphertext, [knownLeft, knownMiddle, value], plugboard).output;
    return { right: value, matches: decoded.slice(2, 2 + crib.length) === crib };
  });
  return {
    id: template.id,
    label: template.label,
    ciphertext,
    plaintext,
    crib,
    cribOffset: 2,
    rotors: ['I', 'II', 'III'],
    ring: [0, 0, 0],
    knownLeft,
    knownMiddle,
    plugboard,
    solutionRight,
    candidates,
  };
}

function generateValidCase(random, templateIndex, attempts = 256) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const candidate = buildCase(random, templateIndex);
    if (candidate.candidates.filter(item => item.matches).length === 1 && candidate.candidates[candidate.solutionRight].matches) return candidate;
  }
  return null;
}

const fallbackCases = Object.freeze(ROGUE_CASES.map((_, index) => {
  const result = generateValidCase(seededRandom(`bombe-rogue-case-fallback-${index}`), index, 4096);
  if (!result) throw new Error(`Unable to create validated fallback case ${index}`);
  return result;
}));

export function createCaseFile(random) {
  if (typeof random !== 'function') throw new TypeError('案件生成需要随机数函数');
  const templateIndex = Math.floor(random() * ROGUE_CASES.length);
  return generateValidCase(random, templateIndex) || structuredClone(fallbackCases[templateIndex]);
}

export function validateCaseFile(caseFile) {
  if (!caseFile || typeof caseFile.ciphertext !== 'string' || !caseFile.ciphertext.length || !/^[A-Z]+$/.test(caseFile.ciphertext)) return { ok: false, reason: '密文必须是 A–Z 字母。' };
  if (caseFile.rotors?.join('-') !== 'I-II-III' || caseFile.ring?.join(',') !== '0,0,0') return { ok: false, reason: '转子或环位超出案件规则。' };
  if (!Number.isInteger(caseFile.knownLeft) || !Number.isInteger(caseFile.knownMiddle) || !Number.isInteger(caseFile.solutionRight)) return { ok: false, reason: '案件轮位无效。' };
  if (caseFile.cribOffset < 0 || caseFile.cribOffset + caseFile.crib.length > caseFile.plaintext.length) return { ok: false, reason: 'crib 位置超出明文。' };
  let decoded;
  try { decoded = encipher(caseFile.ciphertext, [caseFile.knownLeft, caseFile.knownMiddle, caseFile.solutionRight], caseFile.plugboard).output; }
  catch { return { ok: false, reason: '接线或轮位无效。' }; }
  if (decoded !== caseFile.plaintext) return { ok: false, reason: '密文与明文不匹配。' };
  if ([...caseFile.crib].some((char, index) => char === caseFile.ciphertext[caseFile.cribOffset + index])) return { ok: false, reason: 'crib 存在 Enigma 自映射冲突。' };
  const matches = [...ALPHABET].filter((_, right) => encipher(caseFile.ciphertext, [caseFile.knownLeft, caseFile.knownMiddle, right], caseFile.plugboard).output.slice(caseFile.cribOffset, caseFile.cribOffset + caseFile.crib.length) === caseFile.crib);
  if (matches.length !== 1 || ALPHABET.indexOf(matches[0]) !== caseFile.solutionRight) return { ok: false, reason: 'crib 没有唯一右轮候选。' };
  return { ok: true, reason: '' };
}

export function selectRogueNode(state, nodeId) {
  if (state.phase !== 'route' || state.paused) return state;
  const node = state.route[state.depth]?.nodes.find(item => item.id === nodeId);
  if (!node) return state;
  return { ...state, phase: 'event', currentNode: node };
}

function addTool(inventory, toolId) {
  const tool = TOOL_DATA[toolId];
  if (!tool || inventory.some(item => item.id === tool.id) || inventory.length >= 2) return inventory;
  return [...inventory, { ...tool }];
}

function reduceEvent(state, action) {
  if (state.phase !== 'event') return state;
  const option = state.currentNode.options.find(item => item.id === action.choiceId);
  if (!option) return state;
  let cost = option.cost;
  let abilityUsed = state.abilityUsed;
  if (!option.success && state.role === 'mechanic' && state.abilityAvailable) {
    cost = 0;
    abilityUsed = true;
  }
  const reserve = Math.max(0, Math.min(3, state.resources.reserve - cost + (state.currentNode.type === 'tea' && option.success ? 1 : 0)));
  const gainedEvidence = {
    type: EVIDENCE_BY_DEPTH[state.depth],
    quality: option.success ? 'clear' : 'partial',
    text: option.success ? state.currentNode.reward : `${state.currentNode.reward}仍有疑点。`,
  };
  const historyEntry = { depth: state.depth, nodeId: state.currentNode.id, choiceId: option.id, success: option.success };
  return {
    ...state,
    phase: 'event-complete',
    evidence: [...state.evidence, gainedEvidence],
    inventory: option.item ? addTool(state.inventory, option.item) : state.inventory,
    resources: { ...state.resources, reserve },
    abilityUsed,
    abilityAvailable: state.role === 'mechanic' && !abilityUsed,
    assistance: state.assistance || reserve === 0,
    mistakes: state.mistakes + Number(!option.success),
    history: [...state.history, historyEntry],
    lastOutcome: { success: option.success, text: option.success ? '记录核对完毕。' : '记录仍可带走，但余裕少了一格。' },
  };
}

function resolveFinal(state, action) {
  if (state.phase !== 'final') return state;
  const value = typeof action.value === 'string' ? ALPHABET.indexOf(action.value.toUpperCase()) : action.value;
  if (!Number.isInteger(value) || value < 0 || value > 25) return state;
  const candidate = state.caseFile.candidates[value];
  const attempts = state.attempts + 1;
  if (!candidate?.matches) {
    const waive = state.role === 'mechanic' && state.abilityAvailable;
    const reserve = Math.max(0, state.resources.reserve - Number(!waive));
    const abilityUsed = state.abilityUsed || waive;
    return {
      ...state,
      attempts,
      mistakes: state.mistakes + 1,
      resources: { ...state.resources, reserve },
      abilityUsed,
      abilityAvailable: state.role === 'mechanic' && !abilityUsed,
      assistance: state.assistance || reserve === 0 || attempts >= 3,
      lastOutcome: { success: false, text: attempts >= 3 ? '分析员把 crib 位置标了出来，再检查右轮字母。' : '这组轮位没有读通，再试一位。' },
    };
  }
  const decoded = encipher(state.caseFile.ciphertext, [state.caseFile.knownLeft, state.caseFile.knownMiddle, value], state.caseFile.plugboard).output;
  return {
    ...state,
    attempts,
    phase: 'handoff',
    decoded,
    chosenRight: value,
    evidence: [...state.evidence, { type: 'decode', quality: 'clear', text: '短报已由完整 Enigma 回路核验。' }],
  };
}

export function scoreRogueRun(state) {
  const clear = new Set(state.evidence.filter(item => item.quality === 'clear').map(item => item.type));
  if (state.phase === 'complete' && state.ending === 'hold' && ['source', 'crib', 'constraint', 'settings', 'decode'].every(type => clear.has(type))) {
    return { grade: 'complete', reasons: ['证据链完整', '全文已核验', '交接保留了待确认事项'] };
  }
  if (state.decoded) return { grade: 'qualified', reasons: ['短报已核验', '交接档案仍有未补齐的证据'] };
  return { grade: 'pending', reasons: ['完整解密尚未完成'] };
}

export function applyRogueEnding(state, decision) {
  if (state.phase !== 'handoff' || !['hold', 'release', 'defer'].includes(decision)) return state;
  return { ...state, phase: 'complete', ending: decision, history: [...state.history, { decision }] };
}

export function reduceRogueRun(state, action) {
  if (action.type === 'pause') return state.paused ? state : { ...state, paused: true };
  if (action.type === 'resume') return state.paused ? { ...state, paused: false } : state;
  if (state.paused) return state;
  if (action.type === 'select-node') return selectRogueNode(state, action.nodeId);
  if (action.type === 'resolve') return reduceEvent(state, action);
  if (action.type === 'continue' && state.phase === 'event-complete') {
    const depth = state.depth + 1;
    return { ...state, depth, phase: depth === 4 ? 'final' : 'route', currentNode: null };
  }
  if (action.type === 'use-tool') {
    const item = state.inventory.find(tool => tool.id === action.toolId);
    if (!item) return state;
    const inventory = state.inventory.filter(tool => tool.id !== item.id);
    if (item.effect === 'reserve') return { ...state, inventory, resources: { ...state.resources, reserve: Math.min(3, state.resources.reserve + 1) } };
    if (item.effect === 'hint') return { ...state, inventory, assistance: true, hintUsed: true };
    if (item.effect === 'retry') return { ...state, inventory, retryAvailable: true };
    return state;
  }
  if (action.type === 'use-ability' && state.abilityAvailable) {
    if (state.role === 'mechanic') return { ...state, abilityUsed: true, abilityAvailable: false, waiveNextCost: true };
    return state;
  }
  if (action.type === 'reroll' && state.role === 'archive' && !state.rerollUsed && state.phase === 'route') {
    const random = seededRandom(`${state.seed}:reroll:${state.depth}`);
    const events = ROGUE_EVENTS[state.depth];
    const nodes = shuffle(events, random).slice(0, 2).map((event, index) => ({ ...event, id: `${state.depth + 1}-r${index}-${event.type}`, options: createChoices(event.type) }));
    const route = state.route.map(layer => layer.depth === state.depth ? { ...layer, nodes } : layer);
    return { ...state, route, rerollUsed: true, abilityUsed: true, abilityAvailable: false };
  }
  if (action.type === 'submit-right') return resolveFinal(state, action);
  if (action.type === 'handoff') return applyRogueEnding(state, action.decision);
  if (action.type === 'close') return { ...state, phase: 'closed' };
  return state;
}
