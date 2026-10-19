# Bombe 01 Cinematic Model Refinement Design

## Intent

Refine the `01 / THE BOMBE` mechanical exhibition view so the machine reads as a carefully assembled electromechanical instrument at close range, while the running state becomes a cinematic, high-tech product reveal. The model remains a teaching reconstruction, not a manufacturing CAD model or a complete Bombe electrical simulation.

The Cassette Development Kit is the engineering reference for the implementation choices: one dimension schema, separable parts with explicit pivots, shared immutable materials, procedural micro-detail, deliberate studio lighting, a small camera state machine, and verification that separates model, browser, and performance evidence.

## Goals

- Preserve the current 108-drum / five-system model, part IDs, explode path, picking, focus, reset, and disposal contracts.
- Add readable close-range detail around the rotor faces, hubs, contact rings, fasteners, drive, service panels, and rear wiring.
- Make the running state visibly mechanical: nested rotor motion, phase offsets, indicator pulses, restrained signal traces, and a controlled bloom response.
- Add an authored camera rail that moves from a wide three-quarter reveal into rotor close-ups and returns to the product view.
- Let manual orbit/zoom interrupt the rail immediately and restore the normal controls without state drift.
- Respect `prefers-reduced-motion`; reduced motion must use settled poses and single-step rotor updates.
- Keep the page offline and asset-light: procedural geometry and Canvas textures only, with no remote media or GLB dependency.

## Non-goals and anti-goals

- No full historical CAD reconstruction, exact surveyed dimensions, or claim that the geometry is mechanically manufacturable.
- No changes to the signal laboratory, challenge, or mission runtime contracts except shared renderer utilities that are proven not to regress them.
- No always-on neon treatment, excessive bloom, or decorative particles that hide incorrect geometry and materials.
- No new framework, physics engine, external model loader, or runtime network request.

## Experience direction

The static exhibit keeps the existing deep-sea blue, paper, brass, and steel palette. The running state adds an amber/cyan technical accent only to readable machine signals: rotor edge rings, a short-lived path pulse, and the status lamps. The camera sequence is authored as an exhibition/product film rather than a gameplay camera:

1. A 2.5 second wide three-quarter settle establishes the cabinet and its floor shadow.
2. A 3.5 second push-in visits the upper rotor bank, with the active bank receiving a narrow rim highlight.
3. A 3.5 second oblique pass tracks across the rotor faces and exposed drive line.
4. A 2.5 second rear glance reveals the socket board and cable loom.
5. A 3.0 second pull-back returns to the normal three-quarter view.

The sequence is a command, not an autonomous page intro. The normal “运转演示” command starts rotor simulation; a separate “影院运镜” control starts or stops the rail. Starting the rail while the machine is stopped previews the scene at a settled pose; starting it while running couples camera emphasis to the current rotor phase.

## Constraints and contracts

- Stack stays native ESM, Three.js `0.180.0`, esbuild `0.28.2`, Node `>=22`.
- `createProduct()` continues to return `root`, `parts`, `setExplode(value)`, `setFocus(id)`, `update(dt, running)`, `resetMotion()`, `getAnchor(id)`, `getBounds(id?)`, and `dispose()`.
- `DIM` remains the single source for display units and rotor spacing; all new detail offsets derive from it or named detail constants.
- Static repeated pieces may remain instanced or merged only inside one movement/focus group. Dynamic rotor matrices, signal traces, and camera state remain independently owned.
- Shared materials are immutable during focus and effect transitions. Any fade/ghost material is cloned per mesh and disposed by its owner.
- `scene.update(dt, reduced)` remains the only render entry point. A post stack may be added behind this method but must have a renderer-only fallback.
- The existing user changes in `src/model.js` and `tests/model.test.mjs` are part of the starting state and must be preserved while extending the detail groups.

## Acceptance

- The full test suite and build pass.
- Model tests prove finite geometry, expected rotor/detail counts, reversible explode transforms, deterministic rotor reset, and disposal without double-free.
- Camera tests prove cue interpolation, shortest-angle travel, manual interruption, reduced-motion snapping, and no camera clipping at wide and mobile aspects.
- Browser evidence at 1440×900, 1024×768, 390×844, and a reduced-motion run shows the full model, rotor close-up, running state, and manual recovery.
- A runtime inspection report records draw calls, triangles, geometries, textures, and whether the post stack is active; no quality claim is made without those measurements.
