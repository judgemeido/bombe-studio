import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Window } from 'happy-dom';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
}

async function fixture(t, { legacy = false, missing = false, complete = false, width = 0, motion = false, timeoutMs, noObserver = false } = {}) {
  const window = new Window();
  if (noObserver) window.IntersectionObserver = undefined;
  window.document.body.innerHTML = `<main data-history-preview>
    <p data-load-status>静态正文可读</p>
    <a href="#content" data-skip>跳过影像</a>
    <article id="content" data-history-scene>历史正文始终可读</article>
    <img data-history-image alt="档案影像">
  </main>`;
  const root = window.document.querySelector('main');
  const image = root.querySelector('img');
  const pending = deferred();
  Object.defineProperties(image, {
    decode: { configurable: true, writable: true, value: legacy ? undefined : () => pending.promise },
    complete: { configurable: true, value: complete },
    naturalWidth: { configurable: true, value: width },
  });
  let controller;
  t.after(() => { controller?.destroy(); window.happyDOM.abort(); });
  const { createHistoryPreview } = await import('../src/history-preview.js');
  controller = createHistoryPreview(root, { image: missing ? null : image, motion: { matches: motion }, timeoutMs });
  return { window, root, image, pending, controller };
}

function state(root) { return root.getAttribute('data-load-state'); }
function assertReadable(root) {
  for (const element of [root, root.querySelector('article'), root.querySelector('[data-skip]')]) {
    assert.equal(element.hidden, false);
    assert.notEqual(element.getAttribute('aria-hidden'), 'true');
    assert.notEqual(element.style.display, 'none');
    assert.notEqual(element.style.visibility, 'hidden');
    assert.notEqual(element.style.opacity, '0');
  }
}

for (const result of ['resolve', 'reject']) {
  test(`decode ${result} transitions loading to ${result === 'resolve' ? 'ready' : 'fallback'} without hiding content`, async (t) => {
    const { root, pending } = await fixture(t);
    assert.equal(state(root), 'loading');
    assertReadable(root);
    const status = root.querySelector('[data-load-status]');
    assert.equal(status.getAttribute('aria-live'), 'polite');
    const initial = status.textContent;
    pending[result](new Error('image failed'));
    await flush();
    assert.equal(state(root), result === 'resolve' ? 'ready' : 'fallback');
    assert.notEqual(status.textContent, initial);
    assert.ok(status.textContent.trim());
    assertReadable(root);
  });
}

test('default timeout falls back at exactly 3000ms and cannot be overwritten by decode', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { root, pending } = await fixture(t);
  t.mock.timers.tick(2999);
  assert.equal(state(root), 'loading');
  t.mock.timers.tick(1);
  assert.equal(state(root), 'fallback');
  const snapshot = root.outerHTML;
  pending.resolve();
  await flush();
  assert.equal(root.outerHTML, snapshot);
  assertReadable(root);
});

test('custom timeout is respected', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { root } = await fixture(t, { timeoutMs: 25 });
  t.mock.timers.tick(24);
  assert.equal(state(root), 'loading');
  t.mock.timers.tick(1);
  assert.equal(state(root), 'fallback');
});

test('a missing image falls back immediately and keeps text/skip readable', async (t) => {
  const { root } = await fixture(t, { missing: true });
  assert.equal(state(root), 'fallback');
  assertReadable(root);
});

for (const result of ['resolve', 'reject']) {
  test(`destroy is idempotent and ignores later decode ${result} and timeout`, async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const { root, pending, controller } = await fixture(t);
    controller.destroy();
    assert.doesNotThrow(() => controller.destroy());
    const snapshot = root.outerHTML;
    pending[result](new Error('late failure'));
    await flush();
    t.mock.timers.tick(6000);
    assert.equal(root.outerHTML, snapshot);
    assertReadable(root);
  });
}

for (const [event, expected] of [['load', 'ready'], ['error', 'fallback']]) {
  test(`legacy image ${event} settles once and ignores the opposite event`, async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const { root, image, window } = await fixture(t, { legacy: true });
    assert.equal(state(root), 'loading');
    image.dispatchEvent(new window.Event(event));
    assert.equal(state(root), expected);
    const snapshot = root.outerHTML;
    image.dispatchEvent(new window.Event(event === 'load' ? 'error' : 'load'));
    t.mock.timers.tick(6000);
    assert.equal(root.outerHTML, snapshot);
  });
}

for (const width of [0, 640]) {
  test(`legacy complete image with naturalWidth ${width} settles immediately`, async (t) => {
    const { root } = await fixture(t, { legacy: true, complete: true, width });
    assert.equal(state(root), width ? 'ready' : 'fallback');
  });
}

test('destroy detaches image and pagehide listeners, clears timers, and ignores late events', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { root, image, controller, window } = await fixture(t, { legacy: true });
  const removed = [];
  const remove = image.removeEventListener.bind(image);
  image.removeEventListener = (...args) => { removed.push(args[0]); return remove(...args); };
  const removedWindow = [];
  const removeWindow = window.removeEventListener.bind(window);
  window.removeEventListener = (...args) => { removedWindow.push(args[0]); return removeWindow(...args); };
  const clear = t.mock.method(globalThis, 'clearTimeout');
  controller.destroy();
  assert.ok(removed.includes('load'));
  assert.ok(removed.includes('error'));
  assert.ok(removedWindow.includes('pagehide'));
  assert.ok(clear.mock.callCount() >= 1);
  const snapshot = root.outerHTML;
  image.dispatchEvent(new window.Event('load'));
  image.dispatchEvent(new window.Event('error'));
  t.mock.timers.tick(6000);
  assert.equal(root.outerHTML, snapshot);
});

test('ready settles and clears its timeout', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { root, pending } = await fixture(t);
  const clear = t.mock.method(globalThis, 'clearTimeout');
  pending.resolve();
  await flush();
  assert.equal(state(root), 'ready');
  assert.ok(clear.mock.callCount() >= 1);
  t.mock.timers.tick(6000);
  assert.equal(state(root), 'ready');
});

test('synchronous decode throws degrade to fallback', async (t) => {
  const { root, image, controller } = await fixture(t);
  controller.destroy();
  image.decode = () => { throw new Error('decode unavailable'); };
  const { createHistoryPreview } = await import('../src/history-preview.js');
  const next = createHistoryPreview(root, { image, motion: { matches: false } });
  t.after(() => next.destroy());
  assert.equal(state(root), 'fallback');
});

test('missing status element is tolerated', async (t) => {
  const { root, image, controller } = await fixture(t);
  controller.destroy();
  root.querySelector('[data-load-status]').remove();
  const { createHistoryPreview } = await import('../src/history-preview.js');
  const next = createHistoryPreview(root, { image: null, motion: { matches: false } });
  t.after(() => next.destroy());
  assert.equal(state(root), 'fallback');
});

for (const motion of [false, true]) {
  test(`content stays visible with reduced motion=${motion} and no IntersectionObserver`, async (t) => {
    const { root, window, pending } = await fixture(t, { motion, noObserver: true });
    assert.equal(window.IntersectionObserver, undefined);
    assertReadable(root);
    pending.resolve();
    await flush();
    assertReadable(root);
    assert.equal(root.querySelector('article').style.transform, '');
    assert.equal(root.querySelector('article').style.animation, '');
  });
}

test('import is safe without a document', async () => {
  assert.equal(typeof globalThis.document, 'undefined');
  const module = await import('../src/history-preview.js?server-import');
  assert.equal(typeof module.createHistoryPreview, 'function');
});

async function withDocument(t, markup) {
  const window = new Window();
  window.document.body.innerHTML = markup;
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: window.document });
  t.after(() => {
    window.dispatchEvent(new window.Event('pagehide'));
    if (previous) Object.defineProperty(globalThis, 'document', previous);
    else delete globalThis.document;
    window.happyDOM.abort();
  });
  return window;
}

test('auto-mount is a no-op without a preview root', async (t) => {
  const window = await withDocument(t, '<main>Unrelated application</main>');
  const snapshot = window.document.body.innerHTML;
  window.matchMedia = () => { throw new Error('must not query motion on unrelated pages'); };
  await import('../src/history-preview.js?unrelated-page');
  assert.equal(window.document.body.innerHTML, snapshot);
});

test('auto-mount selects the hero image, queries reduced motion and cleans up on pagehide', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const window = await withDocument(t, `<main data-history-preview><p data-load-status>可读</p>
    <img><img data-history-image><article data-history-scene>正文</article></main>`);
  const root = window.document.querySelector('main');
  const pending = deferred();
  const queries = [];
  window.matchMedia = (query) => { queries.push(query); return { matches: true }; };
  window.document.querySelector('img').decode = () => { throw new Error('wrong image'); };
  window.document.querySelector('[data-history-image]').decode = () => pending.promise;
  await import('../src/history-preview.js?auto-pagehide');
  assert.equal(state(root), 'loading');
  assert.deepEqual(queries, ['(prefers-reduced-motion: reduce)']);
  window.dispatchEvent(new window.Event('pagehide'));
  const snapshot = root.outerHTML;
  pending.resolve();
  await flush();
  t.mock.timers.tick(6000);
  assert.equal(root.outerHTML, snapshot);
});

test('auto-mount gracefully handles missing hero and matchMedia', async (t) => {
  const window = await withDocument(t, '<main data-history-preview><p data-load-status>可读</p></main>');
  window.matchMedia = undefined;
  await import('../src/history-preview.js?auto-missing-image');
  assert.equal(state(window.document.querySelector('main')), 'fallback');
});



function pageTransition(window, type, persisted) {
  const event = new window.Event(type);
  Object.defineProperty(event, 'persisted', { value: persisted });
  window.dispatchEvent(event);
}

for (const outcome of ['resolve', 'timeout']) {
  test(`bfcache restore remounts once per departure and supports fresh ${outcome}`, async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const window = await withDocument(t, `<main data-history-preview>
      <p data-load-status>可读</p><img data-history-image>
      <article>正文</article><a data-skip href="#content">跳过</a></main>`);
    const root = window.document.querySelector('main');
    const image = root.querySelector('img');
    const attempts = [];
    image.decode = () => {
      const pending = deferred();
      attempts.push(pending);
      return pending.promise;
    };
    const listeners = new Map();
    const add = window.addEventListener.bind(window);
    const remove = window.removeEventListener.bind(window);
    window.addEventListener = (type, listener, ...args) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(listener);
      return add(type, listener, ...args);
    };
    window.removeEventListener = (type, listener, ...args) => {
      listeners.get(type)?.delete(listener);
      return remove(type, listener, ...args);
    };
    await import(`../src/history-preview.js?bfcache-${outcome}`);
    assert.equal(attempts.length, 1);
    const initialHideListeners = listeners.get('pagehide').size;
    pageTransition(window, 'pageshow', false);
    assert.equal(attempts.length, 1);

    for (let cycle = 0; cycle < 3; cycle++) {
      t.mock.timers.tick(1200);
      pageTransition(window, 'pagehide', true);
      const snapshot = root.outerHTML;
      // A suspended controller must not settle while in bfcache.
      attempts[cycle].resolve();
      await flush();
      t.mock.timers.tick(5000);
      assert.equal(root.outerHTML, snapshot);
      pageTransition(window, 'pageshow', true);
      assert.equal(attempts.length, cycle + 2);
      assert.equal(state(root), 'loading');
      pageTransition(window, 'pageshow', true);
      assert.equal(attempts.length, cycle + 2, 'duplicate pageshow must not remount an active controller');
      assert.equal(listeners.get('pagehide').size, initialHideListeners);
      assert.equal(listeners.get('pageshow').size, 1);
      assertReadable(root);
    }

    if (outcome === 'resolve') {
      attempts.at(-1).resolve();
      await flush();
      assert.equal(state(root), 'ready');
    } else {
      t.mock.timers.tick(2999);
      assert.equal(state(root), 'loading');
      t.mock.timers.tick(1);
      assert.equal(state(root), 'fallback');
      attempts.at(-1).resolve();
      await flush();
      assert.equal(state(root), 'fallback');
    }
    pageTransition(window, 'pagehide', false);
    assert.equal(listeners.get('pagehide').size, 0);
    assert.equal(listeners.get('pageshow').size, 0);
    pageTransition(window, 'pageshow', true);
    assert.equal(attempts.length, 4, 'non-persisted departure disposes auto lifecycle');
  });
}

test('auto lifecycle coordinates scenes and image loader exactly once across bfcache restores', async t => {
  const window = await withDocument(t, `<main data-history-preview>
    <p data-load-status>可读</p><img data-history-image>
    <nav aria-label="历史章节"><a data-scene-link href="#lifeline">海运</a><a data-scene-link href="#intercept">截获</a></nav>
    <article data-history-scene id="lifeline">正文</article><article data-history-scene id="intercept">正文</article></main>`);
  const root = window.document.querySelector('main');
  const scenes = [...root.querySelectorAll('[data-history-scene]')];
  const observers = [];
  window.IntersectionObserver = class {
    constructor(callback) { this.callback = callback; this.targets = []; observers.push(this); }
    observe(target) { this.targets.push(target); }
    disconnect() { this.disconnected = true; }
  };
  const motionListeners = new Set();
  let queries = 0;
  window.matchMedia = () => {
    queries++;
    return { matches: false, addEventListener: (_, fn) => motionListeners.add(fn), removeEventListener: (_, fn) => motionListeners.delete(fn) };
  };
  const attempts = [];
  root.querySelector('img').decode = () => { const attempt = deferred(); attempts.push(attempt); return attempt.promise; };
  await import('../src/history-preview.js?auto-scenes-lifecycle');
  assert.equal(observers.length, 1, 'auto mount must create a scene observer');
  assert.equal(attempts.length, 1);
  assert.equal(queries, 1, 'one shared motion preference per mount');
  for (let cycle = 0; cycle < 3; cycle++) {
    const old = observers.at(-1);
    assert.deepEqual(old.targets, scenes);
    assert.equal(motionListeners.size, 1);
    old.callback([{ target: scenes[0], isIntersecting: true, time: 1 }]);
    assert.equal(scenes[0].classList.contains('is-current'), true);
    pageTransition(window, 'pagehide', true);
    assert.equal(old.disconnected, true);
    assert.equal(motionListeners.size, 0);
    assert.equal(root.classList.contains('history-enhanced'), false);
    const snapshot = root.outerHTML;
    old.callback([{ target: scenes[1], isIntersecting: true, time: 2 }]);
    attempts[cycle].resolve(); await flush();
    assert.equal(root.outerHTML, snapshot);
    pageTransition(window, 'pageshow', false);
    assert.equal(observers.length, cycle + 1);
    pageTransition(window, 'pageshow', true);
    pageTransition(window, 'pageshow', true);
    assert.equal(observers.length, cycle + 2);
    assert.equal(attempts.length, cycle + 2);
    assert.equal(queries, cycle + 2);
    old.callback([{ target: scenes[1], isIntersecting: true, time: 3 }]);
    assert.equal(root.querySelectorAll('.is-current').length, 0, 'old callbacks cannot mutate a restored instance');
  }
  attempts.at(-1).resolve(); await flush();
  assert.equal(state(root), 'ready');
  pageTransition(window, 'pagehide', false);
  assert.equal(observers.at(-1).disconnected, true);
  assert.equal(motionListeners.size, 0);
  pageTransition(window, 'pageshow', true);
  assert.equal(observers.length, 4, 'final departure disposes both auto controllers');
});
