import { parseRoute, routeKey } from './routes.js';
import { createHistoryPreview } from './history-loader.js';
import { createHistoryScenes } from './history-scenes.js';
import { createHistoryGalleries } from './history-gallery.js';

// Keep this lightweight pre-import copy aligned with navigation's chapter labels.
const loadingChapters = {
  mission: { title: '黎明之前，轮到你来解密。', chapter: '04 / DECRYPTION MISSION' },
  exhibit: { title: '回到机器的全貌。', chapter: '01 / THE BOMBE' },
  lab: { title: '让信号，穿过逻辑。', chapter: '02 / THE SIGNAL LAB' },
  challenge: { title: '小小解密员，轮到你了。', chapter: '03 / CODE QUEST' },
};

/** Lightweight owner until the interactive application takes over routing. */
export function createBootstrap({ root, window: view = root?.defaultView || root?.ownerDocument?.defaultView || globalThis.window, document: doc = root?.nodeType === 9 ? root : view.document, loadApplication = () => import('./main.js'), motion = view.matchMedia('(prefers-reduced-motion: reduce)'), mountHistory } = {}) {
  const element = doc.querySelector('#history-page');
  const overlay = doc.querySelector('#page-transition');
  let enhancements, desired = parseRoute(view.location.hash), modulePromise, application;
  let disposed = false, suspended = false, loading = false, handedOff = false;
  const removers = [];
  const on = (target, type, fn) => { target?.addEventListener(type, fn); removers.push(() => target?.removeEventListener(type, fn)); };
  function deactivate() { enhancements?.destroy(); enhancements = undefined; }
  function activate() {
    if (disposed || suspended || enhancements || !element) return;
    if (mountHistory) enhancements = mountHistory(element);
    else {
      const loader = createHistoryPreview(element, { image: element.querySelector('[data-history-image]'), motion });
      const scenes = createHistoryScenes(element, { motion });
      const galleries = createHistoryGalleries(element, { motion });
      enhancements = { destroy() { loader.destroy(); scenes.destroy(); galleries.destroy(); } };
    }
  }
  const historyPage = { element, currentRoute: null, scrollY: 0, activate, deactivate };
  function hideOverlay() { if (overlay) overlay.hidden = true; doc.body.removeAttribute('aria-busy'); }
  function showHistory() {
    if (element) { element.hidden = false; element.inert = false; }
    const shell = doc.querySelector('#application-shell');
    if (shell) { shell.hidden = true; shell.inert = true; }
    doc.body.dataset.page = 'history'; doc.title = '战时序章 · 译码档案';
    doc.querySelectorAll('[data-chapter]').forEach(link => {
      if (link.dataset.chapter === 'history') link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
    historyPage.currentRoute = { page: 'history', topic: 'drums' }; activate(); hideOverlay();
  }
  async function handoff() {
    if (disposed || suspended || handedOff || desired.page === 'history') return;
    // Refresh feedback for every interactive request, even when sharing an import.
    const metadata = loadingChapters[desired.page] || loadingChapters.exhibit;
    const title = doc.querySelector('#route-title'), chapter = doc.querySelector('#route-chapter');
    if (title) title.textContent = metadata.title;
    if (chapter) chapter.textContent = metadata.chapter;
    if (overlay) { overlay.hidden = false; overlay.dataset.state = 'loading'; }
    doc.body.setAttribute('aria-busy', 'true');
    const caption = doc.querySelector('#route-caption'); if (caption) caption.textContent = '正在准备交互章节';
    if (loading) return;
    loading = true;
    try {
      modulePromise ||= Promise.resolve().then(loadApplication);
      const module = await modulePromise;
      if (disposed || suspended) return;
      if (desired.page === 'history') { showHistory(); return; }
      historyPage.scrollY = historyPage.currentRoute ? view.scrollY : 0;
      hideOverlay();
      application = module.createApplication({ initialRoute: desired, historyPage });
      handedOff = true;
      // Application navigation now owns events and the transition overlay.
    } catch (error) {
      modulePromise = undefined;
      // A shared import may fail after the reader returned to history. Clear
      // its cache, but only the latest interactive request may publish errors.
      if (!disposed && !suspended && desired.page !== 'history') {
        if (overlay) { overlay.hidden = false; overlay.dataset.state = 'error'; }
        if (caption) caption.textContent = '交互章节暂不可用。请重试，或继续阅读历史。';
        doc.body.removeAttribute('aria-busy');
      }
    } finally { loading = false; }
  }
  function go(route, push = true) {
    if (disposed) return;
    if (handedOff) { application.go(route, push); return; }
    desired = { ...route };
    if (push && view.location.hash !== routeKey(route)) view.history.pushState(null, '', routeKey(route));
    if (route.page === 'history') showHistory(); else void handoff();
  }
  on(doc, 'click', event => {
    if (handedOff) return;
    const link = event.target.closest?.('a[data-page]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    event.preventDefault(); go({ page: link.dataset.page, topic: link.dataset.topic });
  });
  const fromLocation = () => { if (!handedOff) go(parseRoute(view.location.hash), false); };
  on(view, 'popstate', fromLocation); on(view, 'hashchange', fromLocation);
  on(doc.querySelector('#route-retry'), 'click', () => { if (!handedOff) void handoff(); });
  on(doc.querySelector('#route-back'), 'click', () => { if (!handedOff) go({ page: 'history' }); });
  on(view, 'pagehide', event => { if (!event.persisted) dispose(); else { suspended = true; deactivate(); } });
  on(view, 'pageshow', event => {
    if (!event.persisted || disposed) return;
    suspended = false;
    if (!handedOff) { if (desired.page === 'history') activate(); else void handoff(); }
  });
  function dispose() { if (disposed) return; disposed = true; deactivate(); application?.dispose(); removers.forEach(remove => remove()); hideOverlay(); }
  if (desired.page === 'history') showHistory(); else void handoff();
  return { go, dispose };
}

if (typeof document !== 'undefined' && document.querySelector('#history-page')) createBootstrap({ root: document });
