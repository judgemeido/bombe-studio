# Task 2 — scene controller and preview lifecycle

Date: 2026-10-17
Workspace: C:\Codex\city\bombe-studio (shared checkout; no commit or worktree)
Plan: docs/superpowers/plans/2026-10-17-history-00-p2.md, Global Constraints / Task 2

## Owned files

- src/history-scenes.js (new): exported createHistoryScenes(root, { motion, Observer }) returning destroy().
- src/history-preview.js: auto lifecycle coordinates the existing loader with the new scenes controller. Exported createHistoryPreview API/behavior unchanged.
- tests/history-scenes.test.mjs (new): seven-scene happy-dom fixture with manually controlled observer and motion preference.
- tests/history-preview-controller.test.mjs: added combined lifecycle regression; existing loader tests retained.
- output/history-00-p2/task2-report.md: this report.

No HTML/CSS/assets/static contracts were edited by this task. Other workers' changes are present in the shared checkout and were not reset or staged.

## RED evidence (before production implementation)

1. `node --test tests/history-scenes.test.mjs`
   - Exit 1; 10 tests, 0 pass, 10 fail.
   - Expected assertion: scene controller API must exist; actual typeof export undefined, expected function (new module absent).
   - Fixtures treat only ERR_MODULE_NOT_FOUND as absent API; other fixture import errors propagate.
2. `node --test tests/history-preview-controller.test.mjs`
   - Exit 1; 24 tests, 23 pass, 1 fail.
   - New combined lifecycle regression failed: "auto mount must create a scene observer", actual 0, expected 1.
   - All 23 pre-existing loader/controller tests passed.

## Implementation

- Retains per-target visibility/time across partial IntersectionObserver batches.
- Selects the visible scene whose live rectangle top is nearest 25% of viewport height; ties stay in DOM order, not callback order.
- Duplicates are idempotent; newer records win, equal-time exits win deterministically. Unknown targets ignored.
- Scroll/resize refresh retained targets' live geometry without waiting for another IO threshold crossing.
- Adds history-enhanced only with Observer support. Active scene gets is-current; matching chapter link gets aria-current="location". Leaving all scenes clears current markers.
- is-revealed is monotonic for the lifetime of a controller, preventing replay on exit/re-entry or motion preference changes. Reduced motion reveals every diagram immediately and supports runtime change (modern and legacy MediaQueryList listeners).
- Missing Observer: static diagrams all revealed, no enhancement class and no fake current/progress marker.
- No text hiding, content replacement, hash writes, focus movement, or scrolling.
- Idempotent destroy disconnects observer, removes owned classes/attributes and motion/scroll/resize listeners, clears records. Captured observer and motion callbacks remain inert.
- Auto lifecycle shares one motion query per mount. pagehide destroys both controllers; persisted pageshow remounts one pair only, even with duplicate events. Non-persisted departure removes auto lifecycle. Old callbacks cannot alter restored markup.

## GREEN / final focused verification

`node --test tests/history-scenes.test.mjs tests/history-preview-controller.test.mjs`

- Exit 0; 34 tests, 34 pass, 0 fail (final observed run: 430.8872 ms).
- 10 scene tests + 24 preview-controller tests.
- Includes import without document, partial/reordered batches, DOM-order tie, duplicates, leave-all, scroll/resize geometry, readable content, unchanged location/focus/scroll, initially reduced and runtime reduced motion, legacy motion listeners, no Observer, repeated destroy, listener cleanup, stale callbacks, and three bfcache restore cycles followed by final departure.
- Existing decode resolve/reject, timeout, legacy image events, missing image/status/matchMedia, loader teardown, and bfcache resolve/timeout regressions remain green.

`git diff --check -- src/history-preview.js tests/history-preview-controller.test.mjs`

- Exit 0, no whitespace errors (Git emitted a CRLF-to-LF normalization warning for the test file).

## Handoff boundaries

Broad npm suite, build, updated static HTML/CSS contract checks, and real-browser/visual QA are intentionally left to main task per assignment. This report does not claim those checks passed. CSS is responsible for finite diagram animation and ensuring text stays readable; this controller only supplies progressive-enhancement markers.
