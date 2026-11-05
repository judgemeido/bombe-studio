# Teardown chapters 01–03 · acceptance inventory

## Required behavior

- 01 replaces the existing exhibit route with the detailed 108-drum Atelier. Check front, rear, explosion, motor isolation, live counter, pause, single step and tour.
- 02 uses the actual Enigma I I/II/III, reflector B, ring AAA and plugboard math. Check a known vector, all nine traced segments, fixed-position reciprocity, notch stepping, invalid plug pair and history log.
- 03 uses the tested six-level engine. Finish all six tasks with ordinary UI; test a wrong answer, wrong mission settings, three sequential ciphertext inputs, completion and a fresh round.
- All three pages retain global navigation, direct URLs, back/forward, context-specific headings and pause on route exit. Check 00 and 04 still load.
- Each chapter builds as an offline HTML without network requests. Check file URLs with network blocked.
- Controls: three subsystem isolates/return, camera buttons/orbit/zoom, cutaway, explosion, eco, pause/play/next segment, speed, screenshot, fullscreen, tour/manual takeover, rotor settings, plug pair, keyboard, reciprocal and next chapter.

## Visual evidence

- Desktop 1440×900 and 1366×768: assembled/exploded 01; complete circuit, rotor cutaway, rear contact view and active signal on 02; task/setup/completion on 03.
- Mobile 390×844: global navigation, model, controls, keyboard and challenge answers must be reachable with no horizontal overflow.
- Reduced motion disables idle autoplay. Integrated GPU is verified from the actual renderer.
- Capture the six deterministic tour beats and inspect a current contact sheet.

## Failure-path checks

- A hidden chapter must not advance ticks or signal state; reopening resumes without a time jump.
- Rapid route changes must reveal only the final requested chapter.
- Invalid settings must not change live electrical state; mission decoding must reject the wrong starting state.
- A frame from another origin/window cannot activate a chapter or navigate the host.

Results are recorded after the final browser pass in `teardown-results.md`.
