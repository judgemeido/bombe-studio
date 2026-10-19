# Bombe 01 Cinematic Model Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refine the `01 / THE BOMBE` model with rotor-level mechanical detail and a controllable, cinematic camera/rendering pass that feels technologically elevated while preserving the existing exhibit contracts.

**Architecture:** Keep `createProduct()` as the model boundary and extend its existing part/detail groups with independently owned rotor motion and signal layers. Add a small cinematic camera controller beside the existing framing helpers; `main.js` owns the commands and state, while `scene.js` owns camera interpolation and rendering. Add bloom/grade as an optional renderer layer with a renderer-only fallback, so geometry remains legible when postprocessing is unavailable or reduced motion is enabled.

**Tech Stack:** Native JavaScript ES modules, Three.js `0.180.0`, esbuild `0.28.2`, Canvas-generated textures, Node test runner, existing DOM test harness.

**Spec:** `docs/superpowers/specs/2026-10-20-bombe-01-cinematic-model-refinement-design.md`

## Global Constraints

- Preserve the current `createProduct()` API, five part IDs, 108 drums, explode path, picking, focus, and disposal behavior.
- Keep display units and rotor spacing derived from `DIM`; do not introduce surveyed historical dimensions.
- Keep all runtime assets local and procedural; no GLB, CDN, remote image, or network request.
- Keep the running effect restrained to readable mechanical signals; static exhibit readability has priority over bloom or glow.
- Reduced motion must snap camera/model transitions and provide a single-step rotor action.
- Do not overwrite unrelated uncommitted mission/history changes in the worktree.

## Review Focus

- Running the camera rail while a user drags the model must stop the rail immediately and leave OrbitControls usable; test in the camera task.
- Repeated `setExplode()` and camera cue changes must not accumulate transforms or drift pivots; test in the model and camera tasks.
- A rotor close-up on a 390×844 viewport must keep the rotor face and its labels inside the safe frame; test in framing/browser acceptance.
- Reduced-motion mode must not continue RAF-driven cinematic movement or leave emissive layers half-transitioned; test in state/render tasks.
- Context loss or unavailable postprocessing must still render the model and keep controls functional; test in scene lifecycle/browser acceptance.

---

### Task 1: Freeze the 01 model and runtime contract

**Files:**
- Create: `bombe-studio/docs/BOMBE_01_CINEMATIC_ACCEPTANCE.md`
- Modify: `bombe-studio/src/model.js`
- Modify: `bombe-studio/src/main.js`
- Test: `bombe-studio/tests/model.test.mjs`
- Test: `bombe-studio/tests/application.test.mjs`

**Interfaces:**
- Consumes: existing `DIM`, `PARTS`, model API, current detail groups, and current `state` object.
- Produces: named detail-group ownership rules and a stable command/state vocabulary for `cinematic`, `running`, `reducedMotion`, and `focus`.

- [ ] **Step 1: Write failing contract tests**

  Add assertions that `createProduct()` exposes named groups for `rotor-detail`, `rotor-signal`, and `camera-anchor` without changing the five public part names; add application assertions that `cinematic` is false by default and is stopped when a manual control gesture starts.

- [ ] **Step 2: Run the focused tests and verify they fail**

  Run: `npm.cmd test -- --test-name-pattern="detail|cinematic|manual"`

  Expected: FAIL because the new groups/state are not defined.

- [ ] **Step 3: Define the contract in the existing boundaries**

  Add named groups under the existing `drums`, `drive`, and `frame` parts; keep all state transitions in `main.js`; do not attach DOM listeners inside `model.js`.

- [ ] **Step 4: Run focused tests and verify they pass**

  Run: `npm.cmd test -- --test-name-pattern="detail|cinematic|manual"`

  Expected: PASS.

- [ ] **Step 5: Record the baseline and acceptance surface**

  Document the starting draw-call/triangle inspection shape, the new commands, and the four browser viewports in `docs/BOMBE_01_CINEMATIC_ACCEPTANCE.md`.

### Task 2: Add rotor-level mechanical detail and dynamic ownership

**Files:**
- Modify: `bombe-studio/src/model.js`
- Modify: `bombe-studio/src/textures.js`
- Modify: `bombe-studio/src/exhibit-palette.js`
- Test: `bombe-studio/tests/model.test.mjs`

**Interfaces:**
- Consumes: `DIM`, existing `batch()`, `instances()`, `poseDrums()`, and texture factory.
- Produces: `product.rotorCount`, `product.detailStats`, `product.getRotorAnchor(index)`, and dynamic rotor/signal updates through `update(dt, running)`.

- [ ] **Step 1: Write failing geometry and motion tests**

  Assert 108 logical rotors, named subcomponents for face ring, hub, contact ring, index marker, fasteners, and signal layer; assert a running update changes rotor matrices, a paused update is stable, `resetMotion()` restores the exact initial matrices, and `getRotorAnchor()` returns finite world points.

- [ ] **Step 2: Run the focused model tests and verify they fail**

  Run: `npm.cmd test -- --test-name-pattern="rotor|detail|motion|dispose"`

  Expected: FAIL on the new stats/anchor assertions.

- [ ] **Step 3: Implement the rotor detail set in `src/model.js`**

  Keep high-count pieces instanced: shallow shell, stepped rim, 26-position tick marks, hub cap, eight fasteners, and a thin contact ring. Give each bank a small independent motion group so the upper/center/lower arrays can phase-offset without breaking explode transforms. Add rear shaft collars, belt guides, service fasteners, and a restrained signal layer that can be toggled by the running state.

- [ ] **Step 4: Add procedural material inputs**

  Extend `createTextures()` with a small brushed-metal/paint microtexture and a rotor face map; add explicit `rotorMetal`, `rotorInk`, `signalAmber`, and `signalCyan` materials with stable shader feature flags. Do not mutate shared materials during per-part focus.

- [ ] **Step 5: Implement deterministic dynamic updates**

  Extend `poseDrums()` and `update(dt, running)` so rotor faces, hubs, contact rings, and the short signal pulse derive from one clamped phase. Keep `dt` in seconds, clamp long frames, and update matrices only when running or when a reduced-motion single step is requested.

- [ ] **Step 6: Run focused tests and verify they pass**

  Run: `npm.cmd test -- --test-name-pattern="rotor|detail|motion|dispose"`

  Expected: PASS with no non-finite vertices and no disposal count greater than one.

### Task 3: Introduce the cinematic camera rail and rotor framing

**Files:**
- Create: `bombe-studio/src/cinematic-camera.js`
- Modify: `bombe-studio/src/scene.js`
- Modify: `bombe-studio/src/framing.js`
- Modify: `bombe-studio/src/main.js`
- Test: `bombe-studio/tests/cinematic-camera.test.mjs`
- Test: `bombe-studio/tests/separation.test.mjs`

**Interfaces:**
- Consumes: `fitCamera()`, product bounds/anchors, `OrbitControls`, `motion.matches`, and the `scene.update()` clock.
- Produces: `createCinematicCamera({ camera, controls, product, getAspect, reduced })` with `start(mode)`, `stop()`, `interrupt()`, `update(dt)`, `isActive`, and `dispose()`.

- [ ] **Step 1: Write failing camera tests**

  Cover cue interpolation across the five authored beats, shortest-angle azimuth travel, rotor-anchor targeting, immediate reduced-motion settling, manual interruption, repeated start/stop without drift, and safe-frame bounds at desktop and mobile aspects.

- [ ] **Step 2: Run the camera tests and verify they fail**

  Run: `npm.cmd test -- --test-name-pattern="cinematic camera|camera rail|safe frame"`

  Expected: FAIL because the controller module does not exist.

- [ ] **Step 3: Implement the controller**

  Store target and actual spherical camera values separately; use exponential damping and shortest-angle interpolation. The rail must target `product.getRotorAnchor()` for the rotor beat, respect current explode progress, and call `interrupt()` from OrbitControls `start` and zoom actions.

- [ ] **Step 4: Integrate the controller into `scene.update()` and `main.js`**

  Add a `cinematic` command that starts/stops the rail, update it before `controls.update()` and render, and ensure a manual gesture clears the rail while preserving the current camera pose. The existing view buttons and `frameCamera()` remain valid.

- [ ] **Step 5: Verify camera tests and existing separation tests**

  Run: `npm.cmd test -- --test-name-pattern="cinematic camera|camera rail|safe frame|camera fits|repeated explode"`

  Expected: PASS.

### Task 4: Add restrained studio/post rendering for the running state

**Files:**
- Create: `bombe-studio/src/post.js`
- Modify: `bombe-studio/src/scene.js`
- Modify: `bombe-studio/src/main.js`
- Modify: `bombe-studio/src/exhibit-palette.js`
- Test: `bombe-studio/tests/scene-render.test.mjs`

**Interfaces:**
- Consumes: the current WebGL renderer, scene, camera, `prefers-reduced-motion`, and the signal materials from Task 2.
- Produces: `createPostStack({ renderer, scene, camera, container })` with `render(dt)`, `setEnabled(value)`, `resize()`, `inspect()`, and `dispose()`; `scene.update()` remains the only caller.

- [ ] **Step 1: Write failing fallback/lifecycle tests**

  Assert that the renderer-only path remains available when postprocessing construction fails, `setEnabled(false)` disables bloom without changing model state, resize updates all targets, and dispose releases composer targets/passes exactly once.

- [ ] **Step 2: Run focused scene tests and verify they fail**

  Run: `npm.cmd test -- --test-name-pattern="post|fallback|render lifecycle"`

  Expected: FAIL because `post.js` does not exist.

- [ ] **Step 3: Implement the minimal post stack**

  Use `EffectComposer`, `RenderPass`, `UnrealBloomPass`, and `OutputPass` only when the Three.js add-ons are available. Start with a low-strength bloom threshold so the amber/cyan signal layer blooms while the cabinet silhouette and labels remain crisp; keep the scene renderer path as the fallback.

- [ ] **Step 4: Wire lighting and render mode**

  Add a dedicated rim/top role and a running-state intensity target in `scene.js`; do not recapture or rebuild environment resources per frame. Reduced motion and WebGL context loss must disable the effect cleanly.

- [ ] **Step 5: Run focused and full logic tests**

  Run: `npm.cmd test -- --test-name-pattern="post|fallback|render lifecycle"` and then `npm.cmd test`

  Expected: PASS.

### Task 5: Expose the cinematic command and accessible state feedback

**Files:**
- Modify: `bombe-studio/index.html`
- Modify: `bombe-studio/exhibition-ui.css`
- Modify: `bombe-studio/src/main.js`
- Test: `bombe-studio/tests/application.test.mjs`

**Interfaces:**
- Consumes: `cinematic` controller API, existing `run`, `reset`, `data-view`, and status announcer.
- Produces: native button `#cinematic`, `aria-pressed` state, status text, and reduced-motion label behavior.

- [ ] **Step 1: Write failing DOM tests**

  Assert the button exists, toggles `aria-pressed`, starts/stops the rail through the same command path as keyboard activation, and announces when manual orbit cancels it.

- [ ] **Step 2: Run focused DOM tests and verify they fail**

  Run: `npm.cmd test -- --test-name-pattern="cinematic control|aria-pressed|manual orbit"`

  Expected: FAIL because the control and state wiring do not exist.

- [ ] **Step 3: Add the control and status copy**

  Place the control beside “运转演示”; use an icon plus text, preserve 44px hit targets, keep focus styles, and expose “影院运镜 / 停止运镜”. Add a `C` keyboard shortcut only when focus is outside form controls/dialogs.

- [ ] **Step 4: Wire reduced-motion and lifecycle cleanup**

  When the media query changes, stop the rail and settle to the current cue; remove listeners through the existing runtime cleanup path.

- [ ] **Step 5: Run focused DOM tests and the full suite**

  Run: `npm.cmd test -- --test-name-pattern="cinematic control|aria-pressed|manual orbit"` and then `npm.cmd test`

  Expected: PASS.

### Task 6: Build, browser-verify, and publish acceptance evidence

**Files:**
- Modify: `bombe-studio/docs/BOMBE_01_CINEMATIC_ACCEPTANCE.md`
- Create: `bombe-studio/docs/qa/bombe-01-cinematic/README.md`
- Create: `bombe-studio/docs/qa/bombe-01-cinematic/desktop-wide.png`
- Create: `bombe-studio/docs/qa/bombe-01-cinematic/rotor-closeup.png`
- Create: `bombe-studio/docs/qa/bombe-01-cinematic/mobile.png`
- Create: `bombe-studio/docs/qa/bombe-01-cinematic/reduced-motion.png`

**Interfaces:**
- Consumes: the completed model, camera, post stack, UI controls, and `window.__BOMBE_INSPECT__()`.
- Produces: reproducible commands, screenshots, inspection metrics, and a list of verified limitations.

- [ ] **Step 1: Build and run the full automated checks**

  Run: `npm.cmd run build`, `npm.cmd test`, and `git diff --check` from `bombe-studio`.

  Expected: build succeeds, all tests pass, and `git diff --check` reports no whitespace errors.

- [ ] **Step 2: Start the local server and capture desktop evidence**

  Run: `npm.cmd run dev` and open `http://127.0.0.1:4173/#/` at 1440×900 and 1024×768. Capture the assembled view, running rotor close-up, explode state, and manual recovery after interrupting the rail.

- [ ] **Step 3: Capture mobile and reduced-motion evidence**

  Verify 390×844 has no horizontal overflow, the rotor close-up stays inside the safe frame, the button remains reachable, and reduced motion presents settled poses with one-step rotor updates.

- [ ] **Step 4: Record runtime metrics and limitations**

  Save the inspection output for calls, triangles, geometries, textures, post-enabled state, and context-loss fallback. Record any GPU/browser limitations separately from automated test results.

- [ ] **Step 5: Review the final diff**

  Run: `git status --short` and `git diff --stat`.

  Expected: only the 01 model/camera/render/UI/tests/docs changes intended by this plan are present; unrelated mission/history work remains untouched.
