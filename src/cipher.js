// Historical Enigma I permutations; display order is left I, middle II, right III.
// Ring settings stay at A. The lab deliberately exposes one plug pair at a time.
export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const ROTORS = Object.freeze([
  { name: 'I', wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', notch: 16 },
  { name: 'II', wiring: 'AJDKSIRUXBLHWTMCQGZNPYFVOE', notch: 4 },
  { name: 'III', wiring: 'BDFHJLCPRTXVZNYEIWGAKMUSQO', notch: 21 },
]);
export const REFLECTOR = 'YRUHQSLDPXNGOKMIEBFZCWVJAT';
const mod = n => (n % 26 + 26) % 26;
export const letter = n => ALPHABET[mod(n)];
function index(char) { const n = ALPHABET.indexOf(char); if (n < 0 || char.length !== 1) throw new RangeError('请选择 A–Z 中的一个字母。'); return n; }
function validatePositions(positions) {
  if (!Array.isArray(positions) || positions.length !== 3 || positions.some(n => !Number.isInteger(n) || n < 0 || n > 25)) throw new RangeError('轮位必须是三个 0–25 的整数。');
}
export function plugboard(pairs = []) {
  if (!Array.isArray(pairs) || pairs.length > 10) throw new RangeError('最多支持十对接线。');
  const mapping = [...Array(26).keys()], used = new Set();
  for (const pair of pairs) {
    if (!Array.isArray(pair) || pair.length !== 2) throw new RangeError('接线需要两个端点。');
    const [a, b] = pair.map(index);
    if (a === b || used.has(a) || used.has(b)) throw new RangeError('端点必须不同，且每个字母只能接一次。');
    used.add(a); used.add(b); mapping[a] = b; mapping[b] = a;
  }
  return mapping;
}
export function stepPositions(positions) {
  validatePositions(positions); const [left, middle, right] = positions;
  const middleNotch = middle === ROTORS[1].notch, rightNotch = right === ROTORS[2].notch;
  return [mod(left + Number(middleNotch)), mod(middle + Number(middleNotch || rightNotch)), mod(right + 1)];
}
export function traceLetter(input, positions = [0, 0, 0], pairs = []) {
  validatePositions(positions); const board = plugboard(pairs), stages = []; let value = index(input);
  function add(id, name, output, rotor = null, reverse = false) {
    stages.push({ id, name, input: value, output, rotor, reverse }); value = output;
  }
  function rotorPass(i, reverse) {
    const rotor = ROTORS[i], shifted = mod(value + positions[i]);
    const output = reverse ? rotor.wiring.indexOf(letter(shifted)) : index(rotor.wiring[shifted]);
    add(`rotor-${i}-${reverse ? 'return' : 'out'}`, `鼓轮 ${rotor.name}${reverse ? ' · 返回' : ' · 去程'}`, mod(output - positions[i]), i, reverse);
  }
  add('plug-in', '接线 · 进入', board[value]);
  for (const i of [2, 1, 0]) rotorPass(i, false);
  add('reflector', '反射器 B', index(REFLECTOR[value]));
  for (const i of [0, 1, 2]) rotorPass(i, true);
  add('plug-out', '接线 · 输出', board[value]);
  return { input, output: letter(value), positions: [...positions], stages };
}
export function pressKey(input, positions = [0, 0, 0], pairs = []) {
  return traceLetter(input, stepPositions(positions), pairs);
}
export function encipher(text, positions = [0, 0, 0], pairs = []) {
  validatePositions(positions); plugboard(pairs); let current = [...positions], output = '';
  for (const char of text) { const result = pressKey(char, current, pairs); current = result.positions; output += result.output; }
  return { output, positions: current };
}
