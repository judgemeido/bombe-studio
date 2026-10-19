# SDD ledger — plan: docs/superpowers/plans/2026-10-20-bombe-01-cinematic-model-refinement-plan.md

## Setup

- Baseline: `npm.cmd test` → 176/176 pass; `npm.cmd run build` → success.
- Worktree: execute in the current checkout because `src/model.js` and related tests contain existing uncommitted user work that must be preserved; creating a fresh worktree would omit those changes.
- Pre-flight shared interfaces: Task 1 establishes group/state names consumed by Tasks 2–5; Task 2 produces rotor anchors/materials consumed by Tasks 3–4; Task 3 produces the cinematic controller consumed by Tasks 4–5; Task 6 consumes all prior outputs.
- Ruling: use the current checkout rather than an isolated worktree — the user explicitly chose Native execution and the target model file already contains authorized uncommitted detail work; cost if wrong: unrelated changes could be harder to review, mitigated by scoped diffs and final status review.

## Tasks

- Task 1: complete — `npm.cmd test -- --test-name-pattern="rotor contract|cinematic"` → 177/177 pass after adding named rotor detail/signal/camera-anchor groups, `rotorCount`, `getRotorAnchor()`, and `cinematic: false` state.
- Task 2: complete — `node --test tests/model.test.mjs` → 8/8 pass; added rotor detail groups, counts, signal matrices, procedural metal texture, signal palette, and deterministic rotor reset.
- Task 3: complete — `node --test tests/cinematic-camera.test.mjs tests/application.test.mjs` → 6/6 pass; `node --test tests/separation.test.mjs` → 4/4 pass; added five-beat rail, shortest-angle interpolation, rotor/rear targets, reduced-motion snap, and manual interruption through the stage.
- Task 4: complete — `node --test tests/scene-render.test.mjs tests/cinematic-camera.test.mjs tests/application.test.mjs tests/model.test.mjs` → 16/16 pass; `npm.cmd run build` → success; added optional EffectComposer bloom with renderer fallback, running intensity, and lifecycle inspection.
- Task 5: complete — `node --test tests/application.test.mjs` → 4/4 pass; added accessible `#cinematic` control, `C` shortcut, pressed-state/status updates, mobile three-column action layout, and reduced-motion/manual interruption handling.
- Task 6: complete with documented verification limits — focused Bombe 01 checks pass, production build succeeds, `git diff --check` has no whitespace errors, and acceptance/QA docs are written. The repository-wide suite remains 183/184 because of the pre-existing mission furniture instancing assertion; no new PNG screenshots were saved because the current browser automation session did not expose a stable capture call.

