import * as THREE from 'three';
import { createProduct, PARTS } from './model.js';
import { createStage } from './scene.js';
import { createTextures } from './textures.js';

const $ = (selector) => document.querySelector(selector);
const canvas = $('#scene'), viewer = $('#viewer'), status = $('#status');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const state = { target: 0, progress: 0, running: false, selected: 'drums', view: 'three-quarter' };
const cleanups = [];
function on(el, type, fn, options) { el.addEventListener(type, fn, options); cleanups.push(() => el.removeEventListener(type, fn, options)); }
const announce = (message) => { status.textContent = message; };
const mobileDetail = document.createElement('div'); mobileDetail.className = 'mobile-detail';
$('.parts-section').after(mobileDetail);
let stage, product, stopped = false, raf = 0, previous = performance.now(), contextLost = false;

function selectPart(id, navigate = true) {
  const record = PARTS.find(p => p.id === id); if (!record) return;
  state.selected = id;
  $('#part-name').textContent = record.name; $('#part-english').textContent = record.english;
  $('#part-number').textContent = record.index; $('#part-description').textContent = record.description;
  $('#part-note').textContent = record.note; $('#part-swatch').style.background = record.color;
  $('#hotspot-number').textContent = record.index; $('#hotspot-label').textContent = record.name;
  $('#hotspot').setAttribute('aria-label', `查看${record.name}说明`);
  document.querySelectorAll('[data-part]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.part === id)));
  mobileDetail.innerHTML = `<article class="part-card"><div class="part-kicker"><span>结构笔记 / ${record.english}</span><span>${record.index} / 05</span></div><h3>${record.name}</h3><p>${record.description}</p><div class="part-note"><span>↳</span><span>${record.note}</span></div></article>`;
  if (navigate && stage) {
    if (id === 'board') setView(state.target > .1 ? 'three-quarter' : 'back');
    else setView('three-quarter');
    if (id === 'drive' || id === 'motor') setExplode(1);
  }
  announce(`已选择${record.name}。${record.subtitle}`);
}
function sync() {
  const percent = Math.round(state.target * 100), exploded = percent > 0;
  $('#explode-range').value = percent; $('#explode-output').value = String(percent).padStart(3, '0') + '%';
  $('#explode-range').style.setProperty('--range-progress', `${percent}%`);
  $('#explode-range').setAttribute('aria-valuetext', `${exploded ? '拆解程度' : '完整装配'}，${percent}%`);
  $('#explode').setAttribute('aria-pressed', String(exploded)); $('#explode-label').textContent = exploded ? '合拢机器' : '拆解机器';
  $('#run').setAttribute('aria-pressed', String(state.running)); $('#run-label').textContent = motion.matches ? '转动一步' : state.running ? '暂停演示' : '运转演示';
  $('#view-label').textContent = exploded ? '分解视图' : '装配视图';
  $('#simulation').hidden = !state.running && !(motion.matches && product?.phase > 0);
  document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === state.view)));
  if (stage) { stage.controls.enableDamping = !motion.matches; }
}
function setExplode(value) {
  state.target = THREE.MathUtils.clamp(Number(value) || 0, 0, 1); sync();
  if (motion.matches && product && stage) { state.progress = state.target; product.setExplode(state.progress); stage.setExplode(state.progress); }
}
function setView(view) { state.view = view; stage?.setView(view, motion.matches); sync(); }
function readout() {
  if (!product) return;
  $('#rotor-readout').textContent = [1, 26, 676].map(divisor => String.fromCharCode(65 + Math.floor(product.phase / divisor / (Math.PI * 2) * 26) % 26)).join(' ');
}
function run() {
  if (!product) return;
  if (motion.matches) { for (let i = 0; i < 10; i++) product.update(.1, true); state.running = false; readout(); announce('鼓轮已转动一步。'); }
  else { state.running = !state.running; announce(state.running ? '鼓轮示意运转已开始，此动画不执行密码运算。' : '运转演示已暂停。'); }
  sync();
}
function reset() {
  Object.assign(state, { target: 0, running: false, view: 'three-quarter' });
  product?.resetMotion(); setExplode(0); setView('three-quarter'); selectPart('drums', false); readout(); announce('已恢复初始装配与视角。');
}

// Native dialogs provide modal focus trapping, Escape and focus restoration.
for (const [button, dialog] of [['#archive-open', '#archive-dialog'], ['#story-open', '#archive-dialog'], ['#help-open', '#help-dialog']]) on($(button), 'click', () => $(dialog).showModal());
document.querySelectorAll('dialog').forEach(dialog => {
  on(dialog.querySelector('[data-close]'), 'click', () => dialog.close());
  on(dialog, 'click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
});
document.querySelectorAll('[data-part]').forEach(button => on(button, 'click', () => selectPart(button.dataset.part)));
document.querySelectorAll('[data-view]').forEach(button => on(button, 'click', () => setView(button.dataset.view)));
on($('#explode'), 'click', () => { setExplode(state.target > 0 ? 0 : 1); announce(state.target ? '已展开五个结构系统。' : '已合拢机器。'); });
on($('#explode-range'), 'input', event => setExplode(Number(event.target.value) / 100));
on($('#run'), 'click', run); on($('#reset'), 'click', reset);
on($('#zoom-in'), 'click', () => stage?.zoom(1)); on($('#zoom-out'), 'click', () => stage?.zoom(-1));
on($('#hotspot'), 'click', () => {
  const card = innerWidth <= 760 ? mobileDetail : $('.part-card'); card.scrollIntoView({ block: 'nearest', behavior: motion.matches ? 'instant' : 'smooth' });
  card.setAttribute('tabindex', '-1'); card.focus({ preventScroll: true }); announce(PARTS.find(p => p.id === state.selected).description);
});
on(window, 'keydown', event => {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || document.querySelector('dialog[open]') || event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
  if (event.key === ' ' && event.target.closest('button,a')) return;
  const action = { e: () => setExplode(state.target > 0 ? 0 : 1), r: reset, ' ': run }[event.key.toLowerCase()];
  if (action) { event.preventDefault(); action(); }
});
on(motion, 'change', () => { state.running = false; setExplode(state.target); sync(); announce('已应用系统动态效果偏好。'); });

try {
  stage = createStage(canvas, viewer); product = createProduct({ textures: createTextures() }); stage.scene.add(product.root);
  $('#loading').hidden = true; selectPart('drums', false); sync();
  announce('三维展品已就绪。拖动旋转，或使用下方控件拆解。');
} catch (error) {
  $('#loading').hidden = true; $('#error-state').hidden = false; $('#hotspot').hidden = true;
  stage?.dispose(); stage = null; product?.dispose(); product = null;
  ['#explode', '#explode-range', '#run', '#zoom-in', '#zoom-out', '#reset'].forEach(selector => $(selector).disabled = true);
  document.querySelectorAll('[data-view]').forEach(button => button.disabled = true);
  selectPart('drums', false); announce('三维场景暂不可用，可继续阅读部件和历史档案。'); console.error(error);
}
const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(); let down = null;
on(canvas, 'pointerdown', event => { down = { x: event.clientX, y: event.clientY }; });
on(canvas, 'pointerup', event => {
  if (!down || !stage || !product || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5) { down = null; return; }
  down = null; const r = canvas.getBoundingClientRect(); pointer.set((event.clientX - r.left) / r.width * 2 - 1, -(event.clientY - r.top) / r.height * 2 + 1);
  raycaster.setFromCamera(pointer, stage.camera);
  const hit = raycaster.intersectObject(product.root, true)[0]; if (!hit) return;
  let parent = hit.object; while (parent && !parent.userData.partId) parent = parent.parent;
  if (parent) selectPart(parent.userData.partId, false);
});
on(canvas, 'webglcontextlost', event => { event.preventDefault(); contextLost = true; $('#error-state').hidden = false; $('#error-state h3').textContent = '三维画面已暂停'; $('#error-state p').textContent = '正在等待图形上下文恢复，你仍可阅读展品档案。'; announce('三维画面暂时中断。'); });
on(canvas, 'webglcontextrestored', () => { contextLost = false; $('#error-state').hidden = true; announce('三维画面已恢复。'); });

function frame(now) {
  if (stopped) return;
  const dt = Math.min((now - previous) / 1000, .05); previous = now;
  if (stage && product && !contextLost && !document.hidden) {
    state.progress = motion.matches ? state.target : state.progress + (state.target - state.progress) * (1 - Math.exp(-6 * dt));
    if (Math.abs(state.progress - state.target) < .0001) state.progress = state.target;
    product.setExplode(state.progress); stage.setExplode(state.progress); product.update(dt, state.running && !motion.matches); readout(); stage.update(dt, motion.matches);
    const anchor = product.getAnchor(state.selected); const distance = stage.camera.position.distanceTo(anchor); anchor.project(stage.camera);
    const width = viewer.clientWidth, height = viewer.clientHeight;
    $('#hotspot').style.left = `${Math.max(8, Math.min(width - 128, (anchor.x * .5 + .5) * width))}px`;
    $('#hotspot').style.top = `${Math.max(76, Math.min(height - 84, (-anchor.y * .5 + .5) * height))}px`;
    $('#hotspot').style.opacity = anchor.z < -1 || anchor.z > 1 || distance < 1 ? '0' : '1';
  }
  raf = requestAnimationFrame(frame);
}
function dispose() { if (stopped) return; stopped = true; cancelAnimationFrame(raf); cleanups.forEach(fn => fn()); product?.dispose(); stage?.dispose(); delete window.__BOMBE_INSPECT__; }
on(window, 'pagehide', event => { if (!event.persisted) dispose(); });
// Read-only diagnostics for acceptance checks; no controls depend on this hook.
window.__BOMBE_INSPECT__ = () => ({ ...state, phase: product?.phase, drums: product?.drumCount, reducedMotion: motion.matches, calls: stage?.renderer.info.render.calls, triangles: stage?.renderer.info.render.triangles, geometries: stage?.renderer.info.memory.geometries, textures: stage?.renderer.info.memory.textures, camera: stage?.camera.position.toArray(), ready: Boolean(stage && product), contextLost });
selectPart('drums', false); sync(); raf = requestAnimationFrame(frame);
