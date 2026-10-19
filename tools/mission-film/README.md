# Remotion cinematics

Optional authored layers for the Before Daybreak mission. The website can skip these layers and uses live Three.js camera rails when reduced motion is enabled, decoding fails, or WebGL is unavailable.

Independent authoring project; React is not part of the museum runtime.

```
npm ci
npm run render
npm run still
```

The entry contains three deterministic compositions: `Prologue` (10 seconds), `ZoneTransit` (7 seconds), and `Handoff` (7.5 seconds). All motion is derived from `useCurrentFrame`; no realtime render loop or network asset is required. The compositions reuse the same static world layout as the runtime and remain presentation-only.

If automatic Chrome download is unavailable, pass `--browser-executable` with a local Chromium-compatible browser. Package versions are pinned together. Rendered files are local build artifacts only and are never required to advance the mission state.
