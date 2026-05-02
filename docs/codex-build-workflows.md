# Codex Build Workflows

Read this file only when the user explicitly asks for a local web build, an Android build, or Android live-reload.

## Local Web Build

- `fais un build` means run the local web app build.
- If the user explicitly asks `builde` or requests a build, increment the application version first.
- When incrementing the application version, update `package.json` and keep `package-lock.json` aligned if needed.
- Run `npm run build`.
- After the requested build succeeds, commit the current repository locally without pushing.
- Use the application version number in the local commit message.

## Android Build

- `fais un build Android` means run the Android build workflow.
- Increment the app version first in both root and `mobile/` package manifests, and keep both lockfiles aligned.
- Align `mobile/android/app/build.gradle`:
  - `versionName` must match the app version.
  - `versionCode` should track the numeric release iteration.
- Keep Android identifiers aligned when needed:
  - `mobile/capacitor.config.json`
  - `mobile/android/app/src/main/res/values/strings.xml`
- Build and sync from the repository root:
  1. `npm run build:mobile`
  2. `npm run mobile:sync`
- `npm run build:mobile` must produce:
  - main app bundle in `mobile/www`
  - runtime sample assets under `mobile/www/assets`
  - chart bundle under `mobile/www/chart`
- Then build the native Android app from `mobile/android` with Gradle.
- Working Java and SDK locations on this machine:
  - `JAVA_HOME=C:\Program Files\Android\Android Studio\jbr`
  - `ANDROID_HOME=C:\Users\Alcibiade\AppData\Local\Android\Sdk`
  - `ANDROID_SDK_ROOT=C:\Users\Alcibiade\AppData\Local\Android\Sdk`
- If Java or Android SDK environment variables are missing, set them for the current shell session rather than editing project files.
- Working PowerShell command from `mobile/android`:

```powershell
$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'; $env:ANDROID_HOME='C:\Users\Alcibiade\AppData\Local\Android\Sdk'; $env:ANDROID_SDK_ROOT='C:\Users\Alcibiade\AppData\Local\Android\Sdk'; $env:Path="$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"; .\gradlew.bat assembleDebug
```

- Debug APK output:
  - `mobile/android/app/build/outputs/apk/debug/app-debug.apk`
- After a successful Android build, try to push/install the debug APK onto a connected Android phone with ADB.
- Prefer the local SDK ADB binary:
  - `C:\Users\Alcibiade\AppData\Local\Android\Sdk\platform-tools\adb.exe`
- Device detection:

```powershell
& 'C:\Users\Alcibiade\AppData\Local\Android\Sdk\platform-tools\adb.exe' devices -l
```

- Install:

```powershell
& 'C:\Users\Alcibiade\AppData\Local\Android\Sdk\platform-tools\adb.exe' install -r 'C:\Users\Alcibiade\Documents\GitHub\SharpElevenApp\mobile\android\app\build\outputs\apk\debug\app-debug.apk'
```

- Post-install verification:

```powershell
& 'C:\Users\Alcibiade\AppData\Local\Android\Sdk\platform-tools\adb.exe' shell pm list packages io.github.al532.sharpelevenapp
& 'C:\Users\Alcibiade\AppData\Local\Android\Sdk\platform-tools\adb.exe' shell dumpsys package io.github.al532.sharpelevenapp | Select-String 'versionName|versionCode'
```

- If no device is listed, report that clearly and stop at the built APK without blocking the local build/commit workflow.
- After the requested Android build completes, commit the repository locally with the application version as the commit message.

## Android Live-Reload

Prefer Android live-reload for iterative mobile development when the user wants to verify web-layer changes quickly on a connected Android device without a full mobile build.

Run this loop:

1. `npm run dev:android:web`
2. `npm run dev:typecheck`
3. `npm run mobile:run:android:live`

Use live-reload for UI, TS/JS logic, CSS/layout, state, parsing, and rendering work. Keep the Android app connected to the Vite dev server through `adb reverse` on port `5173`.

Fall back to `npm run mobile:sync`, `npm run build:mobile`, or a full Android build only when changes affect Capacitor plugin configuration, Android native code/resources, manifest or Gradle settings, or bundled static output. Release behavior must remain unchanged: any HTTP cleartext allowance for live-reload stays limited to debug Android builds.
