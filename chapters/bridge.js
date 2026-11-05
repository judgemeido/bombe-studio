// One same-origin parent owns activation. Standalone files run without a parent.
export function connectChapter({activate,topic=()=>{}}){
  const embedded=parent!==window;
  const send=(type,payload={})=>{if(embedded)parent.postMessage({channel:'bombe-chapter-v1',type,...payload},location.origin);};
  if(embedded)document.documentElement.classList.add('embedded');
  function receive(event){
    if(event.source!==parent||event.origin!==location.origin||event.data?.channel!=='bombe-chapter-v1')return;
    if(event.data.type==='active')activate(Boolean(event.data.value));
    if(event.data.type==='topic')topic(event.data.value);
  }
  addEventListener('message',receive);
  return {embedded,ready(){send('ready');},route(page,topic){send('route',{page,topic});},dispose(){removeEventListener('message',receive);}};
}
