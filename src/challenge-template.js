export default `
  <div class="quest-heading-row">
    <div><span class="quest-eyebrow">03 / CODE QUEST</span><h1 id="challenge-heading" tabindex="-1">小小解密员</h1><p>转一转，连一连。把学到的本领用起来。</p></div>
    <button id="quest-new-round" class="quest-text-button"><svg><use href="#reset-icon"/></svg>换一套题</button>
  </div>
  <div class="quest-journey"><ol id="quest-levels" aria-label="六关学习路线"></ol><span id="quest-completed">已完成 0 / 6</span></div>
  <div class="quest-workspace">
    <section class="quest-model-panel" aria-label="可操作的三维教学模型">
      <div class="quest-model-top"><span><i></i>你的 3D 观察台</span><button id="quest-spread" aria-pressed="false">展开看内部 <span aria-hidden="true">↗</span></button></div>
      <div class="quest-viewer" id="quest-viewer">
        <canvas id="quest-canvas" tabindex="0" aria-label="鼓轮、反射器与接线板的三维模型。拖动旋转，也可使用旁边的视角按钮。空格操作实验，右方向键推进一段。"></canvas>
        <div id="quest-labels" class="quest-model-labels" aria-label="模型部件">
          <button data-quest-part="reflector">反射器</button><button data-quest-part="rotor-0">I 慢轮</button><button data-quest-part="rotor-1">II 中轮</button><button data-quest-part="rotor-2">III 快轮</button><button data-quest-part="wiring">接线板</button>
        </div>
        <div class="quest-wheel-readout" id="quest-wheel-readout"><span id="quest-position-label">当前轮位</span><b id="quest-position">A · A · A</b></div>
        <div class="quest-camera-tools"><button id="quest-zoom-in" aria-label="放大模型">+</button><button id="quest-zoom-out" aria-label="缩小模型">−</button><button id="quest-camera-home" aria-label="恢复模型正面视角">↺</button></div>
        <span class="quest-drag-note">拖动旋转 · 滚轮缩放</span>
        <p id="quest-model-error" class="quest-model-error" role="status" hidden>三维画面暂不可用。下方观察台会显示相同的字母路线，仍可完成六关。</p>
      </div>
      <div class="quest-observation">
        <div class="quest-signal-readout"><div><span>输入</span><b id="quest-input">—</b></div><i aria-hidden="true">→</i><div><span id="quest-middle-label">当前字母</span><b id="quest-current-letter">—</b></div><i aria-hidden="true">→</i><div class="quest-output-cell"><span id="quest-output-label">输出</span><b id="quest-output">—</b></div><span id="quest-observation-badge">先读右边的任务</span></div>
        <div class="quest-narration"><span id="quest-stage-count">观察</span><p id="quest-narration">读题后，点击模型标签或右边的答案。</p></div>
        <progress id="quest-signal-progress" value="0" max="9" aria-label="本次信号进度"></progress>
        <div class="quest-observe-actions"><button id="quest-observe" class="quest-primary">开始观察</button><button id="quest-step" class="quest-step" disabled>下一段 →</button><button id="quest-return-task" class="quest-mobile-return" hidden>去选答案 ↓</button></div>
      </div>
    </section>
    <section class="quest-task-panel" aria-label="本关任务与答案">
      <div id="quest-task">
        <div class="quest-task-meta"><span id="quest-level-number">第 1 关</span><span id="quest-skill"></span></div>
        <h2 id="quest-question" tabindex="-1"></h2><p id="quest-instruction" class="quest-instruction"></p>
        <div id="quest-clue" class="quest-clue"></div>
        <details id="quest-how" class="quest-how" open><summary>跟着这三步做</summary><ol id="quest-steps"></ol></details>
        <button id="quest-go-observe" class="quest-mobile-observe">去上方的 3D 观察台 ↑</button>
        <form id="quest-mission-form" class="quest-mission-form" hidden>
          <fieldset id="quest-mission-fields"><legend>① 照着上面的任务卡设置</legend><div class="quest-mission-wheels" id="quest-mission-wheels"></div><div class="quest-mission-plugs"><span>跳线</span><label><span class="sr-only">跳线端点一</span><select id="quest-mission-plug-a" required></select></label><span aria-hidden="true">↔</span><label><span class="sr-only">跳线端点二</span><select id="quest-mission-plug-b" required></select></label></div></fieldset>
          <button id="quest-check-settings" class="quest-check" type="submit">检查设置，开始解密 →</button>
        </form>
        <div id="quest-mission-status" class="quest-mission-status" hidden><span id="quest-mission-caption"></span><button id="quest-mission-reset">重新设置</button></div>
        <p id="quest-setup-feedback" role="status" class="quest-setup-feedback" hidden></p>
        <fieldset id="quest-answers" class="quest-answers"><legend id="quest-answer-label">选择你的发现</legend><div id="quest-options"></div></fieldset>
        <div id="quest-feedback" class="quest-feedback" role="status" aria-live="polite" hidden><strong id="quest-feedback-title"></strong><p id="quest-feedback-text"></p></div>
        <details class="quest-hint" id="quest-hint"><summary>需要一点提示？<span aria-hidden="true">＋</span></summary><p id="quest-hint-text"></p></details>
        <button id="quest-next" class="quest-primary quest-next" hidden>下一关 →</button>
      </div>
      <div id="quest-finish" class="quest-finish" hidden>
        <span class="quest-finish-seal" aria-hidden="true">✳</span><span class="quest-eyebrow">6 / 6 · 任务完成</span><h2 id="quest-finish-heading" tabindex="-1">消息解开了，<br>本领也带走了。</h2><p>你已经会观察部件、读懂跳线、追踪信号，还能亲手解开一条消息。</p><ul id="quest-stamps" aria-label="六项学习收获"></ul><button id="quest-play-again" class="quest-primary">再挑战六道新题 ↗</button><a href="#/lab/drums" data-page="lab" data-topic="drums">带着问题，再去信号实验室 →</a>
      </div>
    </section>
  </div>
  <p class="quest-footnote">依据 Enigma 最小回路设计的学习挑战 · 不需要背字母表，也不计时 · 离开后再进入，会换一套新题</p>
  <p id="quest-status" class="sr-only" role="status" aria-live="polite"></p>`;
