import test from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { createMission } from '../src/mission.js';
import { MISSION } from '../src/mission-engine.js';

function fixture(fail = false, reduced = true) {
  const w = new Window(); w.document.body.innerHTML = '<main id="mission-page"></main>';
  const root = w.document.querySelector('main'); let disposed = 0, transition, sceneOptions;
  const motion = Object.assign(new w.EventTarget(), { matches: reduced });
  const game = createMission(root, { motion, sceneFactory(canvas, options) {
    sceneOptions = options;
    if (fail) throw new Error('WebGL unavailable');
    return { setState() {}, setView() {}, setActive() {}, playTransition(options) { transition = options; }, pauseTransition() {}, cancelTransition() {}, skipTransition() { transition.onComplete(); }, dispose() { disposed++; }, inspect() { return { ready: true }; } };
  } });
  const click = selector => { const el = root.querySelector(selector); assert.ok(el, selector); el.focus(); el.click(); };
  return { w, root, game, click, motion, unavailable: value => sceneOptions.onUnavailable(value), transition: () => transition, released: () => disposed };
}
test('DOM controls play all seven levels, preserve route progress, and restart', async () => {
  const f = fixture(); const { root, game, click } = f;
  try {
    game.setActive(true); click('[data-action="start"]');
    click('[data-action="channel"][data-value="0"]'); click('[data-action="submit"]');
    assert.match(root.querySelector('#mission-feedback').textContent, /时间/);
    click('[data-action="channel"][data-value="1"]'); click('[data-action="submit"]'); click('[data-action="next"]');
    click('[data-action="align"][data-value="2"]'); click('[data-action="submit"]'); click('[data-action="next"]');
    click('[data-action="pair"][data-value="A"]'); click('[data-action="submit"]'); click('[data-action="next"]');
    click('[data-action="rotor"][data-index="0"][data-step="1"]');
    for (let i = 0; i < 3; i++) click('[data-action="rotor"][data-index="1"][data-step="1"]');
    click('[data-action="submit"]'); click('[data-action="next"]');
    click('[data-action="search"]');
    assert.equal(f.w.document.activeElement.id, 'mission-task-title');
    assert.equal(root.querySelectorAll('.mission-candidate').length, 26);
    click('[data-action="answer"][data-value="candidate"]'); click('[data-action="next"]');
    game.setActive(false); assert.equal(game.inspect().state.paused, true);
    game.setActive(true); click('[data-action="resume"]');
    assert.equal(game.inspect().state.stage, 5);
    click('[data-action="decode"]'); assert.equal(f.w.document.activeElement.id, 'mission-task-title'); assert.match(root.querySelector('.mission-plaintext').textContent, /WETTER/);
    assert.equal(game.inspect().state.decoded, MISSION.plaintext);
    click('[data-action="answer"][data-value="weather"]'); click('[data-action="next"]');
    click('[data-action="answer"][data-value="verify"]'); click('[data-action="next"]');
    assert.equal(game.inspect().state.phase, 'complete'); assert.equal(root.querySelectorAll('.mission-report li').length, 7);
    click('[data-action="restart"]'); assert.equal(game.inspect().state.phase, 'briefing');
    game.dispose(); game.dispose(); assert.equal(f.released(), 1);
  } finally { game.dispose(); await f.w.happyDOM.close(); }
});

test('briefing exposes a fifteen-minute decrypt game and live evidence clock', async () => {
  const f = fixture();
  try {
    f.game.setActive(true);
    assert.match(f.root.querySelector('.mission-header-note').textContent, /15 分钟解密游戏/);
    assert.match(f.root.querySelector('.mission-brief-facts').textContent, /15/);
    assert.equal(f.root.querySelector('#mission-elapsed').textContent, '00:00');
    assert.equal(f.root.querySelector('#mission-evidence-count').textContent, '0 / 7');
    f.click('[data-action="start"]');
    await new Promise(resolve => setTimeout(resolve, 1100));
    assert.notEqual(f.root.querySelector('#mission-elapsed').textContent, '00:00');
  } finally { f.game.dispose(); await f.w.happyDOM.close(); }
});

test('real-time intro has no video, skipping starts only once and focuses the task', async () => {
  const f = fixture(false, false);
  try {
    f.game.setActive(true); f.click('[data-action="start"]');
    assert.equal(f.root.querySelector('video'), null);
    assert.equal(f.game.inspect().cinematic, true);
    const late = f.transition().onComplete;
    f.click('[data-action="skip-intro"]'); late();
    assert.equal(f.game.inspect().state.phase, 'playing'); assert.equal(f.game.inspect().state.stage, 0);
    assert.equal(f.w.document.activeElement.id, 'mission-task-title');
    assert.equal(f.root.querySelector('.mission-dossier').inert, false);
  } finally { f.game.dispose(); await f.w.happyDOM.close(); }
});

test('leaving an intro cancels stale callbacks and allows restarting on return', async () => {
  const f = fixture(false, false);
  try {
    f.game.setActive(true); f.click('[data-action="start"]');
    const late = f.transition().onComplete;
    f.game.setActive(false); late(); f.game.setActive(true);
    assert.equal(f.game.inspect().state.phase, 'briefing');
    f.click('[data-action="start"]'); f.transition().onComplete();
    assert.equal(f.game.inspect().state.phase, 'playing');
  } finally { f.game.dispose(); await f.w.happyDOM.close(); }
});

test('without WebGL a motion-enabled visitor enters tasks directly', async () => {
  const f = fixture(true, false);
  try {
    f.game.setActive(true); f.click('[data-action="start"]');
    assert.equal(f.game.inspect().state.phase, 'playing');
    assert.equal(f.game.inspect().cinematic, false);
  } finally { f.game.dispose(); await f.w.happyDOM.close(); }
});

test('stage transitions defer progression and reduced-motion change finishes safely', async () => {
  const f = fixture(false, false);
  try {
    f.game.setActive(true); f.click('[data-action="start"]'); f.transition().onComplete();
    f.click('[data-action="channel"][data-value="1"]'); f.click('[data-action="submit"]'); f.click('[data-action="next"]');
    assert.equal(f.game.inspect().state.stage, 0); assert.equal(f.game.inspect().cinematic, true);
    f.motion.matches = true; f.motion.dispatchEvent(new f.w.Event('change'));
    assert.equal(f.game.inspect().state.stage, 1); assert.equal(f.game.inspect().cinematic, false);
  } finally { f.game.dispose(); await f.w.happyDOM.close(); }
});

for (const trigger of ['context loss', 'reduced motion']) test(`a paused transition is not advanced by ${trigger}`, async () => {
  const f = fixture(false, false);
  try {
    f.game.setActive(true); f.click('[data-action="start"]'); f.transition().onComplete();
    f.click('[data-action="channel"][data-value="1"]'); f.click('[data-action="submit"]'); f.click('[data-action="next"]');
    f.click('[data-action="pause-intro"]');
    if (trigger === 'context loss') f.unavailable(true);
    else { f.motion.matches = true; f.motion.dispatchEvent(new f.w.Event('change')); }
    assert.equal(f.game.inspect().state.stage, 0);
    assert.equal(f.game.inspect().cinematic, true);
    assert.equal(f.game.inspect().transitionPaused, true);
    f.click('[data-action="skip-intro"]');
    assert.equal(f.game.inspect().state.stage, 1);
  } finally { f.game.dispose(); await f.w.happyDOM.close(); }
});
test('no WebGL still exposes all task controls with clear fallback; pause blocks inputs', async () => {
  const f = fixture(true);
  try {
    f.game.setActive(true); f.click('[data-action="start"]');
    assert.equal(f.root.querySelector('.mission-fallback').hidden, false);
    f.click('[data-action="pause"]'); assert.equal(f.game.inspect().state.paused, true);
    assert.ok(f.root.querySelector('[data-action="resume"]'));
    f.click('[data-action="resume"]'); f.click('[data-action="hint"]');
    assert.equal(f.game.inspect().state.stage, 0); assert.match(f.root.textContent, /重复的时间/);
  } finally { f.game.dispose(); await f.w.happyDOM.close(); }
});
