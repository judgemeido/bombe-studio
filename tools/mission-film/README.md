# Remotion opening

Historical authoring project. Since 2026-10-19 the website uses the live Three.js camera transitions in `src/mission-transition.js`; it no longer loads or ships this video. The commands below are retained as the earlier production record; this refinement did not re-render the archived film.

Independent authoring project; React is not part of the museum runtime.

```
npm ci
npm run render
npm run still
```

Render produces `assets/mission/arrival.mp4`, 1280 × 720, 24 fps, 12 seconds, silent with visible Chinese titles. The ThreeCanvas reuses the original procedural model. All motion is derived from `useCurrentFrame`; no realtime render loop is used here.

If automatic Chrome download is unavailable, pass `--browser-executable` with a local Chromium-compatible browser. Package versions are pinned together. The former website presentation used a skip-enabled video and bypassed it for reduced motion.
