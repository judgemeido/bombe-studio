export default `
  <div class="lab-heading-row">
    <div class="lab-title"><span>02 / SIGNAL LAB</span><h1 id="lab-heading" tabindex="-1">信号实验室</h1></div>
    <div class="lab-heading-actions">
      <button id="lab-guide-open" aria-haspopup="dialog" aria-controls="lab-guide"><span aria-hidden="true">?</span> 完整指引</button>
      <button id="lab-reset" aria-label="全部复位"><svg><use href="#reset-icon"/></svg><span>复位</span></button>
    </div>
  </div>
  <div class="lab-workspace">
    <section class="lab-model-panel" aria-label="放大的鼓轮与接线教学模型">
      <section id="lab-walkthrough" class="lab-walkthrough" aria-labelledby="lab-walkthrough-title">
        <div class="lab-walkthrough-top"><span id="lab-walkthrough-mode">跟着做 · 理解一个字母如何被加密</span><button id="lab-walkthrough-toggle">自由探索</button></div>
        <ol class="lab-walkthrough-steps" aria-label="五步实验"><li data-walkthrough-step="0"><span>1</span>准备</li><li data-walkthrough-step="1"><span>2</span>输入</li><li data-walkthrough-step="2"><span>3</span>追踪</li><li data-walkthrough-step="3"><span>4</span>比较</li><li data-walkthrough-step="4"><span>5</span>接线</li></ol>
        <div class="lab-walkthrough-body"><div role="status" aria-live="polite" aria-atomic="true"><h2 id="lab-walkthrough-title"></h2><p id="lab-walkthrough-do"></p><p id="lab-walkthrough-observe"></p></div><button id="lab-walkthrough-action" class="lab-walkthrough-action"></button></div>
      </section>
      <div class="lab-model-top">
        <div class="lab-topic-tabs" aria-label="教学模型视图"><a href="#/lab/drums" data-page="lab" data-topic="drums">完整回路</a><a href="#/lab/wiring" data-page="lab" data-topic="wiring">接线局部</a></div>
        <span class="signal-legend"><i></i>去程 <i></i>返回</span>
      </div>
      <div class="lab-viewer" id="lab-viewer">
        <canvas id="lab-canvas" tabindex="0" aria-label="三鼓轮与接线板，可拖动旋转。点击鼓轮调整轮位，点击接线板触点选择接线端点。"></canvas>
        <div class="lab-annotations" aria-hidden="true"><span data-lab-anchor="reflector">B <small>反射器</small></span><span data-lab-anchor="0">I <small>慢轮</small></span><span data-lab-anchor="1">II <small>中轮</small></span><span data-lab-anchor="2">III <small>快轮</small></span><span data-lab-anchor="board">接线板</span></div>
        <div id="lab-error" class="lab-error" hidden>三维画面暂不可用，仍可输入字母并逐段阅读。</div>
        <div class="lab-view-tools"><button id="lab-zoom-in" aria-label="放大教学模型">+</button><button id="lab-zoom-out" aria-label="缩小教学模型">−</button><button id="lab-home" aria-label="恢复教学模型视角">↺</button></div>
        <span id="lab-view-hint" class="lab-view-hint">拖动观察 · 点击鼓轮调整轮位</span>
      </div>
      <div class="lab-model-footer"><label for="lab-spread">展开结构</label><input type="range" id="lab-spread" min="0" max="100" value="0"><output id="lab-spread-value" for="lab-spread">0%</output></div>
    </section>
    <aside class="lab-desk" aria-label="实验控制台">
      <div class="lab-result" aria-label="本次输入输出">
        <div><span>输入</span><output id="lab-input">—</output></div><span class="lab-result-arrow">→</span><div><span>输出</span><output id="lab-output">—</output></div>
        <i id="lab-result-state">等待按键</i>
      </div>
      <fieldset class="lab-keyboard-field"><legend>输入一个字母</legend><div id="lab-keyboard" class="lab-keyboard" aria-label="字母输入键盘"></div></fieldset>
      <div class="lab-play-controls"><button id="lab-play" disabled>播放信号</button><button id="lab-step" disabled>下一段 →</button></div>
      <button id="lab-settings-open" class="lab-settings-open" aria-haspopup="dialog" aria-controls="lab-settings"><span>轮位与接线</span><strong id="lab-setting-summary">AAA · 无接线</strong><span aria-hidden="true">↗</span></button>
      <p id="lab-quick-note" class="lab-quick-note" role="status">按键先转位，回放不转位。</p>
    </aside>
  </div>
  <section class="lab-trace" aria-labelledby="lab-trace-title">
    <div class="lab-trace-heading"><h2 id="lab-trace-title">信号路径 <span>01 — 09</span></h2><span id="lab-current-position" class="lab-current-position">轮位 A · A · A</span><button id="lab-history-open" aria-haspopup="dialog" aria-controls="lab-records">记录与验证 ↗</button></div>
    <div class="lab-trace-stages" id="lab-trace-stages"></div>
    <div class="lab-trace-narration"><span id="lab-stage-number">—</span><p id="lab-stage-description" role="status">按下一个字母，观察信号如何往返。</p><progress id="lab-signal-progress" max="9" value="0" aria-label="信号演示进度"></progress></div>
  </section>

  <dialog id="lab-settings" class="lab-dialog" aria-labelledby="lab-settings-title">
    <div class="dialog-top"><span class="lab-dialog-kicker">实验设置</span><button class="dialog-close" data-lab-close aria-label="关闭实验设置">×</button></div>
    <h2 id="lab-settings-title">改变设置，再试一次。</h2>
    <p id="lab-settings-instruction" class="lab-settings-instruction" role="status" hidden></p>
    <fieldset class="lab-fieldset"><legend>轮位 <small>从左到右 I / II / III</small></legend><div id="lab-position-controls" class="lab-position-controls"></div><p>每次按键先转位。调整设置会清除本轮路径与记录。</p></fieldset>
    <fieldset class="lab-fieldset lab-wiring-controls"><legend>接上一对字母</legend><div class="lab-plugs"><label><span>端点一</span><select id="lab-plug-a" aria-label="接线端点一"></select></label><span>↔</span><label><span>端点二</span><select id="lab-plug-b" aria-label="接线端点二"></select></label><button id="lab-connect">接入</button></div><div class="lab-wire-meta"><span id="lab-wire-status" role="status">未接线 · 所有字母原样通过</span><button id="lab-disconnect" hidden>拔下</button></div></fieldset>
    <button class="lab-dialog-done" data-lab-close>回到实验 →</button>
  </dialog>

  <dialog id="lab-guide" class="lab-dialog lab-guide" aria-labelledby="lab-guide-title">
    <div class="dialog-top"><span class="lab-dialog-kicker">动手理解</span><button class="dialog-close" data-lab-close aria-label="关闭完整指引">×</button></div>
    <h2 id="lab-guide-title">这个实验，到底在做什么？</h2>
    <div class="lab-guide-tabs" role="group" aria-label="教学主题"><button data-guide-tab="walkthrough" aria-pressed="true" aria-controls="lab-guide-walkthrough">操作步骤</button><button data-guide-tab="stepping" aria-pressed="false" aria-controls="lab-guide-stepping">转位</button><button data-guide-tab="plugboard" aria-pressed="false" aria-controls="lab-guide-plugboard">接线</button><button data-guide-tab="bombe" aria-pressed="false" aria-controls="lab-guide-bombe">整机关系</button></div>
    <article id="lab-guide-walkthrough" data-guide-panel="walkthrough">
      <p class="lab-guide-purpose">你在模拟一次字母加密：输入 A，信号经过接线板、三只鼓轮和反射器，再返回，最终点亮另一个字母。本页用 Enigma 的最小回路解释这个过程。</p>
      <ol class="lab-detailed-steps">
        <li><b>准备：统一起点</b><p>点击页面中的“准备实验”。三只鼓轮都回到 A，表示轮位 AAA；接线拔下。接下来的比较才使用同一个起点。</p></li>
        <li><b>输入：点击金色 A 键</b><p>输入区出现 A，快轮先转到 B，轮位变成 AAB。引导会停在信号第一段，让你有时间看清楚。</p></li>
        <li><b>追踪：逐次点击“下一段”</b><p>看底部高亮步骤与模型亮线：接线进入 → 快轮 III → 中轮 II → 慢轮 I → 反射器 B → 反向通过三轮 → 接线输出。经过 9 段后，输出亮起 B。也可点击底部任意一段复看；“播放信号”可自动演示。</p></li>
        <li><b>比较：再按一次 A</b><p>这次不要复位。快轮继续从 B 转到 C，轮位成为 AAC，输出改为 D。第一次 A→B、第二次 A→D：输入相同，轮位改变了，所以结果不同。重播不会再转轮。</p></li>
        <li><b>接线：保持起点，只改变跳线</b><p>点击引导中的“打开接线设置”，实验会先回到 AAA。端点选 A 和 C，点击“接入”，再点“回到实验”，然后按 A。这次输出为 Q；对照第一轮的 B，就能看到接线对结果的影响。还可以切到“接线局部”，直接点击 A、C 两个插孔。</p></li>
      </ol>
      <dl class="lab-glossary"><div><dt>轮位 AAA</dt><dd>三只鼓轮当前朝向的字母；每次按键先转位。</dd></div><div><dt>接线板</dt><dd>把一对字母双向互换；没有跳线的字母原样通过。</dd></div><div><dt>鼓轮</dt><dd>内部接线把进入的触点映射到另一个触点；转动后映射改变。</dd></div><div><dt>反射器</dt><dd>把信号送回，使它反向再经过三只鼓轮。</dd></div></dl>
      <button id="lab-walkthrough-start" class="lab-dialog-done">从第 1 步跟着做 →</button>
    </article>
    <article id="lab-guide-stepping" data-guide-panel="stepping" hidden><h3>同一个 A，为何不同？</h3><p>从 AAA、无接线开始，连续按两次 A。观察快轮位置，以及两次亮起的输出。每次按键，转子先转一步，字母映射也随之改变。</p><button id="lab-exercise-start" class="lab-dialog-done">准备这个实验 →</button><p id="lab-exercise-result" class="lab-dialog-feedback" role="status">目标：记录 A → ?，再记录 A → ?。</p></article>
    <article id="lab-guide-plugboard" data-guide-panel="plugboard" hidden><h3>一根跳线，双向互换。</h3><p>接上 A ↔ B，电流从 A 进入接线板，就从 B 离开。从 B 进入，会从哪里离开？</p><div class="lab-quiz" role="group" aria-label="接线互换小测"><button data-answer="A">A</button><button data-answer="C">C</button><button data-answer="B">B</button></div><p id="lab-quiz-result" class="lab-dialog-feedback" role="status">选择一个答案，再在模型中试试。</p></article>
    <article id="lab-guide-bombe" data-guide-panel="bombe" hidden><h3>带着原理，回看机器。</h3><p>这里用 Enigma I–II–III、反射器 B 和接线板讲解置换。Bombe 鼓轮模拟转子关系；整机还结合菜单电路与候选设置检查。</p><p>本单元固定环位 AAA，只开放一对接线。三维结构为放大教学重建，不执行完整 Bombe 搜索。</p><a href="#/" data-page="exhibit" class="lab-dialog-done">回看机械全貌 →</a><a class="lab-source-link" href="https://www.cryptomuseum.com/crypto/enigma/wiring.htm" target="_blank" rel="noopener noreferrer">接线资料 ↗</a></article>
  </dialog>

  <dialog id="lab-records" class="lab-dialog" aria-labelledby="lab-records-title">
    <div class="dialog-top"><span class="lab-dialog-kicker">本轮实验</span><button class="dialog-close" data-lab-close aria-label="关闭实验记录">×</button></div>
    <h2 id="lab-records-title">记录与互易验证。</h2>
    <div class="lab-history"><div><span>输入记录</span><b id="lab-history-input">—</b></div><div><span>输出记录</span><b id="lab-history-output">—</b></div></div>
    <p class="lab-record-note">记录最近 24 次按键。重播只显示原路径，不增加记录。</p>
    <button id="lab-verify" class="lab-dialog-done" disabled>验证当前轮位的互易性 ↔</button><p id="lab-verification" class="lab-dialog-feedback" role="status" hidden></p>
  </dialog>
  <p class="sr-only" id="lab-status" role="status"></p>`;
