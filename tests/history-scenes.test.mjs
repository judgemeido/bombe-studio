import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Window } from 'happy-dom';

const ids = ['lifeline', 'intercept', 'pioneers', 'turing', 'constraints', 'intelligence', 'onward'];

async function fixture(t, { reduced = false, noObserver = false, legacyMotion = false } = {}) {
  const window = new Window({ width: 1000, height: 1000, url: 'https://example.test/history-preview.html' });
  window.document.body.innerHTML = `<main data-history-preview><nav aria-label="历史章节">${ids.map(id => `<a data-scene-link href="#${id}">${id}</a>`).join('')}</nav>${ids.map(id => `<article data-history-scene id="${id}"><h2>${id}</h2><p>正文始终可读</p><svg></svg></article>`).join('')}</main>`;
  const root = window.document.querySelector('main');
  const scenes = [...root.querySelectorAll('[data-history-scene]')];
  const tops = scenes.map((_, i) => i * 400);
  scenes.forEach((scene, i) => { scene.getBoundingClientRect = () => ({ top: tops[i], bottom: tops[i] + 400 }); });
  const observers = [];
  class Observer {
    constructor(callback) { this.callback = callback; this.targets = []; observers.push(this); }
    observe(target) { this.targets.push(target); }
    disconnect() { this.disconnected = true; }
    emit(entries) { this.callback(entries); }
  }
  const listeners = new Set();
  const motion = { matches: reduced };
  if (legacyMotion) {
    motion.addListener = fn => listeners.add(fn);
    motion.removeListener = fn => listeners.delete(fn);
  } else {
    motion.addEventListener = (type, fn) => { assert.equal(type, 'change'); listeners.add(fn); };
    motion.removeEventListener = (type, fn) => listeners.delete(fn);
  }
  const viewListeners = new Map();
  const add = window.addEventListener.bind(window);
  const remove = window.removeEventListener.bind(window);
  window.addEventListener = (type, fn, ...args) => {
    if (!viewListeners.has(type)) viewListeners.set(type, new Set());
    viewListeners.get(type).add(fn);
    return add(type, fn, ...args);
  };
  window.removeEventListener = (type, fn, ...args) => {
    viewListeners.get(type)?.delete(fn);
    return remove(type, fn, ...args);
  };
  window.IntersectionObserver = noObserver ? undefined : Observer;
  const module = await import('../src/history-scenes.js').catch(error => {
    if (error.code === 'ERR_MODULE_NOT_FOUND') return {};
    throw error;
  });
  assert.equal(typeof module.createHistoryScenes, 'function', 'scene controller API must exist');
  const controller = module.createHistoryScenes(root, { motion });
  t.after(() => { controller.destroy(); window.happyDOM.abort(); });
  return { window, root, scenes, tops, observers, motion, listeners, viewListeners, controller,
    entry: (i, visible = true, time = 1) => ({ target: scenes[i], isIntersecting: visible, time }),
    change: matches => { motion.matches = matches; for (const fn of listeners) fn({ matches }); },
  };
}

function current(f) { return f.scenes.filter(scene => scene.classList.contains('is-current')).map(scene => scene.id); }
function revealed(f) { return f.scenes.filter(scene => scene.classList.contains('is-revealed')).map(scene => scene.id); }

test('module imports without a document', async () => {
  assert.equal(typeof globalThis.document, 'undefined');
  const module = await import('../src/history-scenes.js').catch(() => ({}));
  assert.equal(typeof module.createHistoryScenes, 'function');
});

test('partial and reordered batches retain visibility and choose reading line, ties by DOM order', async t => {
  const f = await fixture(t);
  const io = f.observers[0];
  assert.deepEqual(io.targets, f.scenes);
  assert.ok(f.root.classList.contains('history-enhanced'));
  f.tops[0] = 150; f.tops[1] = 350; f.tops[2] = 600;
  io.emit([f.entry(1), f.entry(0)]);
  assert.deepEqual(current(f), ['lifeline']);
  io.emit([f.entry(2)]);
  assert.deepEqual(current(f), ['lifeline'], 'partial batch must retain earlier visible scenes');
  f.tops[1] = 260;
  io.emit([f.entry(2), f.entry(0), f.entry(1)]);
  assert.deepEqual(current(f), ['intercept']);
  io.emit([f.entry(1), f.entry(0), f.entry(2)]);
  assert.deepEqual(current(f), ['intercept']);
  assert.equal(f.root.querySelector('[href="#intercept"]').getAttribute('aria-current'), 'location');
  assert.equal(f.root.querySelectorAll('[aria-current]').length, 1);
  assert.deepEqual(revealed(f), ['lifeline', 'intercept', 'pioneers']);
  io.emit([f.entry(0, false), f.entry(1, false), f.entry(2, false)]);
  assert.deepEqual(current(f), []);
  assert.equal(f.root.querySelectorAll('[aria-current]').length, 0);
  assert.equal(revealed(f).length, 3, 'reveal is finite, never replayed on exit');
});

test('retained visible geometry is refreshed on scroll/resize without navigation side effects', async t => {
  const f = await fixture(t);
  const link = f.root.querySelector('a'); link.focus();
  const before = f.window.location.href;
  f.observers[0].emit([f.entry(0), f.entry(1)]);
  f.tops[0] = -500; f.tops[1] = 250;
  f.window.dispatchEvent(new f.window.Event('scroll'));
  assert.deepEqual(current(f), ['intercept']);
  f.tops[0] = 250; f.tops[1] = 900;
  f.window.dispatchEvent(new f.window.Event('resize'));
  assert.deepEqual(current(f), ['lifeline']);
  assert.equal(f.window.location.href, before);
  assert.equal(f.window.document.activeElement, link);
  assert.equal(f.window.scrollY, 0);
  for (const scene of f.scenes) {
    assert.equal(scene.hidden, false);
    assert.equal(scene.hasAttribute('aria-hidden'), false);
    assert.equal(scene.getAttribute('style'), null);
  }
});

test('duplicate records are idempotent; latest timestamp wins independent of batch order', async t => {
  const f = await fixture(t);
  const io = f.observers[0];
  io.emit([f.entry(0, true, 2), f.entry(0, true, 2)]);
  assert.deepEqual(current(f), ['lifeline']);
  io.emit([f.entry(0, false, 4), f.entry(0, true, 3)]);
  assert.deepEqual(current(f), []);
  io.emit([f.entry(0, true, 3), f.entry(0, false, 4)]);
  assert.deepEqual(current(f), []);
});

for (const legacyMotion of [false, true]) {
  test(`reduced motion reveals everything and runtime updates retain finite reveals (${legacyMotion ? 'legacy' : 'modern'})`, async t => {
    const f = await fixture(t, { reduced: true, legacyMotion });
    assert.deepEqual(revealed(f), ids);
    f.observers[0].emit([f.entry(2)]);
    assert.deepEqual(current(f), ['pioneers']);
    f.change(false);
    assert.deepEqual(revealed(f), ids);
    assert.equal(f.listeners.size, 1);
  });
}

test('runtime reduced motion reveals unseen diagrams', async t => {
  const f = await fixture(t);
  f.observers[0].emit([f.entry(0)]);
  assert.deepEqual(revealed(f), ['lifeline']);
  f.change(true);
  assert.deepEqual(revealed(f), ids);
});

for (const reduced of [false, true]) {
  test(`missing observer stays static with no fake current scene (reduced=${reduced})`, async t => {
    const f = await fixture(t, { noObserver: true, reduced });
    assert.equal(f.root.classList.contains('history-enhanced'), false);
    assert.deepEqual(revealed(f), ids);
    assert.deepEqual(current(f), []);
    assert.equal(f.root.querySelectorAll('[aria-current]').length, 0);
    f.change(!reduced);
    assert.deepEqual(revealed(f), ids);
  });
}

test('destroy cleans only owned state, disconnects and makes old callbacks inert', async t => {
  const f = await fixture(t);
  f.root.classList.add('unrelated');
  f.scenes[0].classList.add('editorial');
  f.observers[0].emit([f.entry(0)]);
  const oldMotionCallback = [...f.listeners][0];
  assert.equal(f.viewListeners.get('scroll').size, 1);
  assert.equal(f.viewListeners.get('resize').size, 1);
  f.controller.destroy(); f.controller.destroy();
  assert.equal(f.viewListeners.get('scroll').size, 0);
  assert.equal(f.viewListeners.get('resize').size, 0);
  assert.equal(f.observers[0].disconnected, true);
  assert.equal(f.listeners.size, 0);
  assert.equal(f.root.className, 'unrelated');
  assert.equal(f.scenes[0].className, 'editorial');
  assert.deepEqual(current(f), []); assert.deepEqual(revealed(f), []);
  assert.equal(f.root.querySelectorAll('[aria-current]').length, 0);
  const snapshot = f.root.outerHTML;
  f.observers[0].emit([f.entry(1, true, 20)]);
  f.change(true);
  f.motion.matches = true;
  oldMotionCallback({ matches: true });
  f.window.dispatchEvent(new f.window.Event('scroll'));
  f.window.dispatchEvent(new f.window.Event('resize'));
  assert.equal(f.root.outerHTML, snapshot);
});
