# Codex Instructions

Default workflow in this repository:

- Do not run a build unless the user explicitly asks for it.
- Files at the repository root are the source of truth for synced static assets.
- Do not manually edit the copies in `public/` when a root-level source file exists.
- When a synced static asset is modified at the repository root, also sync its `public/` copy so both stay aligned.
- If the user explicitly asks `builde` or requests a build, run the build and increment the application version.
- When incrementing the application version, update `package.json` and keep `package-lock.json` aligned if needed.
- After a requested build, commit the current repository locally without pushing it online.
- After a requested build, also commit and push the external build-output repository at `..\JazzProgressionTrainerDemo`.
- Use the application version number in both commit messages for the current repository and the external repository.
- Do not increment the `# progressions-version:` header in `default-progressions.txt`.
- Do not increment the `# progressions-version:` header in `public/default-progressions.txt`.

The `progressions-version` value is independent from the app release version and should only change when the default progression catalog itself changes.

Synced static assets currently include:

- `default-progressions.txt` -> `public/default-progressions.txt`
- `progression-suffixes.txt` -> `public/progression-suffixes.txt`
- `style.css` -> `public/style.css`
- `demo.html` -> `public/demo.html`
- `parsing-projects/review-standard-conversions.txt` -> `public/parsing-projects/review-standard-conversions.txt`
