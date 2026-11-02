import { ALPHABET } from './cipher.js';
import { ROGUE_ROLES, ROGUE_ZONE_LABELS } from './rogue-content.js';

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const button = (action, label, value = null, className = '') => `<button type="button" class="rogue-button ${className}" data-rogue-action="${action}"${value === null ? '' : ` data-value="${escapeHtml(value)}"`}>${escapeHtml(label)}</button>`;
const roleChoice = (role, selected) => `<button type="button" class="rogue-role${selected === role.id ? ' is-selected' : ''}" data-rogue-action="role" data-value="${role.id}" aria-pressed="${selected === role.id}"><strong>${escapeHtml(role.name)}</strong><span>${escapeHtml(role.ability)}</span></button>`;

function startView(state) {
  return `<section class="rogue-sheet"><div class="rogue-sheet-head"><div><p class="rogue-kicker">随机夜班 / 档案 ${escapeHtml(state.seed.slice(0, 8))}</p><h2 id="rogue-heading" tabindex="-1">接过这一班</h2></div>${button('close', '返回主线')}</div><p>从四处现场记录里找出一条可核验的截报，把证据和仍未确认的事交给下一班。</p><div class="rogue-roles" role="group" aria-label="选择夜班岗位">${ROGUE_ROLES.map(role => roleChoice(role, state.role)).join('')}</div><p class="rogue-case-note">案件设置单会给出转子、环位和接线条件。你要找出未知的右轮位置。</p>${button('start', '接过随机截报', null, 'is-primary')}</section>`;
}

function routeView(state) {
  const layers = state.route.map((layer, index) => `<li class="rogue-route-layer${index < state.depth ? ' is-visited' : index === state.depth ? ' is-current' : ''}"><span class="rogue-route-depth">${['截收', '档案', '分析', '机房'][index]}</span><div>${layer.nodes.map(node => `<button type="button" class="rogue-node" data-rogue-action="node" data-value="${node.id}"${index !== state.depth ? ' disabled' : ''}><strong>${escapeHtml(node.title)}</strong><small>${escapeHtml(node.reward)}</small></button>`).join('')}</div></li>`).join('');
  return `<section class="rogue-sheet"><div class="rogue-sheet-head"><div><p class="rogue-kicker">${escapeHtml(ROGUE_ZONE_LABELS[state.route[state.depth]?.nodes[0]?.zone] || '夜班现场')}</p><h2 id="rogue-heading" tabindex="-1">选一处先去</h2></div>${button('pause', '暂停')}</div><ol class="rogue-route" aria-label="四处夜班现场">${layers}</ol>${statusView(state)}</section>`;
}

function eventView(state) {
  const node = state.currentNode;
  return `<section class="rogue-sheet"><div class="rogue-sheet-head"><div><p class="rogue-kicker">${escapeHtml(ROGUE_ZONE_LABELS[node.zone] || '夜班现场')}</p><h2 id="rogue-heading" tabindex="-1">${escapeHtml(node.title)}</h2></div>${button('pause', '暂停')}</div><p class="rogue-story">纸带轻响，台灯把字迹照得发亮。值班记录等着你确认下一步。</p><p class="rogue-reserve">当班余裕 <strong>${state.resources.reserve}</strong> / 3</p><div class="rogue-choices">${node.options.map(option => `<button type="button" class="rogue-choice" data-rogue-action="resolve" data-value="${option.id}"><strong>${escapeHtml(option.label)}</strong><small>${option.success ? '保留清楚的证据' : '带着一点疑问继续'}</small></button>`).join('')}</div>${toolView(state)}</section>`;
}

function completeView(state) {
  return `<section class="rogue-sheet"><p class="rogue-kicker">${state.lastOutcome?.success ? '记录已收好' : '线索仍可继续'}</p><h2 id="rogue-heading" tabindex="-1">${escapeHtml(state.lastOutcome?.text || '这一处现场记录完成。')}</h2><p>当前记录已收入案件袋，下一处现场已经亮起台灯。</p>${button('continue', state.depth === 3 ? '前往最终核验' : '继续沿走廊前行', null, 'is-primary')}${statusView(state)}</section>`;
}

function finalView(state) {
  const file = state.caseFile;
  return `<section class="rogue-sheet"><div class="rogue-sheet-head"><div><p class="rogue-kicker">最终核验 / ${escapeHtml(file.label)}</p><h2 id="rogue-heading" tabindex="-1">把短报读通</h2></div>${button('pause', '暂停')}</div><div class="rogue-case-slip"><span>转子 I · II · III / 环位 AAA</span><strong>${ALPHABET[file.knownLeft]} · ${ALPHABET[file.knownMiddle]} · ?</strong><span>接线 ${escapeHtml(file.plugboard[0].join(' ↔ '))}</span><code>${escapeHtml(file.ciphertext)}</code><small>已知词形：${escapeHtml(file.crib)}</small></div><p>选择未知的右轮起点。三次未命中后，分析员会把 crib 位置标给你。</p><div class="rogue-letter-pad" role="group" aria-label="右轮起始字母">${[...ALPHABET].map(char => `<button type="button" class="rogue-letter" data-rogue-action="right" data-value="${char}" aria-label="右轮 ${char}">${char}</button>`).join('')}</div>${state.lastOutcome ? `<p class="rogue-feedback" role="status">${escapeHtml(state.lastOutcome.text)}</p>` : ''}${state.decoded ? `<div class="rogue-decoded"><span>核验明文</span><strong>${escapeHtml(state.decoded)}</strong></div>` : ''}</section>`;
}

function handoffView(state) {
  return `<section class="rogue-sheet"><p class="rogue-kicker">交接室 / ${escapeHtml(state.caseFile.label)}</p><h2 id="rogue-heading" tabindex="-1">报文读通了</h2><p>“${escapeHtml(state.decoded)}” 已通过完整回路。你准备如何交给下一班？</p><div class="rogue-choices"><button type="button" class="rogue-choice" data-rogue-action="handoff" data-value="hold"><strong>保留证据，等待交叉核验</strong><small>把时间戳和未确认事项一起写进档案</small></button><button type="button" class="rogue-choice" data-rogue-action="handoff" data-value="release"><strong>按这条报文立即行动</strong><small>不再等待新的现场记录</small></button></div>${statusView(state)}</section>`;
}

function archiveView(state) {
  const score = state.grade || { grade: 'qualified', reasons: [] };
  return `<section class="rogue-sheet"><p class="rogue-kicker">值班档案 / ${escapeHtml(state.caseFile.label)}</p><h2 id="rogue-heading" tabindex="-1">这一班结束了</h2><p class="rogue-ending">${score.grade === 'complete' ? '證據已核驗，仍未確認的事也已交班。' : '本班留下了有用線索，下一班可以接著查。'}</p><ul class="rogue-record">${state.history.map(item => `<li>${escapeHtml(item.nodeId || item.decision || '现场记录')}${item.choiceId ? ` / ${escapeHtml(item.choiceId)}` : ''}</li>`).join('')}<li>seed / ${escapeHtml(state.seed)}</li></ul>${button('replay', '用同一 seed 再值一班')}${button('new-run', '抽一份新截报', null, 'is-primary')}${button('close', '返回主线')}</section>`;
}

function statusView(state) {
  return `<footer class="rogue-status"><span>已收记录 <strong>${state.evidence.length}</strong></span><span>随身工具 <strong>${state.inventory.length} / 2</strong></span><span>seed <code>${escapeHtml(state.seed.slice(0, 8))}</code></span></footer>`;
}

function toolView(state) {
  return `<div class="rogue-tools" aria-label="随身工具">${state.inventory.map(tool => button('tool', `使用${tool.name}`, tool.id)).join('')}</div>`;
}

export function renderRogueView(state) {
  if (state.paused) return `<section class="rogue-sheet"><p class="rogue-kicker">夜班暂存</p><h2 id="rogue-heading" tabindex="-1">先歇一会儿</h2><p>路线、证据和余裕都留在当前记录里。</p>${button('resume', '继续这一班', null, 'is-primary')}${button('close', '返回主线')}${statusView(state)}</section>`;
  if (state.phase === 'briefing') return startView(state);
  if (state.phase === 'route') return routeView(state);
  if (state.phase === 'event') return eventView(state);
  if (state.phase === 'event-complete') return completeView(state);
  if (state.phase === 'final') return finalView(state);
  if (state.phase === 'handoff') return handoffView(state);
  if (state.phase === 'complete') return archiveView(state);
  return `<section class="rogue-sheet">${button('close', '返回主线')}</section>`;
}
