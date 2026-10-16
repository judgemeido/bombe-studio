import * as THREE from 'three';
import { createProduct, PARTS } from './model.js';
import { createStage } from './scene.js';
import { createTextures } from './textures.js';
import { NOTES } from './notes.js';
import { createNavigation } from './navigation.js';

const $ = selector => document.querySelector(selector);
const canvas = $('#scene'), viewer = $('#viewer'), status = $('#status');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const state = { target: 0, progress: 0, running: false, selected: null, focus: null, view: 'three-quarter', follow: true };
const cleanups = [];
function on(el, type, fn, options) { el.addEventListener(type, fn, options); cleanups.push(() => el.removeEventListener(type, fn, options)); }
const announce = message => { status.textContent = message; };
const mobileDetail = document.createElement('div'); mobileDetail.className = 'mobile-detail';
const mobileNote = document.createElement('button'); mobileNote.className = 'part-card note-trigger'; mobileNote.setAttribute('aria-haspopup', 'dialog'); mobileNote.setAttribute('aria-controls', 'note-dialog');
mobileDetail.append(mobileNote); $('.parts-section').after(mobileDetail);
let stage, product, stopped = false, raf = 0, previous = performance.now(), contextLost = false;
let currentPage = 'exhibit', lab = null, labModule = null, navigation;

function recordFor(id) { return id ? { ...PARTS.find(p => p.id === id), ...NOTES[id] } : NOTES.overview; }
function updateNotes() {
  const record = recordFor(state.selected);
  $('#part-name').textContent = record.name; $('#part-english').textContent = state.selected ? record.english : 'START EXPLORING';
  $('#part-number').textContent = record.index; $('#part-description').textContent = record.subtitle;
  $('#part-swatch').style.background = record.color || '#9aab91';
  mobileNote.innerHTML = $('#note-open').innerHTML.replace(/ id="[^"]+"/g, '');
  const dialog = $('#note-dialog'); dialog.style.setProperty('--part-color', record.color || '#506052');
  $('#note-index').textContent = record.index + ' / 05'; $('#note-title').textContent = record.name;
  $('#note-english').textContent = record.english; $('#note-subtitle').textContent = record.subtitle;
  $('#note-description').textContent = record.description;
  for (const [selector, values] of [['#note-components', record.components], ['#note-steps', record.steps]]) {
    $(selector).replaceChildren(...values.map(text => { const li = document.createElement('li'); li.textContent = text; return li; }));
  }
  $('#note-relationship').textContent = record.relationship;
  $('#note-limit').textContent = record.note || '本展品为教学性结构重建，拆分与运动路径服务于观察，不作为真实拆装指南。';
  $('#note-focus').innerHTML = `${state.selected ? '在模型中查看' : '开始拆解探索'} <svg><use href="#arrow"/></svg>`;
  const teachable = state.selected === 'drums' || state.selected === 'board';
  $('#note-lab').hidden = !teachable;
  $('#note-lab').dataset.topic = state.selected === 'board' ? 'wiring' : 'drums';
  $('#note-lab').href = state.selected === 'board' ? '#/lab/wiring' : '#/lab/drums';
  $('#note-lab-label').textContent = state.selected === 'board' ? '进入接线实验' : '进入鼓轮实验';
}
function frameCamera(immediate = motion.matches) {
  if (!stage || !product) return;
  const focus = state.focus;
  stage.frameBounds(product.getBounds(focus), state.view, state.progress, Boolean(focus), immediate);
}
function selectPart(id, navigate = true) {
  const record = id ? PARTS.find(p => p.id === id) : null; if (id && !record) return;
  state.selected = id;
  if (navigate || !id) {
    state.focus = id && state.target > .01 ? id : null;
    state.follow = true; state.view = id === 'board' && state.target === 0 ? 'back' : 'three-quarter';
  }
  $('#hotspot').hidden = !record || !product; $('#clear-selection').hidden = !record;
  if (record) {
    $('#hotspot-number').textContent = record.index; $('#hotspot-label').textContent = record.name;
    $('#hotspot').setAttribute('aria-label', `展开${record.name}结构笔记`);
  }
  document.querySelectorAll('[data-part]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.part === id)));
  updateNotes(); sync();
  if (navigate || !id) frameCamera();
  announce(record ? `已选择${record.name}，点击结构笔记查看详情。` : '已取消选择，所有部件标记已隐藏。');
}
function sync() {
  const percent = Math.round(state.target * 100), exploded = percent > 0;
  $('#explode-range').value = percent; $('#explode-output').value = String(percent).padStart(3, '0') + '%';
  $('#explode-range').style.setProperty('--range-progress', `${percent}%`);
  $('#explode-range').setAttribute('aria-valuetext', `${exploded ? '拆解程度' : '完整装配'}，${percent}%`);
  $('#explode').setAttribute('aria-pressed', String(exploded)); $('#explode-label').textContent = exploded ? '合拢机器' : '拆解机器';
  $('#run').setAttribute('aria-pressed', String(state.running)); $('#run-label').textContent = motion.matches ? '转动一步' : state.running ? '暂停演示' : '运转演示';
  $('#view-label').textContent = state.focus && exploded ? '部件特写' : exploded ? '分件总览' : '装配视图';
  $('#simulation').hidden = !state.running && !(motion.matches && product?.phase > 0);
  $('#overview').setAttribute('aria-pressed', String(!state.focus && exploded));
  document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === state.view)));
  if (stage) stage.controls.enableDamping = !motion.matches;
}
function setExplode(value) {
  state.target = THREE.MathUtils.clamp(Number(value) || 0, 0, 1); state.focus = null; state.follow = true; sync();
  if (motion.matches && product && stage) { state.progress = state.target; product.setExplode(state.progress); frameCamera(true); }
}
function setView(view) { state.view = view; state.follow = true; frameCamera(); sync(); }
function overview() { state.focus = null; state.view = 'three-quarter'; state.follow = true; frameCamera(); sync(); }
function readout() {
  if (product) $('#rotor-readout').textContent = [1, 26, 676].map(d => String.fromCharCode(65 + Math.floor(product.phase / d / (Math.PI * 2) * 26) % 26)).join(' ');
}
function run() {
  if (!product) return;
  if (motion.matches) { for (let i = 0; i < 10; i++) product.update(.1, true); state.running = false; readout(); announce('鼓轮已转动一步。'); }
  else { state.running = !state.running; announce(state.running ? '鼓轮示意运转已开始，此动画不执行密码运算。' : '运转演示已暂停。'); }
  sync();
}
function reset() {
  Object.assign(state, { target: 0, running: false, focus: null, view: 'three-quarter', follow: true });
  product?.resetMotion(); selectPart(null, false); setExplode(0); readout(); announce('已恢复完整装配，部件标记已隐藏。');
}
function openNote() { updateNotes(); $('#note-dialog').showModal(); $('#note-dialog').scrollTop = 0; }
for (const [button, dialog] of [['#archive-open', '#archive-dialog'], ['#story-open', '#archive-dialog'], ['#help-open', '#help-dialog']]) on($(button), 'click', () => $(dialog).showModal());
document.querySelectorAll('dialog').forEach(dialog => {
  on(dialog.querySelector('[data-close]'), 'click', () => dialog.close());
  on(dialog, 'click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
});
on($('#note-open'), 'click', openNote); on(mobileNote, 'click', openNote); on($('#hotspot'), 'click', openNote);
on($('#note-focus'), 'click', () => { $('#note-dialog').close(); if (state.selected) { if (state.target === 0) setExplode(1); selectPart(state.selected); } else setExplode(1); canvas.scrollIntoView({ block: 'center', behavior: motion.matches ? 'instant' : 'smooth' }); });
document.querySelectorAll('[data-part]').forEach(button => on(button, 'click', () => selectPart(state.selected === button.dataset.part ? null : button.dataset.part)));
document.querySelectorAll('[data-view]').forEach(button => on(button, 'click', () => setView(button.dataset.view)));
on($('#overview'), 'click', overview); on($('#clear-selection'), 'click', () => selectPart(null));
on($('#explode'), 'click', () => { setExplode(state.target > 0 ? 0 : 1); announce(state.target ? '正在按顺序抽离并分区展示五个系统。' : '正在按原路径合拢机器。'); });
on($('#explode-range'), 'input', event => setExplode(Number(event.target.value) / 100));
on($('#run'), 'click', run); on($('#reset'), 'click', reset);
for (const [id, direction] of [['#zoom-in', 1], ['#zoom-out', -1]]) on($(id), 'click', () => { state.follow = false; stage?.zoom(direction); });
on(window, 'keydown', event => {
  if (currentPage !== 'exhibit' || navigation?.busy) return;
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || document.querySelector('dialog[open]') || event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
  if (event.key === ' ' && event.target.closest('button,a')) return;
  const action = { e: () => setExplode(state.target > 0 ? 0 : 1), r: reset, ' ': run, escape: () => selectPart(null) }[event.key.toLowerCase()];
  if (action) { event.preventDefault(); action(); }
});
on(motion, 'change', () => { state.running = false; setExplode(state.target); sync(); announce('已应用系统动态效果偏好。'); });

try {
  stage = createStage(canvas, viewer); product = createProduct({ textures: createTextures() }); stage.scene.add(product.root);
  on(stage.controls, 'start', () => { state.follow = false; });
  $('#loading').hidden = true; frameCamera(true); sync();
  announce('展品已就绪。点击目录或模型时，才会显示部件标记。');
} catch (error) {
  $('#loading').hidden = true; $('#error-state').hidden = false; $('#hotspot').hidden = true;
  stage?.dispose(); stage = null; product?.dispose(); product = null;
  ['#explode', '#explode-range', '#run', '#zoom-in', '#zoom-out', '#reset', '#overview'].forEach(s => $(s).disabled = true);
  document.querySelectorAll('[data-view]').forEach(b => b.disabled = true);
  announce('三维场景暂不可用，可继续阅读结构笔记与展品档案。'); console.error(error);
}
const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(); let down = null;
on(canvas, 'pointerdown', event => { down = { x: event.clientX, y: event.clientY }; });
on(canvas, 'pointercancel', () => { down = null; });
on(canvas, 'pointerup', event => {
  if (!down || !stage || !product || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5) { down = null; return; }
  down = null; const r = canvas.getBoundingClientRect(); pointer.set((event.clientX - r.left) / r.width * 2 - 1, -(event.clientY - r.top) / r.height * 2 + 1);
  raycaster.setFromCamera(pointer, stage.camera); const hit = raycaster.intersectObjects(product.parts.filter(part => part.visible), true)[0];
  if (!hit) { selectPart(null, false); return; }
  let parent = hit.object; while (parent && !parent.userData.partId) parent = parent.parent;
  if (parent) selectPart(parent.userData.partId, false);
});
on(canvas, 'webglcontextlost', event => { event.preventDefault(); contextLost = true; $('#error-state').hidden = false; $('#error-state h3').textContent = '三维画面已暂停'; $('#error-state p').textContent = '正在等待图形上下文恢复，你仍可阅读展品档案。'; announce('三维画面暂时中断。'); });
on(canvas, 'webglcontextrestored', () => { contextLost = false; $('#error-state').hidden = true; announce('三维画面已恢复。'); });

function frame(now) {
  if (stopped) return;
  const dt = Math.min((now - previous) / 1000, .05); previous = now;
  if (currentPage === 'exhibit' && !navigation?.busy && stage && product && !contextLost && !document.hidden) {
    state.progress = motion.matches ? state.target : state.progress + (state.target - state.progress) * (1 - Math.exp(-4.5 * dt));
    if (Math.abs(state.progress - state.target) < .0001) state.progress = state.target;
    product.setExplode(state.progress); product.setFocus(state.focus);
    if (state.follow) frameCamera();
    product.update(dt, state.running && !motion.matches); readout(); stage.update(dt, motion.matches);
    const p = state.progress;
    $('#assembly-progress').hidden = p === 0 || Boolean(state.focus);
    $('#assembly-step').textContent = p < .28 ? '01' : p < .62 ? '02' : p < .999 ? '03' : '✓';
    $('#assembly-caption').textContent = p < .28 ? '前后抽离 · 释放安装空间' : p < .62 ? '依次取出 · 保留安全间距' : p < .999 ? '独立分区 · 在空位中翻面' : '五系统独立陈列 · 点击目录进入特写';
    if (state.selected && !$('#hotspot').hidden) {
      const anchor = product.getAnchor(state.selected).project(stage.camera), width = viewer.clientWidth, height = viewer.clientHeight;
      const visible = anchor.z > -1 && anchor.z < 1 && Math.abs(anchor.x) < .94 && Math.abs(anchor.y) < .92;
      $('#hotspot').style.left = `${Math.max(8, Math.min(width - 150, (anchor.x * .5 + .5) * width))}px`;
      $('#hotspot').style.top = `${Math.max(74, Math.min(height - 78, (-anchor.y * .5 + .5) * height))}px`;
      $('#hotspot').classList.toggle('is-visible', visible); $('#hotspot').inert = !visible;
    }
  }
  raf = requestAnimationFrame(frame);
}
function dispose() { if (stopped) return; stopped = true; cancelAnimationFrame(raf); navigation?.dispose(); lab?.dispose(); cleanups.forEach(fn => fn()); product?.dispose(); stage?.dispose(); delete window.__BOMBE_INSPECT__; }
on(window, 'pagehide', event => { if (!event.persisted) dispose(); });
window.__BOMBE_INSPECT__ = () => ({ ...state, page: currentPage, navigating: navigation?.busy || false, phase: product?.phase, drums: product?.drumCount, reducedMotion: motion.matches, calls: stage?.renderer.info.render.calls, triangles: stage?.renderer.info.render.triangles, geometries: stage?.renderer.info.memory.geometries, textures: stage?.renderer.info.memory.textures, camera: stage?.camera.position.toArray(), cameraTarget: stage?.controls.target.toArray(), ready: Boolean(stage && product), contextLost });
updateNotes(); sync(); raf = requestAnimationFrame(frame);
navigation = createNavigation({
  motion,
  pause() { lab?.setActive(false); $('#exhibit-page').inert = $('#lab-page').inert = true; },
  async prepare(route, report) {
    if (route.page === 'lab') {
      report(26, '载入可运行的信号回路'); labModule ||= import('./lab.js');
      let module; try { module = await labModule; } catch (error) { labModule = null; throw error; }
      $('#exhibit-page').hidden = true; $('#lab-page').hidden = false;
      if (!lab) lab = await module.createLab($('#lab-page'), { motion, progress: report });
      else report(78, '恢复教学模型与实验记录');
      lab.setTopic(route.topic); lab.setActive(true);
    } else {
      report(52, '恢复展品与拆解状态'); $('#exhibit-page').hidden = false; $('#lab-page').hidden = true;
      stage?.resize(); frameCamera(true); report(78, '准备整机视角');
    }
  },
  activate(route) {
    currentPage = route.page; $('#exhibit-page').hidden = route.page !== 'exhibit'; $('#lab-page').hidden = route.page !== 'lab';
    $('#exhibit-page').inert = route.page !== 'exhibit'; $('#lab-page').inert = route.page !== 'lab';
    $('#archive-open').hidden = route.page === 'lab'; document.body.dataset.page = route.page;
    lab?.setActive(route.page === 'lab');
  },
});
