# Supabase Beta Gate

This setup protects the public beta with a small controlled password list and
stores beta feedback. It does not create user accounts.

## Frontend env

Set these in the web hosting environment, or in `.env.local` while testing:

```txt
VITE_BETA_GATE_ENABLED=true
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_BETA_LOGIN_FUNCTION=beta-login
VITE_BETA_FEEDBACK_FUNCTION=beta-feedback
```

Keep `VITE_BETA_GATE_ENABLED=false` for ordinary local/offline development.

## Database

Run `supabase/migrations/20260430000000_beta_feedback.sql` in Supabase SQL
Editor or through the Supabase CLI. The table has RLS enabled and no public
policies; inserts are made by the Edge Function with the service role key.

## Function Secrets

Set the function secrets:

```powershell
supabase secrets set BETA_ACCESS_PASSWORD_HASHES="invite-a:<sha256-hex-password>,invite-b:<sha256-hex-password>"
supabase secrets set BETA_TOKEN_SECRET="<long-random-secret>"
supabase secrets set BETA_ALLOWED_ORIGINS="https://your-beta-domain.example"
supabase secrets set BETA_TOKEN_TTL_SECONDS="1209600"
```

`BETA_TOKEN_TTL_SECONDS=1209600` keeps a successful password entry valid for
14 days. `BETA_ALLOWED_ORIGINS` can be comma-separated for staging plus prod.

`BETA_ACCESS_PASSWORD_HASHES` accepts comma, semicolon, or newline-separated
entries. Prefer the `label:hash` form so each issued beta token carries a
revocable `label`. Removing an entry blocks future logins for that password and
invalidates existing beta tokens that were created from that labeled entry.
Use neutral labels like `invite-a`, `tester-03`, or `press-preview` because the
label is stored in the token payload. Bare hashes are still accepted, but they
can only be revoked for future logins unless you also rotate
`BETA_TOKEN_SECRET`.

To create the password hash in PowerShell:

```powershell
$password = Read-Host "Beta password"
$bytes = [Text.Encoding]::UTF8.GetBytes($password)
$hash = [Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
($hash | ForEach-Object ToString x2) -join ""
```

To rotate the list, generate a new hash, update `BETA_ACCESS_PASSWORD_HASHES`
with the entries you still want active, and omit the entry you want to revoke.
The older single-password `BETA_ACCESS_PASSWORD_HASH` secret remains supported
for compatibility, but new beta setups should use `BETA_ACCESS_PASSWORD_HASHES`.

For quick local testing only, the function also accepts `BETA_ACCESS_PASSWORD`
or `BETA_ACCESS_PASSWORDS` instead of hashed secrets.

## Local Password Manager

For the simplest flow on Windows, double-click `beta-passwords.bat` at the
repository root, or run it from PowerShell:

```powershell
.\beta-passwords.bat
```

It opens a small text menu that asks what you want to do: list codes, assign a
code to someone, revoke, copy the Supabase value, or push it with the Supabase
CLI.

You can also use the same helper directly from npm:

```powershell
npm run beta:passwords -- list
npm run beta:passwords -- issue Thierry
npm run beta:passwords -- add invite-16
npm run beta:passwords -- unassign Thierry
npm run beta:passwords -- revoke invite-07
npm run beta:passwords -- export
```

`issue` assigns the next active unassigned code to the given name and prints the
password to share. The helper stores labels, 6-digit passwords, hashes,
recipient names, and revoked status in `.beta-passwords.json`. This file is
intentionally ignored by Git because it contains the plaintext beta passwords
and invite assignments. `export` prints the full
`BETA_ACCESS_PASSWORD_HASHES` value to paste into Supabase. If the Supabase CLI
is installed and linked, `npm run beta:passwords -- push` runs
`npx supabase secrets set BETA_ACCESS_PASSWORD_HASHES=...` directly.

## Deploy Functions

Deploy both functions:

```powershell
npx supabase functions deploy beta-login --project-ref your-project-ref --use-api --no-verify-jwt
npx supabase functions deploy beta-feedback --project-ref your-project-ref --use-api --no-verify-jwt
```

Both functions are configured with `verify_jwt = false` in
`supabase/config.toml` because the app uses a publishable Supabase key and the
beta code/token checks happen inside the functions. The deploy commands also
pass `--no-verify-jwt` explicitly so the remote function setting is updated even
if the project was deployed before the config file existed.

The frontend calls the functions with the Supabase anon key. The beta token is
returned by `beta-login`, stored in localStorage, and sent to `beta-feedback`
as `x-beta-token`.
