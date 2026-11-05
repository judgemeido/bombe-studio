import {PARTS, COUNT, SPACE, D} from './kinematics.js';
const icons={
 play:'<path d="m8 5 11 7-11 7Z"/>', pause:'<path d="M8 5v14M16 5v14"/>',
 reset:'<path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/>',cube:'<path d="m12 3 9 5v8l-9 5-9-5V8Zm0 10 9-5M3 8l9 5v8M7 5l9 6"/>',
 camera:'<path d="M4 7h4l2-3h4l2 3h4v13H4Z"/><circle cx="12" cy="13" r="4"/>',
 arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>', expand:'<path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"/>',
 sound:'<path d="M4 9h4l5-4v14l-5-4H4Zm13-1q6 4 0 8"/>', help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 4 3v2M12 17h.01"/>'
};
export const icon=(id)=>`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[id]||icons.cube}</svg>`;
export function createConsole(app){
  app.innerHTML=`
  <header class="masthead"><a class="brand" href="#" aria-label="Bombe Atelier 首页"><span class="brand-mark">b<span>·</span></span><span>BOMBE<span class="brand-light"> ATELIER</span></span></a><div class="mast-middle"><span class="live-dot"></span> 交互式机械档案 <span class="hairline"></span> COLLECTION 001</div><button id="about" class="text-button">关于这台机器 ${icon('arrow')}</button></header>
  <main class="workspace">
    <aside class="intro"><div class="eyebrow"><span class="tiny-line"></span> THE CODEBREAKING MACHINE</div><p class="era">BLETCHLEY PARK / 1940</p><h1>Bombe<span class="period">.</span></h1><h2>机械的逻辑。</h2><p class="intro-copy">108 个鼓轮，成千上万种可能。<br>转动、拆解，走进这台改变<br class="desktop-br">密码破译的机电机器。</p><div class="thin-rule"></div><p class="micro">TURING–WELCHMAN BOMBE</p><p class="intro-caption">一份可以亲手探索的三维机械档案</p>
    <div class="spec-list"><div><span>鼓轮</span><strong>${COUNT}<small> DRUMS</small></strong></div><div><span>三轮组合</span><strong>${D.banks*D.columns}<small> SETS</small></strong></div><div><span>字母位置</span><strong>26<small> POSITIONS</small></strong></div></div>
    <button id="tour" class="tour-button">${icon('play')} <span>开始自动导览</span><small>56 SEC</small></button><p class="tour-hint" id="tour-hint">拖动即可自由探索 · 点击鼓轮查看</p><div class="intro-foot"><span>MECHANICAL ARCHIVE</span><b>01 / 05</b></div></aside>
    <section class="viewer" aria-label="三维 Bombe 展示"><div class="viewer-top"><span id="view-caption">01 — 整机视图</span><span class="view-status"><i></i><span id="running-badge">运行中</span></span></div><div id="stage"><canvas id="bombe-canvas" aria-label="可拖动旋转和缩放的 Bombe 三维模型"></canvas><div id="loading"><span>正在装配机械档案</span><div></div></div></div>
    <nav class="view-tabs" aria-label="相机视角"><button data-view="hero" class="active">透视</button><button data-view="front">正面</button><button data-view="back">背面</button><button data-view="detail">微距</button></nav>
    <div class="scene-note"><span>DRAG TO ORBIT</span><span>SCROLL TO ZOOM</span><span id="drum-id">A · 01</span></div><div id="tour-caption" class="tour-caption" hidden></div>
    <div class="viewer-tools"><button id="snapshot" class="icon-button" title="保存模型截图" aria-label="保存模型截图">${icon('camera')}</button><button id="fullscreen" class="icon-button" title="全屏查看" aria-label="全屏查看">${icon('expand')}</button><button id="reset" class="icon-button" title="重置视图 R" aria-label="重置视图">${icon('reset')}</button></div>
    </section>
    <aside class="inspector"><div class="section-label"><span>结构索引</span><small>EXPLORE THE MACHINE</small></div><div class="part-list">${PARTS.map(p=>`<button class="part-button" data-part="${p.id}" aria-pressed="false"><span class="part-no">${p.number}</span><span class="part-name">${p.title}<small>${p.en}</small></span><span class="part-arrow">↗</span></button>`).join('')}</div>
    <div class="part-detail"><div class="detail-head"><span id="detail-no">FIELD NOTE / 001</span><span class="detail-dot"></span></div><h3 id="detail-title">从一台机器，看见一种思路。</h3><p id="detail-copy">选择一个系统，查看它如何与整机协同工作。双击鼓轮，可以靠近检查轮面细节。</p><p id="detail-sub">五个系统，一条机械逻辑。</p><button id="isolate" class="outline-button" disabled aria-pressed="false">${icon('cube')} 单独查看此系统</button></div>
    <div class="display-options"><label><input type="checkbox" id="shell"> 打开维护外壳<span>OPEN SHELL</span></label><label><input type="checkbox" id="quality"> 节能画质<span>ECO</span></label></div>
    <p class="reconstruction">基于实物照片的结构重建<br>运行与接线用于教学示意</p></aside>
  </main>
  <section class="transport" aria-label="机器运行控制"><div class="play-cluster"><button id="play" class="play-button" aria-label="暂停运行">${icon('pause')}</button><div><strong id="play-state">正在检验轮位</strong><span id="rate-label">26 位 / 秒 · 教学速度</span></div><button id="step" class="step-button" title="暂停并前进一步" aria-label="前进一步">+1</button></div>
  <div class="position-panel"><span class="control-label">当前轮位 <small>ROTOR POSITION</small></span><div class="letter-group"><b id="letter-0">A</b><b id="letter-1">A</b><b id="letter-2">A</b><span id="counter">00000 <i>/ ${SPACE.toLocaleString('en-US')}</i></span></div><div class="scan-track"><i id="scan-progress"></i></div></div>
  <div class="speed-control"><label for="speed">运行速度 <output id="speed-value">1×</output></label><input id="speed" type="range" min="1" max="104" value="26" step="1"><div class="range-labels"><span>慢速观察</span><span>快速检验</span></div></div>
  <div class="explode-control"><label for="explode">结构拆解 <output id="explode-value">0%</output></label><input id="explode" type="range" min="0" max="100" value="0" step="1"><div class="range-labels"><span>完整装配</span><span>分层展开</span></div></div>
  <button id="explode-button" class="explode-button">${icon('cube')}<span>拆解整机</span>${icon('arrow')}</button></section>
  <footer class="footer"><span>DESIGNED TO BE UNDERSTOOD.</span><span>空格 暂停 <i>·</i> R 重置 <i>·</i> E 拆解</span><span>BUILT WITH TEARDOWN <b>↗</b></span></footer>
  <div class="toast" id="toast" role="status" hidden></div>
  <dialog id="about-dialog"><button id="close-about" class="dialog-close" aria-label="关闭关于">×</button><span class="eyebrow">THE MACHINE / THE MODEL</span><h2>用机械，检验可能。</h2><p>Bombe 是用于辅助破解 Enigma 密文的机电设备。Turing 的菜单检验方法与 Welchman 的对角板共同构成了它的重要原理。机器的停机提示候选设置，仍需要后续核验。</p><p>此展品依据英国国家计算博物馆的实物照片重建外观与部件关系：108 个鼓轮、36 组三轮组合、机架、轴系与后部接线。</p><p><strong>模型边界：</strong>尺寸由照片比例估计；齿形、齿比、接线路由经过简化。26³ 轮位计数器用于解释枚举搜索，不是完整的历史 Bombe 电路模拟器，不能用于实际解密。</p><p class="sources">参考：The National Museum of Computing · Turing–Welchman Bombe<br>框架：elvarofficial/teardown · MIT<br>制作：Bombe Atelier · 2026</p><div class="dialog-shortcuts">拖动旋转 / 滚轮缩放 / 空格暂停 / E 拆解 / R 重置<br>25 秒无操作后可自动进入导览；手动暂停或结束导览后保持手动模式。</div></dialog>`;
  const $=id=>document.getElementById(id);
  return {$,canvas:$('bombe-canvas'),update(s,speed){s.letters.forEach((v,i)=>$('letter-'+i).textContent=v);$('counter').innerHTML=`${String(s.n).padStart(5,'0')} <i>/ ${SPACE.toLocaleString('en-US')}</i>`;$('scan-progress').style.width=`${s.progress*100}%`;$('rate-label').textContent=`${speed} 位 / 秒 · 教学速度`;}};
}
