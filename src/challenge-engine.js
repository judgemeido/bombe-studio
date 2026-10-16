import { ALPHABET, letter, plugboard, stepPositions, traceLetter, pressKey, encipher } from './cipher.js';

// Each level draws from its own bank. Difficulty stays in order; prompts,
// parameters and answer positions change independently within that level.
export const LEVELS = Object.freeze([
  { id: 'parts', title: '认出小帮手', skill: '部件的作用' },
  { id: 'swap', title: '跳线换朋友', skill: '接线双向互换' },
  { id: 'step', title: '鼓轮走一步', skill: '按键先转位' },
  { id: 'trace', title: '跟着亮线走', skill: '完整信号回路' },
  { id: 'return', title: '信号原路回', skill: '相同轮位可往返' },
  { id: 'message', title: '救出小消息', skill: '设置与逐字解密' },
]);
export const PART_BANK = Object.freeze([
  { target: 'wiring', prompt: '谁能让一对字母交换位置？', hint: '找一找：哪块板上有两排插孔，可以插上一根跳线？', explanation: '接线板把连接的两个字母互换，两个方向都成立。' },
  { target: 'wiring', prompt: '要用一根线把 A 和 C 连起来，应该找谁？', hint: '不是转动圆盘；找可以插线的地方。', explanation: '跳线插在接线板上，连接的一对字母会双向互换。' },
  { target: 'rotor', prompt: '谁转动一步，就能改变字母走的路？', hint: '看看三个圆圆的、有字母刻度的部件。', explanation: '鼓轮转动后，触点对应的内部路线会改变。' },
  { target: 'rotor', prompt: '按下字母时，哪一组部件会先转位？', hint: '最右边的快轮会先走一步。它和另外两个圆盘是一组。', explanation: '按键先让鼓轮转位，然后信号再通过回路。' },
  { target: 'reflector', prompt: '谁像一面小镜子，把信号送回三只鼓轮？', hint: '找模型最左侧的窄板。信号在这里掉头。', explanation: '反射器让信号折返，反向再通过三只鼓轮。' },
  { target: 'reflector', prompt: '信号穿过三只鼓轮后，在哪里掉头？', hint: '它在慢轮 I 的左边，不需要像鼓轮一样转动。', explanation: '信号在反射器折返，接着按相反方向经过鼓轮。' },
]);
export const WORD_BANK = Object.freeze([
  ['SUN', '太阳'], ['CAT', '猫'], ['DOG', '狗'], ['SKY', '天空'], ['KEY', '钥匙'],
  ['MAP', '地图'], ['SEA', '大海'], ['RED', '红色'], ['BUS', '公交车'], ['CAR', '汽车'],
  ['BOX', '盒子'], ['ANT', '蚂蚁'], ['OWL', '猫头鹰'], ['BEE', '蜜蜂'], ['PIG', '小猪'],
  ['HAT', '帽子'], ['CUP', '杯子'], ['PEN', '笔'], ['FOX', '狐狸'], ['BUG', '小虫'],
]);
const SWAP_BANK = ['跳线的一端收到 {input}，另一端会送出谁？', '只看接线板：{input} 进去后，会从哪个字母离开？', '这根跳线连好了。字母 {input} 会变成谁？'];
const TRACE_BANK = ['按下 {input} 后，最后哪个字母会亮起？', '信号从 {input} 出发，走完九段会到哪里？', '做一次小实验：输入 {input}，找到最后的输出。'];
const RETURN_BANK = ['刚才 {input} 变成了 {output}。锁住鼓轮，把 {output} 送回去，会找到谁？', '保持轮位和接线不动：{input} → {output}，那么 {output} → 谁？'];
const partOptions = [{ value: 'wiring', label: '接线板', detail: '两排插孔与跳线' }, { value: 'rotor', label: '鼓轮', detail: '三个带字母的圆盘' }, { value: 'reflector', label: '反射器', detail: '最左侧的折返板' }];
const fill = (text, values) => text.replace(/\{(\w+)\}/g, (_, key) => values[key]);
export const positionText = positions => positions.map(letter).join('');

export function seededRandom(seed) {
  let h = 2166136261;
  for (const char of String(seed)) { h ^= char.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h += 0x6D2B79F5; let n = h; n = Math.imul(n ^ n >>> 15, n | 1); n ^= n + Math.imul(n ^ n >>> 7, n | 61); return ((n ^ n >>> 14) >>> 0) / 4294967296; };
}
export function shuffle(values, random) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function freshSeed() {
  const values = new Uint32Array(4); globalThis.crypto.getRandomValues(values);
  return [...values].map(n => n.toString(16).padStart(8, '0')).join('');
}
function generator(random, used) {
  const pick = values => values[Math.floor(random() * values.length)];
  const alphabet = () => pick([...ALPHABET]);
  const positions = () => [0, 0, 0].map(() => Math.floor(random() * 26));
  const pair = () => shuffle([...ALPHABET], random).slice(0, 2);
  function choices(answer, pool, count = 3) {
    const other = shuffle([...new Set(pool)].filter(value => value !== answer), random).slice(0, count - 1);
    return shuffle([answer, ...other].map(value => ({ value, label: value })), random);
  }
  return (level) => {
    const common = { level, ...LEVELS[level], positions: [0, 0, 0], pairs: [], topic: 'drums' };
    if (level === 0) {
      const available = PART_BANK.filter((item, variant) => !used.has(questionSignature({ ...common, ...item, variant, answer: item.target })));
      const item = pick(available.length ? available : PART_BANK);
      return { ...common, ...item, variant: PART_BANK.indexOf(item), answer: item.target, options: shuffle(partOptions, random), instruction: '读题，再点击模型上的部件标签，或在答案区选择。', steps: ['读题，找出这个部件的本领。', '拖动模型看看位置。', '点击一个部件，检查自己的发现。'] };
    }
    if (level === 1) {
      const cable = pair(), variant = Math.floor(random() * SWAP_BANK.length), unconnected = random() < .25;
      const input = unconnected ? pick([...ALPHABET].filter(c => !cable.includes(c))) : pick(cable), pairs = [cable];
      const answer = letter(plugboard(pairs)[ALPHABET.indexOf(input)]);
      return { ...common, variant, pairs, topic: 'wiring', input, answer, options: choices(answer, ALPHABET), prompt: fill(SWAP_BANK[variant], { input }), instruction: `跳线 ${cable.join(' ↔ ')}。本关只经过接线板。`, steps: ['找到任务卡上的这根跳线。', `点击“让 ${input} 通过接线板”，看字母走到哪。`, '在答案区选出离开的字母。'], hint: cable.includes(input) ? `从跳线的一个端点进去，就从另一个端点出来。现在输入的是 ${input}。` : `${input} 没有插跳线，它会保持原样。`, explanation: cable.includes(input) ? `${cable.join(' ↔ ')} 双向互换，所以 ${input} → ${answer}。` : `${input} 没有接跳线，所以仍然是 ${answer}。` };
    }
    if (level === 2) {
      const start = [Math.floor(random() * 4), Math.floor(random() * 4), pick([0, 1, 2, 3, 7, 8, 12, 13, 16, 17, 24, 25])];
      const count = pick([1, 2]); let next = start;
      for (let i = 0; i < count; i++) next = stepPositions(next);
      const answer = positionText(next), input = alphabet();
      const alternatives = [positionText(start), positionText([start[0], start[1], (start[2] + count + 1) % 26]), positionText([start[0], start[1], (start[2] + count + 2) % 26])];
      return { ...common, variant: count - 1, positions: start, count, input, answer, options: choices(answer, alternatives), prompt: `从 ${positionText(start)} 开始，按 ${count} 次字母后，轮位是什么？`, instruction: '本题只让最右侧快轮转动。Z 的下一步回到 A。', steps: ['读任务卡，记住起点。', `点击观察台的按键，共按 ${count} 次。`, '读模型上方的轮位，选出相同的一组字母。'], hint: `轮位从左到右读。每按一次，最右边快轮走一步；${count === 2 ? '这次要走两步。' : '这次只走一步。'}`, explanation: `${positionText(start)} → ${answer}。本题按了 ${count} 次，快轮走了 ${count} 步。` };
    }
    if (level === 3) {
      const start = positions(), input = alphabet(), pairs = random() < .5 ? [pair()] : [], variant = Math.floor(random() * TRACE_BANK.length);
      const trace = pressKey(input, start, pairs), answer = trace.output;
      return { ...common, variant, positions: start, pairs, input, answer, options: choices(answer, ALPHABET), prompt: fill(TRACE_BANK[variant], { input }), instruction: '不用背内部接线。让亮线走完，在观察台读出结果。', steps: [`点击“输入 ${input}，追踪亮线”。`, '跟着当前段读字母，也可以点“下一段”。', '走完九段后，选出输出字母。'], hint: '信号先过接线板，再过三只鼓轮，在反射器掉头，最后从接线板出来。', explanation: `按下 ${input}，轮位先变为 ${positionText(trace.positions)}，九段回路把它变成 ${answer}。` };
    }
    if (level === 4) {
      const start = positions(), input = alphabet(), pairs = [pair()], first = traceLetter(input, start, pairs), variant = Math.floor(random() * RETURN_BANK.length);
      return { ...common, variant, positions: start, pairs, input: first.output, original: input, answer: input, options: choices(input, ALPHABET), prompt: fill(RETURN_BANK[variant], { input, output: first.output }), instruction: `轮位锁定 ${positionText(start)}。这里直接送入信号，不再按键转轮。`, steps: [`先看已知线索：${input} → ${first.output}。`, `保持轮位，点击“送回 ${first.output}”。`, '观察回路，选出回到的字母。'], hint: `把路线倒着走，就会回到出发的字母。出发时是 ${input}。`, explanation: `轮位和接线相同，${input} → ${first.output}，${first.output} → ${input}。再次按键会转位，所以本关特意锁住了鼓轮。` };
    }
    const word = pick(WORD_BANK), start = [0, 0, 0].map(() => Math.floor(random() * 6)), pairs = [pair()];
    const encrypted = encipher(word[0], start, pairs).output;
    const words = shuffle([word, ...shuffle(WORD_BANK.filter(w => w[0] !== word[0]), random).slice(0, 3)], random);
    return { ...common, variant: WORD_BANK.indexOf(word), positions: start, pairs, ciphertext: encrypted, answer: word[0], meaning: word[1], options: words.map(([value, detail]) => ({ value, label: value, detail })), prompt: '照着任务卡，救出三个字母的小消息。', instruction: '同样的起点、同样的跳线，输入密文就能找回原文。', steps: ['把轮位与接线调成任务卡的样子，再检查设置。', '按顺序输入三个密文字母，每次看一个字母回来。', '读出拼好的消息，再选它的中文意思。'], hint: `起点是 ${positionText(start)}，跳线是 ${pairs[0].join(' ↔ ')}。每次解密一个字母，鼓轮会先转位。不要中途复位。`, explanation: `${encrypted} 解开后是 ${word[0]}，意思是“${word[1]}”。同一起点与接线让双方沿同一组轮位找回消息。` };
  };
}

export function questionSignature(q) {
  return JSON.stringify([q.id, q.variant, q.positions, q.pairs, q.input ?? null, q.ciphertext ?? null, q.answer]);
}
export function createChallengeSet(seed, { avoid = [] } = {}) {
  const random = seededRandom(seed), used = new Set(avoid), make = generator(random, used);
  const questions = LEVELS.map((_, level) => {
    let question;
    // Exclude the last two rounds in the UI, with bounded work even when a
    // caller passes an exhausted history. Reproducibility includes that history.
    for (let attempt = 0; attempt < 48; attempt++) { question = make(level); if (!used.has(questionSignature(question))) break; }
    return { ...question, signature: questionSignature(question) };
  });
  return { seed: String(seed), questions };
}
export function createSession(round) { return { round, index: 0, completed: [], attempts: Array(6).fill(0), selected: null, correct: false, finished: false }; }
export function submitAnswer(session, value) {
  if (session.correct || session.finished) return session;
  const q = session.round.questions[session.index];
  if (!q.options.some(option => option.value === value)) return session;
  const correct = value === q.answer, attempts = [...session.attempts]; attempts[session.index]++;
  return { ...session, attempts, selected: value, correct, completed: correct ? [...session.completed, q.id] : session.completed };
}
export function advanceSession(session) {
  if (!session.correct || session.finished) return session;
  return session.index === 5 ? { ...session, finished: true } : { ...session, index: session.index + 1, selected: null, correct: false };
}
export function checkMissionSetup(q, positions, pair) {
  if (!Array.isArray(positions) || positions.length !== 3 || positions.some(n => !Number.isInteger(n) || n < 0 || n > 25) || positionText(positions) !== positionText(q.positions)) return { ok: false, message: `再看起点卡：三只鼓轮从左到右应是 ${positionText(q.positions)}。` };
  if (!Array.isArray(pair) || pair.length !== 2 || new Set(pair).size !== 2 || !q.pairs[0].every(c => pair.includes(c))) return { ok: false, message: `再看跳线卡：请连接 ${q.pairs[0].join(' ↔ ')}，两个方向都可以。` };
  return { ok: true, message: '设置吻合！在观察台按顺序输入密文字母。' };
}
export function createMissionState() { return { phase: 'setup', positions: [0, 0, 0], pair: [], cursor: 0, output: '' }; }
export function prepareMission(q, state, positions, pair) {
  if (state.phase !== 'setup') return { state, ok: false, message: '已经开始，请继续输入下一个密文字母。' };
  const result = checkMissionSetup(q, positions, pair);
  return { ...result, state: result.ok ? { ...state, phase: 'ready', positions: [...positions], pair: [...pair] } : state };
}
export function decodeMissionLetter(q, state) {
  if (!['ready', 'decoding'].includes(state.phase)) return { state, trace: null };
  const trace = pressKey(q.ciphertext[state.cursor], state.positions, [state.pair]), cursor = state.cursor + 1;
  return { trace, state: { ...state, positions: trace.positions, cursor, output: state.output + trace.output, phase: cursor === q.ciphertext.length ? 'complete' : 'decoding' } };
}
