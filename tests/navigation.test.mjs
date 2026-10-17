import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Window } from 'happy-dom';
import { createNavigation } from '../src/navigation.js';
const tick=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
function fixture(t,options={}) {
 const window=new Window({url:'https://example.test/#/history'});const document=window.document;
 document.body.innerHTML=`<div id="application-shell"></div><div id="page-transition" hidden><progress id="route-progress"></progress><span id="route-caption"></span><span id="route-count"></span><h2 id="route-title"></h2><span id="route-chapter"></span><button id="route-retry"></button><button id="route-back"></button></div>`+['history','exhibit','lab','challenge'].map(p=>`<main id="${p}-page"><h1 id="${p==='history'?'hero-title':p+'-heading'}" tabindex="-1">${p}</h1><a data-page="${p}" data-chapter="${p}" href="#/${p}">${p}</a></main>`).join('')+`<a id="native" href="#sources">Sources</a>`;
 window.scrollTo({top:options.initialScrolls?.history || 0});
 const activated=[];let nav;nav=createNavigation({window,document,motion:{matches:true},initialRoute:{page:'history'},currentRoute:{page:'history'},prepare:async()=>{},activate:r=>activated.push(r.page),pause(){},...options});t.after(()=>{nav.dispose();window.happyDOM.abort();});return {window,document,nav,activated};
}
test('initial current is accurate; history metadata/focus, shell inert, scroll restoration',async t=>{
 const f=fixture(t,{initialRoute:{page:'lab',topic:'wiring'},initialScrolls:{history:321}});await tick();assert.equal(f.nav.current.page,'lab');assert.equal(f.document.body.dataset.page,'lab');
 f.nav.go({page:'history'});await tick();assert.equal(f.document.querySelector('#application-shell').inert,true);assert.equal(f.document.querySelector('#history-page').hidden,false);assert.equal(f.document.activeElement.id,'hero-title');assert.equal(f.window.scrollY,321);assert.equal(f.document.querySelector('[data-chapter="history"]').getAttribute('aria-current'),'page');
});
test('old successful prepare cannot activate over newer route',async t=>{
 const d=deferred();const f=fixture(t,{prepare:r=>r.page==='lab'?d.promise:Promise.resolve()});f.nav.go({page:'lab'});await tick();f.nav.go({page:'challenge'});d.resolve();await tick();assert.deepEqual(f.activated,['challenge']);assert.equal(f.nav.current.page,'challenge');
});
test('queued navigation survives earlier prepare rejection and retry repeats failed route',async t=>{
 const d=deferred();let attempts=0;const f=fixture(t,{prepare:r=>{if(r.page==='lab')return d.promise;if(r.page==='challenge'&&++attempts===1)throw Error('offline');}});
 f.nav.go({page:'lab'});await tick();f.nav.go({page:'challenge'});d.reject(Error('old failure'));await tick();assert.equal(f.document.querySelector('#page-transition').dataset.state,'error');assert.equal(f.nav.busy,false);
 f.document.querySelector('#route-retry').click();await tick();assert.deepEqual(f.activated,['challenge']);assert.equal(attempts,2);
});
test('native/modified links, same-history hashes, and disposed preparation remain inert',async t=>{
 const d=deferred();const f=fixture(t,{prepare:()=>d.promise});for(const selector of ['#native','[data-page="lab"]']){const event=new f.window.MouseEvent('click',{bubbles:true,cancelable:true,ctrlKey:selector!=='#native'});f.document.querySelector(selector).dispatchEvent(event);assert.equal(event.defaultPrevented,false);}
 f.window.location.hash='#sources';f.window.dispatchEvent(new f.window.HashChangeEvent('hashchange'));await tick();assert.equal(f.nav.busy,false);
 f.nav.go({page:'lab'});await tick();f.nav.dispose();d.resolve();await tick();assert.deepEqual(f.activated,[]);assert.equal(f.document.body.hasAttribute('aria-busy'),false);
});
