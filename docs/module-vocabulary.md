# Module Vocabulary

For the broader ownership map, see `docs/module-catalog.md`.

This repository now follows a simple naming rule:

- `chart` means the lead-sheet domain: import, interpretation, rendering, selection, and chart-side playback controls.
- `drill` means the dedicated practice mode shown in `index.html`.
- `practice session` means the shared contract that travels between modules, especially from `chart` to practice playback and the drill trainer.

Practical consequences:

- Shared contracts, storage keys, and exports should prefer `practice` over `drill`.
- File names should only use `drill` when the file is truly specific to Drill mode.
- `chart` is a good English term for this project.
- `drill` is understandable, but a bit narrower than the actual feature set. For cross-module concepts, `practice` or `practice session` is clearer and more idiomatic.

Naming guidance:

- Prefer `createPracticeSession...` for cross-module exports and payload builders.
- Prefer `pendingPracticeSession` for persistence/state handoff.
- Keep `Drill mode` / `Chart mode` only for the actual mode switch, not for shared contracts.
