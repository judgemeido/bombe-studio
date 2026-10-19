import { initialMission, reduceMission, MISSION } from './mission-engine.js';
import { missionShell, renderTask, renderEvidence } from './mission-template.js';
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
  const beatIndex = value => Number.isInteger(value?.beat) ? value.beat : Number.isInteger(value?.stage) ? value.stage : 0;
  const currentBeat = value => MISSION.stages?.[beatIndex(value)] || {};
  const sceneView = value => {
    const index = beatIndex(value), zone = value?.currentZone || currentBeat(value).zone;
    if (Array.isArray(STAGE_VIEWS)) return STAGE_VIEWS[index] || STAGE_VIEWS[Math.min(index, STAGE_VIEWS.length - 1)] || 'desk';
    if (STAGE_VIEWS && typeof STAGE_VIEWS === 'object') return STAGE_VIEWS[zone] || STAGE_VIEWS[index] || 'desk';
    return zone || 'desk';
  };
  const wallClock = seconds => {
    const minute = 42 + Math.floor((seconds || 0) / 60), hour = 5 + Math.floor(minute / 60);
    return `${String(hour).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
  };
  function updateStatus() {
    const elapsed = $('#mission-elapsed');
    const evidence = $('#mission-evidence-count');
    if (elapsed) elapsed.textContent = formatElapsed(state.elapsed);
    if ($('#mission-clock')) $('#mission-clock').textContent = wallClock(state.elapsed);
    if ($('#mission-timestamp')) $('#mission-timestamp').textContent = wallClock(state.elapsed);
    const entries = Array.isArray(state.evidence) && state.evidence.length ? state.evidence : (state.clues || []);
    if (evidence) evidence.textContent = entries.length ? `${entries.at(-1)?.label || entries.at(-1)?.text || entries.at(-1)?.clue || entries.at(-1)?.detail || '最新证据'}已归档` : '尚未归档';
  }
  function fallback(show) {
    unavailable = show; $('.mission-fallback').hidden = !show;
    if (show && cinematic) {
      pauseTransition(true);
      $('.mission-cinema-caption').textContent = '三维画面暂不可用。你的证据仍在，点击“跳过过渡”即可继续任务。';
    }
  }
  progress(45, '搭建 1941 年夜班行动空间');
  try { scene = sceneFactory($('#mission-canvas'), { motion, onUnavailable: fallback, onSignal({ positions, inputLetter, outputLetter }) {
    const text = outputLetter ? `按键 ${inputLetter} → 灯板 ${outputLetter}   /   轮位 ${positions.map(n => ALPHABET[n]).join(' · ')}` : `Enigma / 轮位 ${positions.map((n, i) => beatIndex(state) === 8 && i === 2 ? '?' : ALPHABET[n]).join(' · ')}`;
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
    const evidence = Array.isArray(state.evidence) && state.evidence.length ? state.evidence : (state.clues || []);
    $('#mission-clue-count').textContent = evidence.length ? `${evidence.length} 条记录` : '尚未归档';
    updateStatus();
    $('#mission-clues').innerHTML = renderEvidence(state);
    const beat = currentBeat(state), location = state.phase === 'briefing'
      ? '英国 · 布莱切利园'
      : (beat.place || state.currentZone || beat.zone || '夜班行动空间');
    $('#mission-location').textContent = location;
    $('#mission-location-world').textContent = location;
    $('#mission-scene-caption').textContent = state.phase === 'playing' ? (beat.goal || beat.action || '现场记录等待你的判断。') : '夜班记录从一束稳定信号开始。';
    scene?.setState(state);
    if (focus) focusTask();
    else if (oldData) {
      const replacement = [...task.querySelectorAll('[data-action]')].find(el => Object.entries(oldData).every(([k, v]) => el.dataset[k] === v));
      if (replacement) replacement.focus({ preventScroll: true }); else focusTask();
    }
  }
  function chooseView(name) {
    selectedView = name;
    const zones = ['entry', 'entrance', 'radio', 'archive', 'analysis', 'machine', 'map', 'handoff'];
    if (zones.includes(name) && scene?.setZone) scene.setZone(name); else scene?.setView(name);
    root.querySelectorAll('[data-action="view"]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.value === name)));
  }
  function dispatch(action) {
    if (disposed) return;
    const before = state; state = reduceMission(state, action);
    if (state === before) return;
    const changed = state.stage !== before.stage || state.beat !== before.beat || state.phase !== before.phase || state.paused !== before.paused || state.cleared !== before.cleared;
    if (state.stage !== before.stage || state.beat !== before.beat || state.currentZone !== before.currentZone || state.phase !== before.phase || action.type === 'start') chooseView(sceneView(state));
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
    $('.mission-cinema-caption').textContent = action.type === 'start' ? '05:42，布莱切利园夜班。' : '带上这条证据，前往下一张工作桌。';
    $('.mission-cinema-progress').style.transform = 'scaleX(0)';
    pauseTransition(false);
    scene.playTransition({ kind: action.type === 'start' ? 'arrival' : 'stage', stage: action.type === 'start' ? 0 : beatIndex(state) + 1,
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
    if (action === 'rotor') dispatch({ type: action, index: Number(index), value: (((state.positions || [0, 0, 0])[Number(index)] || 0) + Number(step) + 26) % 26 });
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
  render(); progress(82, '现场记录已准备');
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
