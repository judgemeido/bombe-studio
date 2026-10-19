import { initialMission, reduceMission, MISSION } from './mission-engine.js';
import { missionShell, renderTask } from './mission-template.js';
import { createMissionScene } from './mission-scene.js';
import { ALPHABET } from './cipher.js';
import { STAGE_VIEWS } from './mission-transition.js';

export function createMission(root, { motion, progress = () => {}, sceneFactory = createMissionScene } = {}) {
  const view = root.ownerDocument.defaultView, doc = root.ownerDocument;
  motion ||= view.matchMedia('(prefers-reduced-motion: reduce)');
  root.innerHTML = missionShell;
  const $ = s => root.querySelector(s), task = $('#mission-task');
  let state = initialMission(), active = false, disposed = false, scene, cinematic = false, selectedView = 'desk';
  let transitionId = 0, transitionPaused = false, pendingAction = null, unavailable = false;
  const cleanups = [], on = (el, name, fn) => { el.addEventListener(name, fn); cleanups.push(() => el.removeEventListener(name, fn)); };
  const formatElapsed = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  function updateStatus() {
    const elapsed = $('#mission-elapsed');
    const evidence = $('#mission-evidence-count');
    if (elapsed) elapsed.textContent = formatElapsed(state.elapsed);
    if (evidence) evidence.textContent = `${state.clues.length} / 7`;
  }
  function fallback(show) {
    unavailable = show; $('.mission-fallback').hidden = !show;
    if (show && cinematic) {
      pauseTransition(true);
      $('.mission-cinema-caption').textContent = '三维画面暂不可用。你的证据仍在，点击“跳过过渡”即可继续任务。';
    }
  }
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
    updateStatus();
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
    if (state.stage !== before.stage || action.type === 'start') chooseView(STAGE_VIEWS[state.stage]);
    if (action.type === 'restart') chooseView('desk');
    if (action.type !== 'tick') render(changed); else if (state !== before) updateStatus();
  }
  function clearTransition() {
    transitionId++; cinematic = false; transitionPaused = false;
    $('.mission-cinema').hidden = true; $('.mission-world').classList.remove('is-transitioning');
    $('.mission-dossier').inert = false; $('.mission-camera').inert = false;
  }
  function finishTransition() {
    if (!cinematic || disposed) return;
    const action = pendingAction; pendingAction = null;
    scene?.cancelTransition?.(); clearTransition();
    if (active && action) dispatch(action);
  }
  function pauseTransition(value) {
    if (!value && cinematic && (unavailable || motion.matches) && !doc.hidden) { finishTransition(); return; }
    transitionPaused = value; scene?.pauseTransition?.(value);
    $('[data-action="pause-intro"]').textContent = value ? '继续过渡' : '暂停';
    $('[data-action="pause-intro"]').setAttribute('aria-pressed', String(value));
  }
  function beginTransition(action) {
    if (cinematic) return;
    if (motion.matches || !scene?.playTransition || unavailable) { dispatch(action); return; }
    pendingAction = action; cinematic = true; const id = ++transitionId;
    $('.mission-cinema').hidden = false; $('.mission-world').classList.add('is-transitioning');
    $('.mission-dossier').inert = true; $('.mission-camera').inert = true;
    $('.mission-cinema-caption').textContent = action.type === 'start' ? '1941 年，布莱切利园。' : '带上这条证据，前往下一张工作桌。';
    $('.mission-cinema-progress').style.transform = 'scaleX(0)';
    pauseTransition(false);
    scene.playTransition({ kind: action.type === 'start' ? 'arrival' : 'stage', stage: action.type === 'start' ? 0 : state.stage + 1,
      onFrame(frame) {
        if (!cinematic || id !== transitionId || disposed) return;
        $('.mission-cinema-caption').textContent = frame.caption;
        $('.mission-cinema-progress').style.transform = `scaleX(${frame.progress})`;
      },
      onComplete() { if (id === transitionId && active && !disposed) finishTransition(); },
    });
    $('[data-action="skip-intro"]').focus({ preventScroll: true });
    if (view.innerWidth <= 760) $('.mission-world').scrollIntoView({ block: 'center', behavior: 'instant' });
  }
  on(root, 'click', event => {
    const button = event.target.closest('button[data-action]'); if (!button || !active || disposed) return;
    const { action, value, index, step } = button.dataset;
    if (action === 'skip-intro') { scene?.skipTransition?.(); finishTransition(); return; }
    if (action === 'pause-intro') { pauseTransition(!transitionPaused); return; }
    if (cinematic) return;
    if (action === 'start') { beginTransition({ type: 'start' }); return; }
    if (action === 'next' && state.cleared && !state.paused) { beginTransition({ type: 'next' }); return; }
    if (action === 'view') { chooseView(value); return; }
    if (action === 'rotor') dispatch({ type: action, index: Number(index), value: (state.positions[Number(index)] + Number(step) + 26) % 26 });
    else dispatch({ type: action, value: ['channel', 'align'].includes(action) ? Number(value) : value });
  });
  on(doc, 'visibilitychange', () => {
    if (doc.hidden && active) { if (cinematic) pauseTransition(true); else dispatch({ type: 'pause' }); }
  });
  on(motion, 'change', () => {
    if (motion.matches && cinematic) {
      if (doc.hidden || transitionPaused) pauseTransition(true);
      else { scene?.skipTransition?.(); finishTransition(); }
    }
    scene?.setState(state);
  });
  on(root, 'keydown', event => {
    if (event.key === 'Escape' && active) { if (cinematic) { scene?.skipTransition?.(); finishTransition(); } else dispatch({ type: state.paused ? 'resume' : 'pause' }); }
  });
  const timer = view.setInterval(() => { if (active && !doc.hidden && !cinematic) dispatch({ type: 'tick', seconds: 1 }); }, 1000);
  render(); progress(82, '七关解密游戏与证据手册已准备');
  const inspect = () => ({ state: structuredClone(state), active, cinematic, transitionPaused, view: selectedView, scene: scene?.inspect() || { ready: false } });
  view.__BOMBE_MISSION__ = inspect;
  return {
    setActive(value) {
      if (disposed) return; active = value;
      if (!value) { scene?.cancelTransition?.(); clearTransition(); pendingAction = null; dispatch({ type: 'pause' }); }
      scene?.setActive(value); if (value) render();
    },
    inspect,
    dispose() { if (disposed) return; disposed = true; active = false; transitionId++; view.clearInterval(timer); cleanups.forEach(fn => fn()); scene?.dispose(); if (view.__BOMBE_MISSION__ === inspect) delete view.__BOMBE_MISSION__; root.replaceChildren(); },
  };
}
