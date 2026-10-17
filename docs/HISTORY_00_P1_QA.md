# 00 战时序章 P1 — QA evidence

Date: 2026-10-17. Scope: independent `/history-preview.html`, hero and Turing scenes only. This is a visual sample, **not the complete seven-scene 00 page or authorization to proceed to P2–P4**. Product commits reported by Main: `f06bcc7`, `6f2a530`; QA/evidence commit remains Main's responsibility. This sidecar edits only this document and the contrast JSON; no product edits or commits.

## Evidence provenance and result

- **Fresh sidecar execution:** full `npm test`, `npm run build`, unstaged and staged whitespace checks; source inspection and numerical palette contrast calculations.
- **Real-browser observations supplied by Main:** the two viewport checks, decoded images/ready state, script isolation, anchors, details, locator-based keyboard focus, primary navigation and browser-back restoration below. These were not independently replayed by this sidecar.
- **Static/unit only:** no-JS readability, reduced-motion behavior, image failure/timeout and lifecycle edge cases. Real-browser no-JS/reduced-motion emulation was unavailable; no actual browser image-request-failure test is claimed.
- Main reports Task 1 and Task 2 reviewers passed following the bfcache fix. That review status is supplied evidence, not an additional sidecar code-review certification.

## Real-browser evidence (Main)

| Check | Reported observation |
| --- | --- |
| Desktop 1440 × 900 | `clientWidth=1425`, `scrollWidth=1425`; no horizontal document overflow. Images decoded; sample state `ready`. |
| Mobile 390 × 844 | `clientWidth=375`, `scrollWidth=375`; no horizontal document overflow. Images decoded; sample state `ready`. |
| Scripts | Only the historyPreview script reported on the sample; no main-app / Three bundle loaded there. This does not describe the intentionally navigated original app. |
| Reading anchors | Anchors worked; native timeline details opened at both sizes. |
| Keyboard focus | Main first focused the primary link, then invoked locator `press` with Tab. Focus moved to the “展开这份档案” anchor; computed outline `rgb(228, 231, 226) solid 2.66667px`. Generic page-level `pressKey Tab` did not focus (reported tool issue); it is not recorded as a successful test or as an application keyboard failure. This proves one precise focus transition, not exhaustive keyboard coverage. |
| Primary navigation | Clicking the primary link reached `/#/`; original Bombe model controls/navigation DOM were present. This is not a full 3D/WebGL interaction regression claim. |
| Browser back | Returning from `/#/` restored the sample title and state `ready`. |

Four Main screenshots (relative to this QA document):

- [Desktop hero, 1440 × 900](../output/history-00-p1/desktop-hero.jpg)
- [Desktop Turing, 1440 × 900](../output/history-00-p1/desktop-turing.jpg)
- [Mobile hero, 390 × 844](../output/history-00-p1/mobile-hero.jpg)
- [Mobile Turing, 390 × 844](../output/history-00-p1/mobile-turing.jpg)

Screenshots document composition, not substitutes for the reported interaction checks. No independent sidecar assertion of pixel-perfect title/caption legibility or screenshot-based failure testing is made.

## Fresh tests, build and whitespace

Repeated after Main reported EOF-only cleanup (no semantic changes):

```text
npm test
 tests 51; suites 0; pass 51; fail 0
 cancelled 0; skipped 0; todo 0; duration_ms 805.1694

npm run build
 node build.mjs
 esbuild: Done in 71ms; exit 0

git diff --check
 exit 0

git diff --cached --check
 exit 0
```

Test coverage comprises 23 history controller tests, 5 static preview/content/build contracts and 23 existing app/model/cipher/challenge tests. Controller unit coverage includes decode resolve/reject, missing image, exact default 3000ms timeout, custom timeout, legacy load/error/completion, synchronous decode throw, destroy cleanup and late callbacks, absent DOM/observer, both reduced-motion flags, and persisted bfcache restore/remount resolve/timeout paths. These are happy-dom/mock-timer or Node checks, not fabricated browser fault tests.

Main detected trailing EOF blank lines in newly staged files that the earlier unstaged `git diff --check` did not inspect while those files were untracked. Main trimmed only EOF in `history-preview.html`, `src/history-preview.js`, and controller tests. The subsequent staged and unstaged checks above found no whitespace errors. Git emitted a CRLF→LF normalization warning for the controller test; no whitespace failure was reported. The QA files themselves are new/untracked until Main stages them and should be included in Main's final staged check.

Build retains the original app entry and adds the isolated historyPreview entry. It copies sample HTML/CSS, local history assets and notices, rewriting only the sample bundle URL for dist. A successful combined build is not a claim that the sample loads every bundle printed by esbuild.

## Static no-JS and reduced-motion inspection

- Hero title/introduction, Turing biography, seven timeline entries, source notes, skip/primary/reading anchors and image elements are in initial HTML, not injected by JavaScript. `details/summary` is native HTML. No scene-opacity gate hides body copy pending script execution.
- `noscript` explicitly says images and text remain directly readable. Without JS, the initial loading status and its small CSS scan may remain; this is not a settled loader-state claim. Body text and skip links do not depend on the loading state.
- CSS `@media (prefers-reduced-motion: reduce)` sets HTML scroll behavior to `auto` and disables animations/transitions on elements and both pseudo-elements using `!important`. This covers the ocean clip reveal and loading scan. Source inspection found no scroll interception or sticky mobile staging.
- Unit tests verify visible content with both motion flags and no IntersectionObserver. Static CSS review plus those tests do **not** establish actual browser media-query emulation or full no-JS rendering acceptance.
- Main's real-browser decoded/ready check is the happy path only. Decode rejection, never-settling decode, timeout and late-completion behavior are covered by unit tests, not browser network interception.

## Actual palette contrast — static calculation

Method: WCAG sRGB linearization (`c/12.92` below 0.04045, otherwise `((c+0.055)/1.055)^2.4`), relative luminance weights 0.2126/0.7152/0.0722, contrast `(Llighter+0.05)/(Ldarker+0.05)`. Values come from current CSS/SVG source, not browser pixel samples. Normal-text target: **4.5:1**.

| Actual foreground / background | Usage | Ratio |
| --- | --- | ---: |
| `#E4E7E2` / `#142633` | Hero text; inverse primary button/skip link | 12.42:1 |
| `#b8c4ca` / `#142633` | Figure captions, reading note, status, footer | 8.70:1 |
| `#ced6d8` / `#142633` | Hero introduction | 10.51:1 |
| `#b9c7cc` / `#142633` | Scene bridge | 8.93:1 |
| `#20313a` / `#E4E7E2` | Turing body and timeline | 10.77:1 |
| `#52614D` / `#E4E7E2` | Turing metadata, source link, timeline dates | 5.30:1 |
| `#20313a` / `#d3d8cf` | Portrait-placeholder body | 9.28:1 |
| `#4c5c53` / `#d3d8cf` | Placeholder small metadata/caption | 4.89:1 |
| `#52614D` / `#d3d8cf` | Placeholder name study | 4.56:1 |
| `#B69A67` / `#142633` | Brass brand mark | 5.76:1 |
| `#142633` / `#ffffff` | Primary hover | 15.50:1 |
| `#E4E7E2` / `#52614D` | Schematic text over land | 5.30:1 |
| `#E4E7E2` / `#142633e8` over white | Conservative photo-date label composite | 9.46:1 |

All listed actual text pairs meet 4.5:1, including the placeholder small text. The 4.56:1 pair has little margin. The photograph's `.photo-id` text sits over variable imagery/gradient: **not assigned a fixed contrast pass**, pending pixel-level checking. Low-opacity decorative chapter index/borders/grid and non-text symbols are excluded from normal-body-text ratios. Contrast alone does not certify small-caption readability or WCAG conformance. [Machine-readable calculations](../output/history-00-p1/contrast-report.json).

## Static-server evidence and scope

Task 1's [report](../output/history-00-p1/task1-report.md) records actual local HTTP checks on its own port 4181: HTML/CSS/JS/SVG/JPEG and original app bundle 200 with expected MIME; HEAD 200/no body; POST 405; missing allowed JPG 404; raw encoded traversal, encoded backslash traversal, hidden paths/assets, disallowed asset extensions/subtrees and `/src/main.js` 403. It also records realpath containment. These are attributed Task 1 results, **not rerun by this sidecar**, and not browser failure tests. No additional broad HTTP campaign was run during Main's ongoing browser checks.

## Asset status and outstanding acceptance

- A1: real local 1200 × 941 USS Aquila JPEG, US Navy / December 1941 / 80-G-405290; responsive image window, not a claimed 4K full-bleed image. Main/Task 1 report NHHC cross-check and Commons registration; see [source register](HISTORY_00_SOURCES.md) and notices for attribution/cropping and US-specific public-domain qualification. This sidecar did not independently re-verify remote licensing pages.
- A2: **portrait authorization unresolved**. Current Turing window is explicitly “肖像素材待定” original name typography, not a historical portrait or a generated substitute. Portrait requirement is not complete.
- S6: **independent macro-history source still pending**; no claim of complete historical-source acceptance.
- Browser no-JS, reduced-motion and actual image-request-failure checks remain unperformed due to unavailable emulation capabilities; current evidence is static/unit only for these scenarios.
- One locator-driven keyboard transition and successful primary navigation/back were observed; this is not exhaustive keyboard/accessibility acceptance. Variable-image photo-id contrast remains unverified.
- No test/build blocker was found in this sidecar run. Open items above prevent representing this evidence as complete P1 acceptance or full release. User visual review is still required before P2–P4.
