# Task 1 report — standalone history visual sample

Date: 2026-10-17. Shared checkout; no commit and no worktree created.
Only Task 1 / global constraints were read from the P1 plan. Controller implementation and controller tests belong to the parallel worker and were not edited here.

## Exact edited/created paths

- C:\Codex\city\bombe-studio\history-preview.html
- C:\Codex\city\bombe-studio\history-preview.css
- C:\Codex\city\bombe-studio\tests\history-preview.test.mjs
- C:\Codex\city\bombe-studio\build.mjs
- C:\Codex\city\bombe-studio\dev-server.mjs
- C:\Codex\city\bombe-studio\assets\history\atlantic-aquila-1941.jpg
- C:\Codex\city\bombe-studio\assets\history\atlantic-schematic.svg
- C:\Codex\city\bombe-studio\docs\HISTORY_00_SOURCES.md
- C:\Codex\city\bombe-studio\THIRD_PARTY_NOTICES.txt
- C:\Codex\city\bombe-studio\output\history-00-p1\task1-report.md

Build also regenerates ignored dist outputs. No edits to index.html, navigation.js, main.js, decryption/challenge code, src/history-preview.js, or controller tests.

## Delivered

Independent /history-preview.html; large Chinese serif hero with an asymmetric local historical photo window, secondary original navy Atlantic schematic, genuine image loader hooks, and always-visible main skip link. Archive-paper Turing scene has a deliberate oversized name study, explicitly labelled 肖像素材待定 / not a historical portrait, approved main copy and a native seven-entry details/summary timeline. The bridge explicitly identifies omitted scenes 02/03. Sources visible in HTML. No external fonts, animation libraries, or new dependencies.

Restrained CSS image-window reveal and small loading index scan only; no scene opacity gating, scroll interception, or animation on every paragraph. Reduced motion disables animation and smooth scrolling. Body copy uses specified paper/navy/green palette. Computed solid-color contrast pairs: paper/navy 12.42:1; muted/navy 8.70:1; hero intro/navy 10.51:1; ink/paper 10.77:1; green/paper 5.30:1; dark muted/placeholder 4.89:1; green/placeholder 4.56:1.

## TDD and verification evidence

1. Wrote static happy-dom content/build contracts before implementation.
2. `node --test tests/history-preview.test.mjs`: RED, 0/4 passing; ENOENT history-preview.html and missing historyPreview build entry, as intended. Updated photo expectations after main's A1 ruling; repeated RED before implementation.
3. Implemented page/CSS/assets/build/server. Static suite GREEN 4/4.
4. Added local JPEG/provenance contract: RED 4/5, missing local-path registration; then registered adopted photo and notices. GREEN 5/5.
5. Final static suite: 5/5 passing; `npm run build` exit 0, including controller worker's new independent entry. Preview HTML script rewrites dist/historyPreview.js to historyPreview.js; CSS/assets/notices copied into dist.
6. `npm test`: 51/51 passing including current controller worker tests and existing app/model/cipher/challenge suites.
7. Own dev server started on port **4181**, not existing 4173. HTTP request checks: preview HTML/CSS/JS, original SVG, local JPEG, existing dist/app.js all 200; correct HTML/CSS/JavaScript/SVG/JPEG MIME. HEAD preview 200 with no body; POST 405. Missing allowed JPG 404.
8. Raw encoded traversal, encoded backslash traversal, hidden paths, hidden asset paths, .txt/.js assets, assets outside history, and /src/main.js all 403. Root realpath containment retained; history assets additionally checked against real asset root. Bundle outputs only .js/.map and only actual in-memory outputs.
9. `git diff --check` initially identified one new EOF blank line in source registry; removed it and reran.

## Asset ruling and provenance

Initial instruction was original schematic only with A1 pending. Main subsequently explicitly authorized A1 after independently checking NHHC primary catalog. Used that updated ruling; registration attributes the primary cross-check to main, not to this worker. Photo metadata matches Commons: U.S. Navy, December 1941, 80-G-405290; NHHC Copyright Owner National Archives. PD-USGov-Military-Navy is qualified to the United States, not represented as CC BY or globally unrestricted.

Two direct download attempts failed (connection reset and timeout). Successfully retrieved the exact approved Commons JPEG through the Windows user's already-configured HTTP proxy, 127.0.0.1:7890. File preserved as 224323-byte original JPEG, 1200 x 941; no synthetic fill, resizing, or image substitution. Layout uses responsive CSS cropping in a bounded image window, not 4K full bleed. Source and notices identify date, local path, original filename, attribution, and transformations.

## Remaining risks / integration handoff

- A2 portrait rights remain unresolved: no portrait or generated face used. This is not final portrait delivery.
- S6 macro-history independent source remains pending; not silently marked resolved.
- Real browser desktop/mobile screenshot review, exact crop appraisal, keyboard traversal and no-JS/reduced-motion browser checks are Task 3, not claimed complete here. Numerical contrast checks do not replace photo-overlay/browser visual QA.
- Controller lifecycle belongs to the parallel worker; static hooks match the agreed DOM contract and its bundle builds.
- Development server remains available at http://127.0.0.1:4181/history-preview.html for integration review (session 8481). Existing server on 4173 was not restarted or changed.
- Main agent integrates uncommitted shared-checkout changes. No task 2 or main-route work was performed by this worker.
