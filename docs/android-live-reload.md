# Android live-reload workflow

This project can be iterated quickly on Android without rebuilding the web bundle on every change.

## Recommended session workflow

Use three terminals from the repository root:

1. Start the Vite dev server:

```powershell
npm run dev:android:web
```

2. Start TypeScript watch:

```powershell
npm run dev:typecheck
```

3. Launch the Android app in live-reload mode:

```powershell
npm run mobile:run:android:live
```

The Android app then points at `http://localhost:5173` through `adb reverse`, so JS/TS/CSS changes should show up immediately on the connected device.

The repository helper can also launch a specific target without going through the interactive menu:

```powershell
.\serve.bat
.\serve.bat -ListTargets
.\serve.bat emulator
.\serve.bat usb -Serial <adb-serial>
.\serve.bat wifi -Serial <ip:port>
.\serve.bat -Serial <adb-serial>
```

In the interactive `serve.bat` menu, choosing an Android target opens its live-reload session in a dedicated PowerShell window and then returns to the menu. Use `R` to refresh the device list and `Q` to close only the menu. Starting live-reload on another listed device reuses the same Vite server and does not stop an already running emulator or phone session.

## First-session notes

- Keep USB debugging enabled on the phone.
- Leave the app open while iterating; you should not need to rebuild Android for normal web-layer changes.
- The debug Android manifest enables cleartext HTTP only for debug builds, so release behavior stays unchanged.

## When live-reload is enough

Use this path for:

- UI changes
- TS/JS logic changes
- CSS/layout changes
- most state, parsing, and rendering work

## When to fall back to sync/build

Run a mobile sync or full Android build when you change:

- Capacitor plugin configuration
- Android native code or resources
- manifest or Gradle settings
- anything that depends on bundled static output rather than the dev server

Useful commands:

```powershell
npm run mobile:sync
```

```powershell
npm run build:mobile
```

## If `localhost` does not connect

The live command is optimized for a USB-connected device because it uses `adb reverse` via `--forwardPorts 5173:5173`.

If you need Wi-Fi testing instead, run Capacitor with your machine LAN IP instead of `localhost`, for example:

```powershell
cd mobile
npx cap run android -l --host 192.168.x.x --port 5173
```

In that case, keep the Vite server exposed on the LAN:

```powershell
npm run dev:android:web
```
