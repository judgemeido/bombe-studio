# History gallery controller report

## Scope
- Implemented src/history-gallery.js and tests/history-gallery.test.mjs.
- Connected activation / destruction in src/bootstrap.js and src/history-preview.js.
- No HTML, CSS, assets, existing controller tests or build output edited by this worker. No commit.

## Behavior and integration contract
- Export: createHistoryGalleries(root, { motion, intervalMs = 6000, Observer, clock }) -> { destroy() }.
- Root may be a Document, container or gallery itself. Each gallery is independent.
- First figure is visible; other slides use hidden. Controls wrap previous / next and reset the autoplay countdown. Count is rendered as 1 / N.
- Explicit pause / resume has Chinese labels and aria-pressed. Hover, focus within, document hidden, reduced motion and offscreen independently block autoplay. Clearing one blocker never overrides another or explicit pause.
- IntersectionObserver waits for an initial visible entry; absent Observer falls back to autoplay with all other blockers respected. Manual controls remain available with reduced motion.
- Adds gallery-enhanced and reveals .gallery-controls / [data-gallery-controls]; destruction restores their initial state, slide hidden attributes, control attributes and output text.
- Empty / single-slide galleries disable controls and never schedule timers. A root with no galleries returns a no-op controller without observers or event listeners.
- destroy is idempotent, clears timers and all owned listeners, disconnects observation, restores static figures and makes late observer callbacks inert.
- Bootstrap and preview lifecycle destroy on departure and remount fresh controllers after persisted pageshow. Existing application routing uses bootstrap history activate / deactivate.
- Injectable clock requires setTimeout(fn, ms) / clearTimeout(id); tests advance a deterministic fake clock, never wait six real seconds.

## TDD evidence
- Initial tests failed because the gallery module did not exist.
- Integration tests initially failed before bootstrap / preview wiring.
- Hidden-controls / CSS-hook regression failed before applying the enhancement hook.
- No-gallery regression failed on unexpected document listener before adding early no-op return.
- happy-dom PageTransitionEvent aliases Event and does not populate persisted; lifecycle tests use an Event with explicitly assigned persisted, matching existing tests.

## Final verification
- Gallery-specific suite: 11 tests included in passing targeted run.
- Gallery + bootstrap + original history-preview-controller + history-scenes: 59 / 59 pass.
- Full node --test tests/*.test.mjs: 118 / 118 pass, zero failures.
- esbuild in-memory bundle of bootstrap.js and history-preview.js: pass; no dist writes.
- git diff --check on the four authorized source / test paths: pass.
- No browser visual QA performed by this worker; HTML / CSS / assets remain owned by the main agent.

## Swipe follow-up (2026-10-17)
- Added pointerdown / pointerup / pointercancel listeners on each owned .gallery-slides.
- Horizontal travel must be strictly > 40px and absX > absY; left moves next, right moves previous, wrapping and resetting the countdown through existing advance().
- Gestures starting or ending on button / link descendants are ignored. Non-primary / non-left pointers, cancelled gestures and mismatched pointer IDs do not navigate.
- No preventDefault, pointer capture, touch-action changes or pointermove interception: native vertical scrolling is preserved.
- destroy removes all three pointer listeners and clears pending gesture state.
- TDD: new navigation and cleanup tests failed before implementation; all three added swipe tests now pass.
- Latest verification: gallery suite 14 / 14; full suite 121 / 121; in-memory bootstrap / preview bundles pass; authorized-path diff check passes.
- This follow-up modifies only src/history-gallery.js, tests/history-gallery.test.mjs and this report. No commit or HTML / CSS / assets changes.

## P2 ownership follow-up (2026-10-17)
- Confirmed review.md reproduction via red tests: duplicate roots produced two timers; partially overlapping roots produced three instead of two.
- Added a module-level WeakMap from gallery DOM node to its current cleanup function. New mounts release the old gallery owner before taking DOM snapshots or scheduling timers.
- Gallery cleanup owns its timer, local listeners, DOM restoration and observer target. It deletes its record so stale observer batches cannot restart a replaced gallery. Full replacement also releases the old factory's document / motion listeners and observer.
- Ownership replacement is per gallery: untouched siblings remain active under the previous factory. Old destroy is idempotent and only cleans still-owned galleries; it cannot restore or disable a new owner.
- Six added tests cover identical / overlapping roots, both destruction orders, one timer per gallery, one advance per click, partial replacement with stale observer entries, and exact original HTML restoration including initially hidden controls.
- Latest verification: gallery tests 20 / 20; full suite 127 / 127; in-memory bootstrap / preview bundles pass; controller / tests diff check passes.
- Follow-up writes limited to controller, its tests and this report. No notices changes, no commit.
