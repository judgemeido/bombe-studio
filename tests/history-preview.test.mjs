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
  assert.equal(doc.querySelector('h1').textContent.replace(/\s/g, ''), '在机器之前，先读懂那场无声的较量。');
  assert.match(doc.body.textContent, /18节档案/);
  assert.match(doc.body.textContent, /艾伦·图灵/);
  assert.match(doc.body.textContent, /1936 年，他在关于可计算性的研究中提出抽象机器模型/);
  assert.match(doc.body.textContent, /但它们不是同一台“图灵机器”/);
  assert.ok(doc.querySelector('#turing'));
  assert.ok(doc.querySelector('a[href="#turing"]'));
  assert.ok(doc.querySelector('a[href="/#/"]'));
  assert.deepEqual([...doc.querySelectorAll('[data-history-scene]')].map(el => el.id), ['lifeline','intercept','enigma','daily-key','pioneers','polish-methods','handover','bletchley','turing','crib','constraints','diagonal','victory','operators','intelligence','naval','legacy','onward']);
  assert.equal(doc.querySelectorAll('script:not([src])').length, 0);
});

test('asset boundaries, source notes, and native timeline remain explicit without JS', async () => {
  const doc = await page();
  assert.match(doc.body.textContent, /图灵真实肖像/);
  assert.match(doc.body.textContent, /现代重建/);
  assert.match(doc.body.textContent, /1941年12月/);
  assert.match(doc.body.textContent, /A1.*美国/);
  assert.doesNotMatch(doc.body.textContent, /两幕|暂时省略|本次仅呈现/);
  assert.match(doc.querySelector('#turing details').textContent, /1936[\s\S]*1954/);
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
  assert.doesNotMatch(await read('history-preview.html'), /dist\/app\.js/);
  for (const img of doc.querySelectorAll('img')) assert.ok(img.getAttribute('src').startsWith('assets/history/'));
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
  assert.equal(options.entryPoints.bootstrap, 'src/bootstrap.js');
  assert.equal(options.entryPoints.app, undefined);
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

// Production regressions: a missing chapter, index target, contributor or diagram must fail.
test('eighteen chapter index links resolve and hero belongs to lifeline', async () => {
  const doc = await page();
  const scenes = [...doc.querySelectorAll('[data-history-scene]')];
  const links = [...doc.querySelectorAll('nav[aria-label="历史章节"] [data-scene-link]')];
  assert.equal(links.length, 18);
  assert.deepEqual(links.map(a => a.getAttribute('href')), scenes.map(s => `#${s.id}`));
  assert.ok(doc.querySelector('#lifeline h1'));
  assert.equal(new Set(scenes.map(s => s.id)).size, 18);
  for (const scene of scenes) assert.ok(scene.querySelector('h2'));
});

test('complete approved narrative and expandable background ship without controllers', async () => {
  const doc = await page();
  for (const name of ['马里安·雷耶夫斯基', '耶日·鲁日茨基', '亨里克·齐加尔斯基', 'Marian Rejewski', 'Jerzy Różycki', 'Henryk Zygalski']) assert.ok(doc.querySelector('#pioneers').textContent.includes(name));
  assert.match(doc.querySelector('#pioneers').textContent, /1932[\s\S]*1939 年 7 月/);
  assert.match(doc.querySelector('#constraints').textContent, /韦尔奇曼[\s\S]*BTM[\s\S]*候选仍需检查/);
  for (const step of ['截收', '分析', '搜索', '检查', '解读', '传递', '判断']) assert.ok(doc.querySelector('#intelligence').textContent.includes(step));
  for (const id of ['lifeline', 'polish-methods', 'turing', 'constraints', 'intelligence']) assert.ok(doc.querySelector(`#${id} details summary`));
  for (const href of ['/#/', '/#/lab/drums', '/#/challenge']) assert.ok(doc.querySelector(`#onward a[href="${href}"]`));
  assert.match(doc.querySelector('#sources').textContent, /S1/);
  for (const a of doc.querySelectorAll('a[href^="#"]:not([data-page])')) assert.ok(doc.getElementById(a.hash.slice(1)), a.hash);
});

test('photographic galleries replace the five original diagrams without gating text', async () => {
  const doc = await page();
  assert.equal(doc.querySelectorAll('[data-diagram-source],svg').length, 0);
  assert.equal(doc.querySelectorAll('[data-history-gallery]').length, 2);
  for (const gallery of doc.querySelectorAll('[data-history-gallery]')) assert.ok(gallery.querySelectorAll('img').length >= 2);
  const css = await read('history-preview.css');
  assert.match(css, /aria-current="location"/);
  assert.doesNotMatch(css, /visibility:\s*hidden/, 'reading never waits for an animation');
  assert.match(css, /\.reader-sidebar[\s\S]*position:\s*sticky/);
  assert.match(css, /\.archive-cover\s*\{[^}]*background:\s*var\(--sea\)/);
});

test('verified S6 uses approved narrower supply wording and linked VAC sources', async () => {
  const doc = await page();
  assert.match(doc.querySelector('#lifeline').textContent, /英国需要通过海运接收物资与人员/);
  assert.doesNotMatch(doc.body.textContent, /S6.{0,8}(?:待|仍待)|宏观背景待|食物、燃料和工业原料/);
  const sources = doc.querySelector('#sources');
  assert.match(sources.textContent, /S6/);
  for (const path of ['battle-atlantic', 'chronology-second-world-war']) assert.ok(sources.querySelector(`a[href="https://www.veterans.gc.ca/en/remembrance/military-history/second-world-war/${path}"]`));
  assert.match(sources.textContent, /A2 \/ 图灵真实肖像/);
});
