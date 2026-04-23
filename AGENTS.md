# Codex Instructions

## Default Behavior

- Work autonomously by default.
- Preserve existing behavior unless the user asks for a behavioral change.
- Prefer finishing the requested task end-to-end over asking avoidable questions.
- Make reasonable assumptions from repository context.
- Ask only when a choice has non-obvious product, structural, or release consequences.

## Permanent Repository Rules

### Builds

- Do not run a build unless the user explicitly asks for it.
- If the user explicitly asks `builde` or requests a build, run the build and increment the application version.
- When incrementing the application version, update `package.json` and keep `package-lock.json` aligned if needed.
- After a requested build, commit the current repository locally without pushing it online.
- When a build is requested for the local app, use the application version number in the local repository commit message.

### External Demo Repository

- Do not update, commit, or push the external demo repository at `..\JazzProgressionTrainerDemo` unless the user explicitly asks for that repository to be updated.
- Android/mobile builds remain local to this repository and do not require any external demo-repository update.

### Synced Static Assets

- Files at the repository root are the source of truth for synced static assets.
- Do not manually edit the copies in `public/` when a root-level source file exists.
- When a synced static asset is modified at the repository root, also sync its `public/` copy so both stay aligned.

Synced static assets:

- `default-progressions.txt` -> `public/default-progressions.txt`
- `progression-suffixes.txt` -> `public/progression-suffixes.txt`
- `style.css` -> `public/style.css`
- `demo.html` -> `public/demo.html`
- `parsing-projects/review-standard-conversions.txt` -> `public/parsing-projects/review-standard-conversions.txt`

### Progressions Version

- `progressions-version` is independent from the app release version.
- Only change it when the default progression catalog itself changes.
- Do not increment the `# progressions-version:` header in `default-progressions.txt`.
- Do not increment the `# progressions-version:` header in `public/default-progressions.txt`.

## On-Demand Workflows

### Structural Consolidation

- Only do this when the user explicitly asks for consolidation, clarification, cleanup, or structural refactoring.
- Do not start this pass on your own initiative.
- Reduce unnecessary fragmentation, regroup files that are too small or too thin when this clearly improves readability, and clarify contracts, module boundaries, responsibilities, data flow, naming, and vocabulary.
- Preserve behavior, avoid decorative refactors, keep useful separations, and adapt the scope to the area actually concerned.
- Reserve specific terms for the modules or concepts they truly belong to, and use broader vocabulary for shared or cross-module elements.
- Update imports, references, tests, and relevant documentation so the result is coherent end-to-end.
- At the end, briefly summarize the main structural decisions, important renamings, and any remaining debatable points.

## Web Debug Workflow

- When the user reports a page-load or runtime error in the web app, prefer reproducing it yourself before asking for more console output.
- First try `http://localhost:8000/index.html`.
- If port `8000` is not already serving the repository, start a simple local static server from the repository root, then retry.
- Use a local browser automation/debug loop when available to capture `console` and `pageerror`, fix the issue, and iterate.
- Prefer this local reproduction loop over asking the user to manually copy browser console errors.
- Only ask for manual repro details if the issue appears to depend on an environment not represented by `http://localhost:8000/index.html`.

## Final State

- Prefer the smallest coherent change that fully solves the request.
- Keep meaningful separations; merge abstractions that add noise without carrying real responsibility.
- If files are renamed, merged, or reorganized, update all references.
- If relevant documentation becomes outdated because of the change, update it.
- In the final response, briefly summarize what was done, the most important decisions taken, and anything intentionally left unchanged.
