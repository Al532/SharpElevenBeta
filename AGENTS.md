# Codex Instructions

Default workflow in this repository:

- Do not run a build unless the user explicitly asks for it.
- If the user explicitly asks `builde` or requests a build, run the build and increment the application version.
- When incrementing the application version, update `package.json` and keep `package-lock.json` aligned if needed.
- Do not increment the `# progressions-version:` header in `default-progressions.txt`.
- Do not increment the `# progressions-version:` header in `public/default-progressions.txt`.

The `progressions-version` value is independent from the app release version and should only change when the default progression catalog itself changes.
