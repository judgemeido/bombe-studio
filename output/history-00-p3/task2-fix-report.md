# Task2 independent review — fixes

## Scope

Read `output/history-00-p3/task2-review.md` and verified its three findings against bootstrap and controlled deferred-import tests. Changed only `src/bootstrap.js`, `tests/bootstrap.test.mjs`, and this requested report. No commit; no navigation/main/routes/HTML/CSS/build changes by this fix task.

## Changes

1. **Stale import rejection cannot cover history.** Failed application imports still clear the cached promise for retry, but error feedback is only published if the latest desired route remains interactive. Both explicit history navigation and native `#sources` navigation preserve visible history, hidden overlay, cleared aria-busy and no application creation after rejection. Later interactive navigation retries successfully.
2. **Shared pending import restores loading UI.** UI refresh now precedes the `loading` guard. lab → history → challenge restores the loading overlay and aria-busy immediately, without starting another import. Completion creates exactly one application for challenge. An additional regression checks that rejection of that same shared import still displays an error for the latest interactive request (rather than dropping a valid failure through a stale request token).
3. **Loading metadata follows the latest target.** Initial challenge/exhibit and pending route changes synchronously populate route-title and route-chapter. A lightweight local metadata map matches navigation's existing strings without importing main or altering another file. The metadata copy is explicitly documented as requiring alignment with navigation if chapter labels change.

## TDD evidence

- Added six cases before implementation: two stale-rejection variants, shared pending import UI/factory ownership, two initial overlay metadata cases, and current-interactive rejection safety.
- RED: `node --test tests/bootstrap.test.mjs` → 14 tests, 9 passed, **5 failed**. Failures matched review findings: stale errors revealed the overlay, shared import did not restore loading, and initial metadata retained lab's fixture defaults. Current-interactive rejection already passed and protects unchanged behavior.
- GREEN: `node --test tests/bootstrap.test.mjs tests/navigation.test.mjs` → **18 passed, 0 failed**.
- Full regression: `npm test` → **102 passed, 0 failed**.
- `git diff --check -- src/bootstrap.js tests/bootstrap.test.mjs` → exit 0, no whitespace errors.

## QA handoff

These are controlled-Promise DOM unit tests, not browser/network evidence. Real browser acceptance remains with the main agent as requested. No production build executed for this narrowly scoped fix; no build files modified.
