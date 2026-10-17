# HISTORY 00 · P2 QA

Date: 2026-10-17 · Shared checkout: `C:\Codex\city\bombe-studio`.

## Disposition and scope

**Task3 scoped static QA: PASS. Main reports final broad product reviewer Mendel: APPROVE, no important findings.** This is a seven-scene standalone preview, not a replacement homepage. A2 portrait clearance is still open. No product edits, staging, commits, browser UI operation, broad test rerun, or build rerun were performed by Task3.

Inputs read: P2 implementation plan; `output/history-00-p2/task1-report.md`; `output/history-00-p2/task2-report.md`; execution ledger; current HTML/CSS, controllers, build script and source register. Attribution matters: **local** below means Task3 file/Node inspection; **main-reported** means browser/integration evidence supplied directly by main, not independently reproduced here; **worker-reported** means the implementation reports.

## Evidence matrix

| Check | Result / attribution |
| --- | --- |
| Broad regression / production build | **Main-reported:** fresh `npm test` 66/66; build passed, 73 ms. Not rerun by Task3. Task1's earlier focused 43/43 and 65 ms build are separate, earlier worker evidence. |
| Desktop viewport | **Main-reported real browser:** 1440×900; clientWidth=1425, scrollWidth=1425. |
| Mobile viewport | **Main-reported real browser:** 390×844; clientWidth=375, scrollWidth=375. All seven scenes visited; no horizontal overflow at client width 375. |
| Scene/navigation | **Main-reported:** seven expected scene IDs; current index correct at lifeline/pioneers/onward; anchors work. **Local:** seven IDs in order and every chapter anchor target exists. |
| Disclosures | **Main-reported:** all six native disclosures actually opened on mobile (lifeline/intercept/pioneers/turing/constraints/intelligence); constraint expansion contains BTM. **Local:** six `details` elements; constraint text includes BTM. |
| Image / isolation | **Main-reported:** hero image ready; document scripts only `dist/historyPreview.js`, state ready. **Local:** initial HTML has that single script, with independent history entry in build script. |
| Keyboard focus | **Main-reported:** first chapter link locator `.press('Tab')` moved to `#intercept`; computed outline rgb(228,231,226), solid, 2.66667px. A focused tab-step check, not a complete keyboard/assistive-technology audit. |
| Exit 01 | **Main-reported actual click:** `/#/` opens mechanical view with model controls present. |
| Exit 02 | **Main-reported actual click:** `/#/lab/drums` opens initialized lab, keyboard ready. |
| Exit 03 | **Main-reported actual click:** `/#/challenge` opens first question/options ready. |
| Back navigation | **Main-reported:** back restores history state ready/current onward. |
| Controller review | Task2 independent **PASS**, supplied by main. Worker report records focused 34/34 including IO ordering, runtime reduced motion, destroy/stale callbacks and bfcache. Task3 did not rerun those tests. |
| Static implementation review | Task1 independent **PASS**, supplied by main. Outdated A4–A7 asset-table finding resolved by main: old table removed; definitive A4–A9 filenames retained in SOURCES. |

## Local palette / contrast inspection

Fresh Node calculation at 2026-10-17T10:55:29Z uses WCAG sRGB relative luminance, not screenshot sampling or browser-computed styles. Full machine-readable result: [contrast-report.json](C:/Codex/city/bombe-studio/output/history-00-p2/contrast-report.json).

- Required palette retained: deep sea `#142633`, archive white `#E4E7E2`, mechanical green `#52614D`, brass `#B69A67`.
- **22/22 listed text-color pairs ≥4.5:1.** Includes paper/muted/brass against sea, intercept `#10212c` and constraint `#192a30`; ink/green/secondary colors against archive white, pioneers `#d9ddd4`, portrait `#d3d8cf`.
- Lowest listed pair: green on portrait panel **4.564:1**. Paper/sea **12.421:1**, brass/sea **5.763:1**, green/archive white **5.299:1**.
- Photo identifier has opaque sea backing. Photo-date sea overlay `#142633e8`, composited over worst-case white photo, gives paper text **9.461:1**.
- Decorative translucent hero numerals, rules and registration marks are not normal-text contrast claims. Current chapter also uses border/font weight plus `aria-current`, not color alone. This limited palette check does **not** establish full WCAG conformance, every interaction state, or non-text contrast.

## Static fallback and text safety

**Browser no-JS / reduced-motion / image-failure emulation was unavailable. These modes have unit/static evidence only, NOT real-browser passes.**

Fresh local assertions passed for scene/anchor structure, six native disclosures, single isolated script, explicit noscript notice, reduced-motion CSS, BTM, and S6/A2 labels. Source inspection finds:

- Body text, headings, captions, diagram labels and exit links are initial semantic HTML. Native disclosure contents are present in HTML and intentionally collapsed until opened; they are not JS-loaded. No text-opacity/visibility gating or scroll hijack was found. Hidden `.hero-index span` and mobile intro `br` are decorative/layout exceptions, not narrative removal.
- Default SVG paths are complete. Only `.history-enhanced … .diagram-trace` geometry is gated for a finite 1.25 s draw; captions/labels remain HTML. No-JS does not add that enhancement class. Native anchors/details remain usable.
- Reduced-motion CSS turns smooth scrolling off, disables animations/transitions, and forces full diagram stroke offsets. Scene controller reveals all for reduced motion and without IO; runtime motion changes and missing IO are covered in Task2's reported unit tests.
- Loader never gates document access; it settles image ready/fallback and clears resources. Decode rejection, missing image, timeout and teardown have worker-reported unit coverage. Real-browser failure display and live preference toggles remain unverified.
- Initial no-JS status still says “正在准备首屏影像。”; adjacent noscript explicitly says scripts are disabled and image/text remain readable. Record this static wording limitation rather than claiming a no-JS ready-state transition.

## Built HTML / resources / diagrams

Fresh local recursive file validation: **10 files checked, nine local references, zero missing** from `dist/history-preview.html`: CSS, bundled history JS, A1 JPEG, Atlantic schematic, and five new canonical SVG paths. No local CSS/JS/SVG dependency encountered was missing. This checks file resolution, not HTTP status/MIME or hosting configuration.

- Built HTML equals source after the intended `dist/historyPreview.js` → `historyPreview.js` rewrite; built CSS equals source bytes.
- Each new inline SVG's drawing geometry matches its canonical file (comparison ignores enhancement class/pathLength metadata): intercept-relay, pioneers-relay, constraint-loop, intelligence-chain, bombe-outline.
- All five canonical SVGs equal their dist copies; no script, foreignObject, or external href/src was found in those files. Labels are responsive HTML rather than scaled SVG text.
- Source hashes and exact checked references are in the JSON report. Results apply to that snapshot of the shared checkout, not unspecified later changes.

## Provenance / source state

**S6 VERIFIED by main:** VAC Battle of the Atlantic, Second World War, and Chronology pages. Task3 checked the source register and rendered HTML source for consistent links/status; Task3 did not independently browse or verify the external pages. Narrow wording is “英国需要通过海运接收物资与人员”; the page does not use an unsupported exact war-shortening/lives-saved claim.

A2 remains **肖像素材待定**: original name typography, explicitly not a historical portrait or completed portrait requirement. A1 date/rights disclosure retained. Main resolved the obsolete asset-table finding; definitive SOURCES registry is A4–A9. Task1 report's old browser-block/no-render caveat is superseded only by main's real-browser evidence above, not by Task3 browser testing.

## Screenshot inventory

Files below were confirmed locally present; captures are **main-provided real-browser evidence**. Task3 did not independently render or visually inspect these images. Files do not themselves prove every interaction in the matrix.

| Scene | Desktop | Mobile |
| --- | --- | --- |
| Hero | [desktop](C:/Codex/city/bombe-studio/output/history-00-p2/desktop-hero.jpg) | [mobile](C:/Codex/city/bombe-studio/output/history-00-p2/mobile-hero.jpg) |
| Pioneers | [desktop](C:/Codex/city/bombe-studio/output/history-00-p2/desktop-pioneers.jpg) | [mobile](C:/Codex/city/bombe-studio/output/history-00-p2/mobile-pioneers.jpg) |
| Constraints | [desktop](C:/Codex/city/bombe-studio/output/history-00-p2/desktop-constraints.jpg) | [mobile](C:/Codex/city/bombe-studio/output/history-00-p2/mobile-constraints.jpg) |
| Onward | [desktop](C:/Codex/city/bombe-studio/output/history-00-p2/desktop-onward.jpg) | [mobile](C:/Codex/city/bombe-studio/output/history-00-p2/mobile-onward.jpg) |
| Turing copy | — | [mobile](C:/Codex/city/bombe-studio/output/history-00-p2/mobile-turing-copy.jpg) |

## Open items / acceptance boundaries

1. Final broad product review: **Mendel APPROVE, no important findings**, reported directly by main. Task3 does not independently reproduce that review. Main owns delivery commit.
2. A2 portrait authorization/asset remains unresolved and clearly labelled; not solved by name typography.
3. Browser no-JS, reduced-motion (including live toggle), missing IO and image/network-failure modes require future browser evidence if visual acceptance of those modes is required. Current confidence is static/unit only.
4. No full keyboard/screen-reader or cross-browser audit claimed. Green/portrait contrast has modest margin; future palette changes need remeasurement. Inline/canonical SVG duplication must remain synchronized.
5. Default homepage replacement, WebGL-lazy-entry work and other P3 integration remain outside P2 scope. No observed static blocker was found within Task3's checks.
