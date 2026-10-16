import * as THREE from 'three';
import { createStage } from './scene.js';
import { createLabModel } from './lab-model.js';
import { ALPHABET, ROTORS, letter, pressKey, traceLetter } from './cipher.js';

import template from './lab-template.js';

export async function createLab(container, { motion, progress }) {
  container.innerHTML = template;
  const $ = selector => container.querySelector(selector), cleanups = [];
  const state = { topic: 'drums', positions: [0, 0, 0], pairs: [], trace: null, progress: -1, playing: false, history: [], exercise: false, follow: true };
  let active = false, disposed = false, stage = null, model = null, raf, previous = performance.now(), visibleStage = -2, contextLost = false, pendingPort = null;
  const on = (el, name, handler, options) => { el.addEventListener(name, handler, options); cleanups.push(() => el.removeEventListener(name, handler, options)); };
  const announce = value => { $('#lab-status').textContent = value; };
  function openDialog(dialog) { state.playing = false; syncProgress(); dialog.showModal(); }
  function openSettings(index) {
    if (!$('#lab-settings').open) openDialog($('#lab-settings'));
    if (Number.isInteger(index)) $(`#lab-position-${index}`).focus({ preventScroll: true });
  }
  on($('#lab-settings-open'), 'click', () => openSettings());
  on($('#lab-guide-open'), 'click', () => openDialog($('#lab-guide')));
  on($('#lab-history-open'), 'click', () => openDialog($('#lab-records')));
  container.querySelectorAll('dialog').forEach(dialog => {
    dialog.querySelectorAll('[data-lab-close]').forEach(button => on(button, 'click', () => dialog.close()));
    on(dialog, 'click', event => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
    });
  });
  container.querySelectorAll('[data-guide-tab]').forEach(button => on(button, 'click', () => {
    container.querySelectorAll('[data-guide-tab]').forEach(tab => tab.setAttribute('aria-pressed', String(tab === button)));
    container.querySelectorAll('[data-guide-panel]').forEach(panel => { panel.hidden = panel.dataset.guidePanel !== button.dataset.guideTab; });
  }));
  const options = () => [...ALPHABET].map(char => { const item = document.createElement('option'); item.value = char; item.textContent = char; return item; });
  for (const id of ['#lab-plug-a', '#lab-plug-b']) $(id).replaceChildren(...options()); $('#lab-plug-b').value = 'B';
  ROTORS.forEach((rotor, i) => {
    const label = document.createElement('label'); label.innerHTML = `<span>${rotor.name} <small>${['慢轮', '中轮', '快轮'][i]}</small></span>`;
    const select = document.createElement('select'); select.id = `lab-position-${i}`; select.setAttribute('aria-label', `鼓轮 ${rotor.name} 轮位`); select.replaceChildren(...options()); label.append(select); $('#lab-position-controls').append(label);
    on(select, 'change', () => { state.positions[i] = ALPHABET.indexOf(select.value); invalidate('轮位已调整，按一个字母重新实验。'); });
  });
  for (const char of ALPHABET) {
    const button = document.createElement('button'); button.textContent = char; button.setAttribute('aria-label', `按下字母 ${char}`); button.dataset.letter = char; $('#lab-keyboard').append(button); on(button, 'click', () => input(char));
  }
  function frameCamera(immediate = motion.matches) { if (stage && model) stage.frameBounds(model.getBounds(), 'front', 0, true, immediate); }
  function configure() {
    for (let i = 0; i < 3; i++) $(`#lab-position-${i}`).value = letter(state.positions[i]);
    $('#lab-current-position').textContent = '轮位 ' + state.positions.map(letter).join(' · ');
    $('#lab-disconnect').hidden = state.pairs.length === 0;
    $('#lab-wire-status').textContent = state.pairs.length ? `已接入 ${state.pairs[0].join(' ↔ ')} · 双向互换` : '未接线 · 所有字母原样通过';
    $('#lab-setting-summary').textContent = `${state.positions.map(letter).join('')} · ${state.pairs.length ? state.pairs[0].join('↔') : '无接线'}`;
    $('#lab-keyboard [data-letter="A"]').classList.toggle('is-suggested', !state.trace);
    model?.setPositions(state.positions, motion.matches);
  }
  function syncTrace() {
    const names = ['接线进入', '鼓轮 III', '鼓轮 II', '鼓轮 I', '反射器 B', '鼓轮 I', '鼓轮 II', '鼓轮 III', '接线输出'];
    $('#lab-trace-stages').replaceChildren(...names.map((name, i) => {
      const button = document.createElement('button'), pass = state.trace?.stages[i]; button.dataset.traceStage = i; button.disabled = !pass;
      button.setAttribute('aria-label', `第 ${i + 1} 段，${name}${pass ? '，' + letter(pass.input) + ' 到 ' + letter(pass.output) : ''}`);
      button.innerHTML = `<span>${String(i + 1).padStart(2, '0')} <i>${i < 4 ? '去程' : i === 4 ? '折返' : '返回'}</i></span><b>${name}</b><strong>${pass ? letter(pass.input) + ' → ' + letter(pass.output) : '—'}</strong>`;
      return button;
    }));
    $('#lab-input').textContent = state.trace?.input || '—'; $('#lab-output').textContent = '—';
    $('#lab-play').disabled = $('#lab-step').disabled = $('#lab-verify').disabled = !state.trace;
    $('#lab-history-input').textContent = state.history.map(r => r.input).join(' ') || '—';
    $('#lab-history-output').textContent = state.history.map(r => r.output).join(' ') || '—';
    $('#lab-verification').hidden = true; visibleStage = -2; syncProgress();
  }
  function syncProgress() {
    const current = state.trace ? Math.min(8, Math.max(0, Math.ceil(state.progress) - 1)) : -1, finished = state.progress >= 9;
    $('#lab-play').textContent = state.playing ? '暂停信号' : finished ? '重播信号' : '播放信号';
    $('#lab-play').setAttribute('aria-pressed', String(state.playing));
    $('#lab-signal-progress').value = Math.max(0, state.progress);
    $('#lab-output').textContent = finished ? state.trace.output : '—';
    $('#lab-result-state').textContent = !state.trace ? '按 A，开始实验' : finished ? '回路完成' : state.playing ? '信号经过中' : '逐段观察';
    if (visibleStage === current) return; visibleStage = current;
    $('#lab-trace-stages').querySelectorAll('button').forEach((button, i) => { button.classList.toggle('is-current', i === current); button.classList.toggle('is-complete', i < current); button.setAttribute('aria-pressed', String(i === current)); });
    $('#lab-stage-number').textContent = current < 0 ? '—' : String(current + 1).padStart(2, '0');
    const anchor = current < 0 ? null : state.trace.stages[current].rotor ?? (current === 4 ? 'reflector' : 'board');
    container.querySelectorAll('[data-lab-anchor]').forEach(label => label.classList.toggle('is-signal-focus', anchor !== null && label.dataset.labAnchor === String(anchor)));
    if (current < 0) { $('#lab-stage-description').textContent = '按下一个字母，观察信号如何往返。'; return; }
    const pass = state.trace.stages[current], pair = `${letter(pass.input)} → ${letter(pass.output)}`;
    const explanation = pass.id.startsWith('plug') ? pass.input === pass.output ? '这个字母没有连接跳线，保持原样通过。' : '跳线交换这一对字母，反向进入也会成对交换。' : pass.id === 'reflector' ? '反射器将信号送回，接下来按相反方向通过三只鼓轮。' : `在轮位 ${letter(state.positions[pass.rotor])}，沿${pass.reverse ? '反向' : '正向'}内部接线找到另一个触点。`;
    $('#lab-stage-description').textContent = `${pass.name}：${pair}。${explanation}`;
  }
  function invalidate(message) {
    state.trace = null; state.progress = -1; state.playing = false; state.history = []; state.exercise = false; pendingPort = null;
    $('#lab-keyboard').querySelectorAll('button').forEach(button => button.classList.remove('is-key-active'));
    $('#lab-quick-note').textContent = '按键先转位，回放不转位。'; $('#lab-quick-note').classList.remove('is-task-active');
    model?.setTrace(null); configure(); syncTrace(); announce(message);
  }
  function input(char) {
    const result = pressKey(char, state.positions, state.pairs); state.positions = result.positions; state.trace = result;
    state.progress = motion.matches ? 9 : -.65; state.playing = !motion.matches;
    state.history.push({ input: char, output: result.output }); state.history = state.history.slice(-24);
    model?.setTrace(result); configure(); syncTrace();
    $('#lab-keyboard').querySelectorAll('button').forEach(button => button.classList.toggle('is-key-active', button.dataset.letter === char));
    if (state.exercise) {
      const first = state.history.slice(0, 2);
      $('#lab-exercise-result').textContent = first.some(r => r.input !== 'A') ? '这次按了其他字母。重新准备后，连续按两次 A 再比较。' : first.length === 1 ? `第一次 A → ${first[0].output}，快轮转到 B。再按一次 A。` : `观察完成：A → ${first[0].output}，A → ${first[1].output}。快轮从 B 转到 C，电路映射随之改变。`;
      $('#lab-quick-note').textContent = first.some(r => r.input !== 'A') ? '请从教学指南重新准备，连续按两次 A。' : first.length === 1 ? `A → ${first[0].output}。再按一次 A，比较输出。` : `A → ${first[0].output}，A → ${first[1].output}。轮位改变了映射。`;
    }
    announce(`输入 ${char}，轮位变为 ${state.positions.map(letter).join('')}。${motion.matches ? '输出 ' + result.output : '信号演示开始。'}`);
  }
  function play() {
    if (!state.trace) return;
    if (motion.matches) { state.progress = 9; state.playing = false; }
    else { if (state.progress >= 9) state.progress = 0; state.playing = !state.playing; }
    syncProgress();
  }
  function step() { if (!state.trace) return; state.playing = false; state.progress = Math.min(9, Math.max(0, Math.floor(state.progress)) + 1); syncProgress(); }
  function connect(a, b) {
    if (a === b) { $('#lab-wire-status').textContent = '请选择两个不同的字母端点。'; return; }
    state.pairs = [[a, b]]; $('#lab-plug-a').value = a; $('#lab-plug-b').value = b; model?.setConnection(state.pairs[0]); invalidate(`已接入 ${a} 与 ${b}。`);
    if (state.topic === 'wiring') $('#lab-view-hint').textContent = `${a} ↔ ${b} 已接入 · 点击两个插孔可更换`;
  }
  function reset() {
    state.positions = [0, 0, 0]; state.pairs = []; $('#lab-plug-a').value = 'A'; $('#lab-plug-b').value = 'B';
    model?.setConnection(null); model?.setPositions(state.positions, true); model?.setSpread(0); $('#lab-spread').value = 0; $('#lab-spread-value').textContent = '0%';
    $('#lab-spread').style.setProperty('--range-progress', '0%');
    $('#lab-view-hint').textContent = state.topic === 'wiring' ? '点击两个插孔接线 · 端点菜单在“轮位与接线”中' : '拖动观察 · 点击鼓轮调整轮位';
    invalidate('已复位至 AAA，无接线。');
    $('#lab-exercise-result').textContent = '目标：记录 A → ?，再记录 A → ?。'; state.follow = true; frameCamera();
  }
  function verify() {
    if (!state.trace) return;
    const inverse = traceLetter(state.trace.output, state.positions, state.pairs);
    $('#lab-verification').hidden = false;
    $('#lab-verification').textContent = `当前轮位 ${state.positions.map(letter).join('')}：${state.trace.input} → ${state.trace.output}，${state.trace.output} → ${inverse.output}。互易验证${inverse.output === state.trace.input ? '成立' : '未成立'}。此验证保持轮位不变；再次按键会先转位。`;
  }
  on($('#lab-play'), 'click', play); on($('#lab-step'), 'click', step); on($('#lab-reset'), 'click', reset);
  on($('#lab-connect'), 'click', () => connect($('#lab-plug-a').value, $('#lab-plug-b').value));
  on($('#lab-disconnect'), 'click', () => { state.pairs = []; model?.setConnection(null); invalidate('接线已拔下。'); if (state.topic === 'wiring') $('#lab-view-hint').textContent = '点击两个插孔接线 · 端点菜单在“轮位与接线”中'; });
  on($('#lab-trace-stages'), 'click', event => { const button = event.target.closest('[data-trace-stage]'); if (!button || !state.trace) return; state.playing = false; state.progress = Number(button.dataset.traceStage) + 1; syncProgress(); });
  on($('#lab-verify'), 'click', verify);
  on($('#lab-exercise-start'), 'click', () => {
    reset(); state.exercise = true; $('#lab-exercise-result').textContent = '已准备：轮位 AAA，无接线。请连续按两次 A。';
    $('#lab-quick-note').textContent = '已准备 AAA。连续按两次 A，比较输出。'; $('#lab-quick-note').classList.add('is-task-active');
    $('#lab-guide').close(); $('#lab-keyboard [data-letter="A"]').focus({ preventScroll: true });
  });
  container.querySelectorAll('[data-answer]').forEach(button => on(button, 'click', () => { const correct = button.dataset.answer === 'A'; container.querySelectorAll('[data-answer]').forEach(b => b.setAttribute('aria-pressed', String(b === button))); $('#lab-quiz-result').textContent = correct ? '正确。A ↔ B 是双向交换，从 B 进入就从 A 离开。' : '再试一次：一根跳线连接两个端点，进入其中一个，就从另一个离开。'; }));
  on($('#lab-spread'), 'input', event => { model?.setSpread(Number(event.target.value) / 100); $('#lab-spread-value').textContent = event.target.value + '%'; $('#lab-spread').style.setProperty('--range-progress', event.target.value + '%'); $('#lab-view-hint').textContent = Number(event.target.value) > 0 ? '端面已抽出 · 拖动到侧面观察固定触点' : '拖动观察 · 点击鼓轮调整轮位'; state.follow = true; frameCamera(); });
  for (const [selector, direction] of [['#lab-zoom-in', 1], ['#lab-zoom-out', -1]]) on($(selector), 'click', () => { state.follow = false; stage?.zoom(direction); });
  on($('#lab-home'), 'click', () => { state.follow = true; frameCamera(); });
  on(window, 'keydown', event => {
    if (!active || document.body.hasAttribute('aria-busy') || container.querySelector('dialog[open]') || event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.target.closest('button,a,input,select,textarea,[contenteditable]')) return;
    if (/^[a-z]$/i.test(event.key)) { event.preventDefault(); input(event.key.toUpperCase()); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); step(); }
    else if (event.key === ' ') { event.preventDefault(); play(); }
  });
  on(motion, 'change', () => { state.playing = false; if (state.trace) state.progress = 9; if (stage) stage.controls.enableDamping = !motion.matches; configure(); syncProgress(); frameCamera(true); });
  progress(52, '构建鼓轮触点与接线');
  try {
    stage = createStage($('#lab-canvas'), $('#lab-viewer')); model = createLabModel(); stage.scene.add(model.root);
    stage.controls.enableDamping = !motion.matches; on(stage.controls, 'start', () => { state.follow = false; });
    frameCamera(true); progress(78, '预热材质与光线');
    await stage.renderer.compileAsync(stage.scene, stage.camera); stage.update(0, true);
  } catch (error) {
    stage?.dispose(); model?.dispose(); stage = model = null; $('#lab-error').hidden = false;
    $('.lab-annotations').hidden = true;
    ['#lab-spread', '#lab-zoom-in', '#lab-zoom-out', '#lab-home'].forEach(selector => { $(selector).disabled = true; }); console.warn('Teaching model unavailable:', error);
  }
  let down = null; const pointer = new THREE.Vector2(), raycaster = new THREE.Raycaster();
  on($('#lab-canvas'), 'pointerdown', event => { down = { x: event.clientX, y: event.clientY }; });
  on($('#lab-canvas'), 'pointercancel', () => { down = null; });
  on($('#lab-canvas'), 'pointerup', event => {
    if (!down || !stage || !model || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5) { down = null; return; } down = null;
    const r = $('#lab-canvas').getBoundingClientRect(); pointer.set((event.clientX - r.left) / r.width * 2 - 1, 1 - (event.clientY - r.top) / r.height * 2);
    raycaster.setFromCamera(pointer, stage.camera); const hit = raycaster.intersectObjects(model.pickables.filter(p => p.visible), true)[0], picked = model.pick(hit);
    if (picked?.kind === 'rotor') { openSettings(picked.index); announce(`已定位鼓轮 ${ROTORS[picked.index].name} 的轮位设置。`); }
    if (picked?.kind === 'wiring' && picked.port !== null) {
      const char = letter(picked.port);
      if (pendingPort === null) { pendingPort = char; $('#lab-plug-a').value = char; $('#lab-wire-status').textContent = `已选择 ${char}，请再点一个不同触点。`; $('#lab-view-hint').textContent = `已选择 ${char} · 再点一个不同插孔完成接线`; }
      else if (pendingPort !== char) connect(pendingPort, char);
    }
  });
  on($('#lab-canvas'), 'webglcontextlost', event => { event.preventDefault(); contextLost = true; $('#lab-error').hidden = false; });
  on($('#lab-canvas'), 'webglcontextrestored', () => { contextLost = false; $('#lab-error').hidden = true; });
  function frame(now) {
    if (disposed) return; const dt = Math.min((now - previous) / 1000, .05); previous = now;
    if (active && !document.hidden) {
      if (state.playing) { state.progress = Math.min(9, state.progress + dt * 1.9); if (state.progress === 9) state.playing = false; }
      syncProgress();
      if (stage && model && !contextLost) {
        model.update(dt, state.progress, motion.matches); if (state.follow) frameCamera(); stage.update(dt, motion.matches);
        container.querySelectorAll('[data-lab-anchor]').forEach(label => {
          const kind = label.dataset.labAnchor;
          const point = kind === 'reflector' ? new THREE.Vector3(-5.05, 5.15, .3) : model.getAnchor(kind === 'board' ? 'board' : 'rotor', Number(kind));
          point.project(stage.camera); label.hidden = state.topic === 'wiring' && kind !== 'board' || Math.abs(point.x) > .96 || Math.abs(point.y) > .92;
          label.style.left = `${(point.x * .5 + .5) * $('#lab-viewer').clientWidth}px`; label.style.top = `${(.5 - point.y * .5) * $('#lab-viewer').clientHeight}px`;
        });
      }
    }
    raf = requestAnimationFrame(frame);
  }
  configure(); syncTrace(); raf = requestAnimationFrame(frame);
  window.__BOMBE_LAB__ = () => ({ active, topic: state.topic, positions: [...state.positions], pairs: state.pairs.map(p => [...p]), input: state.trace?.input || null, output: state.trace?.output || null, progress: state.progress, playing: state.playing, history: state.history.map(r => ({ ...r })), ready: Boolean(model && stage), reducedMotion: motion.matches, calls: stage?.renderer.info.render.calls, triangles: stage?.renderer.info.render.triangles, geometries: stage?.renderer.info.memory.geometries, textures: stage?.renderer.info.memory.textures, camera: stage?.camera.position.toArray(), contextLost });
  return {
    setActive(value) { active = value; if (value && stage) { stage.resize(); state.follow = true; frameCamera(true); } },
    setTopic(value) {
      state.topic = value === 'wiring' ? 'wiring' : 'drums'; model?.setTopic(state.topic);
      container.querySelectorAll('.lab-topic-tabs a').forEach(a => a.setAttribute('aria-current', String(a.dataset.topic === state.topic)));
      $('#lab-view-hint').textContent = state.topic === 'wiring' ? '点击两个插孔接线 · 端点菜单在“轮位与接线”中' : '拖动观察 · 点击鼓轮调整轮位';
      $('#lab-spread').disabled = state.topic === 'wiring' || !model; state.follow = true; stage?.resize(); frameCamera();
    },
    dispose() { disposed = true; cancelAnimationFrame(raf); cleanups.forEach(remove => remove()); model?.dispose(); stage?.dispose(); delete window.__BOMBE_LAB__; },
  };
}
