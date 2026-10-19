import { parseRoute, routeKey } from './routes.js';
export { parseRoute, routeKey } from './routes.js';
const chapters = {
  mission: { title: '黎明之前，轮到你来解密。', chapter: '04 / DECRYPTION MISSION', document: '黎明之前 · 15 分钟解密游戏 | 译码档案', heading: '#mission-heading' },
  history: { title: '在机器之前，读懂时代。', chapter: '00 / THE HISTORY', document: '战时序章 · 译码档案', heading: '#hero-title' },
  exhibit: { title: '回到机器的全貌。', chapter: '01 / THE BOMBE', document: 'BOMBE · 译码档案 | 交互机械展', heading: '#exhibit-heading' },
  lab: { title: '让信号，穿过逻辑。', chapter: '02 / THE SIGNAL LAB', document: '信号实验室 · 译码档案', heading: '#lab-heading' },
  challenge: { title: '小小解密员，轮到你了。', chapter: '03 / CODE QUEST', document: '小小解密员 · 六关挑战 | 译码档案', heading: '#challenge-heading' },
};
const normalize = route => ({ page: Object.hasOwn(chapters, route?.page) ? route.page : 'exhibit', topic: route?.topic === 'wiring' ? 'wiring' : 'drums' });

/** prepare may allocate resources, but must not reveal/activate a page. */
export function createNavigation({
  window: view = globalThis.window, document: doc = view.document,
  prepare, activate, pause = () => {}, motion = { matches: true },
  initialRoute = parseRoute(view.location.hash), currentRoute = null, initialScrolls = {},
}) {
  const $ = selector => doc.querySelector(selector);
  const overlay = $('#page-transition');
  let current = currentRoute ? normalize(currentRoute) : null;
  let pending = null, desired = normalize(initialRoute), busy = false, disposed = false, suspended = false, revision = 0;
  const scrolls = { history: 0, exhibit: 0, lab: 0, challenge: 0, mission: 0, ...initialScrolls };
  const removers = [];
  const previousRestoration = view.history.scrollRestoration;
  function on(target, type, fn) { target?.addEventListener(type, fn); removers.push(() => target?.removeEventListener(type, fn)); }
  function progress(value, caption) {
    if (disposed || suspended) return;
    if ($('#route-progress')) $('#route-progress').value = value;
    overlay?.style.setProperty('--load-progress', `${value}%`);
    if ($('#route-caption')) $('#route-caption').textContent = caption;
    if ($('#route-count')) $('#route-count').textContent = `${String(Math.min(4, Math.max(1, Math.ceil(value / 25)))).padStart(2, '0')} / 04`;
  }
  function hideOverlay() { if (overlay) overlay.hidden = true; doc.body.removeAttribute('aria-busy'); }
  function reveal(route) {
    const history = route.page === 'history';
    for (const page of Object.keys(chapters)) {
      const element = $(`#${page}-page`);
      if (element) { element.hidden = route.page !== page; element.inert = route.page !== page; }
    }
    const shell = $('#application-shell');
    if (shell) { shell.hidden = history; shell.inert = history; }
    doc.body.dataset.page = route.page;
    doc.title = chapters[route.page].document;
    doc.querySelectorAll('[data-chapter]').forEach(link => {
      if (link.dataset.chapter === route.page) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
    });
  }
  async function run() {
    if (busy || disposed || suspended) return;
    busy = true;
    // Capture the page being left once, never overwrite its reading position
    // while a queued preparation has not actually activated another page.
    if (current) scrolls[current.page] = view.scrollY;
    pause();
    doc.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    doc.body.setAttribute('aria-busy', 'true');
    if (overlay) { overlay.hidden = false; overlay.dataset.state = 'loading'; }
    try {
      while (pending && !disposed && !suspended) {
        const route = pending; pending = null; const token = revision;
        if ($('#route-title')) $('#route-title').textContent = chapters[route.page].title;
        if ($('#route-chapter')) $('#route-chapter').textContent = chapters[route.page].chapter;
        progress(8, '准备章节');
        try {
          await prepare(route, (value, caption) => { if (token === revision) progress(value, caption); });
          if (disposed || suspended) break;
          if (token !== revision) continue;
          activate(route);
          current = route; reveal(route);
          if (route.page === 'challenge') scrolls.challenge = 0;
          view.scrollTo({ top: scrolls[route.page], behavior: 'instant' });
          // A native history anchor must retain its anchor destination.
          if (route.page === 'history' && view.location.hash && !view.location.hash.startsWith('#/')) {
            try { doc.getElementById(decodeURIComponent(view.location.hash.slice(1)))?.scrollIntoView(); } catch { /* malformed fragment */ }
          }
          progress(100, '场景已就绪');
          const heading = $(chapters[route.page].heading);
          heading?.setAttribute('tabindex', '-1'); heading?.focus({ preventScroll: true });
          if (!motion.matches) $(`#${route.page}-page`)?.animate?.([{ opacity: .25 }, { opacity: 1 }], { duration: 350 });
        } catch (error) {
          if (disposed || suspended) break;
          if (token !== revision) continue;
          if (overlay) overlay.dataset.state = 'error';
          progress(0, '这一章暂时未能准备完成。请重试，或返回历史。');
          doc.body.removeAttribute('aria-busy');
          return;
        }
      }
      if (!disposed && !suspended) hideOverlay();
    } finally { busy = false; }
  }
  function go(route, push = true) {
    if (disposed) return;
    const destination = normalize(route);
    if (push && view.location.hash !== routeKey(destination)) view.history.pushState(null, '', routeKey(destination));
    desired = destination;
    if (busy && routeKey(destination) === routeKey(pending || desired) && pending && routeKey(pending) === routeKey(destination)) return;
    if (!busy && current && routeKey(destination) === routeKey(current) && overlay?.dataset.state !== 'error') return;
    pending = destination; revision++; void run();
  }
  on(doc, 'click', event => {
    const link = event.target.closest?.('a[data-page]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    event.preventDefault(); go({ page: link.dataset.page, topic: link.dataset.topic });
  });
  const fromLocation = () => go(parseRoute(view.location.hash), false);
  on(view, 'popstate', fromLocation); on(view, 'hashchange', fromLocation);
  on($('#route-retry'), 'click', () => go(desired, false));
  on($('#route-back'), 'click', () => go({ page: 'history' }));
  on(view, 'pagehide', event => {
    if (!event.persisted) { dispose(); return; }
    suspended = true; revision++; if (current) scrolls[current.page] = view.scrollY; pause(); hideOverlay();
  });
  on(view, 'pageshow', event => {
    if (!event.persisted || disposed) return;
    suspended = false;
    // A cached in-flight preparation resumes through the queue, not an old callback.
    if (current) { activate(current); reveal(current); }
    if (!current || routeKey(desired) !== routeKey(current)) { pending = desired; revision++; void run(); }
  });
  function dispose() { if (disposed) return; disposed = true; revision++; pending = null; pause(); removers.forEach(fn => fn()); hideOverlay(); view.history.scrollRestoration = previousRestoration; }
  view.history.scrollRestoration = 'manual';
  if (current) reveal(current);
  if (!current || routeKey(desired) !== routeKey(current)) go(desired, false);
  return { go, dispose, get busy() { return busy; }, get current() { return current ? { ...current } : null; } };
}
