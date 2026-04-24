# TS Source Unique Status

## Current State

The application runtime now uses TypeScript as the source of truth.

- `index.html` loads `./src/app.ts`.
- `chart-dev/index.html` loads `./main.ts`.
- `tsconfig.json` keeps `noEmit: true` and no longer enables `allowJs`.
- Runtime source is covered by `src/**/*.ts`, `chart/**/*.ts`, and
  `chart-dev/**/*.ts`.
- Vite remains responsible for browser transpilation.

The remaining JavaScript files are tooling, Vite configuration, generated
compatibility copies, or browser-facing static assets. They are not mirrored
runtime sources for the TypeScript modules.

## Import Convention

TypeScript source files may keep relative import specifiers ending in `.js`.
That convention matches bundler resolution and avoids noisy churn in existing
modules.

Node-based tests that import TypeScript directly must run with
`scripts/ts-source-loader.mjs`. The loader resolves missing relative `.js`
specifiers to adjacent `.ts` source files.

## Refactor Priorities After The Migration

The next work is structural, not another language migration:

- Keep `src/app.ts` as a thin bootstrap and wiring entrypoint.
- Move domain behavior into `features/*` or `core/*` modules.
- Keep `drill` names for drill-specific UI/runtime code.
- Prefer `practice session` names for contracts shared between chart and drill.
- Consolidate very thin `*-assembly`, `*-bindings`, and `*-context` files only
  when they do not carry an independent responsibility.
- Reduce local `any` usage in the audio, sample preload, and renderer surfaces
  without enabling `strict` globally.

## Verification

Use these checks for structural refactors:

- `npm run typecheck`
- `npm run test:chart` after chart or shared playback changes
- `npm run test:drill-wrappers` after drill, app wiring, or config changes

Do not run a full build unless explicitly requested.
