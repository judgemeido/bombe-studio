import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Window } from 'happy-dom';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
async function page() {
  const window = new Window();
  window.document.write(await read('history-preview.html'));
  return window.document;
}

test('standalone preview ships approved hero and Turing copy in initial HTML', async () => {
  const doc = await page();
  assert.equal(doc.documentElement.lang, 'zh-CN');
  assert.equal(doc.querySelector('h1').textContent.replace(/\s/g, ''), '在读懂机器之前，先听见它所处的战争。');
  assert.match(doc.body.textContent, /视觉样稿/);
  assert.match(doc.body.textContent, /艾伦·图灵/);
  assert.match(doc.body.textContent, /1936 年，他在关于可计算性的研究中提出抽象机器模型/);
  assert.match(doc.body.textContent, /但它们不是同一台“图灵机器”/);
  assert.ok(doc.querySelector('#turing'));
  assert.ok(doc.querySelector('a[href="#turing"]'));
  assert.ok(doc.querySelector('a[href="/#/"]'));
  assert.equal(doc.querySelectorAll('[data-history-scene]').length, 2);
  assert.equal(doc.querySelectorAll('script:not([src])').length, 0);
});

test('asset boundaries, source notes, and native timeline remain explicit without JS', async () => {
  const doc = await page();
  assert.match(doc.body.textContent, /肖像素材待定/);
  assert.match(doc.body.textContent, /非历史照片/);
  assert.match(doc.body.textContent, /非特定日期的真实航迹/);
  assert.match(doc.body.textContent, /A1.*美国/);
  assert.match(doc.body.textContent, /02.*03.*省略/s);
  assert.equal(doc.querySelectorAll('#turing details li').length, 7);
  assert.match(doc.querySelector('#turing details').textContent, /1952/);
  assert.ok(doc.querySelector('a[href="#sources"]'));
  assert.equal(doc.querySelector('[data-history-image]').getAttribute('src'), 'assets/history/atlantic-aquila-1941.jpg');
  assert.equal(doc.querySelector('[data-history-preview]').dataset.loadState, 'loading');
  assert.ok(doc.querySelector('[data-load-status][role="status"]'));
  assert.ok(doc.querySelector('img[width][height][alt]'));
});

test('preview has isolated bundle and accessible responsive CSS', async () => {
  const doc = await page();
  assert.equal(doc.querySelector('script[type="module"]').getAttribute('src'), 'dist/historyPreview.js');
  assert.ok(doc.querySelector('link[href="history-preview.css"]'));
  assert.doesNotMatch(await read('history-preview.html'), /dist\/app\.js|https?:\/\/[^"\s]+\.(?:jpg|png|webp)/);
  const css = await read('history-preview.css');
  for (const token of ['#142633', '#E4E7E2', '#52614D', '#B69A67']) assert.ok(css.includes(token));
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /@media/);
  assert.doesNotMatch(css, /opacity:\s*0\s*[;}]/, 'initial scene content must not be hidden');
});

test('build and dev server expose preview narrowly with local schematic and MIME support', async () => {
  const { options } = await import('../build.mjs');
  assert.equal(options.entryPoints.historyPreview, 'src/history-preview.js');
  assert.equal(options.entryPoints.app, 'src/main.js');
  const build = await read('build.mjs');
  assert.match(build, /history-preview\.html/);
  assert.match(build, /history-preview\.css/);
  assert.match(build, /assets\/history/);
  const server = await read('dev-server.mjs');
  assert.match(server, /history-preview\.html/);
  assert.match(server, /image\/jpeg/);
  assert.match(server, /image\/webp/);
  assert.match(server, /realpath/);
  const asset = await read('assets/history/atlantic-schematic.svg');
  assert.match(asset, /<svg/);
  assert.match(asset, /非历史照片/);
  assert.doesNotMatch(asset, /<script|<foreignObject|https?:\/\/(?!www.w3.org)/);
});


test('adopted A1 is a real local JPEG with registered provenance and unresolved portrait', async () => {
  const bytes = await readFile(new URL('../assets/history/atlantic-aquila-1941.jpg', import.meta.url));
  assert.equal(bytes.subarray(0, 3).toString('hex'), 'ffd8ff');
  assert.ok(bytes.length > 100000 && bytes.length < 500000);
  const sources = await read('docs/HISTORY_00_SOURCES.md');
  assert.match(sources, /assets\/history\/atlantic-aquila-1941\.jpg/);
  assert.match(sources, /2026-10-17.*NHHC.*核对/);
  assert.match(sources, /A2.*权利矛盾/);
  assert.match(await read('THIRD_PARTY_NOTICES.txt'), /80-G-405290/);
});
