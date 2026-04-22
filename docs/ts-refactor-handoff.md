# TS Refactor Handoff

## Objective

This repository has been partially refactored to separate the two main app modes:

- `drill`
- `chart`

The current JavaScript refactor should now be treated as a preparation phase for the future TypeScript/mobile migration, not as a goal to complete at all costs in plain JS.

The next major refactor should therefore absorb the remaining heavy extractions instead of duplicating that work twice.

## Current Status

What is already in place:

- a shared app shell for switching between `drill` and `chart`
- a shared storage layer for app mode, pending drill session, and shared playback settings
- a canonical practice-session model used as a shared vocabulary
- a shared playback-session controller abstraction
- a substantial feature split under `features/chart/*`
- a substantial feature split under `features/drill/*`
- a working `chart -> selection -> send to drill` flow
- `npm run test:chart` passing

What is not fully finished:

- `chart` playback still relies on the hidden embedded Drill iframe bridge
- the deepest audio/runtime logic still lives mostly inside `app.js`
- `app.js` is smaller than before, but still too large to be considered fully decomposed

## Important Architectural Reality

The main unresolved boundary is not UI. It is the runtime/audio/playback boundary.

That boundary currently looks like this:

- `chart-dev/main.js`
- `features/chart/chart-playback-controller.js`
- hidden iframe in `chart-dev/index.html`
- embedded Drill API exposed by `window.__JPT_DRILL_API__`
- runtime/audio state and transport still ultimately driven from `app.js`

This is the highest-value target for the future TS migration.

## Shared Core Already Introduced

These files are the main seeds of the future typed architecture:

- `core/models/practice-session.js`
- `core/playback/playback-session-controller.js`
- `core/storage/app-state-storage.js`

These should become the first-class typed contracts during the TS migration.

## Feature Modules Already Extracted

### App

- `features/app/app-shell.js`

### Chart

- `features/chart/chart-session-builder.js`
- `features/chart/chart-selection-controller.js`
- `features/chart/chart-playback-controller.js`
- `features/chart/chart-persistence.js`
- `features/chart/chart-library.js`
- `features/chart/chart-renderer.js`
- `features/chart/chart-sheet-renderer.js`
- `features/chart/chart-navigation.js`
- `features/chart/chart-fixture-controller.js`
- `features/chart/chart-screen-state.js`
- `features/chart/chart-import-controls.js`
- `features/chart/chart-ui-shell.js`
- `features/chart/chart-runtime-controls.js`

### Drill

- `features/drill/drill-session-builder.js`
- `features/drill/drill-playback-controller.js`
- `features/drill/drill-playback-engine.js`
- `features/drill/drill-session-import.js`
- `features/drill/drill-embedded-api.js`
- `features/drill/drill-embedded-bootstrap.js`
- `features/drill/drill-embedded-runtime.js`
- `features/drill/drill-embedded-session.js`
- `features/drill/drill-ui-shell.js`
- `features/drill/drill-ui-runtime.js`
- `features/drill/drill-display-runtime.js`
- `features/drill/drill-key-selection.js`
- `features/drill/drill-runtime-controls.js`
- `features/drill/drill-settings.js`
- `features/drill/drill-welcome.js`
- `features/drill/drill-piano-tools.js`

## Main Remaining Legacy Bridge

The main legacy mechanism still in place is:

- hidden iframe: `chart-dev/index.html`
- API lookup: `window.__JPT_DRILL_API__`
- bridge implementation: `features/chart/chart-playback-controller.js`

This should not be over-invested in further in plain JavaScript.

It should instead be replaced during the TS migration by a shared typed playback runtime that both modes can consume directly.

## Recommended TS Migration Strategy

### Phase 1. Type the shared contracts first

Create typed definitions for:

- `PracticeSessionSpec`
- `PlaybackSettings`
- `PlaybackRuntimeState`
- `PlaybackSessionController`
- chart selection payloads
- pending drill session payloads

Do this before trying to replace the iframe bridge.

### Phase 2. Type the adapters and storage boundary

Type and stabilize:

- `core/storage/app-state-storage.js`
- `features/drill/drill-session-import.js`
- `features/chart/chart-session-builder.js`
- `features/drill/drill-session-builder.js`
- `features/chart/chart-playback-controller.js`
- `features/drill/drill-playback-controller.js`

At this stage, the important goal is to make data flow explicit.

### Phase 3. Extract a real shared playback runtime

Move toward a shared runtime that can be instantiated directly by both modes.

The target architecture should look like:

- typed playback runtime
- typed audio engine wrapper
- no iframe bridge
- no `window.__JPT_DRILL_API__` dependency for chart playback

### Phase 4. Finish decomposing the remaining `app.js` runtime

Only once the shared typed runtime exists should the rest of the large `app.js` leftovers be split aggressively.

Doing it before that risks extracting the wrong boundaries.

## What Should Be Preserved

These behaviors are currently working and should remain stable during the TS migration:

- current `chart -> send selection to drill` flow
- shared persisted playback settings
- chart rendering and navigation behavior
- drill onboarding/welcome behavior
- current musical normalization behavior in chart tests

Note: the chart tests intentionally accept canonicalized aliases such as `Cmaj9 -> Cmaj7` where that matches the repository’s conversion tables.

## What Should Not Be Treated As A Regression

These normalizations are expected in this codebase:

- chord alias collapse toward canonical engine qualities
- chart-side symbolic normalization driven by conversion/alias tables

Do not “fix” those unless the musical conversion tables themselves are meant to change.

## Verification Baseline

Useful commands currently expected to pass:

```powershell
node --check app.js
node --check chart-dev/main.js
node --check features/drill/drill-piano-tools.js
npm run test:chart
```

There is currently a benign Node warning about module type detection because `package.json` does not declare `"type": "module"`.

Do not change that casually as part of the refactor unless the migration explicitly decides to.

## Suggested First TS Targets

If the next agent wants a practical starting point, the highest leverage files to type first are:

1. `core/models/practice-session.js`
2. `core/playback/playback-session-controller.js`
3. `core/storage/app-state-storage.js`
4. `features/chart/chart-session-builder.js`
5. `features/drill/drill-session-builder.js`
6. `features/chart/chart-playback-controller.js`
7. `features/drill/drill-playback-controller.js`

## Practical Bottom Line

The JS refactor is advanced enough to stop treating “more extractions” as the main goal.

The next serious step should be:

- Type the shared contracts
- Type the runtime boundaries
- Replace the iframe bridge as part of that typed extraction

That is where the remaining value is.
