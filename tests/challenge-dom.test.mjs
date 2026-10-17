import test from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { createChallenge } from '../src/challenge.js';

// Exercise the real controller and template. Only WebGL and the animation clock
// are unavailable here; the browser acceptance separately covers GPU rendering.
test('challenge mounts, retries, traverses all six levels and decodes the message through DOM controls', async t => {
  const window = new Window({ url: 'http://localhost/' });
  const keys = ['window', 'document', 'localStorage', 'matchMedia', 'requestAnimationFrame', 'cancelAnimationFrame'];
  const saved = new Map(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const motion = new window.EventTarget(); motion.matches = true;
  Object.assign(globalThis, { window, document: window.document, localStorage: window.localStorage,
    matchMedia: () => ({ matches: false }), requestAnimationFrame: () => 1, cancelAnimationFrame: () => {} });
  window.HTMLElement.prototype.scrollIntoView = function () {};
  const container = window.document.createElement('main'); window.document.body.append(container);
  const $ = selector => container.querySelector(selector);
  let challenge;
  try {
    // This DOM runtime intentionally has no GPU; assert the fallback instead of logging an expected WebGL error.
    const errors = t.mock.method(console, 'error', () => {});
    const warnings = t.mock.method(console, 'warn', () => {});
    challenge = await createChallenge(container, { motion, progress() {} });
    assert.equal(errors.mock.calls.length, 1);
    assert.equal(warnings.mock.calls.length, 1);
    assert.equal($('#quest-model-error').hidden, false);
    errors.mock.restore(); warnings.mock.restore();
    challenge.setActive(true);
    assert.match($('#quest-question').textContent, /谁|哪里|哪一组/);
    assert.equal($('#quest-options').children.length, 3);
    for (let level = 0; level < 6; level++) {
      assert.equal(window.__BOMBE_QUEST__().level, level + 1);
      if (level === 5) {
        const rows = [...$('#quest-clue').children].map(row => row.textContent);
        const start = rows.find(row => row.startsWith('起点轮位')).slice(4);
        const pair = rows.find(row => row.startsWith('跳线')).slice(2).split(' ↔ ');
        for (let i = 0; i < 3; i++) {
          const select = $(`#quest-wheel-${i}`); select.value = start[i]; select.dispatchEvent(new window.Event('change'));
        }
        for (const [i, id] of ['a', 'b'].entries()) {
          const select = $(`#quest-mission-plug-${id}`); select.value = pair[i]; select.dispatchEvent(new window.Event('change'));
        }
        $('#quest-mission-form').dispatchEvent(new window.Event('submit', { cancelable: true }));
        assert.equal(window.__BOMBE_QUEST__().mission.phase, 'ready');
        for (let i = 0; i < 3; i++) $('#quest-observe').click();
        assert.match($('#quest-output').textContent, /^[A-Z]{3}$/);
        assert.equal($('#quest-answers').hidden, false);
        assert.doesNotMatch($('#quest-narration').textContent, /再输入下一个/);
        const decoded = $('#quest-output').textContent;
        $(`[data-quest-answer="${decoded}"]`).click();
        assert.equal(window.__BOMBE_QUEST__().correct, true);
      } else {
        if (level > 0) {
          $('#quest-observe').click();
          assert.notEqual($('#quest-output').textContent, '—');
        }
        // Real option handlers must permit retry and award exactly one stamp.
        for (const option of [...$('#quest-options').children]) {
          option.click();
          if (window.__BOMBE_QUEST__().correct) break;
        }
      }
      assert.equal(window.__BOMBE_QUEST__().completed.length, level + 1);
      assert.equal($('#quest-next').hidden, false);
      $('#quest-next').click();
    }
    assert.equal(window.__BOMBE_QUEST__().finished, true);
    assert.equal($('#quest-finish').hidden, false);
    $('#quest-play-again').click();
    assert.equal(window.__BOMBE_QUEST__().level, 1);
    assert.equal(window.__BOMBE_QUEST__().completed.length, 0);
  } finally {
    challenge?.dispose(); await window.happyDOM.close();
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  }
});
