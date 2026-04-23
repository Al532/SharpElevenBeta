# Mobile Shell

This folder hosts the Capacitor shell for the mobile targets.

Current decisions:

- app id: `io.github.al532.sharpelevenapp`
- app name: `Sharp Eleven App`
- shared web bundle output: [mobile/www](</C:/Users/Alcibiade/Documents/GitHub/SharpElevenApp/mobile/www>)
- Android first, then iOS on the same runtime

## Current status

- Capacitor config is in place in [mobile/capacitor.config.json](</C:/Users/Alcibiade/Documents/GitHub/SharpElevenApp/mobile/capacitor.config.json>).
- The mobile web bundle is produced by [vite.mobile.config.js](</C:/Users/Alcibiade/Documents/GitHub/SharpElevenApp/vite.mobile.config.js>).
- Root scripts now expose the main workflow without changing directory.
- The Android shell is versioned in this repository under [mobile/android](</C:/Users/Alcibiade/Documents/GitHub/SharpElevenApp/mobile/android>).

## Recommended workflow

1. From the repo root, install web dependencies if needed with `npm install`.
2. Install Capacitor dependencies with `npm run mobile:install`.
3. Build the in-repo mobile web bundle with `npm run build:mobile`.
4. Sync the latest web bundle into Capacitor with `npm run mobile:sync`.
5. Open the Android project with `npm run mobile:open:android`.
6. Only re-run `npx cap add android` if you intentionally recreate the native shell.

## Android-first checklist

- Build the mobile bundle before each native sync.
- Validate startup, playback, pause/resume, and settings persistence on real Android hardware.
- Check back navigation, safe areas, keyboard overlays, and audio unlock after user gesture.
- Keep the WebView runtime shared with the browser version; avoid Android-specific business logic.

## iOS follow-up

- Add the iOS shell only after Android is stable with `npx cap add ios`.
- Reuse the same `mobile/www` bundle and sync flow.
- Focus only on WKWebView/Safari differences: audio policies, safe areas, viewport behavior, and lifecycle.

## Notes

- The external demo repository is currently out of scope for the Android/mobile workflow.
- Android/mobile builds stay local to this repository unless the user explicitly asks to update the separate demo deployment.
- `vite.mobile.config.js` exists specifically to produce an in-repo `mobile/www` bundle for Capacitor.
- Root shortcuts are available in [package.json](</C:/Users/Alcibiade/Documents/GitHub/SharpElevenApp/package.json>) as `mobile:install`, `mobile:copy`, `mobile:sync`, `mobile:open:android`, and `mobile:open:ios`.
