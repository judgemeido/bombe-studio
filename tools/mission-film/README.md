# Remotion opening

Independent authoring project; React is not part of the museum runtime.

```
npm ci
npm run render
npm run still
```

Render produces `assets/mission/arrival.mp4`, 1280 × 720, 24 fps, 12 seconds, silent with visible Chinese titles. The ThreeCanvas reuses the original procedural model. All motion is derived from `useCurrentFrame`; no realtime render loop is used here.

If automatic Chrome download is unavailable, pass `--browser-executable` with a local Chromium-compatible browser. Package versions are pinned together. The shipped video is optional, skip-enabled, and bypassed for reduced motion.
