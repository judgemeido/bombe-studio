# Before Daybreak 15-Beat Remake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current seven-stage desk mission with a continuous fifteen-beat night-shift decryption experience spanning a larger multi-zone Three.js world, immersive UI, and optional Remotion cinematics.

**Architecture:** Keep the existing native JavaScript, Three.js, and reducer-driven mission runtime. Move the mission content contract to fifteen internal beat records, separate world zones/camera rails from task rendering, and keep all player actions in the DOM dossier while the canvas supplies location, scale, and diegetic feedback. Use Remotion only for authored prologue, two zone transitions, and the handoff ending, with live Three.js fallbacks for reduced motion, decode failure, and WebGL limitations.

**Tech Stack:** Native ES modules, Three.js 0.180, DOM/CSS, Node test runner with happy-dom, esbuild, Remotion with `@remotion/three` in `tools/mission-film`.

**Spec:** `docs/superpowers/specs/2026-10-19-before-daybreak-15-beat-design.md`

## Global Constraints

- Keep the product copy free of visible stage numbers, concrete stage names, and the string `7 个行动节点 · 约 15 分钟解密游戏 · 可随时暂停`.
- Keep the mission a sequential reducer state machine with fifteen internal beat IDs; URL navigation, refresh, duplicate clicks, and `next` cannot bypass an uncleared beat.
- Preserve real Enigma I stepping, plugboard reciprocity, candidate search, and the final plaintext `DXWETTERNORDHAFENFREI`.
- Use one Three.js canvas with seven spatial zones; share geometry and materials for repeated room parts and keep reduced-motion and no-WebGL fallbacks complete.
- Remotion assets are optional presentation layers; gameplay never depends on video decoding or a network request.
- Use TDD for production changes: add a failing test, run it red, implement the smallest change, then run the focused and full suites.

## Review Focus

- A player can jump to later beats through stale `next` events, URL fragments, or repeated clicks; reducer and DOM tests must prove the chain stays locked.
- Expanded world geometry causes camera clipping, projected overlap, or runaway draw calls on mobile; zone bounds, camera fit, and resource-count tests must cover it.
- Removing visible stage names leaves the player unsure what to do; DOM tests must require a current action sentence, location signal, and unambiguous primary control at every beat.
- Remotion loading, reduced motion, or video decode failure blocks the mission; transition tests must prove the live Three.js fallback reaches the same state.
- A long 15-beat flow loses evidence or focus after zone changes; integration tests must prove evidence persistence, focus restoration, pause, resume, and replay.

---

### Task 1: Freeze the 15-Beat Content Contract

**Files:**
- Modify: `src/mission-engine.js`
- Modify: `tests/mission-engine.test.mjs`
- Modify: `tests/mission-ui.test.mjs`
- Create: `docs/superpowers/specs/2026-10-19-before-daybreak-15-beat-design.md`

**Interfaces:**
- Consumes: current `MISSION`, `initialMission()`, `reduceMission()`, and Enigma helpers.
- Produces: `MISSION.stages` with exactly 15 internal records; each record exposes `id`, `zone`, `story`, `goal`, `actions`, `success`, `clue`, `hints`, `discussion`, and `transition`.

- [ ] **Step 1: Write failing tests** for `MISSION.stages.length === 15`, sequential IDs `S01` through `S15`, the seven required zones, final plaintext, and the absence of forbidden visible copy in `missionShell`.
- [ ] **Step 2: Run focused tests** with `npm.cmd test -- --test-name-pattern="15|mission"`; expect failures against the current seven-stage data and old shell copy.
- [ ] **Step 3: Replace the seven content records** with the S01–S15 contract from the design spec. Keep internal IDs out of renderable copy and preserve the current cipher parameters until the expanded interaction contract is implemented.
- [ ] **Step 4: Run focused engine tests** and confirm the new data contract passes while old seven-stage assertions are removed or rewritten.
- [ ] **Step 5: Commit** `git add src/mission-engine.js tests/mission-engine.test.mjs tests/mission-ui.test.mjs docs/superpowers/specs && git commit -m "test: define fifteen beat mission contract"`.

### Task 2: Rebuild the Reducer for Continuous Evidence

**Files:**
- Modify: `src/mission-engine.js`
- Modify: `tests/mission-engine.test.mjs`

**Interfaces:**
- Consumes: Task 1's fifteen beat records and existing cipher functions.
- Produces: reducer actions for channel scan, paper ordering, crib extraction/alignment, relation linking, plugboard setup, rotor setup, candidate comparison, map marking, cross-check, and handoff submission.

- [ ] **Step 1: Write failing reducer tests** for one action sequence per beat, evidence count persistence, wrong-action recovery, and rejection of any action belonging to a later beat.
- [ ] **Step 2: Run the focused reducer tests** and verify they fail before new action handlers exist.
- [ ] **Step 3: Implement the reducer** with one explicit action contract per beat, a shared `evidence` record, and a `currentZone` derived from the beat. Keep `next` valid only after `cleared` and make stage IDs internal state, never UI labels.
- [ ] **Step 4: Add candidate-comparison and map-marker validation** so BDF and the final plaintext are still computed from real Enigma operations rather than hard-coded answer acceptance.
- [ ] **Step 5: Run `npm.cmd test -- --test-name-pattern="mission engine|15 beat|cipher"`** and commit `feat: rebuild mission evidence state machine`.

### Task 3: Remove Gamey Progress Chrome and Rebuild the Dossier

**Files:**
- Modify: `src/mission-template.js`
- Modify: `src/mission.js`
- Modify: `mission.css`
- Modify: `tests/mission-ui.test.mjs`

**Interfaces:**
- Consumes: Task 2's state shape and `MISSION` beat records.
- Produces: `missionShell`, `renderTask(state)`, `renderEvidence(state)`, and a focus-safe action surface with no visible stage names or counts.

- [ ] **Step 1: Write failing DOM tests** that assert no progress list, no `stage N / 15` copy, no forbidden old phrase, and a current action sentence plus primary control at each of the fifteen states.
- [ ] **Step 2: Run the DOM tests** and confirm the current progress list and stage labels fail them.
- [ ] **Step 3: Replace the shell** with location, time, signal status, current task copy, and an evidence drawer. Remove `mission-progress`, visible stage counters, and the classroom/teaching panel from the mission surface.
- [ ] **Step 4: Render beat-specific controls** through action descriptors instead of branching on seven numeric stages. Preserve keyboard focus after rerender, pause, route leave/return, and transition completion.
- [ ] **Step 5: Add responsive styles** for the large world plus dossier on desktop and stacked world/dossier/map layouts on mobile; run the focused UI suite and commit `feat: make mission dossier diegetic`.

### Task 4: Expand the 3D World into Six Connected Zones

**Files:**
- Modify: `src/mission-model.js`
- Create: `src/mission-world-layout.js`
- Create: `src/mission-props.js`
- Modify: `src/mission-scene.js`
- Modify: `src/mission-transition.js`
- Modify: `tests/mission-model.test.mjs`
- Modify: `tests/mission-transition.test.mjs`

**Interfaces:**
- Consumes: Task 2's `currentZone`, state positions, and search/decode projections.
- Produces: `createMissionModel({ labelTexture })` returning `root`, `zones`, `anchors`, `interactives`, `getBounds(zone?)`, `setZone(zone)`, `update(state, time, projection)`, and `dispose()`; `MISSION_ZONES` and fifteen camera rail destinations.

- [ ] **Step 1: Write failing geometry tests** for the seven zone IDs, zone bounds, at least ten named interactive anchors, no projected overlap at desktop/mobile camera fits, and bounded geometry/resource counts.
- [ ] **Step 2: Run model and transition tests** to capture the expected red state before adding zones.
- [ ] **Step 3: Extract shared construction helpers** into `mission-props.js` and define room dimensions, zone origins, camera targets, and LOD thresholds in `mission-world-layout.js`.
- [ ] **Step 4: Replace the single desk composition** with the connected floor plan from the design spec. Add the archive corridor, analysis room, second Bombe bank, map room, handoff room, windows, wall records, and diegetic interactive anchors.
- [ ] **Step 5: Update `mission-scene.js`** to select the active zone, fit camera rails, animate ambient objects, and keep one renderer/environment lifecycle. Update `mission-transition.js` with named rail data only; captions come from beat records.
- [ ] **Step 6: Run geometry, camera, and resource tests** at desktop and mobile aspect ratios and commit `feat: build connected mission world`.

### Task 5: Bind Beat Actions to World Objects and Camera Movement

**Files:**
- Modify: `src/mission.js`
- Modify: `src/mission-scene.js`
- Modify: `src/mission-model.js`
- Modify: `tests/mission-ui.test.mjs`
- Modify: `tests/mission-route.test.mjs`

**Interfaces:**
- Consumes: Task 2 reducer actions, Task 4 `anchors`/zones, and transition callbacks.
- Produces: `dispatch({type, ...payload})` bindings where every beat action highlights one world anchor and every successful beat moves to the next zone/anchor without exposing a stage label.

- [ ] **Step 1: Write failing integration tests** for S01–S15 action routing, anchor highlight, camera destination, focus recovery, pause/resume, and route leave/return.
- [ ] **Step 2: Run the integration tests** and confirm current numeric stage branching cannot satisfy the zone/action contract.
- [ ] **Step 3: Implement action descriptors** so the UI and scene both consume `MISSION.stages[state.beat].actions`; do not duplicate action names in `mission.js` and `mission-template.js`.
- [ ] **Step 4: Add diegetic feedback** for radio needles, paper pins, plugboard cables, rotor rings, Bombe banks, map markers, and the handoff form; ensure inactive zones remain readable but not interactive.
- [ ] **Step 5: Run the full mission UI/route suite** and commit `feat: connect mission actions to world zones`.

### Task 6: Refactor Remotion into Optional Cinematic Layers

**Files:**
- Modify: `tools/mission-film/src/index.jsx`
- Modify: `tools/mission-film/package.json`
- Modify: `tools/mission-film/README.md`
- Modify: `build.mjs`
- Modify: `src/mission-template.js`
- Modify: `src/mission.js`
- Create: `tests/mission-film.test.mjs`

**Interfaces:**
- Consumes: Task 4's static world layout and Task 5's transition events.
- Produces: `Prologue`, `ZoneTransit`, and `Handoff` Remotion compositions, plus a `playCinematic(kind, context)` hook with live Three.js fallback.

- [ ] **Step 1: Write failing tests** for composition IDs, frame durations, local-only asset references, reduced-motion bypass, and fallback completion when video cannot load.
- [ ] **Step 2: Run the Remotion-focused tests** and confirm only the old `Arrival` composition exists.
- [ ] **Step 3: Refactor the Remotion entry** into three compositions with inline interactive metadata, deterministic `useCurrentFrame()` animation, and no dependency on mutable browser mission state.
- [ ] **Step 4: Add local output commands** for preview and still frames; update `build.mjs` to copy only approved local outputs and keep the live fallback path.
- [ ] **Step 5: Preview each composition, render a representative still, run the fallback tests, and commit `feat: add optional mission cinematics`.

### Task 7: Full Accessibility, Responsive, and Performance Pass

**Files:**
- Modify: `mission.css`
- Modify: `src/mission-template.js`
- Modify: `src/mission.js`
- Modify: `src/mission-scene.js`
- Modify: `tests/mission-ui.test.mjs`
- Modify: `tests/mission-model.test.mjs`

**Interfaces:**
- Consumes: Tasks 3–6 final DOM, world, and cinematic interfaces.
- Produces: complete keyboard, reduced-motion, no-WebGL, mobile, pause, and focus behavior across all fifteen beats.

- [ ] **Step 1: Write failing tests** for keyboard-only completion, reduced motion, no-WebGL fallback, hidden-page pause, video failure, focus restoration, and 390px no-overflow layout.
- [ ] **Step 2: Run the accessibility and responsive tests** to identify regressions from the larger world and removed progress UI.
- [ ] **Step 3: Implement the final focus model, live announcements, static zone summaries, responsive layout, and resource cleanup.** Use `aria-current` only for the current task region, never as a visible numbered progress list.
- [ ] **Step 4: Run `npm.cmd test`, `npm.cmd run build`, and `git diff --check`; record render calls, triangles, textures, and geometry counts for desktop/mobile.
- [ ] **Step 5: Commit `fix: finish mission accessibility and performance pass`.

### Task 8: Browser Acceptance, Documentation, and Main Integration

**Files:**
- Modify: `README.md`
- Modify: `docs/MISSION_04_ACCEPTANCE.md`
- Modify: `docs/MISSION_REFINEMENT_ACCEPTANCE.md`
- Create: `docs/MISSION_15_ACCEPTANCE.md`

**Interfaces:**
- Consumes: all previous task outputs.
- Produces: a reproducible acceptance record and the reviewed branch ready to merge into `main`.

- [ ] **Step 1: Create a branch** named `mission-15-beat-remake` from the current `main`; keep `mission-original` untouched as the rollback reference.
- [ ] **Step 2: Run browser acceptance** at 1440×900, 1280×720, 390×844, reduced motion, no WebGL, and video failure; complete all fifteen beats and capture the final handoff archive.
- [ ] **Step 3: Verify forbidden copy** is absent from source-rendered mission UI while the internal S01–S15 IDs remain testable.
- [ ] **Step 4: Update README and acceptance docs** with the seven zones, final plaintext, Remotion fallback behavior, test/build results, and known limits; do not claim historical Bombe completeness.
- [ ] **Step 5: Run the final checks** and commit `docs: record fifteen beat mission acceptance`; merge the reviewed branch into `main` only after approval.
