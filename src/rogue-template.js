import { ALPHABET } from './cipher.js';
import { ROGUE_ROLES, ROGUE_ZONE_LABELS } from './rogue-content.js';

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const ICONS = {
  radio: '<circle cx="12" cy="12" r="2"/><path d="M5.6 8.4a9 9 0 0 0 0 7.2M18.4 8.4a9 9 0 0 1 0 7.2M3.2 5.8a13 13 0 0 0 0 12.4M20.8 5.8a13 13 0 0 1 0 12.4"/>',
  archive: '<path d="M4 7.5h16v12H4zM3 4h18v3.5H3zM8 11h8M8 15h5"/>',
  wrench: '<path d="m14.5 6.5 3-3 3 3-3 3M16.5 8.5 8 17a2.8 2.8 0 1 1-4-4l8.5-8.5M5.5 18.5l-2 2"/>',
  signal: '<path d="M4 18V9M8 18V6M12 18V3M16 18v-7M20 18v-4"/>',
  file: '<path d="M6 3h8l4 4v14H6zM14 3v5h5M9 13h6M9 17h4"/>',
  analysis: '<circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 5 5M8 10.5h5M10.5 8v5"/>',
  machine: '<path d="M4 5h16v14H4zM8 9h8M8 13h2M12 13h2M16 13h0M8 17h8"/>',
  tea: '<path d="M5 8h11v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM16 10h2a3 3 0 0 1 0 6h-2M8 4c0 1 1 1 1 2M12 4c0 1 1 1 1 2"/>',
  shield: '<path d="M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6zM8 12l2.5 2.5L16 9"/>',
  pause: '<path d="M8 5v14M16 5v14"/>', play: '<path d="m8 5 11 7-11 7z"/>',
  arrow: '<path d="M5 12h13M13 6l6 6-6 6"/>', back: '<path d="M19 12H6M11 6l-6 6 6 6"/>',
  repeat: '<path d="M17 3l4 4-4 4M3 7h18M7 21l-4-4 4-4M21 17H3"/>',
  shuffle: '<path d="M3 7h3c4 0 5 10 9 10h6M17 13l4 4-4 4M3 17h3c1.5 0 2.5-1.2 3.3-2.8M17 3l4 4-4 4"/>',
  send: '<path d="m21 3-7.5 18-3.5-7-7-3.5zM10 14l11-11"/>', spark: '<path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z"/>',
};
const icon = (name, className = '') => `<svg class="rogue-icon ${className}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.spark}</svg>`;
const button = (action, label, value = null, className = '') => `<button type="button" class="rogue-button ${className}" data-rogue-action="${action}"${value === null ? '' : ` data-value="${escapeHtml(value)}"`}>${icon(({ start: 'play', close: 'back', pause: 'pause', resume: 'play', continue: 'arrow', replay: 'repeat', 'new-run': 'shuffle', handoff: 'send', tool: 'spark' }[action] || 'arrow'))}<span>${escapeHtml(label)}</span></button>`;
const roleIcon = { intercept: 'radio', archive: 'archive', mechanic: 'wrench' };
const nodeIcon = { signal: 'signal', dispatch: 'file', colleague: 'radio', archive: 'archive', tea: 'tea', analysis: 'analysis', wire: 'wrench', settings: 'file', machine: 'machine' };
const layerNames = ['截收', '档案', '分析', '机房'];
const roleChoice = (role, selected) => `<button type="button" class="rogue-role${selected === role.id ? ' is-selected' : ''}" data-rogue-action="role" data-value="${role.id}" aria-pressed="${selected === role.id}"><span class="rogue-role-icon">${icon(roleIcon[role.id])}</span><span class="rogue-role-copy"><strong>${escapeHtml(role.name)}</strong><small>${escapeHtml(role.ability)}</small></span><span class="rogue-role-check">${selected === role.id ? '已选' : '选择'}</span></button>`;

function hud(state) {
  const reserve = state.resources?.reserve ?? 0;
  return `<div class="rogue-hud" aria-label="当前班次"><div class="rogue-hud-stat rogue-hud-stat--reserve"><span>当班余裕</span><strong>${reserve}<i>/ 3</i></strong><small>${reserve === 0 ? '分析员已介入' : '错误会消耗余裕'}</small></div><div class="rogue-hud-stat"><span>已收记录</span><strong>${state.evidence?.length || 0}<i> 条</i></strong><small>证据袋持续更新</small></div><div class="rogue-hud-stat"><span>随身工具</span><strong>${state.inventory?.length || 0}<i>/ 2</i></strong><small>${state.inventory?.length ? state.inventory.map(item => item.name).join(' · ') : '尚未携带'}</small></div><div class="rogue-hud-seed"><span>RUN ID</span><code>${escapeHtml(state.seed.slice(0, 8).toUpperCase())}</code></div></div>`;
}

function evidenceAside(state, objective = '完成四处现场记录，再核验右轮起点。') {
  const evidence = state.evidence?.slice(-4) || [];
  return `<aside class="rogue-aside"><div class="rogue-aside-block"><p class="rogue-aside-label">行动目标</p><strong class="rogue-objective">${escapeHtml(objective)}</strong></div><div class="rogue-aside-block"><p class="rogue-aside-label">证据袋 <span>${state.evidence?.length || 0}</span></p><ul class="rogue-evidence-list">${evidence.length ? evidence.map(item => `<li>${icon(item.quality === 'clear' ? 'shield' : 'file')}<span>${escapeHtml(item.text || '现场记录')}</span></li>`).join('') : '<li class="is-empty">还没有可核验的记录。</li>'}</ul></div><div class="rogue-aside-block rogue-aside-note"><p class="rogue-aside-label">值班提示</p><p>每次选择都会留下痕迹。先保住证据，再追求速度。</p></div></aside>`;
}

function startView(state) {
  return `<section class="rogue-sheet rogue-screen rogue-screen-start rogue-game-stage"><div class="rogue-run-kicker"><span class="rogue-kicker"><i></i>随机夜班 / 10 分钟行动</span><span class="rogue-seed">案件 ${escapeHtml(state.seed.slice(0, 8).toUpperCase())}</span></div><div class="rogue-game-scene"><div class="rogue-game-scene-glow"></div><div class="rogue-avatar"><div class="rogue-avatar-ring">${icon('radio')}</div><strong>夜班截收员</strong><small>正在等待你的命令</small></div><div class="rogue-scene-copy"><p class="rogue-eyebrow">NIGHT SHIFT / FIELD RUN</p><h2 id="rogue-heading" tabindex="-1">接过这一班，<br><em>把信号送到天亮。</em></h2><p class="rogue-lead">四处现场、两次判断、一次真正的 Enigma 核验。你会在十分钟内把一条截报从噪声里带出来。</p><div class="rogue-mission-objective"><span>${icon('spark')}</span><div><small>当前任务</small><strong>选定岗位，开始第一处截收现场</strong></div></div></div><div class="rogue-briefing-card"><div class="rogue-card-top"><span>CASE BRIEF</span>${icon('file')}</div><p>案件设置单会给出转子、环位和接线条件。最后一格右轮位置不会直接告诉你。</p><div class="rogue-briefing-line"><span>起始资源</span><strong>3 格余裕</strong></div><div class="rogue-briefing-line"><span>失败也会发生什么</span><strong>证据继续保留</strong></div></div></div><div class="rogue-run-facts"><span><b>04</b>现场层</span><span><b>03</b>可选岗位</span><span><b>01</b>唯一答案</span></div><div class="rogue-role-heading"><div><p class="rogue-section-label">选择你的岗位</p><h3>今晚谁来守住这条线？</h3></div><span>每个岗位都改变一条规则</span></div><div class="rogue-roles" role="group" aria-label="选择夜班岗位">${ROGUE_ROLES.map(role => roleChoice(role, state.role)).join('')}</div><div class="rogue-action-bar"><div class="rogue-start-actions">${button('start', '接过随机截报', null, 'is-primary')}<span>${icon('shield')} 进度自动保存在本机</span></div><span class="rogue-action-hint">ENTER / 开始行动</span></div></section>`;
}

function routeView(state) {
  const current = state.route[state.depth];
  const layers = state.route.map((layer, index) => `<li class="rogue-route-layer${index < state.depth ? ' is-visited' : ''}${index === state.depth ? ' is-current' : ''}"><div class="rogue-route-layer-head"><span class="rogue-route-step">0${index + 1}</span><div><strong>${layerNames[index]}</strong><small>${index < state.depth ? '已完成' : index === state.depth ? '现在选择' : '待解锁'}</small></div><span class="rogue-route-line"></span></div><div class="rogue-route-nodes">${layer.nodes.map(node => `<button type="button" class="rogue-node${index !== state.depth ? ' is-locked' : ''}" data-node-icon="${node.type}" data-rogue-action="node" data-value="${node.id}"${index !== state.depth ? ' disabled' : ''}><span class="rogue-node-icon">${icon(nodeIcon[node.type] || 'spark')}</span><span class="rogue-node-copy"><strong>${escapeHtml(node.title)}</strong><small>${escapeHtml(node.reward)}</small></span><span class="rogue-node-arrow">${index !== state.depth ? icon('shield') : icon('arrow')}</span></button>`).join('')}</div></li>`).join('');
  return `<section class="rogue-sheet rogue-screen"><div class="rogue-screen-head"><div><p class="rogue-section-label">${escapeHtml(ROGUE_ZONE_LABELS[current?.nodes[0]?.zone] || '夜班现场')}</p><h2 id="rogue-heading" tabindex="-1">选一处先去。</h2><p>路线会随着你的选择展开，先看清眼前一层。</p></div>${button('pause', '暂停')}</div>${hud(state)}<div class="rogue-game-grid"><main class="rogue-primary"><div class="rogue-route-map-head"><span>FIELD ROUTE</span><strong>四处现场记录</strong><span>第 ${state.depth + 1} / 4 层</span></div><ol class="rogue-route-map" aria-label="四处夜班现场">${layers}</ol></main>${evidenceAside(state)}</div></section>`;
}

function eventView(state) {
  const node = state.currentNode;
  return `<section class="rogue-sheet rogue-screen"><div class="rogue-screen-head"><div><p class="rogue-section-label">${escapeHtml(ROGUE_ZONE_LABELS[node.zone] || '夜班现场')}</p><h2 id="rogue-heading" tabindex="-1">${escapeHtml(node.title)}</h2><p>现场记录需要一个明确判断。保留线索，或者带着代价继续。</p></div>${button('pause', '暂停')}</div>${hud(state)}<div class="rogue-game-grid"><main class="rogue-primary"><div class="rogue-scene-card"><div class="rogue-scene-icon">${icon(nodeIcon[node.type] || 'spark')}</div><div><span>现场回放</span><strong>纸带轻响，台灯把字迹照得发亮。</strong><p>选择一项行动，决定这条记录能否成为清楚的证据。</p></div></div><div class="rogue-choice-heading"><span>你的判断</span><small>每个选项都可以继续前进</small></div><div class="rogue-choices">${node.options.map((option, index) => `<button type="button" class="rogue-choice" data-rogue-action="resolve" data-value="${option.id}"><span class="rogue-choice-index">0${index + 1}</span><span class="rogue-choice-copy"><strong>${escapeHtml(option.label)}</strong><small>${option.success ? '保留清楚的证据，并可能获得工具。' : '带着一点疑问继续，消耗一格余裕。'}</small></span>${icon(option.success ? 'shield' : 'arrow')}</button>`).join('')}</div>${toolView(state)}</main>${evidenceAside(state, '完成眼前记录，再决定是否继续深入。')}</div></section>`;
}

function completeView(state) {
  return `<section class="rogue-sheet rogue-screen rogue-screen-result"><div class="rogue-result-icon ${state.lastOutcome?.success ? 'is-good' : ''}">${icon(state.lastOutcome?.success ? 'shield' : 'file')}</div><p class="rogue-section-label">${state.lastOutcome?.success ? '记录已收好' : '线索仍可继续'}</p><h2 id="rogue-heading" tabindex="-1">${escapeHtml(state.lastOutcome?.text || '这一处现场记录完成。')}</h2><p>当前记录已收入案件袋，下一处现场已经亮起台灯。</p><div class="rogue-result-strip"><span>证据袋 <b>${state.evidence.length}</b></span><span>余裕 <b>${state.resources.reserve} / 3</b></span><span>下一站 <b>${state.depth === 3 ? '最终核验' : layerNames[state.depth + 1]}</b></span></div>${button('continue', state.depth === 3 ? '前往最终核验' : '继续沿走廊前行', null, 'is-primary')}${statusView(state)}</section>`;
}

function finalView(state) {
  const file = state.caseFile;
  return `<section class="rogue-sheet rogue-screen"><div class="rogue-screen-head"><div><p class="rogue-section-label">最终核验 / ${escapeHtml(file.label)}</p><h2 id="rogue-heading" tabindex="-1">把短报读通。</h2><p>选择未知的右轮起点。三次未命中后，分析员会把 crib 位置标给你。</p></div>${button('pause', '暂停')}</div>${hud(state)}<div class="rogue-game-grid"><main class="rogue-primary"><div class="rogue-cipher-console"><div class="rogue-cipher-top"><span>ENIGMA CHECK / RIGHT ROTOR</span>${icon('machine')}</div><div class="rogue-rotor-row"><div><small>左轮</small><strong>${ALPHABET[file.knownLeft]}</strong></div><span>·</span><div><small>中轮</small><strong>${ALPHABET[file.knownMiddle]}</strong></div><span>·</span><div class="is-unknown"><small>右轮</small><strong>?</strong></div></div><div class="rogue-cipher-line"><span>密文</span><code>${escapeHtml(file.ciphertext)}</code></div><div class="rogue-cipher-line"><span>已知词形</span><code>${escapeHtml(file.crib)}</code></div><div class="rogue-cipher-note">接线 ${escapeHtml(file.plugboard[0].join(' ↔ '))} · 环位 AAA · 转子 I / II / III</div></div><div class="rogue-letter-heading"><span>选择右轮起点</span><small>点击字母提交一次候选</small></div><div class="rogue-letter-pad" role="group" aria-label="右轮起始字母">${[...ALPHABET].map(char => `<button type="button" class="rogue-letter" data-rogue-action="right" data-value="${char}" aria-label="右轮 ${char}">${char}</button>`).join('')}</div>${state.lastOutcome ? `<p class="rogue-feedback" role="status">${icon(state.lastOutcome.success ? 'shield' : 'signal')}<span>${escapeHtml(state.lastOutcome.text)}</span></p>` : ''}${state.decoded ? `<div class="rogue-decoded"><span>核验明文</span><strong>${escapeHtml(state.decoded)}</strong></div>` : ''}</main>${evidenceAside(state, '确认唯一的右轮候选，完成这条短报的核验。')}</div></section>`;
}

function handoffView(state) {
  return `<section class="rogue-sheet rogue-screen rogue-screen-result"><div class="rogue-result-icon is-good">${icon('send')}</div><p class="rogue-section-label">交接室 / ${escapeHtml(state.caseFile.label)}</p><h2 id="rogue-heading" tabindex="-1">报文读通了。</h2><p>“${escapeHtml(state.decoded)}” 已通过完整回路。你准备如何交给下一班？</p><div class="rogue-choices"><button type="button" class="rogue-choice" data-rogue-action="handoff" data-value="hold"><span class="rogue-choice-index">01</span><span class="rogue-choice-copy"><strong>保留证据，等待交叉核验</strong><small>把时间戳和未确认事项一起写进档案</small></span>${icon('shield')}</button><button type="button" class="rogue-choice" data-rogue-action="handoff" data-value="release"><span class="rogue-choice-index">02</span><span class="rogue-choice-copy"><strong>按这条报文立即行动</strong><small>不再等待新的现场记录</small></span>${icon('send')}</button></div>${statusView(state)}</section>`;
}

function archiveView(state) {
  const score = state.grade || { grade: 'qualified', reasons: [] };
  return `<section class="rogue-sheet rogue-screen rogue-screen-archive"><div class="rogue-archive-stamp">${score.grade === 'complete' ? 'COMPLETE' : 'QUALIFIED'}</div><p class="rogue-section-label">值班档案 / ${escapeHtml(state.caseFile.label)}</p><h2 id="rogue-heading" tabindex="-1">这一班结束了。</h2><p class="rogue-ending">${score.grade === 'complete' ? '证据已核验，仍未确认的事也已交班。' : '本班留下了有用线索，下一班可以接着查。'}</p><div class="rogue-score-grid">${score.reasons.map((reason, index) => `<div><span>0${index + 1}</span><strong>${escapeHtml(reason)}</strong></div>`).join('')}</div><ul class="rogue-record">${state.history.map(item => `<li>${icon(item.success === false ? 'file' : 'shield')}<span>${escapeHtml(item.nodeId || item.decision || '现场记录')}${item.choiceId ? ` / ${escapeHtml(item.choiceId)}` : ''}</span></li>`).join('')}<li>${icon('radio')}<span>seed / ${escapeHtml(state.seed)}</span></li></ul><div class="rogue-archive-actions">${button('replay', '用同一 seed 再值一班')}${button('new-run', '抽一份新截报', null, 'is-primary')}${button('close', '返回主线')}</div></section>`;
}

function statusView(state) {
  return `<footer class="rogue-status"><span>已收记录 <strong>${state.evidence.length}</strong></span><span>随身工具 <strong>${state.inventory.length} / 2</strong></span><span>seed <code>${escapeHtml(state.seed.slice(0, 8))}</code></span></footer>`;
}

function toolView(state) {
  if (!state.inventory.length) return '<div class="rogue-tools rogue-tools-empty">工具会在现场判断后加入工具袋。</div>';
  return `<div class="rogue-tools" aria-label="随身工具"><span class="rogue-tools-label">工具袋</span>${state.inventory.map(tool => button('tool', `使用${tool.name}`, tool.id)).join('')}</div>`;
}

export function renderRogueView(state) {
  if (state.paused) return `<section class="rogue-sheet rogue-screen rogue-screen-paused"><div class="rogue-paused-mark">${icon('pause')}</div><p class="rogue-section-label">夜班暂存</p><h2 id="rogue-heading" tabindex="-1">先歇一会儿。</h2><p>路线、证据和余裕都留在当前记录里。</p>${button('resume', '继续这一班', null, 'is-primary')}${button('close', '返回主线')}${statusView(state)}</section>`;
  if (state.phase === 'briefing') return startView(state);
  if (state.phase === 'route') return routeView(state);
  if (state.phase === 'event') return eventView(state);
  if (state.phase === 'event-complete') return completeView(state);
  if (state.phase === 'final') return finalView(state);
  if (state.phase === 'handoff') return handoffView(state);
  if (state.phase === 'complete') return archiveView(state);
  return `<section class="rogue-sheet">${button('close', '返回主线')}</section>`;
}
