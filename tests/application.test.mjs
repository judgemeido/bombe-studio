import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Window} from 'happy-dom';
import {createApplication} from '../src/main.js';
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function setup(){const window=new Window({url:'http://localhost/#/'});window.document.write(html);const old=Object.fromEntries(['window','document','matchMedia'].map(k=>[k,globalThis[k]]));Object.assign(globalThis,{window,document:window.document,matchMedia:()=>({matches:true})});return {window,async close(){Object.assign(globalThis,old);await window.happyDOM.close();}};}
test('main imports without a DOM or a WebGL allocation',()=>assert.equal(typeof createApplication,'function'));
test('chapters prepare while hidden, activate singly, keep state and retry failed frames',async()=>{
  const env=setup();let nav,app,fail=true;const calls=[],created=[],released=[];
  const history={currentRoute:{page:'history'},scrollY:317,activate(){calls.push('history');},deactivate(){}};
  const runtime={createNavigation(options){nav=options;return {go:r=>r,dispose(){}};},createChapterFrame(root,{page}){
    created.push(page);return {ready:page==='exhibit'&&fail?Promise.reject(new Error('GPU failed')):Promise.resolve(),setActive(v){calls.push([page,v]);},setTopic(v){calls.push(['topic',v]);},inspect(){return {ready:true};},dispose(){released.push(page);}};
  }};
  try{
    app=createApplication({initialRoute:{page:'lab'},historyPage:history,runtime});assert.equal(created.length,0);assert.equal(nav.initialScrolls.history,317);
    const roots=[...document.querySelectorAll('main.teardown-chapter')],visible=roots.map(e=>e.hidden);
    await nav.prepare({page:'history'});await nav.prepare({page:'lab'});await nav.prepare({page:'challenge'});assert.deepEqual(calls,[]);assert.deepEqual(roots.map(e=>e.hidden),visible);
    nav.activate({page:'lab',topic:'wiring'});assert.ok(calls.some(c=>c[0]==='lab'&&c[1]===true));assert.ok(calls.some(c=>c[0]==='challenge'&&c[1]===false));
    await assert.rejects(nav.prepare({page:'exhibit'}),/GPU failed/);assert.deepEqual(released,['exhibit']);fail=false;
    await Promise.all([nav.prepare({page:'exhibit'}),nav.prepare({page:'exhibit'})]);assert.equal(created.filter(p=>p==='exhibit').length,2);
    nav.activate({page:'challenge'});nav.activate({page:'history'});await nav.prepare({page:'challenge'});assert.equal(created.filter(p=>p==='challenge').length,1);
    nav.pause();assert.deepEqual(calls.slice(-3).map(c=>c[1]),[false,false,false]);app.dispose();assert.equal(released.length,4);
  }finally{app?.dispose();await env.close();}
});
test('disposing during mission module load prevents construction; late controllers are released',async()=>{
  const env=setup();let nav,app,resolveModule,resolveController,constructed=0,released=0;
  const runtime={createNavigation(options){nav=options;return {go(){},dispose(){}};},loadMission:()=>new Promise(r=>resolveModule=r)};
  try{
    app=createApplication({runtime});const pending=nav.prepare({page:'mission'});await tick();app.dispose();resolveModule({createMission(){constructed++;}});await assert.rejects(pending,/disposed/);assert.equal(constructed,0);
    runtime.loadMission=async()=>({createMission(){constructed++;return new Promise(r=>resolveController=r);}});app=createApplication({runtime});const late=nav.prepare({page:'mission'});await tick();app.dispose();resolveController({dispose(){released++;}});await assert.rejects(late,/disposed/);assert.equal(released,1);assert.equal(window.__BOMBE_INSPECT__,undefined);
  }finally{app?.dispose();await env.close();}
});
test('disposing during chapter preparation releases the pending frame and prevents activation',async()=>{
  const env=setup();let nav,app,resolveReady,released=0,active=0;
  try{app=createApplication({runtime:{createNavigation(options){nav=options;return {go(){},dispose(){}};},createChapterFrame(){return {ready:new Promise(r=>resolveReady=r),setActive(){active++;},dispose(){released++;}};}}});const pending=nav.prepare({page:'lab'});await tick();app.dispose();resolveReady();await assert.rejects(pending,/disposed/);nav.activate({page:'lab'});assert.equal(active,0);assert.equal(released,1);}finally{app?.dispose();await env.close();}
});
