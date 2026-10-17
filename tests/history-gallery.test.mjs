import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Window } from 'happy-dom';
import { createHistoryGalleries } from '../src/history-gallery.js';

function fixture(t, { reduced = false, observe = true, count = 3, copies = 1 } = {}) {
  const window = new Window({ url: 'https://example.test/' });
  const doc = window.document;
  doc.body.innerHTML = Array.from({ length: copies }, () => `<section data-history-gallery><div class="gallery-slides">${Array.from({ length: count }, (_, i) => `<figure data-gallery-slide>Photo ${i}</figure>`).join('')}</div><button data-gallery-prev>上一张</button><button data-gallery-next>下一张</button><button data-gallery-toggle>暂停轮播</button><output data-gallery-count>静态照片</output></section>`).join('');
  let now = 0, id = 0;
  const tasks = new Map();
  const clock = {
    setTimeout(fn, delay) { tasks.set(++id, { fn, at: now + delay }); return id; },
    clearTimeout(key) { tasks.delete(key); },
    tick(ms) {
      const end = now + ms;
      while (true) {
        const next = [...tasks].sort((a, b) => a[1].at - b[1].at)[0];
        if (!next || next[1].at > end) break;
        now = next[1].at; tasks.delete(next[0]); next[1].fn();
      }
      now = end;
    },
  };
  const motion = new window.EventTarget(); motion.matches = reduced;
  motion.set = value => { motion.matches = value; motion.dispatchEvent(new window.Event('change')); };
  let observer;
  class Observer {
    constructor(callback) { this.callback = callback; this.targets = []; observer = this; }
    observe(target) { this.targets.push(target); }
    disconnect() { this.disconnected = true; }
  }
  const galleries = [...doc.querySelectorAll('[data-history-gallery]')];
  const original = doc.body.innerHTML;
  const controller = createHistoryGalleries(doc, { motion, clock, Observer: observe ? Observer : null });
  const visible = (value, gallery = galleries[0]) => observer.callback([{ target: gallery, isIntersecting: value }]);
  const event = (type, target = galleries[0], init = {}) => target.dispatchEvent(new window.FocusEvent(type, { bubbles: true, ...init }));
  const click = selector => galleries[0].querySelector(selector).click();
  const index = (gallery = galleries[0]) => [...gallery.querySelectorAll('figure')].findIndex(slide => !slide.hidden);
  t.after(() => { controller.destroy(); window.happyDOM.abort(); });
  return { window, doc, galleries, original, controller, clock, tasks, motion, visible, event, click, index, get observer() { return observer; } };
}

test('progressive enhancement, six-second autoplay, wrap, manual reset and explicit pause', t => {
  const f = fixture(t);
  assert.equal(f.index(), 0);
  assert.equal(f.galleries[0].querySelector('output').textContent, '1 / 3');
  assert.equal(f.tasks.size, 0, 'wait for first intersection');
  f.visible(true); f.clock.tick(5999); assert.equal(f.index(), 0);
  f.clock.tick(1); assert.equal(f.index(), 1);
  f.clock.tick(5000); f.click('[data-gallery-prev]'); assert.equal(f.index(), 0);
  f.clock.tick(1000); assert.equal(f.index(), 0);
  f.click('[data-gallery-prev]'); assert.equal(f.index(), 2);
  f.click('[data-gallery-next]'); assert.equal(f.index(), 0);
  f.click('[data-gallery-toggle]'); assert.equal(f.tasks.size, 0);
  assert.equal(f.galleries[0].querySelector('[data-gallery-toggle]').getAttribute('aria-pressed'), 'true');
  f.clock.tick(12000); assert.equal(f.index(), 0);
  f.click('[data-gallery-toggle]'); f.clock.tick(6000); assert.equal(f.index(), 1);
});

test('pause blockers compose; focus within does not resume and explicit pause survives blockers', t => {
  const f = fixture(t); f.visible(true);
  f.event('mouseenter'); assert.equal(f.tasks.size, 0);
  f.event('focusin'); f.event('mouseleave'); assert.equal(f.tasks.size, 0);
  const next = f.galleries[0].querySelector('[data-gallery-next]');
  f.event('focusout', next, { relatedTarget: f.galleries[0].querySelector('[data-gallery-prev]') });
  assert.equal(f.tasks.size, 0);
  f.event('focusout', next, { relatedTarget: null }); assert.equal(f.tasks.size, 1);
  f.motion.set(true); assert.equal(f.tasks.size, 0);
  f.click('[data-gallery-next]'); assert.equal(f.index(), 1, 'manual controls work with reduced motion');
  f.motion.set(false); assert.equal(f.tasks.size, 1);
  f.visible(false); assert.equal(f.tasks.size, 0);
  f.visible(true); f.click('[data-gallery-toggle]');
  f.event('mouseenter'); f.event('mouseleave'); f.motion.set(true); f.motion.set(false);
  assert.equal(f.tasks.size, 0);
});

test('document visibility and initial reduced motion suppress autoplay', t => {
  const f = fixture(t, { reduced: true }); f.visible(true); assert.equal(f.tasks.size, 0);
  f.motion.set(false); assert.equal(f.tasks.size, 1);
  Object.defineProperty(f.doc, 'hidden', { configurable: true, value: true });
  f.doc.dispatchEvent(new f.window.Event('visibilitychange')); assert.equal(f.tasks.size, 0);
  Object.defineProperty(f.doc, 'hidden', { configurable: true, value: false });
  f.doc.dispatchEvent(new f.window.Event('visibilitychange')); assert.equal(f.tasks.size, 1);
});

test('multiple galleries are independent and destroy restores static DOM and removes callbacks', t => {
  const f = fixture(t, { copies: 2 });
  f.visible(true); f.visible(true, f.galleries[1]); assert.equal(f.tasks.size, 2);
  f.click('[data-gallery-toggle]'); f.clock.tick(6000);
  assert.equal(f.index(), 0); assert.equal(f.index(f.galleries[1]), 1);
  f.controller.destroy(); f.controller.destroy();
  assert.equal(f.tasks.size, 0); assert.equal(f.observer.disconnected, true);
  assert.equal(f.doc.body.innerHTML, f.original);
  f.click('[data-gallery-next]'); f.visible(true); f.motion.set(true); f.event('mouseleave');
  assert.equal(f.doc.body.innerHTML, f.original); assert.equal(f.tasks.size, 0);
});

for (const count of [0, 1]) test(`${count} slides remains static without timers`, t => {
  const f = fixture(t, { count, observe: false });
  assert.equal(f.tasks.size, 0);
  for (const button of f.doc.querySelectorAll('button')) assert.equal(button.disabled, true);
  f.controller.destroy(); assert.equal(f.doc.body.innerHTML, f.original);
});

test('without IntersectionObserver, galleries remain usable and autoplay', t => {
  const f = fixture(t, { observe: false }); f.clock.tick(6000); assert.equal(f.index(), 1);
});

test('bootstrap mounts galleries and restores static content on pagehide / dispose', async t => {
  const { createBootstrap } = await import('../src/bootstrap.js');
  const f = fixture(t, { observe: false }); f.controller.destroy();
  const root = f.galleries[0]; root.id = 'history-page';
  f.window.setTimeout = f.clock.setTimeout; f.window.clearTimeout = f.clock.clearTimeout;
  f.window.IntersectionObserver = undefined;
  const app = createBootstrap({ root: f.doc, motion: f.motion });
  t.after(() => app.dispose());
  assert.equal(f.index(), 0); assert.equal(f.tasks.size, 1);
  f.window.dispatchEvent(Object.assign(new f.window.Event('pagehide'), { persisted: true }));
  assert.equal(f.tasks.size, 0); assert.ok([...root.querySelectorAll('figure')].every(slide => !slide.hidden));
  f.window.dispatchEvent(Object.assign(new f.window.Event('pageshow'), { persisted: true }));
  assert.equal(f.tasks.size, 1); f.clock.tick(6000); assert.equal(f.index(), 1);
  app.dispose(); assert.equal(f.tasks.size, 0);
});

test('preview auto-mount destroys and remounts galleries across BFCache', async t => {
  const f = fixture(t, { observe: false }); f.controller.destroy();
  f.galleries[0].setAttribute('data-history-preview', '');
  f.window.setTimeout = f.clock.setTimeout; f.window.clearTimeout = f.clock.clearTimeout;
  f.window.IntersectionObserver = undefined;
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: f.doc });
  try { await import('../src/history-preview.js?gallery-lifecycle'); }
  finally {
    if (previous) Object.defineProperty(globalThis, 'document', previous);
    else delete globalThis.document;
  }
  assert.equal(f.tasks.size, 1);
  f.window.dispatchEvent(Object.assign(new f.window.Event('pagehide'), { persisted: true }));
  assert.equal(f.tasks.size, 0);
  f.window.dispatchEvent(Object.assign(new f.window.Event('pageshow'), { persisted: true }));
  assert.equal(f.tasks.size, 1); f.clock.tick(6000); assert.equal(f.index(), 1);
  f.window.dispatchEvent(Object.assign(new f.window.Event('pagehide'), { persisted: false }));
  assert.equal(f.tasks.size, 0);
  f.window.dispatchEvent(Object.assign(new f.window.Event('pageshow'), { persisted: true }));
  assert.equal(f.tasks.size, 0);
});

test('reveals static hidden controls and applies the shared CSS hook, restoring both on destroy', t => {
  const f = fixture(t); f.controller.destroy();
  const gallery = f.galleries[0];
  const controls = f.doc.createElement('div'); controls.className = 'gallery-controls'; controls.hidden = true;
  for (const element of [...gallery.querySelectorAll('button, output')]) controls.append(element);
  gallery.append(controls);
  const original = gallery.outerHTML;
  const controller = createHistoryGalleries(gallery, { clock: f.clock, Observer: null });
  t.after(() => controller.destroy());
  assert.equal(controls.hidden, false);
  assert.equal(gallery.classList.contains('gallery-enhanced'), true);
  controller.destroy(); assert.equal(gallery.outerHTML, original);
});

test('without galleries allocates no observers, motion listeners or document listeners', t => {
  const window = new Window(); t.after(() => window.happyDOM.abort());
  const motion = { addEventListener() { assert.fail('unexpected motion listener'); } };
  window.document.addEventListener = () => assert.fail('unexpected document listener');
  const controller = createHistoryGalleries(window.document, { motion,
    Observer: class { constructor() { assert.fail('unexpected observer'); } },
  });
  controller.destroy(); controller.destroy();
});

function pointer(f, type, x, y, { target = f.galleries[0].querySelector('.gallery-slides'), id = 1, button = 0, isPrimary = true } = {}) {
  const event = Object.assign(new f.window.Event(type, { bubbles: true, cancelable: true }), {
    clientX: x, clientY: y, pointerId: id, button, isPrimary,
  });
  target.dispatchEvent(event);
  assert.equal(event.defaultPrevented, false, 'native scrolling and link behavior are not intercepted');
}

test('horizontal swipes navigate both ways, wrap and reset the autoplay countdown', t => {
  const f = fixture(t, { observe: false }); f.clock.tick(5000);
  pointer(f, 'pointerdown', 100, 50); pointer(f, 'pointerup', 49, 55);
  assert.equal(f.index(), 1);
  f.clock.tick(1000); assert.equal(f.index(), 1);
  pointer(f, 'pointerdown', 10, 50); pointer(f, 'pointerup', 80, 55);
  assert.equal(f.index(), 0);
  pointer(f, 'pointerdown', 10, 50); pointer(f, 'pointerup', 80, 55);
  assert.equal(f.index(), 2);
});

test('short, vertical, diagonal, cancelled and mismatched pointer gestures do not navigate', t => {
  const f = fixture(t);
  for (const [x, y] of [[40, 0], [30, 0], [60, 70], [60, 60]]) {
    pointer(f, 'pointerdown', 0, 0); pointer(f, 'pointerup', x, y);
    assert.equal(f.index(), 0);
  }
  pointer(f, 'pointerdown', 0, 0); pointer(f, 'pointercancel', 0, 0); pointer(f, 'pointerup', 100, 0);
  assert.equal(f.index(), 0);
  pointer(f, 'pointerdown', 0, 0); pointer(f, 'pointerup', 100, 0, { id: 2 });
  assert.equal(f.index(), 0);
  pointer(f, 'pointerdown', 0, 0, { button: 2 }); pointer(f, 'pointerup', 100, 0);
  assert.equal(f.index(), 0);
  pointer(f, 'pointerdown', 0, 0, { isPrimary: false }); pointer(f, 'pointerup', 100, 0);
  assert.equal(f.index(), 0);
});

test('swipes exclude button and link descendants, and pointer listeners are removed on destroy', t => {
  const f = fixture(t);
  const track = f.galleries[0].querySelector('.gallery-slides');
  for (const tag of ['button', 'a']) {
    const element = f.doc.createElement(tag); element.innerHTML = '<span>interactive</span>'; track.append(element);
    const target = element.firstChild;
    pointer(f, 'pointerdown', 0, 0, { target }); pointer(f, 'pointerup', 100, 0);
    assert.equal(f.index(), 0);
    pointer(f, 'pointerdown', 0, 0); pointer(f, 'pointerup', 100, 0, { target });
    assert.equal(f.index(), 0);
  }
  const removals = [];
  const remove = track.removeEventListener.bind(track);
  track.removeEventListener = (type, fn) => { removals.push(type); remove(type, fn); };
  pointer(f, 'pointerdown', 0, 0); f.controller.destroy();
  assert.ok(['pointerdown', 'pointerup', 'pointercancel'].every(type => removals.includes(type)));
  const snapshot = f.doc.body.innerHTML;
  pointer(f, 'pointerup', 100, 0); pointer(f, 'pointerdown', 0, 0); pointer(f, 'pointerup', 100, 0);
  assert.equal(f.doc.body.innerHTML, snapshot); assert.equal(f.tasks.size, 0);
});

for (const overlap of [false, true]) for (const reverse of [false, true]) {
  test(`duplicate factory replaces owner safely (overlap=${overlap}, reverseDestroy=${reverse})`, t => {
    const f = fixture(t, { observe: false });
    const b = createHistoryGalleries(overlap ? f.galleries[0] : f.doc, { clock: f.clock, Observer: null });
    t.after(() => b.destroy());
    assert.equal(f.tasks.size, 1, 'only one timer per gallery');
    if (!reverse) {
      f.controller.destroy();
      assert.equal(f.tasks.size, 1);
      assert.equal(f.galleries[0].classList.contains('gallery-enhanced'), true);
      f.click('[data-gallery-next]'); assert.equal(f.index(), 1, 'one click advances once');
      b.destroy();
    } else {
      b.destroy(); f.controller.destroy();
    }
    assert.equal(f.tasks.size, 0);
    assert.equal(f.doc.body.innerHTML, f.original);
  });
}

test('replacing one gallery leaves sibling ownership active and ignores stale observer entries', t => {
  const f = fixture(t, { copies: 2 });
  f.visible(true); f.visible(true, f.galleries[1]);
  const oldObserver = f.observer;
  const b = createHistoryGalleries(f.galleries[0], { clock: f.clock, Observer: null });
  t.after(() => b.destroy());
  assert.equal(f.tasks.size, 2);
  oldObserver.callback([{ target: f.galleries[0], isIntersecting: true }]);
  assert.equal(f.tasks.size, 2);
  f.controller.destroy(); assert.equal(f.tasks.size, 1);
  f.click('[data-gallery-next]'); assert.equal(f.index(), 1);
  b.destroy(); assert.equal(f.tasks.size, 0);
  assert.equal(f.doc.body.innerHTML, f.original);
});

test('replacement snapshots original hidden controls, not the prior enhanced DOM', t => {
  const f = fixture(t); f.controller.destroy();
  const gallery = f.galleries[0];
  const controls = f.doc.createElement('div'); controls.className = 'gallery-controls'; controls.hidden = true;
  for (const element of [...gallery.querySelectorAll('button, output')]) controls.append(element);
  gallery.append(controls);
  const original = gallery.outerHTML;
  const a = createHistoryGalleries(f.doc, { clock: f.clock, Observer: null });
  const b = createHistoryGalleries(gallery, { clock: f.clock, Observer: null });
  t.after(() => { a.destroy(); b.destroy(); });
  assert.equal(f.tasks.size, 1);
  a.destroy(); assert.equal(controls.hidden, false);
  assert.equal(gallery.classList.contains('gallery-enhanced'), true);
  b.destroy(); assert.equal(gallery.outerHTML, original); assert.equal(f.tasks.size, 0);
});
