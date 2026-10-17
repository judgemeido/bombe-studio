import { createHistoryScenes } from './history-scenes.js';

const STATUS_TEXT = {
  loading: '正在载入档案影像，正文与跳过入口可直接使用。',
  ready: '档案影像已就绪。',
  fallback: '档案影像暂不可用，可继续阅读正文。',
};

/** Wait only for the hero image; never gate access to the document on media. */
export function createHistoryPreview(root, { image, motion, timeoutMs = 3000 }) {
  const view = root.ownerDocument.defaultView;
  const status = root.querySelector('[data-load-status]');
  let destroyed = false;
  let settled = false;
  let timer;

  // Preserve the loader API; the separate scene controller owns motion enhancement.
  void motion;

  function update(state) {
    root.dataset.loadState = state;
    if (status) {
      status.setAttribute('aria-live', 'polite');
      if (status.textContent !== STATUS_TEXT[state]) status.textContent = STATUS_TEXT[state];
    }
  }

  function clearLoadingResources() {
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
    }
    image?.removeEventListener('load', onLoad);
    image?.removeEventListener('error', onError);
  }

  function settle(state) {
    if (destroyed || settled) return;
    settled = true;
    clearLoadingResources();
    update(state);
  }

  function onLoad() { settle('ready'); }
  function onError() { settle('fallback'); }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    clearLoadingResources();
    view?.removeEventListener('pagehide', destroy);
  }

  update('loading');
  view?.addEventListener('pagehide', destroy);

  if (!image) {
    settle('fallback');
  } else {
    timer = setTimeout(onError, timeoutMs);
    if (typeof image.decode === 'function') {
      try {
        Promise.resolve(image.decode()).then(onLoad, onError);
      } catch {
        onError();
      }
    } else {
      // Attach first so completion cannot race the cached-image check.
      image.addEventListener('load', onLoad);
      image.addEventListener('error', onError);
      if (image.complete) settle(image.naturalWidth > 0 ? 'ready' : 'fallback');
    }
  }

  return { destroy };
}

if (typeof document !== 'undefined') {
  const root = document.querySelector('[data-history-preview]');
  if (root) {
    const view = root.ownerDocument.defaultView;
    let controller;

    function mount() {
      if (controller) return;
      const motion = view?.matchMedia?.('(prefers-reduced-motion: reduce)');
      const preview = createHistoryPreview(root, {
        image: root.querySelector('[data-history-image]'),
        motion,
      });
      const scenes = createHistoryScenes(root, { motion });
      controller = {
        destroy() {
          preview.destroy();
          scenes.destroy();
        },
      };
    }

    function onPageHide(event) {
      controller?.destroy();
      controller = undefined;
      // Keep only the auto-mount lifecycle while cached. Exported controllers
      // still stay permanently destroyed; restoration creates a fresh instance.
      if (!event.persisted) {
        view?.removeEventListener('pagehide', onPageHide);
        view?.removeEventListener('pageshow', onPageShow);
      }
    }

    function onPageShow(event) {
      if (event.persisted) mount();
    }

    view?.addEventListener('pagehide', onPageHide);
    view?.addEventListener('pageshow', onPageShow);
    mount();
  }
}
