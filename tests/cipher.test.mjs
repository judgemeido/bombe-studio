import test from 'node:test';
import assert from 'node:assert/strict';
import { ALPHABET, ROTORS, REFLECTOR, plugboard, stepPositions, traceLetter, pressKey, encipher } from '../src/cipher.js';

test('published Enigma I reference vector: I-II-III, UKW B, AAA, rings AAA', () => {
  assert.equal(encipher('AAAAA').output, 'BDZGO');
  assert.equal(encipher('HELLOWORLD').output, 'ILBDAAMTAZ');
  assert.deepEqual(pressKey('A').positions, [0, 0, 1]);
});
test('every rotor is a permutation and the reflector pairs contacts without self loops', () => {
  for (const wiring of [...ROTORS.map(r => r.wiring), REFLECTOR]) assert.equal([...wiring].sort().join(''), ALPHABET);
  for (let n = 0; n < 26; n++) { assert.notEqual(REFLECTOR[n], ALPHABET[n]); assert.equal(REFLECTOR[ALPHABET.indexOf(REFLECTOR[n])], ALPHABET[n]); }
});
test('middle-wheel double stepping is preserved before a key is encoded', () => {
  assert.deepEqual(stepPositions([0, 3, 20]), [0, 3, 21]);
  assert.deepEqual(stepPositions([0, 3, 21]), [0, 4, 22]);
  assert.deepEqual(stepPositions([0, 4, 22]), [1, 5, 23]);
  assert.deepEqual(stepPositions([25, 25, 25]), [25, 25, 0]);
});
test('trace stages join exactly and fixed-position encipherment is reciprocal', () => {
  const pairs = [['A', 'B'], ['C', 'Z']];
  for (const positions of [[0, 0, 0], [4, 17, 25], [25, 4, 21]]) for (const input of ALPHABET) {
    const result = traceLetter(input, positions, pairs); assert.equal(result.stages.length, 9);
    result.stages.slice(1).forEach((s, i) => assert.equal(s.input, result.stages[i].output));
    assert.equal(traceLetter(result.output, positions, pairs).output, input);
    assert.notEqual(result.output, input);
  }
  const encoded = encipher('TEACHINGWITHROTORS', [3, 7, 19], pairs);
  assert.equal(encipher(encoded.output, [3, 7, 19], pairs).output, 'TEACHINGWITHROTORS');
});
test('invalid or repeated plug endpoints and malformed positions are rejected', () => {
  assert.throws(() => plugboard([['A', 'A']])); assert.throws(() => plugboard([['A', 'B'], ['B', 'C']]));
  assert.throws(() => traceLetter('a')); assert.throws(() => stepPositions([0, 0, 26]));
  assert.throws(() => plugboard([['A']])); assert.equal(plugboard([['A', 'B']])[1], 0);
});
