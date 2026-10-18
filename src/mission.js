import { initialMission, reduceMission, MISSION } from './mission-engine.js';
import { missionShell, renderTask } from './mission-template.js';
import { createMissionScene } from './mission-scene.js';
import { ALPHABET } from './cipher.js';

export function createMission(root, { motion, progress = () => {}, sceneFactory = createMissionScene } = {}) {
  const view = root.ownerDocument.defaultView, doc = root.ownerDocument;
  motion ||= view.matchMedia('(prefers-reduced-motion: reduce)');
  root.innerHTML = missionShell;
  const $ = s => root.querySelector(s), task = $('#mission-task'), video = $('video');
  let state = initialMission(), active = false, disposed = false, scene, cinematic = false, selectedView = 'desk';
  const cleanups = [], on = (el, name, fn) => { el.addEventListener(name, fn); cleanups.push(() => el.removeEventListener(name, fn)); };
  function fallback(show) { $('.mission-fallback').hidden = !show; }
  progress(45, '搭建 1941 年工作室');
  try { scene = sceneFactory($('#mission-canvas'), { motion, onUnavailable: fallback, onSignal({ positions, inputLetter, outputLetter }) {
    const text = outputLetter ? `按键 ${inputLetter} → 灯板 ${outputLetter}   /   轮位 ${positions.map(n => ALPHABET[n]).join(' · ')}` : `Enigma / 轮位 ${positions.map((n, i) => state.stage === 3 && i === 2 ? '?' : ALPHABET[n]).join(' · ')}`;
    const readout = $('#mission-machine-readout'); if (readout && readout.textContent !== text) readout.textContent = text;
  } }); }
  catch { fallback(true); $('.mission-camera').hidden = true; }
  function focusTask() {
    const heading = $('#mission-task-title'); heading?.focus({ preventScroll: true });
    if (view.innerWidth <= 760) heading?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  function render(focus = false) {
    const focused = doc.activeElement?.closest('[data-action]');
    const oldData = focused && task.contains(focused) ? { ...focused.dataset } : null;
    const depthOpen = $('.mission-depth')?.open;
    task.innerHTML = renderTask(state);
    $('#mission-announcement').textContent = state.feedback || '';
    if (depthOpen && !focus && $('.mission-depth')) $('.mission-depth').open = true;
    $('.mission-progress').innerHTML = MISSION.stages.map((s, i) => `<li class="${i < state.clues.length ? 'is-done' : ''} ${state.phase === 'playing' && i === state.stage ? 'is-current' : ''}"${state.phase === 'playing' && i === state.stage ? ' aria-current="step"' : ''}><span>${i < state.clues.length ? '✓' : String(i + 1).padStart(2, '0')}</span>${s.short}</li>`).join('');
    $('#mission-clue-count').textContent = `${state.clues.length} / 7`;
    $('#mission-clues').innerHTML = state.clues.length ? state.clues.map(c => `<li>${c}</li>`).join('') : '<li>完成任务后，你收集的证据会留在这里。</li>';
    $('#mission-location').textContent = state.phase === 'playing' ? MISSION.stages[state.stage].place : '英国 · 布莱切利园 · 1941';
    $('#mission-scene-caption').textContent = state.phase === 'playing' ? ['从规律出发，找到一个可以检验的猜测。', '字母不变成自身：先排除不可能。', '一根接线，两个方向。', '固定已知条件，再搜索未知。', '机房帮助排除，停机结果仍需核验。', '每个按键先步进，再让信号通过回路。', '把已知与未知，一起交给团队。'][state.stage] : '一张工作桌，连接起截收、推理与核验。';
    scene?.setState(state);
    if (focus) focusTask();
    else if (oldData) {
      const replacement = [...task.querySelectorAll('[data-action]')].find(el => Object.entries(oldData).every(([k, v]) => el.dataset[k] === v));
      if (replacement) replacement.focus({ preventScroll: true }); else focusTask();
    }
  }
  function chooseView(name) {
    selectedView = name; scene?.setView(name);
    root.querySelectorAll('[data-action="view"]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.value === name)));
  }
  function dispatch(action) {
    if (disposed) return;
    const before = state; state = reduceMission(state, action);
    if (state === before) return;
    const changed = state.stage !== before.stage || state.phase !== before.phase || state.paused !== before.paused || state.cleared !== before.cleared;
    if (state.stage !== before.stage) chooseView(state.stage === 4 ? 'bombe' : [2, 3, 5].includes(state.stage) ? 'rotors' : 'desk');
    if (action.type === 'restart') chooseView('desk');
    if (action.type !== 'tick') render(changed);
  }
  function finishIntro() {
    cinematic = false; video.pause(); $('.mission-cinema').hidden = true;
    if (active) dispatch({ type: 'start' });
  }
  function begin() {
    if (motion.matches) { dispatch({ type: 'start' }); return; }
    cinematic = true; $('.mission-cinema').hidden = false;
    video.src ||= 'assets/mission/arrival.mp4'; video.currentTime = 0;
    video.play()?.catch(() => { $('.mission-cinema-caption').textContent = '片头暂未播放，可点击播放或直接进入任务。'; });
    $('[data-action="skip-intro"]').focus({ preventScroll: true });
    if (view.innerWidth <= 760) $('.mission-cinema').scrollIntoView({ block: 'center', behavior: 'instant' });
  }
  on(root, 'click', event => {
    const button = event.target.closest('button[data-action]'); if (!button || !active || disposed) return;
    const { action, value, index, step } = button.dataset;
    if (action === 'start') { begin(); return; }
    if (action === 'skip-intro') { finishIntro(); return; }
    if (action === 'view') { chooseView(value); return; }
    if (action === 'rotor') dispatch({ type: action, index: Number(index), value: (state.positions[Number(index)] + Number(step) + 26) % 26 });
    else dispatch({ type: action, value: ['channel', 'align'].includes(action) ? Number(value) : value });
  });
  on(video, 'ended', finishIntro);
  on(video, 'error', () => { if (cinematic) { $('.mission-cinema-caption').textContent = '片头暂不可用；你可以直接进入任务。'; } });
  on(doc, 'visibilitychange', () => {
    if (doc.hidden) { video.pause(); if (active) dispatch({ type: 'pause' }); }
  });
  on(motion, 'change', () => { if (motion.matches && cinematic) finishIntro(); scene?.setState(state); });
  on(root, 'keydown', event => {
    if (event.key === 'Escape' && active) { if (cinematic) finishIntro(); else dispatch({ type: state.paused ? 'resume' : 'pause' }); }
  });
  const timer = view.setInterval(() => { if (active && !doc.hidden && !cinematic) dispatch({ type: 'tick', seconds: 1 }); }, 1000);
  render(); progress(82, '七关任务与证据手册已准备');
  return {
    setActive(value) {
      if (disposed) return; active = value;
      if (!value) { video.pause(); if (cinematic) { cinematic = false; $('.mission-cinema').hidden = true; } dispatch({ type: 'pause' }); }
      scene?.setActive(value); if (value) render();
    },
    inspect() { return { state: structuredClone(state), active, cinematic, view: selectedView, scene: scene?.inspect() || { ready: false } }; },
    dispose() { if (disposed) return; disposed = true; active = false; view.clearInterval(timer); video.pause(); video.removeAttribute('src'); video.load(); cleanups.forEach(fn => fn()); scene?.dispose(); root.replaceChildren(); },
  };
}
