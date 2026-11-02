# 随机夜班肉鸽模式 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 04「黎明之前」增加可重复、约 10 分钟且使用真实 Enigma 运算的随机夜班模式。

**Architecture:** 将生成案件、路线、事件和状态迁移放进纯 JS 引擎；用独立 DOM 控制器承载模式，在主线简报中作为旁路入口挂载，沿用现有 Three.js 场景。所有随机由 seed 驱动，内容模板与状态机可在 Node 中测试。

**Tech Stack:** 原生 ES modules、Three.js 现有场景、`node:test`、esbuild；不增加运行时依赖。

**Spec:** [随机夜班设计](../specs/2026-11-02-roguelite-night-shift-design.md)

## Global Constraints

- Node.js `>=22`；现有入口为 `npm test`、`npm run build`。
- Enigma 的生成、逐字解码与验证调用 `src/cipher.js`。
- 路线、事件、奖励由相同 seed 决定；事件无法绕过主线 reducer 或污染其状态。
- 模式目标为真人试玩中位数 9–11 分钟；没有现实倒计时，所有页面状态可暂停。
- 新 UI 使用 `rogue-` CSS 前缀；支持键盘、触摸、减少动态效果、WebGL 降级。

## Review Focus

- 重复 seed 或损坏存档：同局可复现，坏记录不阻止新局。
- 稀有路线组合：每条可生成路线都能取得足够核验线索，不发生软锁。
- 多解/无解案件：生成器仅在已知转子顺序、环位、左/中轮位和单对接线固定后，验证 26 个右轮候选中恰有一个 crib 命中。
- 模式切换生命周期：暂停、退出、浏览器返回和销毁不能改动 04 主线状态或留下事件监听。
- 错误操作与余裕归零：玩家仍可得到辅助并到达结局，不会困在不可操作状态。

---

### Task 1: Seeded run model and content contracts

**Files:**
- Create: `src/rogue-content.js`
- Create: `src/rogue-engine.js`
- Test: `tests/rogue-engine.test.mjs`

**Interfaces:**
- Export `ROGUE_ROLES`, `ROGUE_EVENTS`, `createRogueRun(seed, { role })`, `reduceRogueRun(state, action)`, `selectRogueNode(state, nodeId)`.
- `createRogueRun` returns `{ seed, phase, role, depth, route, resources, evidence, inventory, caseFile, history, ending }`.
- Reuse `seededRandom` and `shuffle` from `src/challenge-engine.js`.

- [ ] Add failing tests for same-seed determinism, valid roles, 4 route layers, two visible nodes per layer, and one selected node per layer.
- [ ] Add reducer tests for pause/resume, inventory cap 2, reserve floor 0, illegal node rejection, and reaching the final phase.
- [ ] Implement role data, event templates, route generation, seed handling, and pure state transitions.
- [ ] Run `node --test tests/rogue-engine.test.mjs`; all cases pass without DOM or Three.js.

### Task 2: Cipher case pack and guaranteed-solvable generation

**Files:**
- Modify: `src/rogue-content.js`
- Modify: `src/rogue-engine.js`
- Test: `tests/rogue-cases.test.mjs`

**Interfaces:**
- Export `createCaseFile(random) -> CaseFile` and `validateCaseFile(caseFile) -> { ok, reason }`.
- Case file includes `ciphertext`, `plaintext`, `crib`, `cribOffset`, `rotors`, `ring`, `knownLeft`, `knownMiddle`, `plugboard`, `solutionRight`, and 26 `candidates`.

- [ ] Add failing tests for six source templates, ciphertext round-trip, no crib self-map, exactly one match across right rotor A–Z, and bounded retries.
- [ ] Generate case parameters from the run RNG and use `cipher.js` for encrypt/decrypt and consistency checks.
- [ ] Reject invalid or non-unique combinations before they enter a route; guarantee deterministic fallback to a prevalidated case.
- [ ] Run both roguelike test files and `node --test tests/cipher.test.mjs`.

### Task 3: Event actions, evidence, rewards, and endings

**Files:**
- Modify: `src/rogue-engine.js`
- Test: `tests/rogue-engine.test.mjs`

**Interfaces:**
- Events resolve through `reduceRogueRun(state, { type, value })` and append normalized records to `history` and `evidence`.
- Export `scoreRogueRun(state) -> { grade, reasons }` and `applyRogueEnding(state, decision)`.

- [ ] Add failing tests for all event families, role abilities once per run, tool use, two-item cap, evidence tags, wrong attempts, and reserve depletion.
- [ ] Implement event outcome rules so each route preserves the evidence needed for final cipher verification.
- [ ] Ensure reaching zero reserve reveals assistance and still allows final decode and handoff.
- [ ] Run `node --test tests/rogue-engine.test.mjs tests/rogue-cases.test.mjs`.

### Task 4: Isolated mode UI and controller

**Files:**
- Create: `src/rogue-template.js`
- Create: `src/rogue-run.js`
- Create: `rogue.css`
- Test: `tests/rogue-dom.test.mjs`

**Interfaces:**
- `renderRogueStart(state)`, `renderRogueEvent(state)`, `renderRogueFinal(state)`, `renderRogueArchive(state)` return semantic HTML fragments.
- `createRogueRunView(root, { seed, role, onZone, motion, storage }) -> { start(), pause(), resume(), destroy() }` owns only its overlay root.

- [ ] Add failing DOM tests for role selection, two-node route view, accessible event controls, keyboard submit, pause/resume, end summary, and safe HTML escaping.
- [ ] Build a focused overlay using the existing archive palette, Four-layer node route, current room story, evidence row and two-slot tool shelf.
- [ ] Add short spatial transitions and immediate action feedback; honor reduced motion and restore focus when closing the mode.
- [ ] Add mobile stacking and touch targets; verify 390px width with no horizontal overflow in DOM-level tests where possible.
- [ ] Run `node --test tests/rogue-dom.test.mjs`.

### Task 5: Mount as an optional 04 side mode

**Files:**
- Modify: `src/mission-template.js`
- Modify: `src/mission.js`
- Modify: `index.html`
- Modify: `build.mjs`
- Test: `tests/mission-ui.test.mjs`
- Test: `tests/rogue-dom.test.mjs`

**Interfaces:**
- The briefing exposes `data-action="open-rogue"`; the overlay returns through `data-action="close-rogue"`.
- The mode requests scene location through `onZone(zone)` and never mutates `initialMission()` or `reduceMission()` state.

- [ ] Add failing integration tests that open/close the mode without changing main-mission state and destroy it on page teardown.
- [ ] Mount the overlay lazily from the briefing; keep the existing main mission button and route unchanged.
- [ ] Pass the selected event zone to the existing scene camera and suspend ambient/transition activity when hidden.
- [ ] Link `rogue.css` from `index.html` and copy it to `dist` in `build.mjs`.
- [ ] Run mission and roguelike DOM tests.

### Task 6: Persistence, replay, and verification

**Files:**
- Modify: `src/rogue-run.js`
- Test: `tests/rogue-dom.test.mjs`
- Create: `docs/ROGUE_NIGHT_SHIFT_QA.md`
- Create screenshots under: `output/rogue-night-shift/`

- [ ] Add failing tests for 20-entry archive cap, same-seed replay, corrupted/old-version storage, and no persistence of an unfinished run after closing.
- [ ] Save completed archive summaries only; add seed replay and new-random-run actions.
- [ ] Run `npm test`, `npm run build`, and `git diff --check`.
- [ ] Run the browser flow at desktop and 390px mobile; verify pause, role ability, one wrong answer, reserve depletion, final decode, closing to main mission, and a same-seed replay.
- [ ] Measure real elapsed player time; tune copy, transitions, and node count until the median is 9–11 minutes across at least five runs. Record actual sample and limitations in the QA report.
