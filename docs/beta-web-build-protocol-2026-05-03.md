# Build protocol : web beta (SharpElevenBeta) - 2026-05-03

## Repo context
- Source repo: `SharpElevenApp` (remotes: `beta` -> `https://github.com/Al532/SharpElevenBeta.git`, `origin` -> `https://github.com/Al532/SharpEleven.git`)
- Target deployment in this run: GitHub Pages on the `SharpElevenBeta` side.
- On GH Pages, do not serve raw root files like `index.html` with `src/home.ts`.
  Use the generated `build/` bundle as the site root.

## Why auth was missing on some pages
- The auth/feedback layer is in `src/features/app/app-beta-access.ts`.
- It is disabled only when runtime is local (`file:`, `localhost`, `127.0.0.1`, `::1`), where feedback/mail links are stripped.
- If you point GitHub Pages at source `index.html`, this layer is not part of the compiled bundle and is not active.
- The correct fix is to publish the `build/` output from `vite build`.

## Build command set used
```powershell
cd C:\Users\Alcibiade\Documents\GitHub\SharpElevenApp

# Supabase gate enabled, no chart test fixtures in production build
$env:VITE_BETA_GATE_ENABLED='true'
$env:VITE_INCLUDE_CHART_TEST_FIXTURES='false'

# Example Supabase vars (replace with real values; do not commit secrets)
$env:VITE_SUPABASE_URL='https://your-project-ref.supabase.co'
$env:VITE_SUPABASE_ANON_KEY='your-anon-key'
$env:VITE_BETA_LOGIN_FUNCTION='beta-login'
$env:VITE_BETA_FEEDBACK_FUNCTION='beta-feedback'

# Version bump required by codex build workflow
npm version --no-git-tag-version patch

# Build web bundle
npm run build
```

## Result
- `package.json` and `package-lock.json` version incremented from `1.1.67` to `1.1.68`.
- Build succeeds and writes static assets to `build/`.
- `build/` is ignored by git, so deployment is from a generated artifact copy (manual publish or CI publish job).

## Deployment notes for GH Pages
- Copy all files from `build/` to the GH Pages publishing source (not root source files).
- Keep `build/index.html` and hashed `build/assets/*` files together.
- In GH Pages, verify loaded page includes `./assets/...js` and not `./src/home.ts`.
- Keep feedback available by ensuring `VITE_BETA_GATE_ENABLED=true` and Supabase vars are set during build.
