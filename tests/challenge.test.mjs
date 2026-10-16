import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, PART_BANK, WORD_BANK, createChallengeSet, questionSignature, seededRandom, shuffle, freshSeed, positionText, createSession, submitAnswer, advanceSession, createMissionState, prepareMission, decodeMissionLetter } from '../src/challenge-engine.js';
import { ALPHABET, letter, plugboard, stepPositions, pressKey, traceLetter, encipher } from '../src/cipher.js';
import { parseRoute, routeKey } from '../src/navigation.js';

test('one thousand seeds produce six ordered, uniquely answerable, valid challenges', () => {
  for (let seed = 0; seed < 1000; seed++) {
    const round = createChallengeSet(`classroom-${seed}`);
    assert.deepEqual(round.questions.map(q => q.id), LEVELS.map(level => level.id));
    for (const q of round.questions) {
      assert.equal(q.options.filter(option => option.value === q.answer).length, 1);
      assert.equal(new Set(q.options.map(option => option.value)).size, q.options.length);
      assert.equal(q.signature, questionSignature(q));
      assert.ok(q.positions.every(n => Number.isInteger(n) && n >= 0 && n < 26));
      assert.doesNotThrow(() => plugboard(q.pairs));
      assert.equal(q.steps.length, 3);
    }
    const [parts, swap, step, trace, reverse, message] = round.questions;
    assert.equal(parts.answer, PART_BANK[parts.variant].target);
    assert.equal(swap.answer, letter(plugboard(swap.pairs)[ALPHABET.indexOf(swap.input)]));
    let end = [...step.positions]; for (let i = 0; i < step.count; i++) end = stepPositions(end);
    assert.deepEqual(end.slice(0, 2), step.positions.slice(0, 2), 'beginner stepping examples never require a carry');
    assert.equal(step.answer, positionText(end));
    assert.equal(trace.answer, pressKey(trace.input, trace.positions, trace.pairs).output);
    assert.equal(reverse.answer, traceLetter(reverse.input, reverse.positions, reverse.pairs).output);
    assert.equal(reverse.answer, reverse.original);
    assert.equal(message.ciphertext.length, 3);
    assert.equal(encipher(message.ciphertext, message.positions, message.pairs).output, message.answer);
    assert.equal(WORD_BANK.find(w => w[0] === message.answer)[1], message.meaning);
  }
});

test('seeds reproduce complete rounds; parameters, bank entries and answer slots all vary', () => {
  assert.deepEqual(createChallengeSet('replay-this'), createChallengeSet('replay-this'));
  const signatures = LEVELS.map(() => new Set()), slots = LEVELS.map(() => new Set()), variants = LEVELS.map(() => new Set());
  const words = new Set(), swapKinds = new Set(), wraps = new Set();
  for (let seed = 0; seed < 400; seed++) {
    const round = createChallengeSet(seed);
    round.questions.forEach((q, i) => { signatures[i].add(q.signature); slots[i].add(q.options.findIndex(o => o.value === q.answer)); variants[i].add(q.variant); });
    words.add(round.questions[5].answer); const q = round.questions[1]; swapKinds.add(q.pairs[0].includes(q.input));
    const step = round.questions[2]; wraps.add(step.positions[2] + step.count > 25);
  }
  assert.equal(signatures[0].size, PART_BANK.length);
  for (let i = 1; i < 6; i++) assert.ok(signatures[i].size > 90, `level ${i + 1} needs substantial variation`);
  slots.forEach((values, i) => assert.equal(values.size, i === 5 ? 4 : 3));
  assert.equal(words.size, WORD_BANK.length); assert.equal(swapKinds.size, 2); assert.equal(wraps.size, 2);
  assert.ok(variants.every(v => v.size > 1));
  assert.equal(new Set(Array.from({ length: 20 }, freshSeed)).size, 20);
});

test('recent rounds are excluded without losing reproducibility or level order', () => {
  let history = [];
  for (let seed = 0; seed < 150; seed++) {
    const options = { avoid: history.flat() }, round = createChallengeSet(`repeat-${seed}`, options);
    assert.deepEqual(round, createChallengeSet(`repeat-${seed}`, options));
    for (const q of round.questions) assert.ok(!options.avoid.includes(q.signature));
    history = [...history, round.questions.map(q => q.signature)].slice(-2);
  }
  const items = [1, 2, 3, 4]; const mixed = shuffle(items, seededRandom('shuffle'));
  assert.deepEqual(items, [1, 2, 3, 4]); assert.deepEqual([...mixed].sort(), items);
});

test('a learner can retry, but cannot skip, double award or advance after finishing', () => {
  let state = createSession(createChallengeSet('learning-session'));
  for (let i = 0; i < 6; i++) {
    assert.equal(state.index, i); assert.equal(advanceSession(state), state);
    assert.equal(submitAnswer(state, 'not-an-option'), state);
    const q = state.round.questions[i], wrong = q.options.find(o => o.value !== q.answer).value;
    state = submitAnswer(state, wrong); assert.equal(state.correct, false); assert.equal(state.completed.length, i);
    state = submitAnswer(state, q.answer); assert.equal(state.correct, true); assert.equal(state.completed.length, i + 1); assert.equal(state.attempts[i], 2);
    assert.equal(submitAnswer(state, q.answer), state);
    state = advanceSession(state);
  }
  assert.equal(state.finished, true); assert.equal(new Set(state.completed).size, 6);
  assert.equal(advanceSession(state), state); assert.equal(submitAnswer(state, 'A'), state);
});

test('the final mission requires matching settings, then decodes exactly three real keypresses', () => {
  for (let seed = 0; seed < 100; seed++) {
    const q = createChallengeSet(`mission-${seed}`).questions[5], initial = createMissionState();
    assert.equal(decodeMissionLetter(q, initial).trace, null);
    const wrongPositions = [...q.positions]; wrongPositions[2] = (wrongPositions[2] + 1) % 26;
    assert.equal(prepareMission(q, initial, wrongPositions, q.pairs[0]).ok, false);
    assert.equal(prepareMission(q, initial, q.positions.map(n => n + 26), q.pairs[0]).ok, false);
    assert.equal(prepareMission(q, initial, q.positions, []).ok, false);
    assert.equal(prepareMission(q, initial, q.positions, [q.pairs[0][0], q.pairs[0][0]]).ok, false);
    let { state, ok } = prepareMission(q, initial, q.positions, [...q.pairs[0]].reverse()); assert.equal(ok, true);
    const start = [...state.positions];
    for (let i = 0; i < 3; i++) {
      const result = decodeMissionLetter(q, state); assert.equal(result.trace.input, q.ciphertext[i]);
      assert.deepEqual(result.trace.positions, stepPositions(state.positions));
      state = result.state; assert.equal(state.cursor, i + 1); assert.equal(state.output, q.answer.slice(0, i + 1));
    }
    assert.equal(state.phase, 'complete'); assert.notDeepEqual(state.positions, start);
    assert.equal(decodeMissionLetter(q, state).state, state); assert.equal(decodeMissionLetter(q, state).trace, null);
    assert.equal(initial.phase, 'setup'); assert.equal(initial.cursor, 0);
  }
});

test('chapter URLs preserve deep linking to both lab topics and the third page', () => {
  for (const hash of ['#/', '#/lab/drums', '#/lab/wiring', '#/challenge']) assert.equal(routeKey(parseRoute(hash)), hash);
  assert.equal(parseRoute('#/unknown').page, 'exhibit');
});
