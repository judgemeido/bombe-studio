import * as THREE from 'three';
import { createStage } from './scene.js';
import { createLabModel } from './lab-model.js';
import { ALPHABET, letter, pressKey, traceLetter } from './cipher.js';
import { LEVELS, createChallengeSet, freshSeed, createSession, submitAnswer, advanceSession, positionText, createMissionState, prepareMission, decodeMissionLetter } from './challenge-engine.js';
import template from './challenge-template.js';

const HISTORY_KEY = 'bombe-quest-recent-v1';
export async function createChallenge(container, { motion, progress }) {
  container.innerHTML = template;
  const $ = selector => container.querySelector(selector), cleanups = [];
  const on = (el, name, fn) => { el.addEventListener(name, fn); cleanups.push(() => el.removeEventListener(name, fn)); };
  const announce = text => { $('#quest-status').textContent = text; };
  let session, mission, stage = null, model = null, active = false, disposed = false, contextLost = false, raf, previous = performance.now();
  let positions = [0, 0, 0], trace = null, signalProgress = -1, target = 9, playing = false, observationCount = 0, follow = true, spread = false, focusedPart = null, visibleSegment = -2, wasComplete = false;
  const question = () => session.round.questions[session.index];
  const complete = () => Boolean(trace && signalProgress >= target);
  let recent = [];
  try { const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); if (Array.isArray(saved)) recent = saved.filter(item => Array.isArray(item) && item.every(s => typeof s === 'string')).slice(-2); } catch { /* Storage is optional; fresh randomization still works. */ }

  function frameCamera(immediate = motion.matches) { if (stage && model) stage.frameBounds(model.getBounds(), 'front', 0, true, immediate); }
  function moveToModel() {
    if (matchMedia('(max-width: 760px)').matches) $('#quest-viewer').scrollIntoView({ block: 'start', behavior: motion.matches ? 'instant' : 'smooth' });
  }
  function resetObservation() {
    trace = null; signalProgress = -1; playing = false; target = 9; visibleSegment = -2; wasComplete = false; observationCount = 0;
    positions = [...question().positions]; model?.setTrace(null); model?.setPositions(positions, true);
    $('#quest-signal-progress').max = 9;
  }
  function renderJourney() {
    $('#quest-levels').replaceChildren(...LEVELS.map((level, i) => {
      const item = document.createElement('li'), done = session.completed.includes(level.id);
      if (i === session.index && !session.finished) item.setAttribute('aria-current', 'step');
      item.classList.toggle('is-done', done); item.innerHTML = `<span>${done ? '✓' : String(i + 1).padStart(2, '0')}</span><b>${level.title}</b>`;
      item.setAttribute('aria-label', `第 ${i + 1} 关，${level.title}，${done ? '已完成' : i === session.index ? '当前关卡' : '完成前一关后解锁'}`); return item;
    }));
    $('#quest-completed').textContent = `已完成 ${session.completed.length} / 6`;
  }
  function renderClue() {
    const q = question(), entries = [];
    if (q.level === 0) { $('#quest-clue').hidden = true; return; }
    $('#quest-clue').hidden = false;
    if (q.level !== 1) entries.push([q.level === 4 ? '锁住轮位' : '起点轮位', positionText(q.positions)]);
    if (q.level !== 2) entries.push(['跳线', q.pairs.length ? q.pairs[0].join(' ↔ ') : '不接线']);
    if (q.level === 1) entries.push(['输入', q.input]);
    if (q.level === 2) entries.push(['按键次数', `${q.count} 次`]);
    if (q.level === 3) entries.push(['输入', q.input]);
    if (q.level === 4) entries.push(['已知线索', `${q.original} → ${q.input}`]);
    if (q.level === 5) entries.push(['收到密文', q.ciphertext]);
    $('#quest-clue').replaceChildren(...entries.map(([name, value]) => {
      const line = document.createElement('div'), label = document.createElement('span'), strong = document.createElement('strong');
      if (name === '收到密文') line.className = 'quest-cipher-line'; label.textContent = name; strong.textContent = value; line.append(label, strong); return line;
    }));
  }
  function renderOptions() {
    const q = question();
    $('#quest-options').replaceChildren(...q.options.map(option => {
      const button = document.createElement('button'); button.className = 'quest-option'; button.dataset.questAnswer = option.value; button.setAttribute('aria-pressed', 'false');
      const name = document.createElement('strong'); name.textContent = option.label; button.append(name);
      if (option.detail) { const detail = document.createElement('small'); detail.textContent = option.detail; button.append(detail); }
      return button;
    }));
  }
  function syncMission() {
    const q = question(), final = q.level === 5, configured = final && mission.phase !== 'setup';
    $('#quest-mission-form').hidden = !final || configured;
    $('#quest-mission-status').hidden = !configured;
    $('#quest-mission-reset').hidden = session.correct;
    $('#quest-mission-caption').textContent = !configured ? '' : mission.phase === 'complete' && complete() ? '③ 三个字母已找回，选出下面的消息' : `② 设置已锁定 · 输入密文 ${q.ciphertext}`;
    $('#quest-answers').hidden = final && (mission.phase !== 'complete' || !complete());
    $('#quest-answer-label').textContent = final ? '③ 找到的小消息是什么？' : q.level === 0 ? '点模型标签或选择部件' : '选择你的发现';
  }
  function renderQuestion({ focus = false } = {}) {
    const q = question(); mission = createMissionState(); focusedPart = null;
    $('.quest-task-panel').dataset.level = q.level;
    $('.quest-model-panel').dataset.level = q.level;
    $('#quest-task').hidden = false; $('#quest-finish').hidden = true;
    $('#quest-level-number').textContent = `第 ${q.level + 1} 关 / 6`;
    $('#quest-skill').textContent = q.skill; $('#quest-question').textContent = q.prompt; $('#quest-instruction').textContent = q.instruction;
    $('#quest-steps').replaceChildren(...q.steps.map(step => { const item = document.createElement('li'); item.textContent = step; return item; }));
    $('#quest-how').open = q.level !== 5;
    $('#quest-hint').open = false; $('#quest-hint').hidden = false; $('#quest-hint-text').textContent = q.hint;
    $('#quest-feedback').hidden = true; $('#quest-setup-feedback').hidden = true; $('#quest-next').hidden = true;
    $('#quest-position-label').textContent = q.level === 4 ? '轮位锁定' : '当前轮位';
    renderJourney(); renderClue(); renderOptions();
    spread = false; $('#quest-spread').setAttribute('aria-pressed', 'false'); $('#quest-spread').disabled = q.topic === 'wiring' || !model;
    model?.setTopic(q.topic); model?.setSpread(0); model?.setConnection(q.pairs[0] ?? null); resetObservation();
    if (q.level === 5) {
      positions = [0, 0, 0]; model?.setPositions(positions, true); model?.setConnection(null);
      for (let i = 0; i < 3; i++) $(`#quest-wheel-${i}`).value = 'A';
      $('#quest-mission-plug-a').value = $('#quest-mission-plug-b').value = '';
    }
    follow = true; frameCamera(true); syncMission(); syncObservation(true);
    $('.quest-task-panel').scrollTop = 0;
    if (focus) { $('#quest-question').focus({ preventScroll: true }); $('#quest-question').scrollIntoView({ block: 'nearest', behavior: 'instant' }); }
  }
  function startNewRound({ focus = false } = {}) {
    const round = createChallengeSet(freshSeed(), { avoid: recent.flat() });
    recent = [...recent, round.questions.map(q => q.signature)].slice(-2);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(recent)); } catch { /* Private browsing must not block the activity. */ }
    session = createSession(round); renderQuestion({ focus }); announce('新题准备好了。从第 1 关开始，没有倒计时，可以慢慢观察。');
  }
  function answer(value) {
    if (!active || session.finished || session.correct || question().level === 5 && (mission.phase !== 'complete' || !complete())) return;
    const next = submitAnswer(session, value); if (next === session) return; session = next;
    if (question().level === 0) focusedPart = value;
    container.querySelectorAll('[data-quest-answer]').forEach(button => {
      const chosen = button.dataset.questAnswer === session.selected;
      button.setAttribute('aria-pressed', String(chosen)); button.classList.toggle('is-correct', chosen && session.correct); button.classList.toggle('is-wrong', chosen && !session.correct); button.disabled = session.correct;
    });
    $('#quest-feedback').hidden = false; $('#quest-feedback').dataset.correct = String(session.correct);
    $('#quest-feedback-title').textContent = session.correct ? '✓ 发现正确！收下一枚知识印章。' : '再观察一下，你可以继续试。';
    $('#quest-feedback-text').textContent = session.correct ? question().explanation : question().hint;
    $('#quest-next').hidden = !session.correct; $('#quest-next').textContent = session.index === 5 ? '收好我的六枚知识印章 ↗' : `去第 ${session.index + 2} 关 →`;
    $('#quest-hint').hidden = session.correct; renderJourney(); syncMission();
    (session.correct ? $('#quest-next') : $('#quest-feedback')).scrollIntoView({ block: 'nearest', behavior: motion.matches ? 'instant' : 'smooth' });
    announce(session.correct ? `第 ${session.index + 1} 关完成。${question().explanation}` : `再试一次。${question().hint}`);
  }
  function nextQuestion() {
    const next = advanceSession(session); if (next === session) return; session = next;
    if (!session.finished) renderQuestion({ focus: true });
    else {
      playing = false; renderJourney(); $('#quest-task').hidden = true; $('#quest-finish').hidden = false;
      $('#quest-stamps').replaceChildren(...LEVELS.map(level => { const item = document.createElement('li'); item.textContent = level.skill; return item; }));
      $('#quest-finish-heading').focus({ preventScroll: true }); $('.quest-task-panel').scrollTop = 0;
      $('#quest-finish-heading').scrollIntoView({ block: 'nearest', behavior: 'instant' });
      announce('六关全部完成！你已经找回了消息，也收集了六枚知识印章。');
      syncObservation(true);
    }
  }
  function playTrace(value, stopAt = 9) {
    trace = value; positions = [...value.positions]; target = stopAt;
    model?.setPositions(positions, motion.matches); model?.setTrace(trace);
    signalProgress = motion.matches ? target : 0; playing = !motion.matches; visibleSegment = -2; wasComplete = false;
    $('#quest-signal-progress').max = target; syncObservation(true);
  }
  function observe() {
    if (!active || session.finished) return;
    const q = question();
    if (q.level === 0) return;
    if (trace && !complete()) { playing = !playing; if (motion.matches) { playing = false; signalProgress = target; } syncObservation(true); return; }
    if (q.level === 1) playTrace(traceLetter(q.input, q.positions, q.pairs), 1);
    if (q.level === 2) {
      if (observationCount >= q.count) { resetObservation(); }
      const result = pressKey(q.input, positions, q.pairs); observationCount++; playTrace(result);
    }
    if (q.level === 3) playTrace(pressKey(q.input, q.positions, q.pairs));
    if (q.level === 4) playTrace(traceLetter(q.input, q.positions, q.pairs));
    if (q.level === 5) {
      const result = decodeMissionLetter(q, mission); if (!result.trace) return; mission = result.state; $('#quest-setup-feedback').hidden = true; playTrace(result.trace);
    }
  }
  function step() { if (!active || !trace || complete() || session.finished) return; playing = false; signalProgress = Math.min(target, Math.floor(signalProgress) + 1); syncObservation(true); }
  function syncObservation(force = false) {
    const q = question(), done = complete(), segment = trace ? Math.min(target - 1, Math.max(0, Math.ceil(signalProgress) - 1)) : -1;
    $('#quest-signal-progress').value = Math.max(0, signalProgress);
    if (!force && segment === visibleSegment && done === wasComplete) return;
    visibleSegment = segment; wasComplete = done;
    $('#quest-position').textContent = positions.map(letter).join(' · ');
    $('#quest-input').textContent = trace?.input ?? (q.level === 5 ? q.ciphertext[0] : q.input ?? '—');
    $('#quest-middle-label').textContent = q.level === 2 ? '按键次数' : '当前字母';
    $('#quest-current-letter').textContent = q.level === 2 ? `${observationCount}/${q.count}` : trace && segment >= 0 ? letter(trace.stages[segment].output) : '—';
    $('#quest-output-label').textContent = q.level === 5 ? '找回的消息' : q.level === 2 ? '现在的轮位' : q.level === 1 ? '接线板出口' : '输出';
    $('#quest-output').textContent = q.level === 5 ? mission.output.slice(0, Math.max(0, mission.cursor - (done ? 0 : 1))).padEnd(3, '·') : q.level === 2 ? positionText(positions) : done ? q.level === 1 ? letter(trace.stages[0].output) : trace.output : '—';
    const badge = session.finished ? '六枚知识印章 ✓' : q.level === 5 ? mission.phase === 'setup' ? '先设置，再解密' : `解密 ${Math.max(0, mission.cursor - (done ? 0 : 1))} / 3` : q.level === 2 ? `已按 ${observationCount} / ${q.count} 次` : done ? '观察完成 · 去选答案' : trace ? playing ? '亮线正在走' : '已暂停 · 可以逐段看' : '先读右边的任务';
    $('#quest-observation-badge').textContent = badge;
    const pass = trace?.stages[segment];
    $('#quest-stage-count').textContent = pass ? `${String(segment + 1).padStart(2, '0')} / ${String(target).padStart(2, '0')}` : '观察';
    $('#quest-narration').textContent = q.level === 2 && trace ? `第 ${observationCount} 次按键，快轮先走一步。轮位现在是 ${positionText(positions)}。${done && observationCount < q.count ? '再按一次，完成任务卡的次数。' : done ? '按够次数了，去选出这个轮位。' : '看最右边的快轮转动。'}` : pass ? `${pass.name}：${letter(pass.input)} → ${letter(pass.output)}。${done ? q.level === 5 ? mission.phase === 'complete' ? '三个字母已找回，请在答案区选出这条消息。' : '把找回的字母读出来，再输入下一个。' : '可以在答案区选择了。' : pass.id === 'reflector' ? '信号在这里掉头。' : pass.reverse ? '信号正在返回。' : '跟着亮线，看字母如何变化。'}` : q.level === 0 ? '读题后，点击模型标签或答案区的部件。' : q.level === 5 ? '先照着任务卡调轮位和接线，再逐个输入密文。' : q.level === 4 ? '本关锁住鼓轮，只演示同一轮位的信号往返。' : '设置已准备好，点击下面的按钮开始观察。';
    $('#quest-observe').hidden = q.level === 0;
    $('#quest-step').hidden = q.level === 0;
    $('#quest-step').disabled = !trace || done || session.finished;
    $('#quest-observe').disabled = session.finished || q.level === 5 && (mission.phase === 'setup' || mission.phase === 'complete' && done);
    $('#quest-observe').textContent = q.level === 0 ? '观察模型部件' : trace && !done ? playing ? '暂停亮线' : '继续亮线' : q.level === 1 ? `让 ${q.input} 通过接线板` : q.level === 2 ? observationCount >= q.count ? '回到起点，再观察一次 ↺' : `按一下 ${q.input} · 第 ${observationCount + 1} / ${q.count} 次` : q.level === 3 ? `${done ? '重看' : '输入'} ${q.input}，追踪亮线` : q.level === 4 ? `保持轮位，送回 ${q.input}` : mission.phase === 'complete' ? '三个字母已找回 ✓' : `输入密文 ${q.ciphertext[mission.cursor]} · 第 ${mission.cursor + 1} / 3 个`;
    focusedPart = q.level === 0 ? focusedPart : q.level === 2 ? 'rotor-2' : pass?.rotor !== null && pass?.rotor !== undefined ? `rotor-${pass.rotor}` : pass?.id === 'reflector' ? 'reflector' : 'wiring';
    $('#quest-return-task').hidden = !done || session.finished || q.level === 2 && observationCount < q.count || q.level === 5 && mission.phase !== 'complete';
    syncMission();
    if (done && force === false) announce(q.level === 5 ? `找回的消息：${mission.output}。` : `观察完成，${q.level === 2 ? '轮位 ' + positionText(positions) : '输出 ' + (q.level === 1 ? letter(trace.stages[0].output) : trace.output)}。`);
  }

  function syncSetupFromControls() {
    if (mission.phase !== 'setup') return;
    positions = [0, 1, 2].map(i => ALPHABET.indexOf($(`#quest-wheel-${i}`).value)); model?.setPositions(positions, motion.matches);
    const a = $('#quest-mission-plug-a').value, b = $('#quest-mission-plug-b').value;
    model?.setConnection(a && b && a !== b ? [a, b] : null); syncObservation(true);
  }
  function selectPart(part) {
    if (!active || session.finished) return; focusedPart = part;
    if (question().level === 0) answer(part.startsWith('rotor') ? 'rotor' : part);
    if (question().level === 5 && mission.phase === 'setup') {
      const control = part.startsWith('rotor-') ? $(`#quest-wheel-${part.slice(-1)}`) : part === 'wiring' ? $('#quest-mission-plug-a') : null;
      if (control) { control.focus({ preventScroll: true }); control.scrollIntoView({ block: 'nearest', behavior: 'instant' }); }
    }
  }
  const letterOptions = () => [...ALPHABET].map(char => { const option = document.createElement('option'); option.value = char; option.textContent = char; return option; });
  for (let i = 0; i < 3; i++) {
    const label = document.createElement('label'); label.innerHTML = `<span>${['I', 'II', 'III'][i]}</span>`;
    const select = document.createElement('select'); select.id = `quest-wheel-${i}`; select.setAttribute('aria-label', `${['慢轮 I', '中轮 II', '快轮 III'][i]} 的起点轮位`); select.replaceChildren(...letterOptions()); label.append(select); $('#quest-mission-wheels').append(label);
    on(select, 'change', syncSetupFromControls);
  }
  for (const id of ['#quest-mission-plug-a', '#quest-mission-plug-b']) {
    const empty = document.createElement('option'); empty.value = ''; empty.textContent = '—'; $(id).replaceChildren(empty, ...letterOptions()); on($(id), 'change', syncSetupFromControls);
  }
  on($('#quest-mission-form'), 'submit', event => {
    event.preventDefault(); if (!active || question().level !== 5) return;
    const pair = [$('#quest-mission-plug-a').value, $('#quest-mission-plug-b').value], result = prepareMission(question(), mission, positions, pair);
    mission = result.state; $('#quest-setup-feedback').hidden = false; $('#quest-setup-feedback').textContent = result.message;
    if (result.ok) { syncMission(); syncObservation(true); $('#quest-observe').focus({ preventScroll: true }); moveToModel(); }
    announce(result.message);
  });
  on($('#quest-mission-reset'), 'click', () => {
    mission = createMissionState(); resetObservation(); positions = [0, 0, 0]; model?.setPositions(positions, true); model?.setConnection(null);
    session = { ...session, selected: null }; renderOptions(); $('#quest-feedback').hidden = true;
    for (let i = 0; i < 3; i++) $(`#quest-wheel-${i}`).value = 'A'; $('#quest-mission-plug-a').value = $('#quest-mission-plug-b').value = '';
    $('#quest-setup-feedback').hidden = true; syncMission(); syncObservation(true); $('#quest-wheel-0').focus({ preventScroll: true }); $('#quest-mission-form').scrollIntoView({ block: 'nearest', behavior: 'instant' });
  });
  on($('#quest-options'), 'click', event => { const button = event.target.closest('[data-quest-answer]'); if (button) answer(button.dataset.questAnswer); });
  on($('#quest-labels'), 'click', event => { const button = event.target.closest('[data-quest-part]'); if (button) selectPart(button.dataset.questPart); });
  on($('#quest-go-observe'), 'click', () => { $('#quest-canvas').focus({ preventScroll: true }); moveToModel(); });
  on($('#quest-return-task'), 'click', () => { $('#quest-question').focus({ preventScroll: true }); $('#quest-question').scrollIntoView({ block: 'start', behavior: motion.matches ? 'instant' : 'smooth' }); });
  on($('#quest-observe'), 'click', observe); on($('#quest-step'), 'click', step); on($('#quest-next'), 'click', nextQuestion);
  on($('#quest-new-round'), 'click', () => startNewRound({ focus: true })); on($('#quest-play-again'), 'click', () => startNewRound({ focus: true }));
  on($('#quest-spread'), 'click', () => { spread = !spread; $('#quest-spread').setAttribute('aria-pressed', String(spread)); model?.setSpread(spread ? 1 : 0); follow = true; frameCamera(); });
  for (const [id, direction] of [['#quest-zoom-in', 1], ['#quest-zoom-out', -1]]) on($(id), 'click', () => { follow = false; stage?.zoom(direction); });
  on($('#quest-camera-home'), 'click', () => { follow = true; frameCamera(); });
  on($('#quest-canvas'), 'keydown', event => { if (event.key === ' ') { event.preventDefault(); observe(); } if (event.key === 'ArrowRight') { event.preventDefault(); step(); } });
  on(motion, 'change', () => { playing = false; if (trace) signalProgress = target; if (stage) stage.controls.enableDamping = !motion.matches; model?.setPositions(positions, true); syncObservation(true); frameCamera(true); });

  progress(45, '抽取六关任务，组合字母与接线');
  // Build controls and content before preparing WebGL, preserving the activity
  // even on a device with no available graphics context.
  startNewRound();
  progress(56, '准备可旋转的鼓轮与接线模型');
  try {
    stage = createStage($('#quest-canvas'), $('#quest-viewer')); model = createLabModel(); stage.scene.add(model.root);
    stage.controls.enableDamping = !motion.matches; on(stage.controls, 'start', () => { follow = false; });
    model.setTopic(question().topic); model.setConnection(question().pairs[0] ?? null); model.setPositions(positions, true); frameCamera(true);
    progress(78, '预热三维材质与教学亮线'); await stage.renderer.compileAsync(stage.scene, stage.camera); stage.update(0, true);
  } catch (error) {
    model?.dispose(); stage?.dispose(); stage = model = null; $('#quest-model-error').hidden = false; $('#quest-labels').hidden = true;
    ['#quest-zoom-in', '#quest-zoom-out', '#quest-camera-home'].forEach(id => { $(id).disabled = true; }); console.warn('Challenge model unavailable:', error);
  }
  $('#quest-spread').disabled = !model || question().topic === 'wiring';
  let down = null; const pointer = new THREE.Vector2(), raycaster = new THREE.Raycaster();
  on($('#quest-canvas'), 'pointerdown', event => { down = { x: event.clientX, y: event.clientY }; });
  on($('#quest-canvas'), 'pointercancel', () => { down = null; });
  on($('#quest-canvas'), 'pointerup', event => {
    if (!down || !active || !stage || !model || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5) { down = null; return; } down = null;
    const rect = $('#quest-canvas').getBoundingClientRect(); pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
    raycaster.setFromCamera(pointer, stage.camera); const picked = model.pick(raycaster.intersectObjects(model.pickables.filter(p => p.visible), true)[0]);
    if (picked) selectPart(picked.kind === 'rotor' ? `rotor-${picked.index}` : picked.kind);
  });
  on($('#quest-canvas'), 'webglcontextlost', event => { event.preventDefault(); contextLost = true; $('#quest-model-error').hidden = false; });
  on($('#quest-canvas'), 'webglcontextrestored', () => { contextLost = false; $('#quest-model-error').hidden = true; });
  function frame(now) {
    if (disposed) return; const dt = Math.min((now - previous) / 1000, .05); previous = now;
    if (active && !document.hidden) {
      if (playing) { signalProgress = Math.min(target, signalProgress + dt * 3); if (signalProgress >= target) playing = false; syncObservation(); }
      if (stage && model && !contextLost) {
        model.update(dt, signalProgress, motion.matches); if (follow) frameCamera(); stage.update(dt, motion.matches);
        container.querySelectorAll('[data-quest-part]').forEach(label => {
          const part = label.dataset.questPart, point = part === 'reflector' ? new THREE.Vector3(-5.05, 5.15, .3) : model.getAnchor(part === 'wiring' ? 'board' : 'rotor', Number(part.slice(-1)));
          point.project(stage.camera); label.hidden = question().topic === 'wiring' && part !== 'wiring' || Math.abs(point.x) > .96 || Math.abs(point.y) > .9 || point.z < -1 || point.z > 1;
          label.style.left = `${(point.x * .5 + .5) * $('#quest-viewer').clientWidth}px`; label.style.top = `${(.5 - point.y * .5) * $('#quest-viewer').clientHeight}px`;
          label.classList.toggle('is-focus', part === focusedPart || focusedPart === 'rotor' && part.startsWith('rotor'));
        });
      }
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  window.__BOMBE_QUEST__ = () => ({ active, seed: session.round.seed, level: session.index + 1, completed: [...session.completed], attempts: [...session.attempts], correct: session.correct, finished: session.finished, signatures: session.round.questions.map(q => q.signature), positions: [...positions], progress: signalProgress, playing, mission: { phase: mission.phase, cursor: mission.cursor }, ready: Boolean(stage && model), reducedMotion: motion.matches, contextLost, calls: stage?.renderer.info.render.calls, triangles: stage?.renderer.info.render.triangles, geometries: stage?.renderer.info.memory.geometries, textures: stage?.renderer.info.memory.textures });
  return {
    startNewRound,
    setActive(value) { active = value; if (!value) playing = false; if (value && stage) { stage.resize(); follow = true; frameCamera(true); } if (session) syncObservation(true); },
    dispose() { if (disposed) return; disposed = true; cancelAnimationFrame(raf); cleanups.forEach(remove => remove()); model?.dispose(); stage?.dispose(); delete window.__BOMBE_QUEST__; },
  };
}
