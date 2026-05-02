# Codex Instructions

## Default Behavior

- Work autonomously by default.
- Launch as many sub-agents as necessary, only when it genuinely accelerates the work or reduces a concrete risk.
- Preserve existing behavior unless the user asks for a behavioral change.
- Prefer finishing the requested task end-to-end over asking avoidable questions.
- Make reasonable assumptions from repository context.
- Ask only when a choice has non-obvious product, structural, or release consequences.
- Treat the current workspace state as the source of truth, including uncommitted changes.
- Do not use the last Git commit as the implicit baseline for requested work.
- Do not revert, discard, or overwrite uncommitted changes unless the user explicitly asks for that exact rollback.
- When asked to undo recent work, undo only the changes you can specifically attribute to your own last action, not unrelated current workspace changes.
- If the current files contain mixed work from the user or another agent, preserve the useful intent in the current state and repair only the incoherent or broken parts.

## Context Hygiene

- Keep repo exploration targeted. Do not run broad searches such as `rg -S .` unless narrow searches fail.
- Prefer searching the active source areas first: `src/`, `chart/`, `public/`, `scripts/`, `config/`, `mobile/` when relevant, and specific docs when needed.
- Respect `.ignore` for normal `rg` / `rg --files` exploration. Use `--no-ignore` only when the task clearly needs generated output, dependencies, diagnostics, binary assets, or reference archives.
- Avoid dumping large command outputs into the thread. Prefer `Select-Object -First`, targeted `rg -n`, `git ls-files <path>`, file summaries, or exact file reads.
- Treat generated compatibility copies as secondary. When a `public/` source exists, inspect and edit the `public/` file first.

## Permanent Repository Rules

### Builds

- Do not run a build unless the user explicitly asks for it.
- `fais un build` means the local web app build. `fais un build Android` means the Android build workflow.
- If the user requests a build, first read `docs/codex-build-workflows.md`, then follow the relevant workflow exactly.
- Build requests require incrementing the application version and committing locally after success. Do not push unless explicitly asked.

### Synced Static Assets

- Files in `public/` are the source of truth for synced static assets.
- Root-level compatibility copies are generated from `public/` for the local HTML entrypoints and static-server workflows.
- Do not manually edit the generated root-level copies when a `public/` source file exists.

Synced static assets:

- `public/chord-symbol.css` -> `chord-symbol.css`
- `public/default-progressions.txt` -> `default-progressions.txt`
- `public/favicon.svg` -> `favicon.svg`
- `public/parsing-projects/review-standard-conversions.txt` -> `parsing-projects/review-standard-conversions.txt`
- `public/piano-sample-calibrator.html` -> `piano-sample-calibrator.html`
- `public/piano-sample-calibrator.js` -> `piano-sample-calibrator.js`
- `public/progression-suffixes.txt` -> `progression-suffixes.txt`
- `public/style.css` -> `style.css`

### Progressions Version

- `progressions-version` is independent from the app release version.
- Only change it when the default progression catalog itself changes.
- Do not increment the `# progressions-version:` header in `public/default-progressions.txt`.

### Visual Design

- Treat `docs/visual-theme.md` as the source of truth for the app's visual language, theme tokens, and palette workflow.
- Before changing UI styles, inspect the nearby existing CSS/components and preserve the current music-library language: search-first, calm, spacious, soft controls, and minimal chrome.
- Keep style edits in `public/` source files when a synced static asset exists, then sync generated root copies.
- Do not run visual browser or screenshot verification by default for small targeted UI/CSS adjustments. Wait for the user to request visual verification, except when the issue cannot be reasonably validated without reproducing it in a browser.

## On-Demand Workflows

### Android Live-Reload Workflow

- If the user asks to launch Android live-reload or the Android iteration loop, read `docs/codex-build-workflows.md` and execute the Android live-reload workflow.

### Structural Consolidation

- Only do this when the user explicitly asks for consolidation, clarification, cleanup, or structural refactoring.
- Do not start this pass on your own initiative.
- When triggered, read `docs/codex-structural-consolidation.md` and follow it.

## Web Debug Workflow

- When the user reports a page-load or runtime error in the web app, prefer reproducing it yourself before asking for more console output.
- First try `http://localhost:8000/index.html`.
- If port `8000` is not already serving the repository, start a simple local static server from the repository root, then retry.
- Use a local browser automation/debug loop when available to capture `console` and `pageerror`, fix the issue, and iterate.
- Prefer this local reproduction loop over asking the user to manually copy browser console errors.
- For purely visual feedback or small style tuning, do not use screenshots or browser visual checks unless the user explicitly asks for them.
- Only ask for manual repro details if the issue appears to depend on an environment not represented by `http://localhost:8000/index.html`.

## Final State

- Prefer the smallest coherent change that fully solves the request.
- Keep meaningful separations; merge abstractions that add noise without carrying real responsibility.
- If files are renamed, merged, or reorganized, update all references.
- If relevant documentation becomes outdated because of the change, update it.
- In the final response, briefly summarize what was done, the most important decisions taken, and anything intentionally left unchanged.
