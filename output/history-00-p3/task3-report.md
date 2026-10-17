# P3 Task 3 — main factory and lazy exhibit runtime

## Scope

Implemented only `src/main.js`, new `src/exhibit-runtime.js`, new `tests/application.test.mjs`, new `tests/exhibit-runtime.test.mjs`, and this requested report. No commit. Concurrent changes to bootstrap/navigation/routes/static shell/build were not edited by this task.

## Contract / integration

- `main.js` exports synchronous `createApplication({ initialRoute, historyPage, runtime? })` returning `{ go, dispose }`; importing it performs no DOM access, listeners, RAF scheduling or runtime construction.
- Optional `runtime` overrides are the explicit test seam: `createNavigation`, `createStage`, `createProduct`, `createTextures`, `createRaycaster`, `createPointer`, `loadLab`, `loadChallenge`.
- Navigation receives `initialRoute`, `currentRoute: historyPage?.currentRoute ?? null`, `initialScrolls: { history: historyPage?.scrollY ?? 0 }`, and the existing lifecycle callbacks.
- `prepare(history)` performs no allocation. Preparation never changes root visibility/inert, active state, topics or challenge rounds. Navigation alone controls the four page roots and application shell.
- Activation calls historyPage.activate for history, historyPage.deactivate otherwise. Lab topic and active controller states change only on activation. Challenge restarts only when returning after a previously activated challenge; abandoned preparations cannot consume an extra round.
- Stage/product/textures/raycaster/pointer and whole-machine canvas/control listeners are allocated in the first exhibit transaction only; direct lab/challenge uses no whole-machine runtime. Success is cached and reused, preserving selected parts, explosion state and existing business handlers.
- `ensureExhibit()` shares its cached promise, clears failure cache, and exposes a readable failure message plus retry through navigation. Failure disposes all resources that were successfully returned/registered before the throw, including textures when product creation fails.
- Runtime transaction ownership releases resources/listeners in reverse order; dispose is idempotent. Checks before queued initialization and after module imports prevent constructors after disposal; controllers resolving from an already in-flight constructor are immediately disposed rather than published. Generated mobile notes are removed on disposal.

## TDD evidence

1. Added runtime tests first: `node --test tests/exhibit-runtime.test.mjs` failed with missing implementation module. Implemented helper; 4/4 passed.
2. Added application tests before main refactor: `node --test tests/application.test.mjs` failed with `ReferenceError: document is not defined` during main import. Implemented factory and lazy integration; passed.
3. Extended application coverage for disposed module loads and late controllers.

## Latest verification

- `node --test tests/application.test.mjs tests/exhibit-runtime.test.mjs`: **7 passed, 0 failed**.
- `npm test`: **96 passed, 0 failed**.
- `npm run build`: exit 0; split main/lab/challenge output generated.
- `git diff --check -- src/main.js src/exhibit-runtime.js tests/application.test.mjs tests/exhibit-runtime.test.mjs`: no whitespace errors (Git only reports CRLF normalization warning for main).

An earlier full-suite run during concurrent static-shell edits failed a static text assertion; subsequent full runs passed (95 tests before the last added disposal test, then 96).

## Limitations / parent QA handoff

- No real browser/GPU, screenshots or network waterfall checks performed by this task. Build output alone does not prove history never downloads Three; bootstrap/network QA remains with the parent.
- Factory tests inject constructors and exercise DOM handlers rather than requiring a GPU. Actual WebGL restoration/rendering remains a browser QA item.
- Allocation hidden inside a constructor that throws before returning cannot be reclaimed through its public API; main releases every returned resource it owns. `scene.js`, `textures.js`, model internals were deliberately not changed under the file boundary.
- Existing async lab/challenge constructors cannot be cancelled internally without changing their modules. If disposed while their constructor is already awaiting internally, the returned controller is cleaned immediately on settlement; disposal before module resolution prevents starting the constructor at all.
