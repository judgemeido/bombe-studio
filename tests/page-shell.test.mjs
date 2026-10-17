import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Window } from 'happy-dom';
import { renderHome } from '../page-shell.mjs';
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
async function home() { return renderHome({ appHtml: await read('index.html'), historyHtml: await read('history-preview.html') }); }
function document(html) { const doc = new Window().document; doc.write(html); return doc; }
test('home composes exactly one readable history with an inert app and shared overlay', async () => {
  const doc = document(await home());
  const history = doc.querySelector('#history-page[data-history-preview]');
  const app = doc.querySelector('#application-shell');
  assert.ok(history && !history.hidden && !history.hasAttribute('inert'));
  assert.ok(app.hidden && app.hasAttribute('inert'));
  assert.equal(doc.body.dataset.page, 'history');
  assert.equal(history.querySelectorAll('[data-history-scene]').length, 7);
  assert.ok(history.querySelector('header') && history.querySelector('footer'));
  assert.equal(history.querySelector('#hero-title').getAttribute('tabindex'), '-1');
  const ids = [...doc.querySelectorAll('[id]')].map(el => el.id);
  assert.equal(ids.length, new Set(ids).size);
  for (const id of ['note-dialog', 'archive-dialog', 'help-dialog']) assert.ok(app.querySelector(`#${id}`));
  assert.ok(doc.querySelector('#page-transition'));
  assert.equal(app.querySelector('#page-transition'), null);
  assert.equal(history.querySelector('#page-transition'), null);
  assert.deepEqual([...doc.querySelectorAll('script[src]')].map(s => s.getAttribute('src')), ['dist/bootstrap.js']);
  for (const name of ['styles.css', 'history-preview.css']) assert.ok(doc.querySelector(`link[href="${name}"]`));
});
test('both page headers expose four chapters and brand returns to 00', async () => {
  const doc = document(await home());
  for (const root of ['#application-shell', '#history-page']) {
    assert.equal(doc.querySelector(`${root} .brand`).getAttribute('href'), '#/history');
    assert.deepEqual([...doc.querySelectorAll(`${root} header [data-chapter]`)].map(el => el.dataset.page), ['history', 'exhibit', 'lab', 'challenge']);
  }
  for (const link of doc.querySelectorAll('[data-scene-link]')) assert.equal(link.hasAttribute('data-page'), false);
});
test('composition rejects missing or duplicate explicit boundaries rather than guessing at HTML', async () => {
  const appHtml = await read('index.html'), historyHtml = await read('history-preview.html');
  assert.throws(() => renderHome({ appHtml: '<body>unmarked</body>', historyHtml }), /marker/i);
  assert.throws(() => renderHome({ appHtml, historyHtml: '<body>unmarked</body>' }), /marker/i);
  assert.throws(() => renderHome({ appHtml: appHtml + '<!-- APP-SHELL:START -->', historyHtml }), /marker/i);
});
test('dev and production use the same composer and bootstrap entry contract', async () => {
  const { options } = await import('../build.mjs');
  assert.equal(options.entryPoints.bootstrap, 'src/bootstrap.js');
  assert.equal(options.entryPoints.app, undefined);
  for (const path of ['build.mjs', 'dev-server.mjs']) assert.match(await read(path), /renderHome\(/);
});
test('history CSS scopes generic selectors and only paints body in history mode', async () => {
  const css = await read('history-preview.css');
  assert.doesNotMatch(css, /(?:^|\})\s*(?:\/\*[\s\S]*?\*\/\s*)?(?::root|body|html|a|\.brand|\.chapter-nav)\s*\{/m);
  assert.match(css, /:where\(\[data-history-preview\]\)/);
  assert.match(css, /body\[data-page="history"\]/);
  assert.match(css, /body\[data-history-preview\]/);
  const app = await read('styles.css');
  assert.doesNotMatch(app, /:root\s*\{/);
  assert.match(app, /:where\(#application-shell, #page-transition\)/);
});
test('composed history preserves every source scene, caption, source note and local asset', async () => {
  const source = document(await read('history-preview.html'));
  const doc = document(await home());
  for (const scene of source.querySelectorAll('[data-history-scene], #sources')) {
    assert.equal(doc.getElementById(scene.id).outerHTML, scene.outerHTML);
  }
  for (const asset of doc.querySelectorAll('link[rel="stylesheet"][href], img[src]')) {
    const path = asset.getAttribute('href') || asset.getAttribute('src');
    if (!path.startsWith('data:')) assert.ok((await readFile(new URL(`../${path}`, import.meta.url))).length, path);
  }
});
test('both contained stylesheets parse without CSS warnings', async () => {
  const { transform } = await import('esbuild');
  for (const file of ['styles.css', 'history-preview.css']) {
    const result = await transform(await read(file), { loader: 'css' });
    assert.deepEqual(result.warnings, [], file);
  }
});

test('home and preview use publication-neutral archive copy and history return label', async () => {
  for (const html of [await home(), await read('history-preview.html')]) {
    const doc = document(html);
    assert.match(doc.body.textContent, /七幕档案/);
    assert.doesNotMatch(doc.body.textContent, /七幕预览|尚未替换主应用首页|这是七幕独立预览/);
    assert.equal(doc.querySelector('#lifeline').getAttribute('aria-labelledby'), 'hero-title');
    assert.equal(doc.querySelector('#hero-title').getAttribute('tabindex'), '-1');
  }
  assert.equal(document(await home()).querySelector('#route-back').textContent, '返回战时序章');
});
