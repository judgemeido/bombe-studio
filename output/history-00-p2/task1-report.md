# Task 1 · P2 static seven-scene implementation report

Date: 2026-10-17. Shared checkout: `C:\Codex\city\bombe-studio`. No commits or worktrees created. No independent research or downloads.

## Owned changes

- `history-preview.html`: exactly seven scenes, in order `lifeline / intercept / pioneers / turing / constraints / intelligence / onward`; hero is inside lifeline. Seven native chapter-index anchors under `nav[aria-label="历史章节"]`. Approved full narrative and native expandable background; preserved P1 hero, local A1 image, Turing name study and seven-event timeline. Explicit 七幕预览 and unresolved portrait. Removed two-scene omission messaging. Exit links are `/#/`, `/#/lab/drums`, `/#/challenge`.
- `history-preview.css`: individual editorial compositions and mobile reflow; non-color-only current chapter marker; opaque deep-sea backing for photo identifier. Default diagrams complete; only `.diagram-trace` geometry receives finite 1.25-second drawing under `.history-enhanced` and scene `.is-revealed`. No text-opacity gating. Reduced motion forces complete diagrams and disables animation. Controller root class may be on body (as integrated), not only html.
- `tests/history-preview.test.mjs`: expanded seven-scene static contracts, full names/contributors/process chain, links, SVG safety/label boundaries, source notes, S6 correction and portrait state.
- Five new original SVGs listed below. Also embedded inline in their corresponding HTML figures so CSS can trace actual paths; figure `data-diagram-source` records the canonical local filename. Titles/descriptions have unique IDs; text labels are real responsive HTML, not tiny SVG lettering.

## New original asset registry (for main to add to SOURCES)

| File | Description / boundary |
| --- | --- |
| `assets/history/intercept-relay.svg` | Antenna, radio arcs and receiving document: communication relationships only, no actual wartime message or encryption conversion. |
| `assets/history/pioneers-relay.svg` | Three document groups and directional transfer: 1932 breakthrough → July 1939 sharing → British wartime research. Knowledge flow, not travel routes. |
| `assets/history/constraint-loop.svg` | Rectangular logical loop, crossing constraints, exclusion and candidate-check marks. Teaching relationships, not a circuit simulation or actual search results. |
| `assets/history/intelligence-chain.svg` | Seven connected nodes; labels in HTML read 截收 → 分析 → 搜索 → 检查 → 解读 → 传递 → 判断. Simplified work chain, not uniform timing or guaranteed success. |
| `assets/history/bombe-outline.svg` | Cabinet outline with three rows of five abstract drums. Original silhouette, not a historical photo or complete mechanical drawing. |

All five created locally for this page; no external scripts, foreignObject, fonts or linked images. Original visual work, not reproduction of archival artifacts. Existing Atlantic schematic and A1 JPEG unchanged.

## Design decisions

02 uses a wide radio spread beneath a split editorial opening. 03 is an archive-white ruled name register, with English/Polish names retained and knowledge-transfer documents below. 04 preserves P1. 05 is a dark machine-room plate with brass loop and a two-by-two constraint legend. 06 is a light vertical editorial process spine. 07 pairs a generous actual-route exit with a large machine silhouette. No repeated card grid. At narrow widths, compositions become natural document flow; legends re-stack or retain two readable columns, and long foreign names can wrap. Captions and secondary archival copy increased on mobile rather than scaling diagram text down.

## S6 handoff incorporated

Used main's revised approved copy as supplied: **英国需要通过海运接收物资与人员**. Chapter citation now S1/S2/S6. Removed old S6-pending statements. Footer explicitly says **S6 已补核** and links main-verified VAC Battle of the Atlantic, Second World War and Chronology pages. No exact-date expansion or independent research. A2 remains **肖像素材待定**; original name typography is not presented as a completed portrait.

## TDD and verification evidence

1. Before implementation: `node --test tests/history-preview.test.mjs` → **8 tests, 3 pass, 5 fail**. Intended failures: old preview label/scene count, omission messaging, zero chapter-index links, missing chapter narrative, ENOENT for new diagram. Existing asset/build isolation checks remained green.
2. Initial implementation: same static command → **8/8 pass**. `npm run build` → exit 0.
3. Controller integration became available in shared checkout: focused static + scene + loader/controller tests → **42/42 pass**.
4. Main's S6 adjustment: added narrower-wording/VAC-source contract first; static run → **9 tests, 8 pass, 1 fail**, for missing new wording.
5. Final after S6 correction: `node --test tests/history-preview.test.mjs tests/history-scenes.test.mjs tests/history-preview-controller.test.mjs` → **43 tests, 43 pass, 0 fail** (518.8717 ms). Includes 9 owned static tests and worker2 controller tests. No JS/controller edits by Task1.
6. Final `npm run build` → exit 0, esbuild completed in 65 ms.
7. `git diff --check` → exit 0, no whitespace errors; Git emitted CRLF-to-LF normalization warnings, including concurrently owned files. No broad suite run.

## Risks / remaining review

- Attempted in-app browser visit to `http://127.0.0.1:4173/history-preview.html` failed with `net::ERR_BLOCKED_BY_CLIENT`. Did not bypass the block. **No rendered desktop/mobile screenshot or overflow/contrast measurement is claimed by this worker.** Main/Task3 must complete actual 1440/390 browser QA, keyboard, no-JS and reduced-motion visual checks.
- Mobile readability/reflow is implemented and statically checked, not rendered-verified. New SVG labels are HTML and never scale with the drawing. Hero/Turing retained P1 geometry; extra navigation and lifeline body change total reading height.
- A2 portrait authorization remains unresolved, explicitly stated. Seven-scene preview does not replace the application homepage.
- SVG geometry exists both in canonical asset files and inline HTML for tracing. Future geometry changes must keep the two copies synchronized.
- Main owns provenance/research documentation and should register the five original SVG filenames above. Worker2's concurrently modified JS/controller tests and main's COPY/SOURCES were not edited by this worker. No main route, app entrypoint, decryption or challenge changes.
