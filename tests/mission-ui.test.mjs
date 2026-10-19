import test from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { createMission } from '../src/mission.js';
import { MISSION } from '../src/mission-engine.js';
import { missionShell, renderEvidence, renderTask } from '../src/mission-template.js';

function fixture(fail = false, reduced = true) {
  const w = new Window();
  w.document.body.innerHTML = '<main id="mission-page"></main>';
  const root = w.document.querySelector('main');
  let disposed = 0, transition;
  const motion = Object.assign(new w.EventTarget(), { matches: reduced });
  const game = createMission(root, { motion, sceneFactory(canvas, options) {
    if (fail) throw new Error('WebGL unavailable');
    return {
      setState() {}, setView() {}, setActive() {},
      playTransition(options) { transition = options; }, pauseTransition() {}, cancelTransition() {},
      skipTransition() { transition?.onComplete?.(); }, dispose() { disposed++; },
      inspect() { return { ready: true }; },
    };
  } });
  const click = selector => { const el = root.querySelector(selector); assert.ok(el, selector); el.focus(); el.click(); };
  return { w, root, game, click, motion, transition: () => transition, released: () => disposed };
}

test('mission shell uses a diegetic record instead of progress chrome', () => {
  assert.equal(missionShell.includes('mission-progress'), false);
  assert.equal(missionShell.includes('mission-teacher'), false);
  assert.match(missionShell, /mission-location/);
  assert.match(missionShell, /mission-evidence-count/);
  assert.match(missionShell, /mission-clues/);
  assert.doesNotMatch(missionShell, /7 个行动节点|约 15 分钟解密游戏|第 \d+ (关|阶段)|任务 \d+ \/ 07/);
});

test('every internal beat exposes a current action and primary control without leaking its id', () => {
  assert.equal(MISSION.stages.length, 15);
  for (let stage = 0; stage < 15; stage++) {
    const html = renderTask({ phase: 'playing', stage, beat: stage, paused: false, cleared: false, hint: 0, clues: [], evidence: [], positions: [0, 0, 0], results: [], channel: null, offset: 0 });
    assert.match(html, /id="mission-task-title"/);
    assert.match(html, /class="mission-goal"/);
    assert.match(html, /data-action="[^"]+"/);
    assert.doesNotMatch(html, new RegExp(`S0?${stage + 1}`));
    assert.doesNotMatch(html, /第\s*\d+\s*(关|阶段)|\/\s*15/);
  }
});

test('briefing, pause, resume and completion retain stable focus targets', async () => {
  const f = fixture();
  try {
    f.game.setActive(true);
    assert.equal(f.root.querySelector('#mission-task-title').id, 'mission-task-title');
    f.click('[data-action="start"]');
    assert.equal(f.game.inspect().state.phase, 'playing');
    f.click('[data-action="pause"]');
    assert.equal(f.game.inspect().state.paused, true);
    assert.equal(f.root.querySelector('#mission-task-title').id, 'mission-task-title');
    f.click('[data-action="resume"]');
    assert.equal(f.game.inspect().state.paused, false);
    assert.equal(f.root.querySelector('#mission-evidence-count').textContent, '尚未归档');
  } finally {
    f.game.dispose();
    await f.w.happyDOM.close();
  }
});

test('no WebGL keeps the text record and all beat controls available', async () => {
  const f = fixture(true);
  try {
    f.game.setActive(true);
    assert.equal(f.root.querySelector('.mission-fallback').hidden, false);
    f.click('[data-action="start"]');
    assert.ok(f.root.querySelector('[data-action="pause"]'));
    assert.ok(f.root.querySelector('#mission-task-title'));
    assert.doesNotMatch(f.root.textContent, /7 个行动节点|约 15 分钟解密游戏/);
  } finally {
    f.game.dispose();
    await f.w.happyDOM.close();
  }
});

test('evidence archive accepts structured entries and remains readable when empty', () => {
  assert.match(renderEvidence({ evidence: [{ label: '纸带已归档' }] }), /纸带已归档/);
  assert.match(renderEvidence({ evidence: [{ clue: '时间锚点已记录' }] }), /时间锚点/);
  assert.match(renderEvidence({ clues: ['WETTER 对齐已记录'] }), /WETTER/);
  assert.match(renderEvidence({ evidence: [] }), /现场证据/);
});

test('completion dossier stays immersive and does not expose stage counts or duration claims', () => {
  const html = renderTask({
    phase: 'complete', elapsed: 900,
    evidence: Array.from({ length: 15 }, (_, i) => ({ clue: `证据 ${i + 1}` })), clues: [],
  });
  assert.match(html, /交接档案/);
  assert.match(html, /mission-report/);
  assert.doesNotMatch(html, /7 个行动节点|约 15 分钟解密游戏|\d+\s*\/\s*15|第\s*\d+\s*(关|阶段)/);
});
