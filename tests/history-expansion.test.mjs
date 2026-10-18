import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { Window } from 'happy-dom';
import { parseRoute } from '../src/routes.js';
import { renderHome } from '../page-shell.mjs';
import { encipher } from '../src/cipher.js';

const expected = ['lifeline','intercept','enigma','daily-key','pioneers','polish-methods','handover','bletchley','turing','crib','constraints','diagonal','victory','operators','intelligence','naval','legacy','onward'];
const read = name => readFile(new URL(`../${name}`, import.meta.url), 'utf8');

test('the history introduction does not promise a different output on every repeated key', async () => {
  assert.equal(encipher('AA', [0, 2, 16]).output, 'OO', 'ACQ provides a counterexample with real Enigma wiring');
  const w = new Window(); w.document.write(await read('history-preview.html'));
  assert.doesNotMatch(w.document.querySelector('#enigma h2').textContent, /下一次就会改变/);
  await w.happyDOM.close();
});

test('eighteen substantive sourced chapters and directory survive both standalone and composed HTML', async () => {
  const historyHtml = await read('history-preview.html');
  const appHtml = await read('index.html');
  for (const html of [historyHtml, renderHome({ appHtml, historyHtml })]) {
    const w = new Window(); w.document.write(html); const d = w.document;
    const chapters = [...d.querySelectorAll('[data-history-scene]')];
    assert.deepEqual(chapters.map(c => c.id), expected);
    const links = [...d.querySelectorAll('nav[aria-label="历史章节"] [data-scene-link]')];
    assert.deepEqual(links.map(a => a.hash), expected.map(id => `#${id}`));
    for (const c of chapters) {
      assert.ok(c.querySelector('h2'), `${c.id} needs a heading`);
      assert.ok([...c.querySelectorAll('p')].map(p => p.textContent).join('').length >= 150, `${c.id} needs substantive prose`);
      assert.ok(c.querySelector('.chapter-reference a[href^="https://"]'), `${c.id} needs a source`);
    }
    const ids = [...d.querySelectorAll('[id]')].map(el => el.id);
    assert.equal(ids.length, new Set(ids).size, 'no duplicate ids in composed app');
    await w.happyDOM.close();
  }
});

test('all published fragment links stay in history including references, reading shortcuts and legacy links', async () => {
  const w = new Window(); w.document.write(await read('history-preview.html')); const d = w.document;
  for (const a of d.querySelectorAll('a[href^="#"]:not([data-page])')) {
    const hash = a.getAttribute('href');
    assert.ok(d.getElementById(hash.slice(1)), `missing target ${hash}`);
    assert.equal(parseRoute(hash).page, 'history', `${hash} must not load 3D`);
  }
  for (const id of expected) assert.equal(parseRoute(`#${id}`).page, 'history', id);
  for (const id of ['lifeline-context','sources']) assert.equal(parseRoute(`#${id}`).page, 'history');
  for (const hash of ['#/','#/lab/drums','#/lab/wiring','#/challenge']) assert.notEqual(parseRoute(hash).page, 'history');
  await w.happyDOM.close();
});

test('archive photographs retain local files, intrinsic dimensions, meaningful alt text and linked credits', async () => {
  const w = new Window(); w.document.write(await read('history-preview.html'));
  for (const img of w.document.querySelectorAll('img')) {
    assert.ok(img.alt.length > 8);
    assert.ok(Number(img.getAttribute('width')) > 0 && Number(img.getAttribute('height')) > 0, img.src);
    assert.ok(img.getAttribute('src').startsWith('assets/history/'));
    assert.ok((await stat(new URL(`../${img.getAttribute('src')}`, import.meta.url))).size > 1000);
    assert.ok(img.closest('figure')?.querySelector('figcaption a[href^="https://"]'), img.src);
  }
  const root = w.document.querySelector('[data-history-preview]');
  assert.equal(root.querySelector('a').getAttribute('href'), '#lifeline-context');
  assert.ok(w.document.querySelector('details.archive-directory summary'));
  await w.happyDOM.close();
});
