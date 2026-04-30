create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  message text not null check (char_length(message) <= 4000),
  page text not null default '',
  app_version text not null default '',
  user_agent text not null default '',
  beta_session_id text not null default ''
);

alter table public.beta_feedback enable row level security;
