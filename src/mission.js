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
  let state = initialMission(), active = false, disposed = false, scene, cinematic = false, selectedView = 'entry';
  let transitionId = 0, transitionPaused = false, pendingAction = null, unavailable = false;
  const cleanups = [], on = (el, name, fn) => { el.addEventListener(name, fn); cleanups.push(() => el.removeEventListener(name, fn)); };
  const formatElapsed = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const beatIndex = value => Number.isInteger(value?.beat) ? value.beat : Number.isInteger(value?.stage) ? value.stage : 0;
  const currentBeat = value => MISSION.stages?.[beatIndex(value)] || {};
  const viewPlaces = Object.freeze({
    floor: '夜班楼层 · 连通走廊',
    entry: '夜班入口 · 外廊', radio: '无线电室 · 接收台', archive: '档案走廊 · 班次记录墙',
    analysis: '分析室 · 放大灯下', machine: '机房 · 接线工作台', map: '地图室 · 北港墙图', handoff: '交接室 · 封存桌',
  });
  const viewCaptions = Object.freeze({
    floor: '中央走廊连接五个前区；档案与分析室的后门通往交接室和地图室。',
    entry: '入口登记、耳机和雾况记录都在这张交班桌上。', radio: '接收台留下频段、纸带和重复报头。',
    archive: '旧班记录墙把时间、呼号和格式放在同一条证据线上。', analysis: '放大灯下的关系图把 crib 变成可检验的约束。',
    machine: '接线台、Enigma 设置单和 Bombe 鼓轮在这里反复核验候选。', map: '北港墙图把明文、时间戳和行动位置连在一起。',
    handoff: '封存桌保留 BDF、明文、时间戳和仍未确认的事项。',
  });
  const sceneView = value => {
    const index = beatIndex(value), zone = value?.currentZone || currentBeat(value).zone;
    if (Array.isArray(STAGE_VIEWS)) return STAGE_VIEWS[index] || STAGE_VIEWS[Math.min(index, STAGE_VIEWS.length - 1)] || 'entry';
    if (STAGE_VIEWS && typeof STAGE_VIEWS === 'object') return STAGE_VIEWS[zone] || STAGE_VIEWS[index] || 'entry';
    return zone || 'entry';
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
    $('[data-action="floorplan"]').hidden = show;
    if (show && cinematic) {
      pauseTransition(true);
      $('.mission-cinema-caption').textContent = '三维画面暂不可用。你的证据仍在，点击“跳过过渡”即可继续任务。';
    }
  }
  progress(45, '搭建 1941 年夜班行动空间');
  try { scene = sceneFactory($('#mission-canvas'), { motion, onUnavailable: fallback, onSignal({ positions, inputLetter, outputLetter }) {
    const apparatus = outputLetter ? `按键 ${inputLetter} → 灯板 ${outputLetter}   /   轮位 ${positions.map(n => ALPHABET[n]).join(' · ')}` : `Enigma / 轮位 ${positions.map((n, i) => beatIndex(state) === 8 && i === 2 ? '?' : ALPHABET[n]).join(' · ')}`;
    const text = ({ entry: '夜班登记 / 05:42', radio: '接收台 / 双机监听', archive: '班次档案 / 原始记录',
      map: '北港墙图 / 时间与位置', handoff: '交接桌 / 封存与核验', floor: '连续楼层 / 走廊与开放门洞' })[selectedView] || apparatus;
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
    const inspected = selectedView !== sceneView(state) && viewPlaces[selectedView];
    const beat = currentBeat(state), location = inspected || (state.phase === 'briefing'
      ? '英国 · 布莱切利园'
      : (beat.place || state.currentZone || beat.zone || '夜班行动空间'));
    $('#mission-location').textContent = location;
    $('#mission-location-world').textContent = location;
    $('#mission-scene-caption').textContent = inspected ? viewCaptions[selectedView] : state.phase === 'playing' ? (beat.goal || beat.action || '现场记录等待你的判断。') : '夜班记录从一束稳定信号开始。';
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
    $('[data-action="floorplan"]').setAttribute('aria-pressed', String(name === 'floor'));
    const place = viewPlaces[name];
    if (place) {
      $('#mission-location').textContent = place;
      $('#mission-location-world').textContent = place;
      $('#mission-scene-caption').textContent = viewCaptions[name];
    }
  }
  function dispatch(action) {
    if (disposed) return;
    const before = state; state = reduceMission(state, action);
    if (state === before) return;
    const changed = state.stage !== before.stage || state.beat !== before.beat || state.phase !== before.phase || state.paused !== before.paused || state.cleared !== before.cleared;
    if (state.stage !== before.stage || state.beat !== before.beat || state.currentZone !== before.currentZone || state.phase !== before.phase || action.type === 'start') chooseView(sceneView(state));
    if (action.type === 'restart') chooseView('entry');
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
    if (action === 'floorplan') { chooseView(selectedView === 'floor' ? sceneView(state) : 'floor'); return; }
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
