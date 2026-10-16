// The walkthrough follows the same input and transport commands as the free lab.
export function createWalkthrough(container, on, commands) {
  const $ = selector => container.querySelector(selector);
  const guide = { enabled: true, step: 0, phase: 'setup', first: null, second: null, wired: null, note: '' };
  let snapshot = { progress: -1, trace: null }, rendered = '';
  function restart(note = '') {
    Object.assign(guide, { step: 0, phase: 'setup', first: null, second: null, wired: null, note });
  }
  function render() {
    const current = Math.min(8, Math.max(0, Math.ceil(snapshot.progress) - 1)), finished = snapshot.progress >= 9;
    const key = JSON.stringify([guide, current, finished, snapshot.topic]);
    if (key === rendered) return; rendered = key;
    let title, instruction, observation, action, target = '';
    if (!guide.enabled) {
      title = '自由探索'; instruction = '任意按键、改变轮位或接线，观察不同的输出。'; observation = ''; action = '重新跟着做 →';
    } else if (guide.step === 0) {
      title = '01 · 准备一个相同的起点';
      instruction = guide.note || '点击“准备实验”：三只鼓轮回到 A，拔下接线。';
      observation = '目标：观察 A 经过回路，如何变成另一个字母。'; action = '准备实验 →'; target = 'settings';
    } else if (guide.step === 1) {
      title = '02 · 点击金色 A 键'; instruction = '轮位 AAA、无接线已就绪。点击字母键盘里的 A。';
      observation = '观察：快轮先转到 B，信号停在第 1 段。'; action = '输入 A →'; target = 'input';
    } else if (guide.step === 2) {
      title = finished ? '03 · 回路完成：A 变成了 ' + guide.first : `03 · 追踪信号，第 ${current + 1} / 9 段`;
      instruction = finished ? `看深色结果框：输入 A，输出 ${guide.first}，完成一次加密。` : '点击“下一段”，对照模型亮线和底部高亮步骤。';
      observation = finished ? '接下来不复位，再按一次 A，比较结果。' : '路径：接线板 → 三只鼓轮 → 反射器 → 反向通过三轮 → 输出。';
      action = finished ? '下一步：比较输出 →' : '下一段 →'; target = finished ? 'result' : 'trace';
      if (snapshot.topic === 'wiring') {
        title = '03 · 回到完整回路继续追踪'; instruction = '现在只显示接线板。点击“完整回路”，观察三只鼓轮和反射器。';
        observation = '当前输入和信号进度会保留，切换视图不会重新按键。'; action = '查看完整回路 →'; target = 'model';
      }
    } else if (guide.step === 3) {
      title = '04 · 再按 A，结果会一样吗？';
      instruction = !guide.second ? `第一次 A → ${guide.first}。保持轮位，不要复位，再按一次 A。` : finished ? `第一次 A → ${guide.first}，第二次 A → ${guide.second}。同一个 A，输出不同。` : '第二次信号正在通过回路，也可点击“查看比较结果”直接看结论。';
      observation = guide.second && finished ? '原因：快轮从 B 转到 C，内部接线相对触点的位置变了。' : '观察：轮位从 AAB 变成 AAC，最终输出会变为 D。';
      action = !guide.second ? '再输入一次 A →' : finished ? '下一步：改变接线 →' : '查看比较结果 →'; target = guide.second ? 'result' : 'input';
    } else {
      title = '05 · 只改接线，比较同一起点';
      if (guide.phase === 'setup' || guide.phase === 'connect') {
        instruction = guide.phase === 'setup' ? '打开设置，实验会先回到 AAA。选择端点 A 与 C，点击“接入”，再回到实验。' : '在“轮位与接线”里选择 A、C 并点击“接入”。保持轮位 AAA。';
        observation = `对照：第一轮无接线时 A → ${guide.first}。这次只改变接线。`; action = '打开接线设置 →'; target = 'settings';
      } else if (guide.phase === 'test') {
        instruction = '已接入 A ↔ C，轮位 AAA。回到字母键盘，再输入 A。';
        observation = `观察：输入先被接线换成 C；比较本次输出和无接线时的 ${guide.first}。`; action = '输入 A，验证接线 →'; target = 'input';
      } else {
        instruction = finished ? `同样从 AAA 按 A：无接线 → ${guide.first}，接 A ↔ C → ${guide.wired}。` : '接线后的信号正在通过回路。可直接查看接线前后的结果。';
        observation = finished ? '你已验证：轮位和接线都会改变输出。现在可以自己更换设置实验。' : '接线会在进入与返回时交换这一对字母。';
        action = finished ? '完成教学，自由探索 →' : '查看接线结果 →'; target = 'result';
      }
    }
    container.dataset.labGuidance = target;
    $('#lab-walkthrough').classList.toggle('is-free', !guide.enabled);
    $('#lab-walkthrough-title').textContent = title;
    $('#lab-walkthrough-do').textContent = instruction;
    $('#lab-walkthrough-observe').textContent = observation;
    $('#lab-walkthrough-action').textContent = action;
    $('#lab-walkthrough-toggle').textContent = guide.enabled ? '自由探索' : '恢复指引';
    $('#lab-walkthrough-mode').textContent = guide.enabled ? '跟着做 · 理解一个字母如何被加密' : '自由探索 · 自己更改设置，观察输出';
    container.querySelectorAll('[data-walkthrough-step]').forEach(item => {
      const index = Number(item.dataset.walkthroughStep);
      item.classList.toggle('is-done', index < guide.step);
      if (guide.enabled && index === guide.step) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current');
    });
    const wiring = guide.enabled && guide.step === 4;
    $('#lab-settings-instruction').hidden = !wiring;
    $('#lab-settings-instruction').textContent = guide.phase === 'test' ? '已接入 A ↔ C。点击“回到实验”，然后按 A，比较输出。' : '本步：轮位保持 AAA，端点选 A 和 C，点击“接入”，再回到实验。';
    $('#lab-settings').classList.toggle('is-guided', wiring);
  }
  function action() {
    if (!guide.enabled) { guide.enabled = true; restart('点击“准备实验”会清除当前记录，并从 AAA、无接线开始。'); }
    else if (guide.step === 0) { guide.step = 1; guide.note = ''; commands.prepare(); }
    else if (guide.step === 1) commands.input('A');
    else if (guide.step === 2) { if (snapshot.topic === 'wiring') commands.fullCircuit(); else if (snapshot.progress < 9) commands.step(); else guide.step = 3; }
    else if (guide.step === 3) {
      if (!guide.second) commands.input('A');
      else if (snapshot.progress < 9) commands.finish();
      else { guide.step = 4; guide.phase = 'setup'; }
    } else if (guide.phase === 'setup') { guide.phase = 'connect'; commands.prepareWiring(); }
    else if (guide.phase === 'connect') commands.openSettings();
    else if (guide.phase === 'test') commands.input('A');
    else if (snapshot.progress < 9) commands.finish();
    else guide.enabled = false;
    render();
  }
  on($('#lab-walkthrough-action'), 'click', action);
  on($('#lab-walkthrough-toggle'), 'click', () => { guide.enabled = !guide.enabled; if (guide.enabled) restart('点击“准备实验”会清除当前记录，并从 AAA、无接线开始。'); render(); });
  on($('#lab-walkthrough-start'), 'click', () => { guide.enabled = true; restart(); $('#lab-guide').close(); render(); $('#lab-walkthrough-action').focus({ preventScroll: true }); });
  return {
    sync(value) { snapshot = value; render(); },
    invalidate(preserve, message) { if (!preserve) restart(guide.enabled ? message + ' 点击“准备实验”重新跟着做。' : ''); },
    input(char, output) {
      if (!guide.enabled) return false;
      if (guide.step === 1 && char === 'A') { guide.first = output; guide.step = 2; return true; }
      if (guide.step === 3 && !guide.second && char === 'A') { guide.second = output; return false; }
      if (guide.step === 4 && guide.phase === 'test' && char === 'A') { guide.wired = output; guide.phase = 'result'; return false; }
      restart('你刚才进行了额外输入。点击“准备实验”可从 AAA 重新跟着做。'); return false;
    },
    connection(a, b, positions) {
      if (!guide.enabled || guide.step !== 4 || !positions.every(p => p === 0)) return false;
      guide.phase = [a, b].sort().join('') === 'AC' ? 'test' : 'connect'; return true;
    },
    free() { guide.enabled = false; render(); },
    get state() { return { ...guide }; },
  };
}
