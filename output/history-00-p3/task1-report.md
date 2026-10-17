# P3 Task1 — routes and static home composition

## Status
Task1 implementation and focused contracts complete in the shared checkout. No worktree, commit, main/navigation/bootstrap/controller edits by this worker. Full integrated build/dev/browser validation remains pending the bootstrap entry from the main agent.

## Fixed integration contracts
- `parseRoute(hash)` / `routeKey(route)` exported by `src/routes.js`; returned shape `{ page, topic }` (default topic `drums`). Empty hash and `#/history` are history; old `#/` is exhibit. Lab drums/wiring and challenge retain their route keys. `#/lab` remains a drums alias. Unknown routes fall back to exhibit.
- Local history anchor whitelist: lifeline, intercept, pioneers, turing, constraints, intelligence, onward, lifeline-context, sources. No broad arbitrary-fragment or lab-prefix matching.
- `renderHome({appHtml, historyHtml})` in `page-shell.mjs` uses unique explicit APP-SHELL / HISTORY-CONTENT / SHARED-TRANSITION START/END markers, not arbitrary body regex rewriting.
- Generated root is `#history-page[data-history-preview][data-load-state="loading"]`; seven scenes plus header, chapter index and footer all inside. History visible; `#application-shell` hidden/inert. Body starts `data-page="history"`.
- Focus target: `#hero-title[tabindex="-1"]` (fixed shared heading contract; section aria-labelledby matches). **Navigation/bootstrap must use this ID**. Navigation and its fixtures already use this fixed ID.
- App root retains site header, exhibit/lab/challenge pages, note/archive/help dialogs and all their existing stage IDs. Shared `#page-transition` is a sibling outside both roots. Overlay retains route-chapter/title/caption/count/progress/retry/back.
- Both headers have four data-page/data-chapter navigation links; brand returns to history. History scene anchors remain ordinary links without data-page.
- Generated index has exactly one auto-entry: `dist/bootstrap.js`. Build emits `bootstrap.js` and rewrites that one script path; no standalone app entry. Independent preview keeps its own `dist/historyPreview.js` entry.
- Both build and dev call the same renderHome; dev reads template/prose at request time. Preview assets and security checks preserved.

## CSS decisions
- All history component/global selectors scoped with `:where([data-history-preview])`, supporting the standalone preview body and composed wrapper. Palette/type tokens reside on the history root, not :root.
- Body paint/reading-scroll rules opt into `body[data-page="history"]` or standalone `body[data-history-preview]` only.
- App rules/tokens scoped to `:where(#application-shell, #page-transition)`; root overlay rules target #page-transition directly. This prevents generic brand/chapter-nav/anchor/SVG/reset/type rules leaking into history and keeps overlay theme independent of active page.
- Global hidden enforcement and body margin reset retained deliberately. Added restrained responsive four-chapter header layout without changing narrative or diagrams.
- A2 portrait remains explicitly unresolved; no assets added/researched.

## Changed paths (worker-owned only)
- src/routes.js (new)
- page-shell.mjs (new)
- index.html
- history-preview.html
- history-preview.css
- styles.css
- build.mjs
- dev-server.mjs
- tests/routes.test.mjs (new)
- tests/page-shell.test.mjs (new)
- tests/history-preview.test.mjs (existing static tests updated; main informed)
- output/history-00-p3/task1-report.md and task1 test logs

Static-test updates: expect bootstrap rather than app build entry; distinguish data-page route hashes from native local anchors when checking fragment targets. All original narrative/source/asset assertions remain.

## Evidence
1. Before implementation: `node --test tests/routes.test.mjs tests/page-shell.test.mjs` failed for missing routes.js and page-shell.mjs (expected RED).
2. Added containment test failed against unscoped :root/body/brand CSS (expected RED); passed after scoping.
3. Latest focused run: `node --test tests/routes.test.mjs tests/page-shell.test.mjs tests/history-preview.test.mjs` — **19 passed, 0 failed**. Log: task1-focused-tests.log.
4. CSS parsed via esbuild transform: styles.css **0 warnings**, history-preview.css **0 warnings** (also asserted in focused suite).
5. Latest whole shared suite: `node --test tests/*.test.mjs` — **79 passed, 2 failed**. Log: task1-tests.log. Bootstrap suite cannot import absent src/bootstrap.js; navigation history scroll test expected 321 but got 0. Concurrent main-owned tests/files, not changed here.
6. `npm run build` attempted: blocked by missing src/bootstrap.js; no temporary stub introduced. Runtime dev and production smoke checks must run after main creates bootstrap. No browser visual-QA claim made.

## Handoff checks still required
- Main: point focus metadata at #hero-title; use agreed historyPage adapter. Confirm shared overlay remains operable while app is inert.
- Once bootstrap exists, run build + HTTP dev/prod smoke check (generated prose/scripts/styles/images), then browser desktop/mobile containment and keyboard checks.
- Verify initial history network excludes Three/app dependencies, legacy deep links initialize correct page, and preview remains independently usable.
- This report does not claim Task2/3 lifecycle, lazy WebGL or browser visual checks are complete.

## Integration update (after main published bootstrap)
- `npm run build` now **passes** (esbuild completed in 65 ms); initial missing-entry blocker above is historical, resolved by main's concurrent bootstrap file.
- Actual dev server started on 127.0.0.1:4189 and terminated after smoke checks. `/` HTML is byte-identical to built dist/index.html after the single expected bootstrap script path normalization.
- HTTP 200 confirmed for dist/bootstrap.js, history-preview.html, history-preview.css, styles.css, and adopted local JPEG.
- Whole-suite rerun log refreshed in task1-tests.log. Latest failure is the existing randomized challenge DOM copy assertion (`/谁|哪里/` vs question `按下字母时，哪一组部件会先转位？`), outside Task1 write set. Main notified; do not mistake this for a history/composition regression.
- Browser desktop/mobile visual QA and lazy-network runtime QA remain for integration reviewer; not claimed here.

## Requested small fixes — final shared-contract alignment
- Restored fixed `#hero-title[tabindex="-1"]` contract, `#lifeline[aria-labelledby="hero-title"]`, and matching focus CSS. No duplicate-ID reason existed to deviate; prior #history-heading choice is superseded.
- Shared history source now says “七幕档案” (including preview title/description) and footer says “七幕档案串起通信、破译与协作的战时脉络；真实肖像仍待核实。” Neither composed home nor standalone preview claims the homepage has not yet been replaced. A2 remains unresolved.
- Shared overlay `#route-back` now reads “返回战时序章”.
- TDD: updated heading/copy contracts first; observed 3 expected failing tests (task1-small-fixes-red.log), then implemented fixes. Latest focused suite **20 passed, 0 failed**; `npm run build` **passes** (71 ms).
- Verified actual running dev endpoint http://127.0.0.1:4182/: heading/tabindex/aria-labelledby, neutral copy, return label, unique IDs, and byte-equivalent dev/prod composition (bootstrap path normalization) all PASS. This is an HTTP/DOM check, not a visual browser-QA claim.
- No main/navigation/bootstrap/history-controller changes or commits made by Task1 worker.
