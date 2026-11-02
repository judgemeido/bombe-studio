import test from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { createRogueRunView } from '../src/rogue-run.js';
import { createRogueRun, selectRogueNode } from '../src/rogue-engine.js';
import { renderRogueView } from '../src/rogue-template.js';

function fixture() {
  const window = new Window();
  window.document.body.innerHTML = '<main id="root"></main><button id="return">随机夜班</button>';
  const root = window.document.querySelector('#root');
  const overlay = createRogueRunView(root, { seed: 'night-shift-qa', returnFocus: window.document.querySelector('#return') });
  return { window, root, overlay };
}

test('start, route, event, final decode and handoff render semantic controls', () => {
  const run = createRogueRun('view-contract', { role: 'intercept' });
  assert.match(renderRogueView(run), /截收员/);
  assert.match(renderRogueView({ ...run, phase: 'route' }), /data-rogue-action="node"/);
  const selected = selectRogueNode({ ...run, phase: 'route' }, run.route[0].nodes[0].id);
  assert.match(renderRogueView(selected), /data-rogue-action="resolve"/);
});

test('role select, start, event choice, pause and close restore focus', async () => {
  const f = fixture();
  try {
    f.overlay.open();
    f.root.querySelector('[data-rogue-action="role"][data-value="archive"]').click();
    f.root.querySelector('[data-rogue-action="start"]').click();
    assert.equal(f.overlay.inspect().state.role, 'archive');
    assert.equal(f.root.querySelectorAll('[data-rogue-action="node"]:not([disabled])').length, 2);
    f.root.querySelector('[data-rogue-action="node"]:not([disabled])').click();
    f.root.querySelector('[data-rogue-action="resolve"]').click();
    assert.equal(f.overlay.inspect().state.phase, 'event-complete');
    f.root.querySelector('[data-rogue-action="continue"]').click();
    f.root.querySelector('[data-rogue-action="pause"]').click();
    assert.equal(f.root.querySelector('[data-rogue-action="resume"]').textContent.includes('继续'), true);
    f.root.querySelector('[data-rogue-action="close"]').click();
    assert.equal(f.overlay.inspect().visible, false);
    assert.equal(f.window.document.activeElement.id, 'return');
  } finally { f.overlay.destroy(); await f.window.happyDOM.close(); }
});

test('final panel submits rotor letters and a completed run can be replayed by seed', async () => {
  const f = fixture();
  try {
    f.overlay.open(); f.overlay.start();
    let state = f.overlay.inspect().state;
    for (let depth = 0; depth < 4; depth++) {
      f.root.querySelector('[data-rogue-action="node"]:not([disabled])').click();
      f.root.querySelector('[data-rogue-action="resolve"]').click();
      f.root.querySelector('[data-rogue-action="continue"]').click();
    }
    assert.equal(state.route.length, 4);
    const solution = f.overlay.inspect().state.caseFile.solutionRight;
    f.root.querySelector(`[data-rogue-action="right"][data-value="${String.fromCharCode(65 + solution)}"]`).click();
    f.root.querySelector('[data-rogue-action="handoff"][data-value="hold"]').click();
    assert.match(f.root.textContent, /值班档案/);
    f.root.querySelector('[data-rogue-action="replay"]').click();
    assert.equal(f.overlay.inspect().state.seed, 'night-shift-qa');
  } finally { f.overlay.destroy(); await f.window.happyDOM.close(); }
});

test('optional mode mounts beside the existing mission without mutating its state', async () => {
  const f = fixture();
  try {
    f.overlay.open();
    const before = f.overlay.inspect().state;
    f.overlay.close();
    assert.equal(f.overlay.inspect().state.phase, before.phase);
    assert.equal(f.overlay.inspect().visible, false);
  } finally { f.overlay.destroy(); await f.window.happyDOM.close(); }
});

test('completed archives persist up to twenty entries and ignore malformed storage', async () => {
  const f = fixture();
  const storage = { value: '{broken', getItem() { return this.value; }, setItem(_key, value) { this.value = value; } };
  f.overlay.destroy();
  const second = createRogueRunView(f.root, { seed: 'archive-seed', storage });
  second.open();
  assert.deepEqual(second.inspect().archives, []);
  second.destroy();
  await f.window.happyDOM.close();
});
