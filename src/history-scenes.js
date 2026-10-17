/** Enhance diagrams and chapter navigation without changing native reading/navigation. */
export function createHistoryScenes(root, {
  motion,
  Observer = root.ownerDocument.defaultView?.IntersectionObserver,
} = {}) {
  const view = root.ownerDocument.defaultView;
  const scenes = [...root.querySelectorAll('[data-history-scene]')];
  const links = [...root.querySelectorAll('nav[aria-label="历史章节"] [data-scene-link]')];
  const records = new Map();
  let destroyed = false;
  let observer;

  function revealAll() {
    for (const scene of scenes) scene.classList.add('is-revealed');
  }

  function updateCurrent() {
    if (destroyed) return;
    const readingLine = (view?.innerHeight ?? 0) * 0.25;
    let current;
    let distance = Infinity;
    // Query retained targets' live geometry, not stale rectangles from IO batches.
    // Strict comparison deliberately leaves equal distances in DOM order.
    for (const scene of scenes) {
      if (!records.get(scene)?.visible) continue;
      const nextDistance = Math.abs(scene.getBoundingClientRect().top - readingLine);
      if (nextDistance < distance) {
        current = scene;
        distance = nextDistance;
      }
    }
    for (const scene of scenes) scene.classList.toggle('is-current', scene === current);
    for (const link of links) {
      if (current && link.getAttribute('href') === `#${current.id}`) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    }
  }

  function onEntries(entries) {
    if (destroyed) return;
    for (const entry of entries) {
      if (!scenes.includes(entry.target)) continue;
      const previous = records.get(entry.target);
      const time = entry.time ?? 0;
      const visible = Boolean(entry.isIntersecting);
      // IO may queue more than one transition for a target. Newest wins;
      // an equal-time exit wins deterministically, regardless of array order.
      if (previous && (time < previous.time || (time === previous.time && !previous.visible))) continue;
      records.set(entry.target, { time, visible });
    }
    for (const scene of scenes) {
      if (records.get(scene)?.visible) scene.classList.add('is-revealed');
    }
    updateCurrent();
  }

  function onMotionChange() {
    if (destroyed) return;
    // Never remove a reveal: toggling preferences must not replay an animation.
    if (motion?.matches || !observer) revealAll();
  }

  if (typeof Observer === 'function') {
    observer = new Observer(onEntries);
    if (motion?.matches) revealAll();
    root.classList.add('history-enhanced');
    for (const scene of scenes) observer.observe(scene);
    view?.addEventListener('scroll', updateCurrent, { passive: true });
    view?.addEventListener('resize', updateCurrent);
  } else {
    // No enhancement class means CSS remains fully static; do not invent progress.
    revealAll();
  }
  if (motion?.addEventListener) motion.addEventListener('change', onMotionChange);
  else motion?.addListener?.(onMotionChange);

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    observer?.disconnect();
    records.clear();
    view?.removeEventListener('scroll', updateCurrent);
    view?.removeEventListener('resize', updateCurrent);
    if (motion?.removeEventListener) motion.removeEventListener('change', onMotionChange);
    else motion?.removeListener?.(onMotionChange);
    root.classList.remove('history-enhanced');
    for (const scene of scenes) scene.classList.remove('is-current', 'is-revealed');
    for (const link of links) link.removeAttribute('aria-current');
  }

  return { destroy };
}
