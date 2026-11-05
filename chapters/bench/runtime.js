import {createStage} from './stage.js';
import {createConsole} from './console.js';
import {connectChapter} from '../bridge.js';
import {ALPHABET,letter,traceLetter,pressKey,tourState} from './kinematics.js';
import {LEVELS,createChallengeSet,freshSeed,createSession,submitAnswer,advanceSession,createMissionState,prepareMission,decodeMissionLetter,positionText} from '../../src/challenge-engine.js';

export async function createExperience(mode){
  const quest=mode==='challenge',ui=createConsole(mode),$=ui.$;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),capture=new URLSearchParams(location.search).has('capture');
  let stage;
  try{stage=createStage(ui.canvas);}catch(error){$('loading').textContent='无法初始化三维模型。请启用浏览器硬件加速后重新载入。';throw error;}
  let state={positions:[0,0,0],pairs:[],spread:.65,cut:true,focus:null,trace:null,progress:0};
  let active=parent===window,ready=false,raf=0,last=performance.now(),clock=0,running=false,speed=1,limit=9,view='overview',tour=false,tourTime=0,autoTour=!reduced.matches,lastInput=performance.now(),lastPaint='',contextLost=false;
  let session=createSession(createChallengeSet(freshSeed())),mission=createMissionState(),pressCount=0,log=[],toastTimer;
  const bridge=connectChapter({activate(value){active=value;last=performance.now();lastInput=last;if(active){stage.resize();schedule();}else{cancelAnimationFrame(raf);raf=0;}},topic(value){if(!quest&&value==='wiring'){state.focus='wiring';stage.model.update(state);stage.setView('overview','wiring');paint(true);}}});
  const q=()=>session.round.questions[session.index];
  const display=()=>tour?{...state,...tourState(tourTime)}:state;
  const on=(id,event,fn)=>$(id).addEventListener(event,fn);
  function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3000);}
  function stopTour(manual=false){if(tour){tour=false;stage.model.update(state);stage.setView(view,state.focus);lastPaint='';}if(manual)autoTour=false;$('tour-caption').hidden=true;$('tour').innerHTML='▷ 自动导览 <small>48 SEC</small>';}
  function interact(){lastInput=performance.now();stopTour();if(quest)autoTour=false;}
  function syncSettings(){state.positions.forEach((n,i)=>$(`rotor-${i}`).value=n);$('plug-a').value=state.pairs[0]?.[0]??'';$('plug-b').value=state.pairs[0]?.[1]??'';}
  function resetTrace(){running=false;state.trace=null;state.progress=0;limit=9;paint(true);}
  function positionsFromUI(){return [0,1,2].map(i=>Number($(`rotor-${i}`).value));}
  function apply(){
    interact();const a=$('plug-a').value,b=$('plug-b').value;
    if(Boolean(a)!==Boolean(b)||a&&a===b){$('setup-status').textContent='请选择两个不同端点，或把两端都设为“无”。';return false;}
    state.positions=positionsFromUI();state.pairs=a?[[a,b]]:[];resetTrace();$('setup-status').textContent=`已应用 ${positionText(state.positions)} · ${a?a+' ↔ '+b:'无跳线'}`;return true;
  }
  function begin(trace,{play=true,max=9}={}){
    state.trace=trace;state.positions=[...trace.positions];state.progress=0;state.focus=null;limit=max;running=play&&!reduced.matches;stage.model.update(state);stage.setView(view);syncSettings();paint(true);
  }
  function addLog(trace,locked=false){log.unshift({input:trace.input,output:trace.output,pos:positionText(trace.positions),locked});log=log.slice(0,5);$('log').innerHTML=log.map(l=>`<li><span>${l.input} → ${l.output}</span><span>${l.pos} / ${l.locked?'锁位':'按键'}</span></li>`).join('');}
  function inputLetter(input){if(quest)return;interact();if(!apply())return;const trace=pressKey(input,state.positions,state.pairs);begin(trace);addLog(trace);}
  function setPart(part){interact();state.focus=state.focus===part?null:part;stage.model.update(state);stage.setView('overview',state.focus);paint(true);}
  function configureQuestion(){
    const question=q();mission=createMissionState();pressCount=0;running=false;limit=9;
    state={...state,positions:[...question.positions],pairs:question.pairs.map(p=>[...p]),trace:null,progress:0,focus:null,cut:true};
    if(question.level===5){state.positions=[0,0,0];state.pairs=[];}
    $('settings').hidden=question.level!==5;$('zero').hidden=true;$('apply').textContent='应用';$('setup-status').textContent='';
    $('level').textContent=`MISSION ${String(question.level+1).padStart(2,'0')} / 06 · ${question.skill}`;
    $('question').textContent=question.prompt;$('instruction').textContent=question.instruction;
    $('clue').textContent=`轮位 ${positionText(question.positions)} · ${question.pairs.length?question.pairs[0].join(' ↔ '):'无跳线'}${question.ciphertext?' · 密文 '+question.ciphertext:''}`;
    $('answers').innerHTML=question.options.map(o=>`<button data-answer="${o.value}"><strong>${o.label}</strong>${o.detail?`<small>${o.detail}</small>`:''}</button>`).join('');
    $('feedback').textContent='';$('next').hidden=true;
    $('observe').textContent=['选择左侧部件，打开观察',`让 ${question.input} 通过接线板`,`按下 ${question.input}（0 / ${question.count}）`,`输入 ${question.input}，追踪亮线`,`锁住轮位 · 送回 ${question.input}`,'检查起点与跳线'][question.level];
    $('observe').disabled=question.level===0;$('reciprocal').disabled=true;
    $('journey').innerHTML=LEVELS.map((l,i)=>`<li class="${i<session.index?'done':i===session.index?'current':''}" ${i===session.index?'aria-current="step"':''}><b>${i<session.index?'✓':i+1}</b>${l.title}</li>`).join('');
    syncSettings();stage.model.update(state);stage.setView('overview');paint(true);
  }
  function observe(){
    interact();const question=q();
    if(question.level===1)begin(traceLetter(question.input,question.positions,question.pairs),{max:1});
    else if(question.level===2){if(pressCount>=question.count)return;const trace=pressKey(question.input,state.positions,question.pairs);pressCount++;begin(trace,{play:false});$('observe').textContent=`已按 ${pressCount} / ${question.count} 次 · ${positionText(state.positions)}`;$('observe').disabled=pressCount>=question.count;}
    else if(question.level===3)begin(pressKey(question.input,question.positions,question.pairs));
    else if(question.level===4)begin(traceLetter(question.input,question.positions,question.pairs));
    else if(question.level===5){
      if(mission.phase==='setup'){
        if(!apply())return;const prepared=prepareMission(question,mission,state.positions,state.pairs[0]??[]);mission=prepared.state;$('setup-status').textContent=prepared.message;
        if(prepared.ok){$('settings').querySelectorAll('select,button').forEach(e=>e.disabled=true);$('observe').textContent=`输入密文 ${question.ciphertext[0]} →`;}
      }else{
        const result=decodeMissionLetter(question,mission);mission=result.state;
        if(result.trace){begin(result.trace);$('observe').textContent=mission.phase==='complete'?'三个字母已解开':`输入密文 ${question.ciphertext[mission.cursor]} →`;$('observe').disabled=true;}
      }
    }
  }
  function paint(force=false){
    const s=display(),tr=s.trace,idx=tr?Math.min(8,Math.max(0,Math.ceil(s.progress)-1)):0,segment=tr?.stages[idx];
    const key=JSON.stringify([s.positions,s.pairs,s.focus,s.cut,s.spread,tr,Math.ceil(s.progress),running,tour,tour?Math.floor(tourTime/2):0,mission.output]);
    if(!force&&key===lastPaint)return;lastPaint=key;
    $('position-display').textContent=s.positions.map(letter).join(' ');$('input-letter').textContent=tr?.input??(quest?q().input??'—':'—');
    const end=tour?9:limit;
    $('output-letter').textContent=tr&&s.progress>=end?(end===1?letter(tr.stages[0].output):tr.output):'—';
    if(quest&&q().level===5&&s.progress>=9&&!tour)$('output-letter').textContent=mission.output||'—';
    $('signal-status').textContent=tour?'导览中':running?'信号通过中':tr&&s.progress>=end?'回路已读出':'等待操作';
    $('part-caption').textContent=({rotor:'转子剖视 · 26 根内部接线随轮位旋转。',reflector:'反射器 B · 13 对固定的双向连接。',wiring:'接线板 · 一对字母在输入与输出各交换一次。'})[s.focus]??'三个转子，一条往返的路线。';
    document.querySelectorAll('[data-part]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.part===s.focus));
    $('cut').checked=s.cut;$('spread').value=Math.round(s.spread*100);$('spread-value').value=`${Math.round(s.spread*100)}%`;
    const names=['接线','III','II','I','反射','I','II','III','接线'];
    $('trace').innerHTML=names.map((name,i)=>`<button data-segment="${i}" class="${i>4?'return ':''}${s.progress>=i+1?'passed ':''}${tr&&idx===i&&s.progress>0?'current':''}" ${!tr||!tour&&i>=limit?'disabled':''} aria-label="第 ${i+1} 段 ${name}">${name}<b>${tr?letter(tr.stages[i].input)+'→'+(s.progress>=i+1?letter(tr.stages[i].output):'·'):'—'}</b></button>`).join('');
    $('stage-number').textContent=`${String(Math.ceil(s.progress)).padStart(2,'0')} / ${String(end).padStart(2,'0')}`;
    $('stage-copy').textContent=tr&&s.progress>0?`${segment.name}：${letter(segment.input)} → ${letter(segment.output)}${s.progress>=end?'。本次路径已完成。':'。'}${s.focus?'当前只展示此部件内部的线路。':''}`:s.focus?'部件已独立展开，可查看内部接线；返回完整回路继续输入实验。':'按下一个字母，先转位，再让电流进入回路。';
    $('play').textContent=running?'Ⅱ 暂停信号':tr&&s.progress>=end?'↻ 重播信号':'▶ 播放信号';$('play').disabled=!tr;$('step').disabled=!tr||s.progress>=end;
    $('reciprocal').disabled=!tr||s.progress<9;
    $('tour-caption').hidden=!tour;if(tour)$('tour-caption').textContent=tourState(tourTime).title;
    if(quest&&q().level===5&&!tour&&s.progress>=9&&mission.phase==='decoding')$('observe').disabled=false;
  }
  on('apply','click',apply);on('zero','click',()=>{interact();state.positions=[0,0,0];resetTrace();syncSettings();$('setup-status').textContent='轮位已复位 AAA，跳线保留。';});
  on('reciprocal','click',()=>{if(!state.trace)return;interact();const trace=traceLetter(state.trace.output,state.positions,state.pairs);begin(trace);addLog(trace,true);});
  on('clear-log','click',()=>{log=[];$('log').innerHTML='';});
  on('keyboard','click',e=>{const b=e.target.closest('[data-key]');if(b)inputLetter(b.dataset.key);});
  document.querySelectorAll('[data-part]').forEach(b=>b.addEventListener('click',()=>setPart(b.dataset.part)));
  on('return-model','click',()=>{interact();state.focus=null;stage.model.update(state);stage.setView(view);paint(true);});
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{interact();view=b.dataset.view;stage.setView(view,state.focus);}));
  on('cut','change',()=>{interact();state.cut=$('cut').checked;paint(true);});
  on('spread','input',()=>{interact();state.spread=Number($('spread').value)/100;stage.model.update(state);if(state.focus)stage.setView(view,state.focus);paint(true);});
  on('eco','change',()=>stage.eco($('eco').checked));
  on('speed','change',()=>{interact();speed=Number($('speed').value);});
  on('play','click',()=>{interact();autoTour=false;if(!state.trace)return;if(state.progress>=limit)state.progress=0;running=!running;paint(true);});
  on('step','click',()=>{interact();running=false;autoTour=false;state.progress=Math.min(limit,Math.floor(state.progress+.00001)+1);paint(true);});
  on('trace','click',e=>{const b=e.target.closest('[data-segment]');if(!b||b.disabled)return;interact();running=false;state.progress=Number(b.dataset.segment)+1;paint(true);});
  on('tour','click',()=>{if(tour){stopTour(true);paint(true);}else{tour=true;tourTime=0;running=false;lastPaint='';$('tour').innerHTML='□ 结束导览';}});
  on('observe','click',observe);
  on('answers','click',e=>{
    const b=e.target.closest('[data-answer]');if(!b||session.correct||session.finished)return;interact();
    if(q().level===5&&(mission.phase!=='complete'||state.progress<9)){$('feedback').textContent='先检查设置，再按顺序解开三个密文字母。';return;}
    session=submitAnswer(session,b.dataset.answer);b.classList.add(session.correct?'correct':'wrong');$('feedback').textContent=session.correct?`✓ ${q().explanation}`:'还没有找到。再观察一次电路，或展开提示。';
    if(session.correct){$('answers').querySelectorAll('button').forEach(e=>e.disabled=true);$('next').hidden=false;$('next').textContent=session.index===5?'完成六关 →':'下一关 →';}
  });
  on('hint','click',()=>{interact();$('feedback').textContent=q().hint;});
  on('next','click',()=>{interact();session=advanceSession(session);$('settings').querySelectorAll('select,button').forEach(e=>e.disabled=false);if(session.finished){$('level').textContent='06 / 06 · 全部完成';$('question').textContent='你已完成六次验证。';$('instruction').textContent='从部件识别，到亲手恢复三个字母。现在可以进入下一章，接手完整任务。';$('feedback').textContent=`共完成 6 关，作答 ${session.attempts.reduce((a,b)=>a+b,0)} 次。`;$('next').hidden=true;$('observe').disabled=true;$('journey').querySelectorAll('li').forEach(l=>{l.className='done';l.querySelector('b').textContent='✓';l.removeAttribute('aria-current');});}else{configureQuestion();$('question').focus({preventScroll:true});}});
  on('new-round','click',()=>{interact();session=createSession(createChallengeSet(freshSeed(),{avoid:session.round.questions.map(q=>q.signature)}));$('settings').querySelectorAll('select,button').forEach(e=>e.disabled=false);configureQuestion();});
  on('continue','click',()=>{const page=quest?'mission':'challenge';if(bridge.embedded)bridge.route(page);else location.href=quest?'../index.html#/mission':'03.html';});
  on('home','click',e=>{if(bridge.embedded){e.preventDefault();bridge.route('exhibit');}});
  on('shot','click',()=>{const a=document.createElement('a');a.download=`Bombe-${mode}.png`;a.href=stage.snapshot();a.click();});
  on('full','click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('当前浏览器未允许全屏。');}});
  ui.canvas.addEventListener('pointerdown',interact);ui.canvas.addEventListener('wheel',interact,{passive:true});
  document.addEventListener('pointerdown',e=>{if(!e.target.closest('#tour'))interact();});
  document.addEventListener('keydown',e=>{if(e.ctrlKey||e.altKey||e.metaKey||e.repeat||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(!quest&&/^[a-z]$/i.test(e.key)){e.preventDefault();inputLetter(e.key.toUpperCase());}else if(e.code==='Space'&&!e.target.closest('button,a')){e.preventDefault();$('play').click();}});
  document.addEventListener('visibilitychange',()=>{last=performance.now();if(!document.hidden)schedule();});
  reduced.addEventListener('change',()=>{if(reduced.matches){running=false;stopTour(true);paint(true);}});
  ui.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;running=false;toast('图形上下文暂时中断，正在等待恢复。');});
  ui.canvas.addEventListener('webglcontextrestored',()=>{contextLost=false;stage.resize();schedule();});
  function schedule(){if(ready&&active&&!document.hidden&&!raf&&!capture)raf=requestAnimationFrame(frame);}
  function frame(now){
    raf=0;if(!active||document.hidden)return;const dt=Math.max(0,Math.min(.08,(now-last)/1000));last=now;clock+=dt;
    if(tour){tourTime+=dt;if(tourTime>=48){stopTour(true);paint(true);}}else if(autoTour&&performance.now()-lastInput>25000){tour=true;tourTime=0;running=false;$('tour').innerHTML='□ 结束导览';}
    if(running&&!tour){state.progress=Math.min(limit,state.progress+dt*speed);if(state.progress>=limit)running=false;}
    const shown=display();if(!contextLost){stage.frame(shown);if(tour){const key=tourState(tourTime).at;if(stage.tourBeat!==key){stage.tourBeat=key;stage.setView('overview',shown.focus);}}}paint();schedule();
  }
  if(!bridge.embedded){$('home').href='01.html';if(quest&&location.protocol==='file:')$('continue').hidden=true;}
  if(quest)configureQuestion();else{syncSettings();paint(true);}
  stage.model.update(state);stage.resize();await stage.warm();stage.frame(state);$('loading').remove();ready=true;paint(true);bridge.ready();schedule();
  window.BOMBE_BENCH={get state(){return {...structuredClone(state),mode,active,running,ready,tour,limit,session:quest?structuredClone(session):null,mission:quest?structuredClone(mission):null};},get metrics(){return {calls:stage.renderer.info.render.calls,triangles:stage.renderer.info.render.triangles};},stage};
  window.SIM={ready:true,duration:48,fps:60,render(t){stopTour();running=false;const s={...state,...tourState(t)};state=s;stage.frame(s);stage.setView('overview',s.focus);stage.frame(s);paint(true);$('tour-caption').hidden=false;$('tour-caption').textContent=s.title;}};
  addEventListener('pagehide',e=>{if(e.persisted)return;cancelAnimationFrame(raf);bridge.dispose();stage.dispose();},{once:true});
}
