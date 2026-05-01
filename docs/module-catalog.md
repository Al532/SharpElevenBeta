# Module Catalog

This catalog records the current module ownership map. Keep it practical: it
should help future consolidation, renaming, and refactoring decisions without
becoming a second codebase.

Last reviewed: 2026-04-28.

## Naming Baseline

- `chart` owns lead-sheet import, interpretation, rendering, selection, and chart-side playback controls.
- `drill` owns the dedicated practice mode shown by `index.html`.
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
- Mobile iReal import redirects that belong to the app shell rather than Drill UI.

Refactor signals:

- Feature-specific behavior leaks into shell code.
- Mobile-only bridge behavior becomes general practice-session behavior.

### `src/features/chart`

Responsibility: the lead-sheet module and the increasingly central user workflow.

Keep here:

- Chart import controls, library state, persistence, fixture loading, and navigation.
- Chart library import flow, including import timing, apply/persist behavior, and default-library handoff.
- Chart rendering, selection, gestures, and screen state.
- Standalone chart screen DOM reference factories and focused screen wiring helpers.
- Standalone chart screen URL/localStorage persistence helpers.
- Runtime chart display CSS helpers used by the standalone screen.
- Chart playback controls and chart-to-practice-session export.

Refactor signals:

- Chart code reaches into drill internals instead of using a practice/playback contract.
- Playback bridge code is reusable by non-chart callers.
- Chart rendering state and practice playback state start sharing vocabulary accidentally.

### `src/features/chart-management`

Responsibility: chart library and setlist management pages shared by
`library.ts` and `setlists.ts`.

Keep here:

- Shared library/setlist page bootstrap, DOM wiring, filtering, metadata panel integration, and setlist drag/reorder behavior.
- Focused helper modules for page DOM refs, filter state/rendering, drag/drop previews, and shared view helpers.
- Page-mode differences between the library view and setlists view when the behavior is otherwise identical.
- Small root entrypoints that only select the page mode.

Refactor signals:

- Library-only or setlists-only behavior becomes large enough to deserve a focused submodule.
- Drag/drop or metadata panel logic becomes reusable by the main chart screen.
- Root `library.ts` or `setlists.ts` gain behavior beyond calling the shared page initializer.

### `chart`

Responsibility: chart domain module and standalone chart screen.

Keep here:

- Chart import/decoding, interpretation, harmony, reharmonization, contextual qualities, and practice-session export.
- The standalone chart screen entrypoint, chart sheet CSS, and chart fixtures.
- Node-facing exports used by tests or tooling.
- Pure domain logic that does not depend on app DOM.

Refactor signals:

- UI assumptions leak into pure chart domain helpers.
- Practice-session contracts are duplicated in `src/features/chart`.

### `src/features/drill`

Responsibility: the dedicated practice trainer UI and drill-specific adapters.

Keep here:

- Drill screen UI, controls, display helpers, welcome flow, key picker, settings UI, and progression selection specific to the trainer.
- Drill-specific adapters that translate trainer UI state into practice playback contracts.
- Legacy root-app adapters while they still translate the old `app.ts` state shape into narrower modules.

Current structural pressure:

- Embedded/direct runtime adapters still live here because they translate between practice playback contracts and the drill UI/runtime.
- Thin `*-assembly`, `*-bindings`, and `*-context` files should be consolidated when they only copy options or rename fields.

Refactor signals:

- A module is used by chart and drill, or by direct/embedded playback, without depending on drill UI or drill runtime state.
- Tests import drill files only to exercise shared contracts.

### `src/features/practice-arrangement`

Responsibility: practice arrangement generation and voicing support independent of the drill screen UI.

Keep here:

- Comping engine, piano comping, and string comping.
- Small shared comping utility helpers when they serve arrangement algorithms without owning music-domain policy.
- Practice voicing runtime and its root-app assembly.
- Walking bass generation and root-app assembly.

Refactor signals:

- A file starts reading drill DOM or trainer display state directly.
- Pure music-domain algorithms become reusable enough to move into `src/core/music` or a future `src/core/accompaniment`.
- Root-app assembly wrappers become pass-through layers after `app.ts` wiring shrinks.

### `src/features/practice-patterns`

Responsibility: practice pattern parsing, analysis, validation, and help text loading.

Keep here:

- Pattern analysis and normalization helpers.
- Custom pattern validation.
- Pattern help loading.
- Root-app pattern runtime wiring that groups analysis, validation, and help behavior for the trainer.

Refactor signals:

- Pattern code starts owning drill UI state instead of returning domain results.
- Chart-side pattern import needs the same parser, making a lower-level `core` owner more appropriate.

### `src/features/practice-playback`

Responsibility: app-level practice playback composition shared by chart handoff, direct playback, embedded playback, and the drill trainer host.

Keep here:

- Practice playback root assembly and root context wiring.
- Practice playback resources, preparation, and resource facade.
- Runtime host, scheduler, transport, and runtime app assembly that group app state, audio, preload, constants, and helper bindings before delegating to an injected runtime adapter.
- App-level embedded/direct playback composition through injected adapters supplied by the drill trainer while those adapters still depend on drill UI/runtime details.

Refactor signals:

- A file imports drill UI modules directly instead of going through a narrow adapter.
- Runtime-host code becomes DOM-free and can move further down into `src/core/playback`.
- Resource preparation becomes pure audio infrastructure and can move toward a future audio owner.

### `src/features/playback-audio`

Responsibility: app-level audio runtime, sample loading/playback, scheduled audio tracking, and audio facade composition for practice playback.

Keep here:

- Audio runtime helpers that own Web Audio context setup, mixer routing, sample fetching/decoding, and active source tracking.
- Sample playback and preload runtimes.
- Scheduled audio bookkeeping and fade/stop behavior.
- Audio stack and facade assembly used by the app and practice playback runtime.

Refactor signals:

- A file starts depending on drill UI state or trainer display details.
- Pure sample cache, decoding, or scheduling helpers become independent enough to move into `src/core/audio`.
- Playback settings or practice-session logic leaks into low-level audio helpers.

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

- Embedded/direct/practice playback bridges, runtime providers, session adapters, and assembly providers.
- Shared playback controller/runtime behavior that has no DOM dependency.
- Compatibility globals for published playback APIs.

Refactor signals:

- Feature modules duplicate playback provider or bridge concepts.
- Runtime code imports UI-specific feature modules.

### `src/core/music`

Responsibility: shared music-domain helpers and configuration.

Keep here:

- Reharmonization rules, harmony context, chord symbol display, swing utilities, voicing configuration, and piano rhythm/voicing constants.
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
