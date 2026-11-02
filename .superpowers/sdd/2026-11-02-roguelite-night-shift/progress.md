# SDD ledger — plan: docs/superpowers/plans/2026-11-02-roguelite-night-shift.md

- Pre-flight: Task 1 produces seeded run contracts consumed by Tasks 2–3; Task 2 extends case generation consumed by Task 3 and final UI; Task 4 produces the view consumed by Task 5; Task 5 mounts it and must pause/resume the existing scene; Task 6 adds persistence to the controller. Interfaces align with the spec after narrowing unknown cipher state to the right rotor A–Z.
- Ruling: use direct `git worktree add` because the app worktree tool only accepts the outer workspace root, while this project is nested beneath it; keep all implementation inside the isolated sibling worktree and preserve the original checkout.
- Task 1: in progress
