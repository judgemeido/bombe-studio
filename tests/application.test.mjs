import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Window } from 'happy-dom';
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));

test('main imports without a DOM or allocation', async () => {
  const module = await import('../src/main.js');
  assert.equal(typeof module.createApplication, 'function');
});

test('application prepares without revealing; exhibit is lazy, retryable and state survives navigation', async () => {
  const window = new Window({ url: 'http://localhost/#/lab/drums' });
  window.document.write(html);
  const saved = Object.fromEntries(['window', 'document', 'matchMedia', 'requestAnimationFrame', 'cancelAnimationFrame'].map(k => [k, globalThis[k]]));
  Object.assign(globalThis, { window, document: window.document, matchMedia: () => Object.assign(new window.EventTarget(), { matches: true }), requestAnimationFrame: () => 1, cancelAnimationFrame() {} });
  let options, stageCalls = 0, productCalls = 0, stageDisposed = 0, productDisposed = 0, fail = true, historyActive = 0, historyInactive = 0, rounds = 0;
  const active = [], topics = [];
  const controller = { setActive(value) { active.push(value); }, setTopic(value) { topics.push(value); }, startNewRound() { rounds++; }, dispose() {} };
  const historyPage = { element: window.document.querySelector('#history-page'), currentRoute: { page: 'history' }, scrollY: 317, activate() { historyActive++; }, deactivate() { historyInactive++; } };
  const runtime = {
    createNavigation(value) { options = value; return { go: route => route, dispose() {} }; },
    loadLab: async () => ({ createLab: async () => controller }), loadChallenge: async () => ({ createChallenge: async () => controller }),
    createStage() { stageCalls++; return { scene: { add() {} }, controls: new window.EventTarget(), resize() {}, frameBounds() {}, dispose() { stageDisposed++; } }; },
    createTextures: () => ({}),
    createProduct() { productCalls++; if (fail) throw new Error('GPU failed'); return { root: {}, getBounds() {}, dispose() { productDisposed++; } }; },
    createRaycaster: () => ({}), createPointer: () => ({}),
  };
  let app;
  try {
    const { createApplication } = await import('../src/main.js');
    app = createApplication({ initialRoute: { page: 'lab', topic: 'drums' }, historyPage, runtime });
    assert.equal(window.__BOMBE_INSPECT__().cinematic, false);
    assert.deepEqual(options.currentRoute, historyPage.currentRoute); assert.equal(options.initialScrolls.history, 317);
    assert.equal(stageCalls, 0);
    const roots = [...window.document.querySelectorAll('#exhibit-page,#lab-page,#challenge-page')];
    const visibility = roots.map(root => [root.hidden, root.inert]);
    await options.prepare({ page: 'lab', topic: 'wiring' }, () => {});
    await options.prepare({ page: 'challenge' }, () => {});
    await options.prepare({ page: 'history' }, () => {});
    assert.equal(stageCalls, 0); assert.deepEqual(active, []); assert.deepEqual(topics, []);
    assert.deepEqual(roots.map(root => [root.hidden, root.inert]), visibility);
    options.activate({ page: 'challenge' }); assert.equal(rounds, 0);
    options.activate({ page: 'history' }); options.activate({ page: 'challenge' }); assert.equal(rounds, 1);
    await assert.rejects(options.prepare({ page: 'exhibit' }, () => {}), /GPU failed/);
    assert.equal(stageDisposed, 1); fail = false;
    await Promise.all([options.prepare({ page: 'exhibit' }, () => {}), options.prepare({ page: 'exhibit' }, () => {})]);
    assert.equal(stageCalls, 2); assert.equal(productCalls, 2);
    options.activate({ page: 'exhibit' });
    window.document.querySelector('#explode').click(); window.document.querySelector('[data-part="drums"]').click();
    options.activate({ page: 'history' }); await options.prepare({ page: 'exhibit' }, () => {}); options.activate({ page: 'exhibit' });
    assert.equal(window.__BOMBE_INSPECT__().target, 1); assert.equal(window.__BOMBE_INSPECT__().selected, 'drums');
    assert.equal(stageCalls, 2); assert.equal(historyActive, 2); assert.ok(historyInactive > 0);
    app.dispose(); assert.equal(stageDisposed, 2); assert.equal(productDisposed, 1);
    assert.equal(window.document.querySelector('.mobile-detail'), null);
  } finally { app?.dispose(); Object.assign(globalThis, saved); await window.happyDOM.close(); }
  await tick();
});

test('dispose while a module loads prevents its constructor; late controllers are released', async () => {
  const window = new Window(); window.document.write(html);
  const saved = Object.fromEntries(['window', 'document', 'matchMedia', 'requestAnimationFrame', 'cancelAnimationFrame'].map(k => [k, globalThis[k]]));
  Object.assign(globalThis, { window, document: window.document, matchMedia: () => Object.assign(new window.EventTarget(), { matches: true }), requestAnimationFrame: () => 1, cancelAnimationFrame() {} });
  const { createApplication } = await import('../src/main.js');
  let options, resolveModule, resolveController, constructors = 0, released = 0;
  const runtime = { createNavigation(value) { options = value; return { go() {}, dispose() {} }; }, loadLab: () => new Promise(resolve => { resolveModule = resolve; }) };
  let app;
  try {
    app = createApplication({ initialRoute: { page: 'lab' }, runtime });
    const pending = options.prepare({ page: 'lab' }); await tick(); app.dispose();
    resolveModule({ createLab() { constructors++; } });
    await assert.rejects(pending, /disposed/); assert.equal(constructors, 0);
    runtime.loadLab = async () => ({ createLab() { constructors++; return new Promise(resolve => { resolveController = resolve; }); } });
    app = createApplication({ initialRoute: { page: 'lab' }, runtime });
    const late = options.prepare({ page: 'lab' }); await tick(); app.dispose();
    resolveController({ dispose() { released++; } });
    await assert.rejects(late, /disposed/); assert.equal(constructors, 1); assert.equal(released, 1);
    assert.equal(window.__BOMBE_INSPECT__, undefined);
  } finally { app?.dispose(); Object.assign(globalThis, saved); await window.happyDOM.close(); }
});

test('exhibit cinematic control shares state, keyboard action, and manual interruption', async () => {
  const window = new Window({ url: 'http://localhost/#/' }); window.document.write(html);
  const saved = Object.fromEntries(['window', 'document', 'matchMedia', 'requestAnimationFrame', 'cancelAnimationFrame'].map(k => [k, globalThis[k]]));
  Object.assign(globalThis, { window, document: window.document, matchMedia: () => Object.assign(new window.EventTarget(), { matches: false }), requestAnimationFrame: () => 1, cancelAnimationFrame() {} });
  let options, controls, controller;
  const runtime = {
    createNavigation(value) { options = value; return { go() {}, dispose() {} }; },
    createStage() { controls = new window.EventTarget(); controls.target = { toArray() { return []; } }; return { camera: { aspect: 1, position: { toArray() { return []; } } }, scene: { add() {} }, controls, setCinematic(value) { controller = value; }, interruptCamera() { controller?.interrupt(); }, resize() {}, frameBounds() {}, dispose() {} }; },
    createCinematicCamera() { return { active: false, start() { this.active = true; }, stop() { this.active = false; }, interrupt() { this.active = false; }, update() {}, dispose() {}, get isActive() { return this.active; } }; },
    createTextures: () => ({}),
    createProduct() { return { root: {}, getBounds() {}, getRotorAnchor() {}, getAnchor() {}, dispose() {} }; },
    createRaycaster: () => ({}), createPointer: () => ({}),
  };
  let app;
  try {
    const { createApplication } = await import('../src/main.js');
    app = createApplication({ initialRoute: { page: 'exhibit' }, runtime });
    await options.prepare({ page: 'exhibit' }); options.activate({ page: 'exhibit' });
    const button = window.document.querySelector('#cinematic');
    assert.ok(button, 'cinematic control must exist');
    button.click(); assert.equal(window.__BOMBE_INSPECT__().cinematic, true); assert.equal(button.getAttribute('aria-pressed'), 'true');
    controls.dispatchEvent(new window.Event('start'));
    assert.equal(window.__BOMBE_INSPECT__().cinematic, false); assert.equal(button.getAttribute('aria-pressed'), 'false');
  } finally { app?.dispose(); Object.assign(globalThis, saved); await window.happyDOM.close(); }
});
