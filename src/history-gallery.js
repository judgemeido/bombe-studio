// The most recent mount exclusively owns each gallery, even across overlapping roots.
const galleryOwners = new WeakMap();

/** Progressive enhancement: the source figures remain readable without JS. */
export function createHistoryGalleries(root, {
  motion,
  intervalMs = 6000,
  Observer = (root.ownerDocument || root).defaultView?.IntersectionObserver,
  // A minimal injectable clock keeps lifecycle tests deterministic.
  clock = (root.ownerDocument || root).defaultView || globalThis,
} = {}) {
  const doc = root.ownerDocument || root;
  const galleries = [...root.querySelectorAll('[data-history-gallery]')];
  if (root.matches?.('[data-history-gallery]')) galleries.unshift(root);
  if (!galleries.length) return { destroy() {} };
  const records = new Map();
  const removers = [];
  let destroyed = false;
  let observer;
  const delay = Number.isFinite(intervalMs) && intervalMs > 0 ? intervalMs : 6000;
  const on = (target, type, callback) => {
    target?.addEventListener(type, callback);
    removers.push(() => target?.removeEventListener(type, callback));
  };
  const remember = (element, attributes, text = false) => {
    if (!element) return;
    const values = attributes.map(name => [name, element.getAttribute(name)]);
    const content = element.textContent;
    removers.push(() => {
      for (const [name, value] of values) {
        if (value === null) element.removeAttribute(name);
        else element.setAttribute(name, value);
      }
      if (text) element.textContent = content;
    });
  };
  function clear(record) {
    if (record.timer !== undefined) clock.clearTimeout(record.timer);
    record.timer = undefined;
  }
  function sync(record) {
    clear(record);
    if (destroyed || record.slides.length < 2 || record.paused || record.hover || record.focus ||
        doc.hidden || motion?.matches || !record.visible) return;
    record.timer = clock.setTimeout(() => {
      record.timer = undefined;
      if (destroyed) return;
      advance(record, 1);
    }, delay);
  }
  function render(record) {
    record.slides.forEach((slide, index) => { slide.hidden = index !== record.index; });
    if (record.count) record.count.textContent = `${record.slides.length ? record.index + 1 : 0} / ${record.slides.length}`;
    if (record.toggle) {
      record.toggle.textContent = record.paused ? '继续轮播' : '暂停轮播';
      record.toggle.setAttribute('aria-pressed', String(record.paused));
      record.toggle.setAttribute('aria-label', record.paused ? '继续轮播' : '暂停轮播');
    }
  }
  function advance(record, step) {
    if (destroyed || record.slides.length < 2) return;
    record.index = (record.index + step + record.slides.length) % record.slides.length;
    render(record);
    sync(record);
  }
  if (typeof Observer === 'function' && galleries.length) {
    observer = new Observer(entries => {
      if (destroyed) return;
      for (const entry of entries) {
        const record = records.get(entry.target);
        if (!record) continue;
        record.visible = Boolean(entry.isIntersecting);
        sync(record);
      }
    });
  }
  for (const gallery of galleries) {
    galleryOwners.get(gallery)?.();
    const cleanupStart = removers.length;
    // Keep nested galleries independent, should a page ever contain one.
    const owned = selector => [...gallery.querySelectorAll(selector)].filter(element => element.closest('[data-history-gallery]') === gallery);
    const slides = owned('[data-gallery-slide]');
    const wasEnhanced = gallery.classList.contains('gallery-enhanced');
    removers.push(() => {
      gallery.classList.toggle('gallery-enhanced', wasEnhanced);
      if (!gallery.className) gallery.removeAttribute('class');
    });
    gallery.classList.add('gallery-enhanced');
    for (const controls of owned('.gallery-controls, [data-gallery-controls]')) {
      remember(controls, ['hidden']);
      controls.hidden = false;
    }
    const prev = owned('[data-gallery-prev]')[0];
    const next = owned('[data-gallery-next]')[0];
    const toggle = owned('[data-gallery-toggle]')[0];
    const count = owned('[data-gallery-count]')[0];
    const record = { slides, toggle, count, index: 0, paused: false,
      hover: gallery.matches(':hover'), focus: gallery.contains(doc.activeElement), visible: !observer, timer: undefined };
    records.set(gallery, record);
    slides.forEach(slide => remember(slide, ['hidden']));
    remember(count, [], true);
    for (const button of [prev, next, toggle]) {
      remember(button, ['disabled', 'aria-pressed', 'aria-label'], button === toggle);
      if (button) button.disabled = slides.length < 2;
    }
    const track = owned('.gallery-slides')[0];
    let gesture;
    const interactive = event => event.target?.closest?.('button, a');
    on(track, 'pointerdown', event => {
      gesture = undefined;
      if (event.button !== 0 || event.isPrimary === false || interactive(event) ||
          event.target?.closest?.('[data-history-gallery]') !== gallery) return;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
    });
    on(track, 'pointerup', event => {
      const start = gesture;
      gesture = undefined;
      if (!start || event.pointerId !== start.id || interactive(event) ||
          event.target?.closest?.('[data-history-gallery]') !== gallery) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      // Do not capture pointers or preventDefault: vertical scrolling stays native.
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) advance(record, dx < 0 ? 1 : -1);
    });
    on(track, 'pointercancel', () => { gesture = undefined; });
    removers.push(() => { gesture = undefined; });
    on(prev, 'click', () => advance(record, -1));
    on(next, 'click', () => advance(record, 1));
    on(toggle, 'click', () => {
      if (slides.length < 2) return;
      record.paused = !record.paused;
      render(record); sync(record);
    });
    on(gallery, 'mouseenter', () => { record.hover = true; sync(record); });
    on(gallery, 'mouseleave', () => { record.hover = false; sync(record); });
    on(gallery, 'focusin', () => { record.focus = true; sync(record); });
    on(gallery, 'focusout', event => { record.focus = gallery.contains(event.relatedTarget); sync(record); });
    render(record);
    observer?.observe(gallery);
    sync(record);
    const galleryRemovers = removers.splice(cleanupStart);
    let released = false;
    const cleanup = () => {
      if (released) return;
      released = true;
      clear(record);
      records.delete(gallery);
      observer?.unobserve?.(gallery);
      for (const remove of galleryRemovers.reverse()) remove();
      if (galleryOwners.get(gallery) === cleanup) galleryOwners.delete(gallery);
      // A partially replaced factory must keep its remaining galleries alive.
      if (!records.size && !destroyed) destroy();
    };
    record.cleanup = cleanup;
    galleryOwners.set(gallery, cleanup);
  }
  const syncAll = () => { for (const record of records.values()) sync(record); };
  on(doc, 'visibilitychange', syncAll);
  if (motion?.addEventListener) on(motion, 'change', syncAll);
  else if (motion?.addListener) {
    motion.addListener(syncAll);
    removers.push(() => motion.removeListener?.(syncAll));
  }
  function destroy() {
    if (destroyed) return;
    destroyed = true;
    observer?.disconnect();
    for (const record of [...records.values()]) record.cleanup();
    for (const remove of removers.reverse()) remove();
  }
  return { destroy };
}
