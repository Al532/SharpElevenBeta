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

#### Android Build Procedure

- For an Android build request, increment the app version first in both root and `mobile/` package manifests, and keep both lockfiles aligned.
- Also align the Android native version in `mobile/android/app/build.gradle`:
  - `versionName` must match the app version
  - `versionCode` should track the numeric release iteration
- Keep Android identifiers aligned when needed:
  - `mobile/capacitor.config.json`
  - `mobile/android/app/src/main/res/values/strings.xml`
- Build and sync in this order from the repository root:
  1. `npm run build:mobile`
  2. `npm run mobile:sync`
- `npm run build:mobile` now has to produce the full mobile web shell, not only the drill entrypoint:
  - main app bundle in `mobile/www`
  - runtime sample assets under `mobile/www/assets`
  - chart bundle under `mobile/www/chart-dev`
- Then build the native Android app from `mobile/android` with Gradle.
- On this machine, Android Studio is installed and the working Java and SDK locations are:
  - `JAVA_HOME=C:\Program Files\Android\Android Studio\jbr`
  - `ANDROID_HOME=C:\Users\Alcibiade\AppData\Local\Android\Sdk`
  - `ANDROID_SDK_ROOT=C:\Users\Alcibiade\AppData\Local\Android\Sdk`
- If `JAVA_HOME` or `ANDROID_HOME` is missing, prefer setting them for the current shell session before running Gradle rather than editing project files.
- Working local command for this machine:
  - PowerShell:
    `$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'; $env:ANDROID_HOME='C:\Users\Alcibiade\AppData\Local\Android\Sdk'; $env:ANDROID_SDK_ROOT='C:\Users\Alcibiade\AppData\Local\Android\Sdk'; $env:Path=\"$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path\"; .\gradlew.bat assembleDebug`
- The debug APK output path is:
  - `mobile/android/app/build/outputs/apk/debug/app-debug.apk`
- After a successful Android build, also try to push/install the debug APK onto a connected Android phone with ADB.
- On this machine, prefer the local SDK ADB binary:
  - `C:\Users\Alcibiade\AppData\Local\Android\Sdk\platform-tools\adb.exe`
- Device detection command:
  - `& 'C:\Users\Alcibiade\AppData\Local\Android\Sdk\platform-tools\adb.exe' devices -l`
- Install command:
  - `& 'C:\Users\Alcibiade\AppData\Local\Android\Sdk\platform-tools\adb.exe' install -r 'C:\Users\Alcibiade\Documents\GitHub\SharpElevenApp\mobile\android\app\build\outputs\apk\debug\app-debug.apk'`
- Post-install verification commands:
  - `& 'C:\Users\Alcibiade\AppData\Local\Android\Sdk\platform-tools\adb.exe' shell pm list packages io.github.al532.sharpelevenapp`
  - `& 'C:\Users\Alcibiade\AppData\Local\Android\Sdk\platform-tools\adb.exe' shell dumpsys package io.github.al532.sharpelevenapp | Select-String 'versionName|versionCode'`
- If no device is listed, report that clearly and stop at the built APK without blocking the local build/commit workflow.
- After the requested Android build completes, commit the repository locally with the application version as the commit message.

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
