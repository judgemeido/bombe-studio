import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Window } from 'happy-dom';
import { createBootstrap } from '../src/bootstrap.js';
const pageEvent = (window, type, persisted) => Object.assign(new window.Event(type), { persisted });
const tick = async () => { for (let i=0;i<12;i++) await Promise.resolve(); };
const deferred = () => { let resolve, reject; const promise = new Promise((a,b)=>{resolve=a;reject=b;}); return {promise,resolve,reject}; };
function fixture(t, hash='') {
  const window = new Window({url:`https://example.test/${hash}`});
  window.document.body.innerHTML = `<main id="history-page" data-history-preview><h1 id="hero-title">History</h1><p data-load-status></p><section id="sources"></section><a id="anchor" href="#sources">Sources</a></main><div id="application-shell" hidden inert></div><a data-page="lab" href="#/lab/drums">Lab</a><div id="page-transition" hidden><h2 id="route-title">让信号，穿过逻辑。</h2><p id="route-chapter">02 / THE SIGNAL LAB</p><p id="route-caption"></p><button id="route-retry">Retry</button><button id="route-back">Back</button></div>`;
  let boot; t.after(()=>{boot?.dispose();window.happyDOM.abort();});
  return {window, document:window.document, start(options={}) {return boot=createBootstrap({window,document:window.document,...options});}};
}
test('history and native anchors do not import application; history owns visibility', async t=>{
 const f=fixture(t);let loads=0;f.start({loadApplication(){loads++;}});await tick();
 assert.equal(loads,0);assert.equal(f.document.body.dataset.page,'history');assert.equal(f.document.querySelector('#application-shell').inert,true);
 const event=new f.window.MouseEvent('click',{bubbles:true,cancelable:true});f.document.querySelector('#anchor').dispatchEvent(event);assert.equal(event.defaultPrevented,false);
 f.window.location.hash='#sources';f.window.dispatchEvent(new f.window.HashChangeEvent('hashchange'));await tick();assert.equal(loads,0);
});
test('pending import uses last desired route, does not steal history, creates one factory',async t=>{
 const f=fixture(t);const d=deferred();const starts=[];let loads=0;const boot=f.start({loadApplication:()=>{loads++;return d.promise;}});
 boot.go({page:'lab',topic:'wiring'});boot.go({page:'history'});d.resolve({createApplication(opts){starts.push(opts);return {go(){},dispose(){}};}});await tick();
 assert.equal(starts.length,0);assert.equal(f.document.body.dataset.page,'history');
 boot.go({page:'challenge'});await tick();assert.equal(starts.length,1);assert.equal(starts[0].initialRoute.page,'challenge');assert.equal(starts[0].historyPage.currentRoute.page,'history');assert.equal(loads,1);
 boot.go({page:'lab'});await tick();assert.equal(starts.length,1);
});
for(const hash of ['#/lab/wiring','#/challenge','#/']) test(`direct ${hash} hands initial route to factory`,async t=>{
 const f=fixture(t,hash);let options;f.start({loadApplication:async()=>({createApplication(o){options=o;return {go(){},dispose(){}};}})});await tick();assert.equal(options.initialRoute.page,hash.includes('lab')?'lab':hash.includes('challenge')?'challenge':'exhibit');assert.equal(options.historyPage.currentRoute,null);
});
test('rejected import displays retry and clears failed attempt',async t=>{
 const f=fixture(t);let attempts=0,created=0;const boot=f.start({loadApplication:()=>{attempts++;return attempts===1?Promise.reject(Error('offline')):Promise.resolve({createApplication(){created++;return {go(){},dispose(){}};}});}});
 boot.go({page:'lab'});await tick();assert.equal(f.document.querySelector('#page-transition').dataset.state,'error');f.document.querySelector('#route-retry').click();await tick();assert.equal(attempts,2);assert.equal(created,1);assert.equal(f.document.querySelector('#page-transition').hidden,true);
});
test('modified click is native; disposed pending promise cannot mount',async t=>{
 const f=fixture(t);const d=deferred();let creates=0;const boot=f.start({loadApplication:()=>d.promise});
 const click=new f.window.MouseEvent('click',{bubbles:true,cancelable:true,ctrlKey:true});f.document.querySelector('[data-page]').dispatchEvent(click);assert.equal(click.defaultPrevented,false);
 boot.go({page:'lab'});boot.dispose();boot.dispose();d.resolve({createApplication(){creates++;}});await tick();assert.equal(creates,0);
});
test('bfcache destroys and remounts enhancements, nonpersisted pagehide disposes',async t=>{
 const f=fixture(t);let mounts=0,destroys=0,loads=0;f.start({loadApplication:()=>{loads++;},mountHistory:()=>{mounts++;return {destroy(){destroys++;}};}});
 f.window.dispatchEvent(pageEvent(f.window,'pagehide',true));assert.equal(destroys,1);
 f.window.dispatchEvent(pageEvent(f.window,'pageshow',true));assert.equal(mounts,2);
 f.window.dispatchEvent(pageEvent(f.window,'pagehide',false));f.window.dispatchEvent(new f.window.HashChangeEvent('hashchange'));assert.equal(destroys,2);assert.equal(loads,0);
});


for (const anchor of [false, true]) test(`stale import rejection preserves history${anchor ? ' native anchor' : ''} and allows retry`, async t => {
  const f = fixture(t); const d = deferred(); let loads = 0, creates = 0;
  const boot = f.start({ loadApplication: () => { loads++; return loads === 1 ? d.promise : Promise.resolve({ createApplication() { creates++; return { go() {}, dispose() {} }; } }); } });
  boot.go({ page: 'lab' }); await tick(); assert.equal(loads, 1);
  if (anchor) {
    f.window.location.hash = '#sources';
    f.window.dispatchEvent(new f.window.HashChangeEvent('hashchange'));
  } else boot.go({ page: 'history' });
  await tick(); d.reject(Error('offline')); await tick();
  assert.equal(f.document.body.dataset.page, 'history');
  assert.equal(f.document.querySelector('#history-page').hidden, false);
  assert.equal(f.document.querySelector('#page-transition').hidden, true);
  assert.equal(f.document.body.hasAttribute('aria-busy'), false);
  assert.equal(creates, 0);
  assert.equal(f.window.location.hash, anchor ? '#sources' : '#/history');
  boot.go({ page: 'challenge' }); await tick(); assert.equal(loads, 2); assert.equal(creates, 1);
});

test('shared pending import restores latest loading UI after lab to history to challenge', async t => {
  const f = fixture(t); const d = deferred(); let loads = 0; const starts = [];
  const boot = f.start({ loadApplication: () => { loads++; return d.promise; } });
  boot.go({ page: 'lab' }); await tick();
  boot.go({ page: 'history' });
  assert.equal(f.document.querySelector('#page-transition').hidden, true);
  boot.go({ page: 'challenge' });
  const overlay = f.document.querySelector('#page-transition');
  assert.equal(overlay.hidden, false); assert.equal(overlay.dataset.state, 'loading');
  assert.equal(f.document.body.getAttribute('aria-busy'), 'true');
  assert.equal(f.document.querySelector('#route-title').textContent, '小小解密员，轮到你了。');
  assert.equal(f.document.querySelector('#route-chapter').textContent, '03 / CODE QUEST');
  assert.equal(loads, 1);
  d.resolve({ createApplication(options) { starts.push(options); return { go() {}, dispose() {} }; } }); await tick();
  assert.equal(starts.length, 1); assert.equal(starts[0].initialRoute.page, 'challenge');
  assert.equal(overlay.hidden, true); assert.equal(f.document.body.hasAttribute('aria-busy'), false);
});

for (const [hash, title, chapter] of [
  ['#/challenge', '小小解密员，轮到你了。', '03 / CODE QUEST'],
  ['#/', '回到机器的全貌。', '01 / THE BOMBE'],
]) test(`initial ${hash} loading overlay has matching metadata`, async t => {
  const f = fixture(t, hash); const d = deferred(); f.start({ loadApplication: () => d.promise });
  assert.equal(f.document.querySelector('#route-title').textContent, title);
  assert.equal(f.document.querySelector('#route-chapter').textContent, chapter);
  assert.equal(f.document.querySelector('#page-transition').hidden, false);
  assert.equal(f.document.body.getAttribute('aria-busy'), 'true');
});

test('latest interactive request still receives shared import failure', async t => {
  const f = fixture(t); const d = deferred(); let loads = 0;
  const boot = f.start({ loadApplication: () => { loads++; return d.promise; } });
  boot.go({ page: 'lab' }); await tick(); boot.go({ page: 'history' }); boot.go({ page: 'challenge' });
  d.reject(Error('offline')); await tick();
  assert.equal(loads, 1); assert.equal(f.document.querySelector('#page-transition').hidden, false);
  assert.equal(f.document.querySelector('#page-transition').dataset.state, 'error');
  assert.equal(f.document.body.hasAttribute('aria-busy'), false);
});
