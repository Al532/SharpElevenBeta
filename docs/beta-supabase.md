# Supabase Beta Gate

This setup protects the public beta with one shared password and stores beta
feedback. It does not create user accounts.

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
supabase secrets set BETA_ACCESS_PASSWORD_HASH="<sha256-hex-password>"
supabase secrets set BETA_TOKEN_SECRET="<long-random-secret>"
supabase secrets set BETA_ALLOWED_ORIGINS="https://your-beta-domain.example"
supabase secrets set BETA_TOKEN_TTL_SECONDS="1209600"
```

`BETA_TOKEN_TTL_SECONDS=1209600` keeps a successful password entry valid for
14 days. `BETA_ALLOWED_ORIGINS` can be comma-separated for staging plus prod.

To create the password hash in PowerShell:

```powershell
$password = Read-Host "Beta password"
$bytes = [Text.Encoding]::UTF8.GetBytes($password)
$hash = [Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
($hash | ForEach-Object ToString x2) -join ""
```

For quick local testing only, the function also accepts `BETA_ACCESS_PASSWORD`
instead of `BETA_ACCESS_PASSWORD_HASH`.

## Deploy Functions

Deploy both functions:

```powershell
supabase functions deploy beta-login
supabase functions deploy beta-feedback
```

The frontend calls the functions with the Supabase anon key. The beta token is
returned by `beta-login`, stored in localStorage, and sent to `beta-feedback`
as `x-beta-token`.
