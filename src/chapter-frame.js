const pages={exhibit:['01','机械全貌'],lab:['02','信号实验室'],challenge:['03','解密挑战']};
export function createChapterFrame(root,{page,navigate,window:view=window,timeout=30000}){
  const [number,title]=pages[page];
  const frame=view.document.createElement('iframe');
  frame.className='chapter-frame';frame.title=`${number} · ${title} · 交互三维场景`;
  frame.allow='fullscreen';frame.src=`chapters/${number}.html`;
  let ready=false,active=false,disposed=false,topic='drums',resolveReady,rejectReady;
  const whenReady=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});
  const send=(type,extra={})=>{if(ready&&!disposed)frame.contentWindow?.postMessage({channel:'bombe-chapter-v1',type,...extra},view.location.origin);};
  function receive(event){
    if(disposed||event.source!==frame.contentWindow||event.origin!==view.location.origin||event.data?.channel!=='bombe-chapter-v1')return;
    if(event.data.type==='ready'){ready=true;clearTimeout(timer);send('topic',{value:topic});send('active',{value:active});resolveReady();}
    if(event.data.type==='route'&&active&&['history','exhibit','lab','challenge','mission'].includes(event.data.page))navigate({page:event.data.page,topic:event.data.topic});
  }
  const timer=setTimeout(()=>rejectReady(new Error(`${title}载入超时，请重试。`)),timeout);
  view.addEventListener('message',receive);root.append(frame);
  return {ready:whenReady,setActive(value){active=value;send('active',{value});},setTopic(value){topic=value;send('topic',{value});},inspect(){return {ready,active,page};},dispose(){if(disposed)return;send('active',{value:false});disposed=true;clearTimeout(timer);view.removeEventListener('message',receive);frame.remove();rejectReady(new Error('Chapter disposed'));}};
}
