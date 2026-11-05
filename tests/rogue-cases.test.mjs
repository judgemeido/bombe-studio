import test from 'node:test';
import assert from 'node:assert/strict';
import { createCaseFile, validateCaseFile } from '../src/rogue-engine.js';
import { encipher } from '../src/cipher.js';
import { seededRandom } from '../src/challenge-engine.js';

test('generated case decrypts through cipher.js and has exactly one right-rotor solution', () => {
  for (let index = 0; index < 120; index++) {
    const random = seededRandom(`case-${index}`);
    const caseFile = createCaseFile(random);
    const full = encipher(caseFile.ciphertext, [caseFile.knownLeft, caseFile.knownMiddle, caseFile.solutionRight], caseFile.plugboard).output;

    assert.equal(full, caseFile.plaintext);
    assert.equal(caseFile.candidates.length, 26);
    assert.deepEqual(caseFile.candidates.filter(item => item.matches).map(item => item.right), [caseFile.solutionRight]);
    assert.equal(validateCaseFile(caseFile).ok, true);
    assert.notEqual(caseFile.ciphertext[caseFile.cribOffset], caseFile.crib[0]);
  }
});

test('same RNG stream reproduces a case and invalid cases report a validation reason', () => {
  const first = createCaseFile(seededRandom('reproducible-case'));
  const second = createCaseFile(seededRandom('reproducible-case'));
  assert.deepEqual(first, second);
  assert.match(validateCaseFile({ ...first, ciphertext: '' }).reason, /密文/);
});
