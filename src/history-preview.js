import { createHistoryPreview } from './history-loader.js';
export { createHistoryPreview } from './history-loader.js';
import { createHistoryScenes } from './history-scenes.js';
import { createHistoryGalleries } from './history-gallery.js';

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
      const galleries = createHistoryGalleries(root, { motion });
      controller = {
        destroy() {
          preview.destroy();
          scenes.destroy();
          galleries.destroy();
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
