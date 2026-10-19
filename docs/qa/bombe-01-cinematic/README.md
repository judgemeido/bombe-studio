# Bombe 01 Cinematic QA

## Scope

This folder records the final verification surface for the refined `01 / THE BOMBE` exhibit: rotor detail ownership, cinematic camera cues, running-state signals, postprocessing fallback, reduced-motion behavior, and manual camera recovery.

## Reproduce

From `bombe-studio`:

```powershell
npm.cmd test -- tests/model.test.mjs tests/cinematic-camera.test.mjs tests/scene-render.test.mjs tests/application.test.mjs
npm.cmd run build
git diff --check
npm.cmd run dev
```

Open `http://127.0.0.1:4174/#/` and use the `影院运镜` control or the `C` shortcut. The browser-facing inspection hook is `window.__BOMBE_INSPECT__()`.

## Evidence matrix

| Surface | Evidence | Result |
|---|---|---|
| Model detail | `tests/model.test.mjs` | 8/8 pass; finite geometry, counts, anchors, reversible explode, deterministic reset and disposal |
| Camera rail | `tests/cinematic-camera.test.mjs` | 3/3 pass; five cues, shortest turn, interruption, repeat start/stop and reduced motion |
| Render lifecycle | `tests/scene-render.test.mjs` | 2/2 pass; fallback, resize and running intensity |
| UI state | `tests/application.test.mjs` | 4/4 pass; button, keyboard command, pressed state and manual interruption |
| Browser smoke | In-app browser at 01 route | Model and rotor details visible; cinema button toggles to stop state |

## Known limitation

The repository-wide test command currently has one unrelated failure in the existing mission furniture instancing assertion. Bombe 01 focused tests and the production build pass. No screenshot is stored here because the current browser automation session did not expose a stable capture call; the visual check is documented in `docs/BOMBE_01_CINEMATIC_ACCEPTANCE.md`.
