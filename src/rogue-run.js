import { applyRogueEnding, createRogueRun, reduceRogueRun, scoreRogueRun } from './rogue-engine.js';
import { renderRogueView } from './rogue-template.js';

export function createRogueRunView(root, { seed = `night-${Date.now()}`, role = 'intercept', returnFocus = null, onZone = () => {}, onClose = () => {}, motion = null, storage = null } = {}) {
  const doc = root.ownerDocument;
  storage ||= doc.defaultView?.localStorage || null;
  const readArchives = () => { try { const data = JSON.parse(storage?.getItem('bombe-rogue-archives') || '[]'); return Array.isArray(data) ? data.filter(item => item && item.version === 1).slice(-20) : []; } catch { return []; } };
  let archives = readArchives();
  let state = createRogueRun(seed, { role });
  let visible = false, disposed = false, archiveSaved = false;
  const cleanups = [];
  const viewCleanups = [];
  const on = (el, event, handler) => { el.addEventListener(event, handler); cleanups.push(() => el.removeEventListener(event, handler)); };
  const onView = (el, event, handler) => { if (!el) return; el.addEventListener(event, handler); viewCleanups.push(() => el.removeEventListener(event, handler)); };
  function focusHeading() { root.querySelector('#rogue-heading')?.focus({ preventScroll: true }); }
  function render(focus = false) {
    viewCleanups.splice(0).forEach(fn => fn());
    root.innerHTML = visible ? `<div class="rogue-overlay" role="dialog" aria-modal="true" aria-label="随机夜班"><div class="rogue-frame">${renderRogueView(state)}</div></div>` : '';
    if (!visible) return;
    root.querySelectorAll('[data-rogue-action]').forEach(el => onView(el, 'click', () => el.dataset.rogueAction === 'close' ? close() : dispatch(el.dataset.rogueAction, el.dataset.value)));
    if (focus) focusHeading();
    const node = state.currentNode || state.route[state.depth]?.nodes[0];
    if (node?.zone) onZone(node.zone);
  }
  function dispatch(action, value) {
    if (disposed) return;
    if (action === 'start') state = { ...state, phase: 'route' };
    else if (action === 'new-run') { state = createRogueRun(`night-${Date.now()}`, { role: state.role }); archiveSaved = false; }
    else if (action === 'replay') { state = createRogueRun(state.seed, { role: state.role }); archiveSaved = false; }
    else if (action === 'handoff') state = applyRogueEnding(state, value);
    else if (action === 'tool') state = reduceRogueRun(state, { type: 'use-tool', toolId: value });
    else if (action === 'role') state = { ...state, role: value };
    else state = reduceRogueRun(state, {
      type: ({ node: 'select-node', resolve: 'resolve', continue: 'continue', pause: 'pause', resume: 'resume', right: 'submit-right' }[action] || action),
      nodeId: value, choiceId: value, value,
    });
    if (state.phase === 'complete') state = { ...state, grade: scoreRogueRun(state) };
    if (state.phase === 'complete' && !archiveSaved) {
      archiveSaved = true;
      const entry = { version: 1, seed: state.seed, role: state.role, ending: state.ending, grade: state.grade?.grade || 'qualified', evidence: state.evidence.length, savedAt: Date.now() };
      archives = [...archives, entry].slice(-20);
      try { storage?.setItem('bombe-rogue-archives', JSON.stringify(archives)); } catch { /* private mode or quota */ }
    }
    render(true);
  }
  function open() { visible = true; render(true); }
  function close() { visible = false; viewCleanups.splice(0).forEach(fn => fn()); root.innerHTML = ''; returnFocus?.focus?.({ preventScroll: true }); onClose(); }
  function start() { if (!visible) open(); dispatch('start'); }
  function pause() { dispatch('pause'); }
  function resume() { dispatch('resume'); }
  function destroy() { disposed = true; close(); cleanups.splice(0).forEach(fn => fn()); }
  function inspect() { return { state, visible, disposed, archives: [...archives] }; }
  if (motion?.addEventListener) on(motion, 'change', () => render());
  return { open, close, start, pause, resume, destroy, inspect };
}
