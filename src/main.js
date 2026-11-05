import {createNavigation} from './navigation.js';
import {createExhibitRuntime} from './exhibit-runtime.js';
import {createChapterFrame} from './chapter-frame.js';

/** Inert on import: 00 never allocates a WebGL scene. Each chapter owns its GPU. */
export function createApplication({initialRoute,historyPage,runtime={}}={}){
  const dependencies={createNavigation,createChapterFrame,loadMission:()=>import('./mission.js'),...runtime};
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let disposed=false,navigation,currentPage=historyPage?.currentRoute?.page??null;
  const controllers={},transactions={};
  for(const page of ['exhibit','lab','challenge','mission'])transactions[page]=createExhibitRuntime(async({own,check})=>{
    let controller;
    if(page==='mission'){
      const module=await dependencies.loadMission();check();
      controller=own(await module.createMission(document.getElementById('mission-page'),{motion}));
    }else{
      controller=own(dependencies.createChapterFrame(document.getElementById(`${page}-page`),{page,navigate:route=>navigation?.go(route)}));
      await controller.ready;check();
    }
    check();controllers[page]=controller;return controller;
  });
  const pause=()=>Object.values(controllers).forEach(controller=>controller.setActive(false));
  navigation=dependencies.createNavigation({initialRoute,currentRoute:historyPage?.currentRoute??null,initialScrolls:{history:historyPage?.scrollY??0},motion,pause,
    async prepare(route,report=()=>{}){
      if(disposed||route.page==='history')return;
      report(25,'装配章节与交互模型');await transactions[route.page].ensure();
      if(!disposed)report(90,'模型与控制台已就绪');
    },
    activate(route){
      if(disposed)return;currentPage=route.page;
      if(route.page==='history')historyPage?.activate();else historyPage?.deactivate();
      controllers.lab?.setTopic(route.topic);
      for(const [page,controller]of Object.entries(controllers))controller.setActive(route.page===page);
      const skip=document.querySelector('.skip-link');
      if(skip){skip.href=route.page==='history'?'#hero-title':route.page==='mission'?'#mission-task-title':`#${route.page}-heading`;skip.textContent='跳至当前章节';}
    }
  });
  function dispose(){if(disposed)return;disposed=true;pause();navigation.dispose();Object.values(transactions).forEach(t=>t.dispose());window.removeEventListener('pagehide',onHide);delete window.__BOMBE_INSPECT__;}
  function onHide(event){if(!event.persisted)dispose();}
  window.addEventListener('pagehide',onHide);
  window.__BOMBE_INSPECT__=()=>({page:currentPage,navigating:navigation.busy,chapters:Object.fromEntries(Object.entries(controllers).map(([p,c])=>[p,c.inspect?.()??{ready:true}]))});
  return {go:route=>disposed?undefined:navigation.go(route),dispose};
}
