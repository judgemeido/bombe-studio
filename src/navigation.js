const parse = hash => ({ page: hash.startsWith('#/lab') ? 'lab' : 'exhibit', topic: hash.endsWith('/wiring') ? 'wiring' : 'drums' });
const key = route => route.page === 'lab' ? `#/lab/${route.topic}` : '#/';
const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));

export function createNavigation({ prepare, activate, pause, motion }) {
  const overlay = document.querySelector('#page-transition'), bar = document.querySelector('#route-progress');
  let current = { page: 'exhibit', topic: 'drums' }, pending = null, busy = false, disposed = false;
  const scrolls = { exhibit: 0, lab: 0 };
  const listeners = [];
  function on(el, name, fn) { el.addEventListener(name, fn); listeners.push(() => el.removeEventListener(name, fn)); }
  function progress(value, caption) {
    bar.value = value; overlay.style.setProperty('--load-progress', `${value}%`);
    document.querySelector('#route-caption').textContent = caption;
    document.querySelector('#route-count').textContent = `${String(Math.min(4, Math.max(1, Math.ceil(value / 25)))).padStart(2, '0')} / 04`;
  }
  async function run() {
    if (busy || disposed) return; busy = true;
    document.body.setAttribute('aria-busy', 'true'); pause();
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    overlay.hidden = false; overlay.dataset.state = 'loading';
    while (pending && !disposed) {
      const route = pending; pending = null;
      pause();
      scrolls[current.page] = window.scrollY;
      document.querySelector('#route-title').textContent = route.page === 'lab' ? '让信号，穿过逻辑。' : '回到机器的全貌。';
      document.querySelector('#route-chapter').textContent = route.page === 'lab' ? '02 / THE SIGNAL LAB' : '01 / THE BOMBE';
      progress(8, '准备章节');
      if (!motion.matches) await overlay.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 210, easing: 'ease-out' }).finished;
      await nextFrame();
      try {
        await prepare(route, progress); if (disposed) return;
        progress(100, '场景已就绪'); await nextFrame(); await nextFrame();
        current = route;
        if (pending && key(pending) === key(route)) pending = null;
        activate(route); window.scrollTo({ top: scrolls[route.page], behavior: 'instant' });
        document.querySelectorAll('[data-chapter]').forEach(link => { if (link.dataset.chapter === route.page) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); });
        document.title = route.page === 'lab' ? '信号实验室 · 译码档案' : 'BOMBE · 译码档案 | 交互机械展';
        if (!pending && !motion.matches) {
          const page = document.querySelector(route.page === 'lab' ? '#lab-page' : '#exhibit-page');
          page.animate([{ opacity: .25, transform: 'translateY(24px)', filter: 'blur(5px)' }, { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' }], { duration: 650, easing: 'cubic-bezier(.2,.7,.2,1)' });
          await overlay.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-102%)' }], { duration: 520, easing: 'cubic-bezier(.76,0,.24,1)' }).finished;
        }
      } catch (error) {
        overlay.dataset.state = 'error'; progress(0, '这一章暂时未能准备完成。请重试，或返回展品。');
        console.error('Chapter preparation failed:', error); busy = false; document.body.removeAttribute('aria-busy'); return;
      }
    }
    if (disposed) return;
    overlay.hidden = true; busy = false; document.body.removeAttribute('aria-busy');
    const title = document.querySelector(current.page === 'lab' ? '#lab-heading' : '#exhibit-heading'); title.focus({ preventScroll: true });
    // Back/forward or repeated navigation during loading always resolves to the latest request.
    if (pending) run();
  }
  function go(route, push = true) {
    const destination = { page: route.page === 'lab' ? 'lab' : 'exhibit', topic: route.topic === 'wiring' ? 'wiring' : 'drums' };
    if (!busy && key(destination) === key(current) && overlay.hidden) return;
    if (push && location.hash !== key(destination)) history.pushState(null, '', key(destination));
    pending = destination; run();
  }
  on(document, 'click', event => {
    const link = event.target.closest('a[data-page]');
    if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    event.preventDefault(); go({ page: link.dataset.page, topic: link.dataset.topic });
  });
  on(window, 'popstate', () => go(parse(location.hash), false));
  on(window, 'hashchange', () => go(parse(location.hash), false));
  // A rejected dynamic import is cached by the browser's module map. A reload
  // creates a fresh map so retry can recover from a transient chunk failure.
  on(document.querySelector('#route-retry'), 'click', () => location.reload());
  on(document.querySelector('#route-back'), 'click', () => go({ page: 'exhibit' }));
  history.scrollRestoration = 'manual';
  if (parse(location.hash).page === 'lab') go(parse(location.hash), false);
  return { go, get busy() { return busy; }, get current() { return { ...current }; }, dispose() { disposed = true; listeners.forEach(remove => remove()); } };
}
