import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRoute, routeKey } from '../src/routes.js';
import { readFile } from 'node:fs/promises';
import { Window } from 'happy-dom';
import { createNavigation } from '../src/navigation.js';

test('04 has a distinct round-trip route and navigation reveals only that chapter', async () => {
  assert.deepEqual(parseRoute('#/mission'), { page: 'mission', topic: 'drums' });
  assert.equal(routeKey({ page: 'mission' }), '#/mission');
  const window = new Window();
  window.document.body.innerHTML = '<div id="application-shell"></div><main id="history-page"></main><main id="mission-page" hidden inert><h1 id="mission-heading">04</h1></main>';
  let prepared, activated;
  const nav = createNavigation({ window, initialRoute: { page: 'mission' }, motion: { matches: true }, prepare: async r => { prepared = r.page; }, activate: r => { activated = r.page; } });
  try {
    for (let n = 0; n < 10; n++) await Promise.resolve();
    assert.equal(prepared, 'mission'); assert.equal(activated, 'mission');
    assert.equal(window.document.querySelector('#mission-page').hidden, false);
    assert.equal(window.document.querySelector('#history-page').hidden, true);
    assert.equal(window.document.activeElement.id, 'mission-heading');
  } finally { nav.dispose(); await window.happyDOM.close(); }
});

test('mission preparation is lazy, shared and cannot construct after application disposal', async () => {
  const window = new Window(); window.document.write(await readFile(new URL('../index.html', import.meta.url), 'utf8'));
  const saved = Object.fromEntries(['window', 'document', 'matchMedia', 'requestAnimationFrame', 'cancelAnimationFrame'].map(k => [k, globalThis[k]]));
  Object.assign(globalThis, { window, document: window.document, matchMedia: () => Object.assign(new window.EventTarget(), { matches: true }), requestAnimationFrame: () => 1, cancelAnimationFrame() {} });
  let app, options, loads = 0, creates = 0, resolve;
  try {
    const { createApplication } = await import('../src/main.js');
    app = createApplication({ initialRoute: { page: 'mission' }, runtime: {
      createNavigation(o) { options = o; return { dispose() {} }; },
      loadMission() { loads++; return new Promise(r => { resolve = r; }); },
    } });
    assert.equal(loads, 0);
    const pending = options.prepare({ page: 'mission' });
    for (let n = 0; n < 5; n++) await Promise.resolve();
    assert.equal(loads, 1); app.dispose();
    resolve({ createMission() { creates++; } });
    await assert.rejects(pending, /disposed/); assert.equal(creates, 0);
  } finally { app?.dispose(); Object.assign(globalThis, saved); await window.happyDOM.close(); }
});
