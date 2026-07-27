-- Early-access email capture (client inserts, dashboard reads).
-- Run in Supabase SQL editor. Client: src/services/sessions.ts submitEarlyAccessEmail().
create table if not exists public.early_access (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.early_access enable row level security;

-- Any authenticated (incl. anonymous) user may leave their email.
-- No SELECT policy → the list is only visible via dashboard / service role.
create policy "anyone can join early access"
  on public.early_access for insert to authenticated with check (true);
