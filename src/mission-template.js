import { MISSION, alignmentConflicts } from './mission-engine.js';
import { ALPHABET } from './cipher.js';

/** The reducer keeps internal beat IDs; the dossier only shows the live room and action. */
export const missionShell = `
  <div class="mission-wrap">
    <p id="mission-announcement" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></p>
    <header class="mission-header">
      <div><p class="mission-kicker">NIGHT HANDOFF</p><h1 id="mission-heading" tabindex="-1">黎明之前<span>Before daybreak.</span></h1></div>
      <div class="mission-header-note">
        <span class="mission-header-copy">接过无线电室的夜班记录，把一条截报完整交给下一班。</span>
        <div class="mission-status" aria-label="现场状态">
          <span><small>当前位置</small><output id="mission-location" class="mission-location">英国 · 布莱切利园</output></span>
          <span><small>现场时间</small><output id="mission-clock">05:42</output></span>
          <span><small>证据状态</small><output id="mission-evidence-count" aria-label="证据状态">尚未归档</output></span>
        </div>
        <output id="mission-elapsed" class="sr-only" aria-label="行动已用时间">00:00</output>
      </div>
    </header>
    <div class="mission-layout">
      <section class="mission-world" aria-label="夜班行动空间">
        <div class="mission-scene-top"><span class="mission-live-dot" aria-hidden="true"></span><span id="mission-location-world">英国 · 布莱切利园</span><span id="mission-timestamp" class="mission-year">05:42</span></div>
        <canvas id="mission-canvas" aria-label="可拖动观察的三维夜班工作区；现场记录中的操作仍可用键盘完成"></canvas>
        <output id="mission-machine-readout" aria-live="off">夜班登记 / 05:42</output>
        <button class="mission-floorplan" type="button" data-action="floorplan" aria-pressed="false" aria-label="查看连通走廊与七个工作区的楼层全景">楼层全景 ↗</button>
        <div class="mission-fallback" hidden><span class="mission-fallback-symbol" aria-hidden="true">B · D · ?</span><h2>三维画面暂不可用</h2><p>文本现场仍可继续。线索、密码运算和当前行动都保留在现场记录中。</p></div>
        <div class="mission-cinema" hidden aria-label="场景过渡"><div class="mission-cinema-top"><span>NIGHT SHIFT</span><div><button type="button" data-action="pause-intro" aria-pressed="false">暂停</button><button type="button" data-action="skip-intro">跳过过渡 →</button></div></div><div class="mission-cinema-bottom"><span class="mission-cinema-label">NORTH HARBOR / 05:42</span><p class="mission-cinema-caption" role="status" aria-live="polite">雾中的截报，正在等待你的判断。</p><div class="mission-cinema-track" aria-hidden="true"><div class="mission-cinema-progress"></div></div></div></div>
        <div class="mission-camera" role="group" aria-label="三维观察视角"><button type="button" data-action="view" data-value="entry" aria-pressed="true">入口</button><button type="button" data-action="view" data-value="radio" aria-pressed="false">无线电</button><button type="button" data-action="view" data-value="archive" aria-pressed="false">档案</button><button type="button" data-action="view" data-value="analysis" aria-pressed="false">分析</button><button type="button" data-action="view" data-value="machine" aria-pressed="false">机房</button><button type="button" data-action="view" data-value="map" aria-pressed="false">地图</button><button type="button" data-action="view" data-value="handoff" aria-pressed="false">交接</button></div>
        <div class="mission-scene-caption"><span id="mission-scene-caption">夜班记录从一束稳定信号开始。</span><small>拖动观察 · 现场记录</small></div>
      </section>
      <section class="mission-dossier" aria-label="当前现场记录"><div id="mission-task"></div></section>
    </div>
    <div class="mission-afterword">
      <details class="mission-notebook"><summary>证据档案 <span id="mission-clue-count">尚未归档</span></summary><ol id="mission-clues"></ol></details>
      <details class="mission-record"><summary>现场记录</summary><div class="mission-record-body"><p>每一条记录都保留输入、判断和留下的证据。可以暂停行动，回到当前记录继续。</p><p>三维画面不可用时，文字现场仍保留全部密码运算和操作入口。</p></div></details>
    </div>
    <footer class="mission-footer"><span>机器可以重复计算，交接仍要对时间和后果负责。</span><a href="#/history" data-page="history">返回战时序章 ↗</a></footer>
  </div>`;

const option = (action, value, title, detail = '', selected = false) => `<button class="mission-option" type="button" data-action="${action}" data-value="${value}"${action === 'answer' ? '' : ` aria-pressed="${selected}"`}><strong>${title}</strong>${detail ? `<span>${detail}</span>` : ''}</button>`;
const primary = (action, label, value = null) => `<button class="mission-primary" type="button" data-action="${action}"${value === null ? '' : ` data-value="${value}"`}>${label}<span aria-hidden="true">→</span></button>`;
const beatIndex = s => Number.isInteger(s?.beat) ? s.beat : Number.isInteger(s?.stage) ? s.stage : 0;
const beatAt = s => MISSION.stages?.[beatIndex(s)] || {};
const selected = (s, key, fallback = null) => s?.[key] ?? fallback;
const values = (s, key, fallback = []) => Array.isArray(s?.[key]) ? s[key] : fallback;

function legacyControls(s, index) {
  if (index === 1) {
    const offset = selected(s, 'offset', 0), conflicts = alignmentConflicts(offset);
    return `<div class="mission-align" aria-label="猜测与密文对齐"><span>密文开头 · 前 8 格</span><div class="mission-letter-grid">${[...(MISSION.strip || '').slice(0, 8)].map((c, i) => `<b class="${conflicts.includes(i - offset) ? 'is-conflict' : ''}">${c}</b>`).join('')}</div><span>猜测 · WETTER（天气）</span><div class="mission-letter-grid">${Array.from({ length: 8 }, (_, i) => `<b class="${conflicts.includes(i - offset) ? 'is-conflict' : ''}">${MISSION.crib?.[i - offset] || '·'}</b>`).join('')}</div><p>${conflicts.length ? `发现 ${conflicts.length} 处相同字母，当前对齐有矛盾。` : '没有相同字母：暂未排除，仍需后续核验。'}</p></div><div class="mission-inline-options">${[0, 1, 2].map(n => option('align', n, `从第 ${n + 1} 格`, '', offset === n)).join('')}</div>${primary('submit', '检查这次对齐')}`;
  }
  if (index === 2) return `<div class="mission-pair-display"><span>已知</span><strong>A <i>↔</i> G</strong><span>补全</span><strong>G <i>↔</i> ${selected(s, 'pair', '?') || '?'}</strong></div><div class="mission-inline-options">${['T', 'A', 'G'].map(c => option('pair', c, c, '', selected(s, 'pair') === c)).join('')}</div>${primary('submit', '核对双向接线')}`;
  if (index === 3) {
    const positions = values(s, 'positions', [0, 0, 0]);
    return `<div class="mission-setting-note">交接设置单 <strong>左 B · 中 D · 右 ?</strong><small>I–II–III / 环位 AAA / A ↔ G</small></div><div class="mission-rotors">${[0, 1, 2].map((n) => `<div><span>${['I · 左', 'II · 中', 'III · 右'][n]}</span><div>${n < 2 ? `<button type="button" data-action="rotor" data-index="${n}" data-step="-1" aria-label="${n === 0 ? '左' : '中'}转子前一个字母">−</button>` : ''}<output aria-label="${['左', '中', '右'][n]}转子位置">${n < 2 ? ALPHABET[positions[n]] : '?'}</output>${n < 2 ? `<button type="button" data-action="rotor" data-index="${n}" data-step="1" aria-label="${n === 0 ? '左' : '中'}转子后一个字母">+</button>` : ''}</div><small>${n < 2 ? '点击调整' : '交给搜索'}</small></div>`).join('')}</div>${primary('submit', '确认初始设置')}`;
  }
  if (index === 4) return `${values(s, 'results').length ? `<div class="mission-search-summary"><strong>候选批次已检验</strong><span>候选初始轮位 B · D · F</span></div><details class="mission-search-list"><summary>展开运算结果</summary><div>${values(s, 'results').map(r => `<div class="mission-candidate ${r.matches ? 'is-match' : ''}"><span>${r.key}</span><code>${r.output}</code><small>${r.matches ? '保留' : '排除'}</small></div>`).join('')}</div></details><p class="mission-question">机器停下，我们得到了什么？</p>${option('answer', 'finished', '整条航线已经确认', '可以直接把候选当作放行命令。')}${option('answer', 'candidate', '一个需要继续核验的候选', '先用它解开整条交接报。')}` : `<div class="mission-search-ready"><span>当前问题</span><strong>B · D · A → Z</strong><p>已知开头 WETTER<br>只比较右轮的 26 个初始位置。</p></div>${primary('search', '启动候选搜索')}`}`;
  if (index === 5) return `<div class="mission-ciphertext"><span>整条密文 · 保留全部步进</span><code>${(MISSION.ciphertext || '').match(/.{1,5}/g)?.join(' ') || '等待截报'}</code></div>${s.decoded ? `<div class="mission-plaintext"><span>完整核验结果 · 从 BDF 复位</span><code>${s.decoded.slice(0,2)} / ${s.decoded.slice(2,8)} ${s.decoded.slice(8,17)} ${s.decoded.slice(17)}</code><p>DX = 交接批次 · WETTER = 天气<br>NORDHAFEN = 北港 · FREI = 通行</p></div><p class="mission-question">这条消息支持哪一种行动解释？</p>${option('answer', 'route', '北港在这次窗口内可通行', '保留时间戳，交给交接班继续核验。')}${option('answer', 'attack', '敌军马上从西侧进攻', '报文没有提供这条结论。')}` : primary('decode', '复位 BDF 并解密')}`;
  return `${option('answer', 'certain', '立即放行接头船', '把早先的窗口当成实时保证。')}${option('answer', 'verify', '标注时间，交叉核验再建议', '把明文和待确认事项一起交给下一班。')}${option('answer', 'discard', '丢弃报文，不告诉任何人', '让有价值的线索消失。')}`;
}

function taskControls(s, index) {
  if (index === 0) return `${option('checkin', 'ready', '接起耳机，确认值班', '记录当前时间与窗外雾况。', selected(s, 'checkin') === 'ready' || selected(s, 'checkIn') === true)}${primary('submit', '锁定接班记录')}`;
  if (index === 1) return `<div class="mission-channels">${(MISSION.channels || []).map((c, i) => option('channel', i, c.title || c.label || `频道 ${i + 1}`, c.label || '', selected(s, 'channel') === i)).join('')}</div><div class="mission-evidence"><span>截收记录</span><p>${selected(s, 'channel') === null || selected(s, 'channel') === undefined ? '点选一个频道，查看它留下的记录。' : MISSION.channels[selected(s, 'channel')]?.text || '记录已载入。'}</p></div>${primary('submit', '锁定这份截报')}`;
  if (index === 2) return `<div class="mission-inline-options">${[['chronological', '按时间排序'], ['length', '按长度排序'], ['source', '按来源排序']].map(([v, t]) => option('order', v, t, '', selected(s, 'order') === v)).join('')}</div>${primary('submit', '整理截收纸')}`;
  if (index === 3) return `<div class="mission-inline-options">${[['weather', '天气格式'], ['routine', '例行格式'], ['unknown', '未知格式']].map(([v, t]) => option('archive', v, t, '', selected(s, 'archive') === v)).join('')}</div>${primary('submit', '归档相同格式')}`;
  if (index === 4) return `<div class="mission-inline-options">${[['WETTER', 'WETTER'], ['NORDHAFEN', 'NORDHAFEN'], ['FREI', 'FREI']].map(([v, t]) => option('crib', v, t, '', selected(s, 'cribSelection') === v || selected(s, 'crib') === v)).join('')}</div>${primary('submit', '圈出可检验词形')}`;
  if (index === 5) return legacyControls(s, 1);
  if (index === 6) return `<div class="mission-inline-options">${[['A-G', 'A ↔ G'], ['A-T', 'A ↔ T'], ['G-T', 'G ↔ T']].map(([v, t]) => option('relation', v, t, '', selected(s, 'relation') === v)).join('')}</div>${primary('submit', '连起关系链')}`;
  if (index === 7) return legacyControls(s, 2);
  if (index === 8) return legacyControls(s, 3);
  if (index === 9) return primary('search', '启动候选搜索');
  if (index === 10) return `${option('compare', 'candidate', '保留一个待核验候选', '停机结果需要完整解密后才能交接.')}${primary('submit', '比较停机结果')}`;
  if (index === 11) return primary('decode', '复位候选并解密');
  if (index === 12) return `<div class="mission-map-note"><span>北港地图</span><strong>标出有效窗口与报文位置</strong><p>05:42 的位置需要在地图上留下可复核标记。</p></div><div class="mission-inline-options">${[['north-harbor', '北港'], ['west-channel', '西侧航道'], ['unknown', '暂不确定']].map(([v, t]) => option('map', v, t, '', selected(s, 'mapMarker') === v || selected(s, 'mapMarker') === 'north-harbor-window' && v === 'north-harbor' || selected(s, 'marker') === v)).join('')}</div>${primary('submit', '留下地图标记')}`;
  if (index === 13) return `${option('verify', 'verify', '与瞭望记录交叉核验', '把时间戳和仍未确认的变量一起保留。', selected(s, 'crossCheck') === 'verify' || selected(s, 'crossCheck') === true)}${primary('submit', '完成交叉核验')}`;
  if (index === 14) return `${option('handoff', 'hold', '确认前暂缓放行', '交出 BDF、明文、时间戳和待确认事项。', selected(s, 'handoff') === 'hold')}${primary('submit', '封存交接记录')}`;
  return legacyControls(s, index);
}

export function renderEvidence(s) {
  const entries = Array.isArray(s?.evidence) && s.evidence.length ? s.evidence.map(e => typeof e === 'string' ? e : e.text || e.label || e.clue || e.detail || '') : (s?.clues || []);
  return entries.length ? entries.map(c => `<li>${c}</li>`).join('') : '<li>现场证据会在判断完成后留在这里。</li>';
}

export function renderTask(s) {
  const index = beatIndex(s), beat = beatAt(s);
  if (s.phase === 'briefing') return `<p class="mission-file-label">夜班记录 / 待接班</p><h2 class="mission-brief-title" id="mission-task-title" tabindex="-1">05:42，<br>北港传来一段短报。</h2><p class="mission-lead">雾压在海面，交接窗口正在逼近。你要沿着同一条证据链，把信号从截收到交接完整保存。</p><p>现场记录会随着你的判断移动：无线电室、档案走廊、分析室、机房、地图室，直到交接电话接通。</p>${primary('start', '接过截报，开始行动')}<p class="mission-mini-note">所有操作都可用键盘完成；现场记录会保留可重试的判断。</p>`;
  if (s.phase === 'complete') return `<p class="mission-file-label">交接档案 / 已封存</p><h2 class="mission-brief-title" id="mission-task-title" tabindex="-1">信号已交接。<br>北港暂缓放行。</h2><p class="mission-lead">BDF、完整明文和时间戳已经写入交接表。仍未确认的变量也随档案交给下一班。</p><ol class="mission-report">${renderEvidence(s)}</ol><p class="mission-reflection">读懂消息只是开始；交接必须同时交出证据、时间和后果。</p>${primary('restart', '重新执行夜班任务')}<a class="mission-return" href="#/history" data-page="history">返回战时序章 ↗</a>`;
  if (s.paused) return `<p class="mission-file-label">行动暂存 / 现场记录</p><h2 class="mission-brief-title" id="mission-task-title" tabindex="-1">先停一会儿。</h2><p>线索、轮位和已收证据都还在。准备好后，回到当前记录继续。</p><blockquote>${beat.discussion || beat.story || '现场记录等待你的下一次判断。'}</blockquote>${primary('resume', '继续当前记录')}<a class="mission-return" href="#/history" data-page="history">返回序章，稍后再来 ↗</a>`;
  const location = beat.place || beat.zone || s.currentZone || '夜班行动空间';
  const actionSentence = beat.goal || beat.action || beat.actions?.[0]?.label || '继续检查现场留下的证据。';
  return `<div class="mission-task-meta"><span class="mission-location-line">${location}</span><button type="button" class="mission-text-button" data-action="pause">暂停</button></div><h2 id="mission-task-title" tabindex="-1">${actionSentence}</h2><div class="mission-story"><span>${beat.speaker || '现场记录'}</span><p>${beat.story || '记录已载入，等待你的判断。'}</p></div><p class="mission-goal"><span>当前行动</span>${actionSentence}</p><div class="mission-controls" ${s.cleared ? 'hidden' : ''}>${taskControls(s, index)}</div><div id="mission-feedback" class="mission-feedback ${s.cleared ? 'is-success' : ''}" ${s.feedback ? '' : 'hidden'}>${s.cleared ? '<span>证据已收录</span>' : '<span>再试一次</span>'}<p>${s.feedback || ''}</p></div>${s.cleared ? primary('next', index === (MISSION.stages?.length || 15) - 1 ? '完成交接，打开档案' : '收好证据，继续前行') : `<button type="button" class="mission-hint-button" data-action="hint">${s.hint >= 2 ? '提示已全部展开' : s.hint === 1 ? '再给我一点提示' : '需要一点提示'} <span>${s.hint || 0} / 2</span></button>${s.hint ? `<div class="mission-hints">${(beat.hints || []).slice(0, s.hint).map(h => `<p>${h}</p>`).join('')}</div>` : ''}`}<details class="mission-depth"><summary>再想深一层</summary><p>${beat.depth || beat.discussion || ''}</p><blockquote>${beat.discussion || ''}</blockquote></details>`;
}
