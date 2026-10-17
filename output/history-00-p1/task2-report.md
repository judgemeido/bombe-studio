# Task 2 — History preview controller

## Scope

Implemented only the two owned source/test files, plus this explicitly requested report. No commits. Did not edit HTML, CSS, build configuration, static tests, or other application modules. Read only Global Constraints and Task 2 from the approved plan.

- Controller: `C:\Codex\city\bombe-studio\src\history-preview.js`
- Focused tests: `C:\Codex\city\bombe-studio\tests\history-preview-controller.test.mjs`
- Report: `C:\Codex\city\bombe-studio\output\history-00-p1\task2-report.md`

## API and behavior

`createHistoryPreview(root, { image, motion, timeoutMs = 3000 }) -> { destroy() }`

- Immediately sets loading, then decode resolve -> ready; rejection, synchronous throw, missing image, or timeout -> fallback.
- Timeout defaults to exactly 3000 ms; custom deadlines supported.
- First terminal result wins: a late decode/event cannot overwrite fallback or ready.
- Legacy images without decode use load/error plus complete/naturalWidth checks, with listeners registered before checking cached completion.
- Settling removes image listeners and clears timeout. Idempotent destroy additionally removes pagehide listener; all late callbacks are inert.
- Status is updated through textContent, with aria-live="polite"; a missing status node is tolerated.
- Import without document is safe. Auto-mount only on a page containing the preview root, selects its marked hero image, queries its window's reduced-motion setting, and cleans up on pagehide.
- No text, links, or scenes are hidden by JS. No observers or JS animations are created. Optional scene animation intentionally omitted, so observer cleanup is vacuous and reduced motion never creates displacement animation. CSS remains responsible for its own reduced-motion rules.

## HTML/CSS/build integration contract

- Root: `[data-history-preview]`.
- Hero image inside root: `[data-history-image]`.
- Small nonblocking status region: `[data-load-status]`.
- State selectors: `[data-history-preview][data-load-state="loading"]`, `[data-history-preview][data-load-state="ready"]`, `[data-history-preview][data-load-state="fallback"]`.
- `[data-history-scene]` is not modified by this controller; no enhancement classes are needed.
- Keep body copy and skip links visible in default/no-JS CSS and in every load state. Do not gate whole text visibility on data-load-state. Loading styling should affect only the small index/indicator; no overlays or fake percentages.
- Disable CSS scan/displacement/parallax/smooth scroll in `@media (prefers-reduced-motion: reduce)`.
- Other worker owns the `historyPreview` build entry and script inclusion. Not edited or built here to avoid shared-checkout conflicts.

## TDD evidence

Command, run from `C:\Codex\city\bombe-studio`:

```text
node --test tests/history-preview-controller.test.mjs
```

### RED (before controller existed)

```text
tests 21
pass 0
fail 21
ERR_MODULE_NOT_FOUND: Cannot find module ...\src\history-preview.js
exit 1
```

Tests were written before implementation. The test fixture's image.decode descriptor was subsequently made writable for the synchronous-throw test.

### Intermediate run

```text
tests 21
pass 19
fail 2
```

Both failures came from the fixture assuming happy-dom lacked IntersectionObserver. Corrected the no-observer fixture by explicitly setting the window's IntersectionObserver to undefined before creating the controller; no production change was needed.

### GREEN (final focused run)

```text
tests 21
suites 0
pass 21
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 390.4956
exit 0
```

Coverage includes controlled decode promises; default 2999/3000 ms timeout boundary with mock timers; custom timeout; null image; resolve/reject after destroy; repeated destroy; legacy load/error, complete/naturalWidth; timer and listener cleanup; terminal-state preservation; synchronous decode throws; missing status; readable content and skip link; no-observer/reduced-motion cases; SSR-safe import; conditional auto-mount; hero selection; matchMedia query; pagehide; missing matchMedia/hero.

Additional checks:

```text
node --check src/history-preview.js
exit 0

git diff --check -- src/history-preview.js tests/history-preview-controller.test.mjs
exit 0 (files currently untracked, so this is not a substantive untracked-file whitespace check)
```

No browser UI was used. This focused suite deliberately remains separate from the other worker's static tests. Full application regression/build not run as part of this isolated task.

## P2 review follow-up — bfcache restoration

### Root cause and fix

The initial auto-mounted controller destroyed itself on every pagehide. When pagehide.persisted was true, bfcache retained the module but the restored page did not execute it again, leaving a pending image's loading status without an active controller or timeout.

Changed only the owned controller and focused test file, plus this requested report update. The exported createHistoryPreview/destroy contract is unchanged: destroyed instances remain permanently inert. An auto-mount lifecycle wrapper now destroys/releases its controller on pagehide, retains one pageshow listener for persisted departures, and mounts a fresh controller on persisted pageshow. An active-instance guard prevents repeated pageshow events from creating duplicates. Non-persisted departure removes both wrapper listeners. Each restored controller receives a fresh timeout budget and invokes decode again; old callbacks cannot mutate state.

### TDD regression evidence

Command: `node --test tests/history-preview-controller.test.mjs` from `C:\Codex\city\bombe-studio`.

RED before production change:

```text
tests 23
pass 21
fail 2
bfcache restore remounts once per departure and supports fresh resolve: FAIL
bfcache restore remounts once per departure and supports fresh timeout: FAIL
AssertionError: 1 !== 2 (decode attempt count after persisted pageshow)
exit 1
```

GREEN after fix:

```text
tests 23
suites 0
pass 23
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 424.1835
exit 0
```

Both new happy-dom regressions use controllable decode promises and mock timers. They exercise three pending-decode -> persisted pagehide -> persisted pageshow cycles, completion while suspended remaining inert, one fresh decode per restore, duplicate pageshow not remounting, stable pagehide listener count and exactly one pageshow listener, text/skip readability, fresh resolve -> ready or 2999/3000ms -> fallback, late completion not overriding fallback, and complete wrapper listener cleanup on non-persisted departure.

Additional checks: `node --check src/history-preview.js` and scoped `git diff --check` both exited 0. No browser UI, unrelated file edits, or commits. HTML/CSS selector contract is unchanged.
