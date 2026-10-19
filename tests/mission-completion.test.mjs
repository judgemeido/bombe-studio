import test from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { createMission } from '../src/mission.js';

function fixture() {
  const window = new Window();
  window.document.body.innerHTML = '<main id="mission-page"></main>';
  const root = window.document.querySelector('main');
  const motion = Object.assign(new window.EventTarget(), { matches: true });
  const views = [];
  const zones = [];
  const game = createMission(root, {
    motion,
    sceneFactory() {
      return {
        setState() {},
        setView(name) { views.push(name); },
        setZone(name) { zones.push(name); views.push(name); },
        setActive() {},
        dispose() {},
        inspect() { return { ready: true }; },
      };
    },
  });
  const click = (action, value = null, attrs = {}) => {
    let selector = `[data-action="${action}"]`;
    if (value !== null) selector += `[data-value="${value}"]`;
    for (const [key, attr] of Object.entries(attrs)) selector += `[data-${key}="${attr}"]`;
    const button = root.querySelector(selector);
    assert.ok(button, selector);
    button.click();
  };
  return { window, root, game, click, views, zones };
}

test('completion moves the live scene and location record to the handoff room', async () => {
  const f = fixture();
  try {
    f.game.setActive(true);
    f.click('start');
    f.click('checkin', 'ready'); f.click('next');
    f.click('channel', '1'); f.click('submit'); f.click('next');
    f.click('order', 'chronological'); f.click('submit'); f.click('next');
    f.click('archive', 'weather'); f.click('submit'); f.click('next');
    f.click('crib', 'WETTER'); f.click('submit'); f.click('next');
    f.click('align', '2'); f.click('submit'); f.click('next');
    f.click('relation', 'A-G'); f.click('submit'); f.click('next');
    f.click('pair', 'A'); f.click('submit'); f.click('next');
    f.click('rotor', null, { index: '0', step: '1' });
    for (let i = 0; i < 3; i++) f.click('rotor', null, { index: '1', step: '1' });
    f.click('submit'); f.click('next');
    f.click('search'); f.click('next');
    f.click('compare', 'candidate'); f.click('next');
    f.click('decode'); f.click('next');
    f.click('map', 'north-harbor'); f.click('next');
    f.click('verify', 'verify'); f.click('next');
    f.click('handoff', 'hold'); f.click('next');

    const state = f.game.inspect().state;
    assert.equal(state.phase, 'complete');
    assert.equal(state.currentZone, 'handoff');
    assert.equal(f.root.querySelector('#mission-location').textContent, '交接室 · 封存桌');
    assert.equal(f.root.querySelector('#mission-location-world').textContent, '交接室 · 封存桌');
    assert.equal(f.views.at(-1), 'handoff');
    assert.equal(f.zones.at(-1), 'handoff');
  } finally {
    f.game.dispose();
    await f.window.happyDOM.close();
  }
});
