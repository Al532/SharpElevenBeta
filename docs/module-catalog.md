# Module Catalog

This catalog records the current module ownership map. Keep it practical: it
should help future consolidation, renaming, and refactoring decisions without
becoming a second codebase.

Last reviewed: 2026-04-24.

## Naming Baseline

- `chart` owns lead-sheet import, interpretation, rendering, selection, and chart-side playback controls.
- `drill` owns the dedicated practice trainer experience shown by `index.html`.
- `practice session` names the shared payload/contract that travels between modules.
- Shared contracts, storage handoff, playback bridges, and runtime infrastructure should avoid `drill` naming unless they are tied to the drill UI.

See also: `docs/module-vocabulary.md`.

## Source Modules

### `src/app.ts`

Responsibility: application bootstrap and root wiring for the main web app.

Keep here:

- DOM lookup and top-level boot sequence.
- Composition of app, chart, drill, progression, playback, and mobile concerns.
- Cross-feature event wiring that has no narrower owner yet.

Refactor signals:

- New feature logic appears inline instead of being delegated to a feature module.
- Large object literals are only there to bridge root state into a submodule.
- A concern needs tests but can only be exercised through full app wiring.

### `src/features/app`

Responsibility: app shell behavior that is neither chart nor drill domain logic.

Keep here:

- Mode switching and shell-level DOM references.
- Environment, analytics, mobile back navigation, and pending mobile imports.
- Native/mobile integration points that shape the app shell.

Refactor signals:

- Feature-specific behavior leaks into shell code.
- Mobile-only bridge behavior becomes general practice-session behavior.

### `src/features/chart`

Responsibility: the lead-sheet module and the increasingly central user workflow.

Keep here:

- Chart import controls, library state, persistence, fixture loading, and navigation.
- Chart rendering, selection, gestures, and screen state.
- Chart playback controls and chart-to-practice-session export.

Refactor signals:

- Chart code reaches into drill internals instead of using a practice/playback contract.
- Playback bridge code is reusable by non-chart callers.
- Chart rendering state and practice playback state start sharing vocabulary accidentally.

### `chart`

Responsibility: chart domain primitives that can run outside the app UI.

Keep here:

- iReal import/decoding, chart interpretation, harmony, contextual qualities, and practice-session export.
- Node-facing exports used by tests or tooling.
- Pure domain logic that does not depend on app DOM.

Refactor signals:

- UI assumptions appear in chart domain code.
- Practice-session contracts are duplicated in `src/features/chart`.

### `chart-dev`

Responsibility: standalone chart development entrypoint.

Keep here:

- Dev-only chart bootstrapping.
- Styles and harness code for chart iteration.

Refactor signals:

- Production chart behavior is fixed only in the dev harness.

### `src/features/drill`

Responsibility: the dedicated practice trainer UI and its local runtime orchestration.

Keep here:

- Drill screen UI, controls, display helpers, welcome flow, key picker, settings UI, and progression selection specific to the trainer.
- Practice playback behavior that is only meaningful inside the drill screen.
- Legacy root-app adapters while they still translate the old `app.ts` state shape into narrower modules.

Current structural pressure:

- Some files are still named `drill` because the drill screen was the original app center, not because the responsibility is drill-specific.
- `shared-playback`, embedded/direct playback, audio resource preparation, and practice-session handoff are candidates for eventual `practice`, `playback`, or `audio` ownership.
- Thin `*-assembly`, `*-bindings`, and `*-context` files should be consolidated when they only copy options or rename fields.

Refactor signals:

- A module is used by chart and drill, or by direct/embedded playback, without depending on drill UI.
- A file describes shared playback, practice sessions, or audio infrastructure but lives under `features/drill`.
- Tests import drill files only to exercise shared contracts.

### `src/features/progression`

Responsibility: user progression catalog, storage, editor, and manager UI.

Keep here:

- Progression library parsing and persistence.
- Progression manager/editor behavior.
- Bindings specific to progression UI.

Refactor signals:

- Progression logic becomes a chart library concern.
- Progression storage becomes a shared practice-session or catalog contract.

### `src/core/playback`

Responsibility: playback contracts and runtime infrastructure shared across app modes.

Keep here:

- Embedded/direct/drill playback bridges, runtime providers, session adapters, and assembly providers.
- Shared playback controller/runtime behavior that has no DOM dependency.
- Compatibility globals for published playback APIs.

Refactor signals:

- Files named `drill-*` are actually generic playback infrastructure.
- Feature modules duplicate playback provider or bridge concepts.
- Runtime code imports UI-specific feature modules.

### `src/core/music`

Responsibility: shared music-domain helpers and configuration.

Keep here:

- Harmony context, chord symbol display, swing utilities, voicing configuration, and piano rhythm/voicing constants.
- Music calculations that are independent from chart or drill UI.

Refactor signals:

- Feature modules duplicate harmony or voicing constants.
- Music helpers depend on DOM, storage, or app shell state.

### `src/core/models`

Responsibility: shared domain models.

Keep here:

- Practice-session model definitions and helpers.

Refactor signals:

- Cross-module payloads are typed only inside feature folders.

### `src/core/storage`

Responsibility: shared app storage primitives.

Keep here:

- Storage helpers and persistence boundaries used across features.

Refactor signals:

- Feature-specific storage keys dominate this folder.
- Storage code starts importing feature UI modules.

### `src/core/types`

Responsibility: shared TypeScript contracts.

Keep here:

- Cross-module type declarations that form stable app contracts.

Refactor signals:

- Types are broad only because ownership is unclear.
- Feature-specific types are promoted here before proving they are shared.

### `src/config`

Responsibility: app configuration.

Keep here:

- Trainer defaults and configuration values that are read by multiple modules.

Refactor signals:

- Runtime state or feature behavior is added here instead of configuration.

### `config/vite`

Responsibility: Vite build/dev configuration.

Keep here:

- Web, demo, chart, and mobile Vite config.

Refactor signals:

- Build configuration starts encoding feature behavior.

### `scripts`

Responsibility: repository automation and verification helpers.

Keep here:

- Asset sync scripts, TS source loader, test runners, live-reload helpers, and local tooling.

Refactor signals:

- Scripts become the only source of truth for app behavior.
- Test runners import modules only to preserve obsolete wrapper files.

## Maintenance Rules

- Update this catalog when a refactor changes module ownership, moves files across module boundaries, or renames a responsibility.
- Do not update it for purely internal edits that leave ownership unchanged.
- When removing a misleading `drill` name, record the new owner and the reason.
- Prefer documenting current reality plus a refactor signal over documenting an aspiration as if it were already true.
