import {connectChapter} from '../bridge.js';
import {createStage} from './stage.js';
import {createConsole,icon} from './console.js';
import {stateAt,PARTS,tourAt,SPACE,mod} from './kinematics.js';

document.documentElement.lang='zh-CN';document.title='Bombe Atelier · 机械的逻辑';
const ui=createConsole(document.getElementById('app')), $=ui.$;
const capture=new URLSearchParams(location.search).has('capture')||!!window.__CAPTURE;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let stage;
try{stage=createStage(ui.canvas);}catch(error){$('loading').innerHTML='<span>三维渲染未能启动</span><p>请使用支持 WebGL 的浏览器，并开启硬件加速。</p>';throw error;}
let ticks=0, speed=26, running=!reduced.matches, explode=0, explodeTarget=0, part=null, shell=false, isolate=false, selected=0;
let tour=false,tourStart=0,tourStep=-1,autoEligible=!reduced.matches,lastInput=performance.now(),lastFrame=performance.now(),lastPaint=-1,view='hero';
let raf=0,toastTimer,ready=false,active=parent===window;
const bridge=connectChapter({activate(value){active=value;lastFrame=performance.now();lastInput=lastFrame;stage.resize();if(ready&&active&&!raf&&!capture)raf=requestAnimationFrame(frame);if(!active){cancelAnimationFrame(raf);raf=0;}}});
const options=()=>({part,shell,isolate,selected,reducedMotion:reduced.matches});
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,2600);}
function updatePlay(){
  $('play').innerHTML=icon(running?'pause':'play');$('play').setAttribute('aria-label',running?'暂停运行':'开始运行');
  $('play-state').textContent=running?'正在检验轮位':'轮位已暂停';$('running-badge').textContent=running?'运行中':'已暂停';
}
function updatePart(){
  document.querySelectorAll('[data-part]').forEach(b=>{const on=b.dataset.part===part;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on);});
  const p=PARTS.find(p=>p.id===part);
  $('detail-no').textContent=p?`FIELD NOTE / ${p.number.padStart(3,'0')}`:'FIELD NOTE / 001';
  $('detail-title').textContent=p?p.title:'从一台机器，看见一种思路。';
  $('detail-copy').textContent=p?p.description:'选择一个系统，查看它如何与整机协同工作。双击鼓轮，可以靠近检查轮面细节。';
  $('detail-sub').textContent=p?p.detail:'五个系统，一条机械逻辑。';
  $('isolate').disabled=!part;$('isolate').classList.toggle('active',isolate);$('isolate').setAttribute('aria-pressed',isolate);
  $('isolate').innerHTML=`${icon('cube')} ${isolate?'返回整机环境':'单独查看此系统'}`;
  document.querySelector('.intro-foot b').textContent=p?`${p.number} / 05`:'01 / 05';
  $('shell').checked=shell;
}
function setView(id,immediate=false){
  view=id;stage.setView(id,immediate);
  document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===id));
  $('view-caption').textContent=({hero:'01 — 整机视图',front:'02 — 鼓轮正面',back:'03 — 后部结构',detail:'04 — 鼓轮微距',explode:'05 — 分层拆解',motor:'06 — 电机特写'})[id]||'自由视角';
}
function setExplode(n,changeCamera=true){
  explodeTarget=Math.max(0,Math.min(1,n));$('explode').value=Math.round(explodeTarget*100);$('explode-value').value=`${Math.round(explodeTarget*100)}%`;
  $('explode-button').classList.toggle('active',explodeTarget>.1);$('explode-button').querySelector('span').textContent=explodeTarget>.1?'合拢整机':'拆解整机';
  if(reduced.matches)explode=explodeTarget;
  if(changeCamera){isolate=false;updatePart();setView(explodeTarget>.1?'explode':'hero');}
}
function stopTour(manual=false){
  tour=false;$('tour').classList.remove('active');$('tour').querySelector('span').textContent='开始自动导览';$('tour-caption').hidden=true;
  if(manual)autoEligible=false;
}
function input(){lastInput=performance.now();if(tour){stopTour();$('tour-hint').textContent='已交给你控制 · 随时可重新开始导览';}}
function startTour(){
  tour=true;tourStart=performance.now();tourStep=-1;running=true;autoEligible=true;isolate=false;selected=0;ticks=0;speed=26;
  $('speed').value=speed;$('speed-value').value='1×';$('tour').classList.add('active');$('tour').querySelector('span').textContent='结束自动导览';$('tour-caption').hidden=false;
  $('tour-hint').textContent='自动导览中 · 任意操作即可接管';updatePlay();
}
function selectPart(id){
  part=id;isolate=false;
  if(id==='drive'){shell=true;setExplode(0,false);setView('back');}
  else if(id==='wiring'){shell=true;setExplode(0,false);setView('back');}
  else if(id==='motor'){shell=true;setExplode(.8,false);setView('explode');}
  else if(id==='frame'){shell=false;setExplode(.7,false);setView('explode');}
  else{setExplode(0,false);setView('front');}
  updatePart();
}
function command(name,value){
  input();
  if(name==='play'){running=!running;autoEligible=false;updatePlay();}
  else if(name==='step'){running=false;autoEligible=false;ticks=Math.floor(ticks)+1;updatePlay();paint(true);}
  else if(name==='reset'){ticks=0;speed=26;running=!reduced.matches;part=null;shell=false;isolate=false;selected=0;autoEligible=false;stopTour();setExplode(0,false);setView('hero');$('speed').value=26;$('speed-value').value='1×';updatePlay();updatePart();paint(true);}
  else if(name==='explode')setExplode(value??(explodeTarget>.1?0:1));
  else if(name==='part')selectPart(value);
  else if(name==='view'){isolate=false;updatePart();setView(value);if(value==='detail'){part='drums';updatePart();}}
  else if(name==='isolate'){isolate=!isolate;if(isolate){setExplode(0,false);setView(part==='motor'?'motor':part==='wiring'||part==='drive'?'back':'front');}else selectPart(part);updatePart();}
}
const on=(id,type,fn)=>$(id).addEventListener(type,fn);
on('play','click',()=>command('play'));on('step','click',()=>command('step'));on('reset','click',()=>command('reset'));
on('explode-button','click',()=>command('explode'));on('explode','input',e=>command('explode',Number(e.target.value)/100));
on('speed','input',e=>{input();speed=Number(e.target.value);$('speed-value').value=`${(speed/26).toFixed(2).replace(/0+$/,'').replace(/\.$/,'')}×`;ui.update(stateAt(ticks),speed);});
on('isolate','click',()=>command('isolate'));
on('shell','change',e=>{input();shell=e.target.checked;});
on('quality','change',e=>{input();stage.setQuality(e.target.checked);toast(e.target.checked?'已切换节能画质':'已恢复精细画质');});
on('tour','click',()=>{if(tour){stopTour(true);lastInput=performance.now();$('tour-hint').textContent='手动模式 · 点击可重新开始导览';}else startTour();});
document.querySelectorAll('[data-part]').forEach(b=>b.addEventListener('click',()=>command('part',b.dataset.part)));
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>command('view',b.dataset.view)));
document.querySelector('.brand').addEventListener('click',e=>{e.preventDefault();command('reset');});
on('about','click',()=>{input();$('about-dialog').showModal();});on('close-about','click',()=>$('about-dialog').close());
$('about-dialog').addEventListener('click',e=>{if(e.target===$('about-dialog')){const r=$('about-dialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('about-dialog').close();}});
on('fullscreen','click',async()=>{input();try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('当前浏览器未允许全屏');}});
on('snapshot','click',()=>{input();const link=document.createElement('a');link.download='Bombe-Atelier.png';link.href=stage.screenshot();link.click();toast('模型截图已保存');});
let down=null;
ui.canvas.addEventListener('pointerdown',e=>{input();down={x:e.clientX,y:e.clientY};});
ui.canvas.addEventListener('pointerup',e=>{
  if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<5){const hit=stage.selectDrum(e.clientX,e.clientY);if(hit!==null){selected=hit;part='drums';isolate=false;updatePart();const p=stage.model.positions[hit];$('drum-id').textContent=`${String.fromCharCode(65+p.bank)} · ${String(p.col+1).padStart(2,'0')} / ${['I','II','III'][p.row]}`;}}
  down=null;
});
ui.canvas.addEventListener('dblclick',()=>{if(part==='drums'){setView('detail');stage.focusDrum(selected,explode);}});
ui.canvas.addEventListener('wheel',input,{passive:true});
document.addEventListener('keydown',e=>{
  if($('about-dialog').open||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
  if(e.code==='Space'&&e.target.tagName==='BUTTON')return;
  if(e.code==='Space'){e.preventDefault();command('play');}else if(e.key.toLowerCase()==='e')command('explode');else if(e.key.toLowerCase()==='r')command('reset');
});
document.addEventListener('visibilitychange',()=>{lastFrame=performance.now();lastInput=lastFrame;if(!document.hidden&&active&&ready&&!raf&&!capture)raf=requestAnimationFrame(frame);});
addEventListener('resize',()=>stage.resize());
reduced.addEventListener('change',()=>{if(reduced.matches){running=false;stopTour(true);explode=explodeTarget;updatePlay();}});
function paint(force=false){const s=stateAt(ticks);if(force||s.n!==lastPaint){ui.update(s,speed);lastPaint=s.n;}return s;}
function applyTour(t,immediate=false){
  const beat=tourAt(t);if(beat.at!==tourStep){tourStep=beat.at;part=beat.part;isolate=false;shell=part==='drive'||part==='wiring';setView(beat.view,immediate);setExplode(beat.explode,false);updatePart();$('tour-caption').textContent=beat.title;}
}
function frame(now){
  raf=0;if(!active||document.hidden)return;
  const dt=Math.max(0,Math.min((now-lastFrame)/1000,.08));lastFrame=now;
  if(!document.hidden&&!$('about-dialog').open){
    if(tour)applyTour((now-tourStart)/1000);
    else if(autoEligible&&now-lastInput>25000)startTour();
    if(running)ticks+=dt*speed;
    explode+=(explodeTarget-explode)*(reduced.matches?1:1-Math.exp(-dt*5.5));
  }
  const s=paint();stage.frame(s,explode,options(),dt);
  raf=requestAnimationFrame(frame);
}
updatePlay();updatePart();
await stage.warm();
stage.frame(paint(true),0,options());if(capture)$('loading').remove();else{$('loading').style.opacity=0;setTimeout(()=>$('loading')?.remove(),400);}ready=true;
window.BOMBE={get state(){return {active,ticks,running,speed,explode,explodeTarget,part,isolate,shell,tour,view,selected,letters:stateAt(ticks).letters,ready};},get metrics(){return {...stage.model.metrics,drawCalls:stage.renderer.info.render.calls,triangles:stage.renderer.info.render.triangles,textures:stage.renderer.info.memory.textures,geometries:stage.renderer.info.memory.geometries};},stage};
window.SIM={ready:true,duration:56,fps:60,render(t){
  const beat=tourAt(t);part=beat.part;shell=part==='drive'||part==='wiring';isolate=false;selected=0;ticks=mod(t*26,SPACE);speed=26;
  explode=explodeTarget=beat.explode;setView(beat.view,true);setExplode(beat.explode,false);updatePart();$('tour-caption').hidden=false;$('tour-caption').textContent=beat.title;
  stage.frame(paint(true),explode,options(),0);
}};
bridge.ready();
if(!capture&&active){lastFrame=performance.now();raf=requestAnimationFrame(frame);}
addEventListener('pagehide',()=>{cancelAnimationFrame(raf);stage.dispose();},{once:true});
