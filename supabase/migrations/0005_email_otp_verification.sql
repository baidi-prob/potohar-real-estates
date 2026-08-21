-- Add this migration to existing projects that already ran 0001-0004.
alter table public.profiles
  add column if not exists is_verified boolean not null default false;

create table if not exists public.email_verification_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  last_sent_at timestamptz not null default now(),
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_verification_codes_user_created
  on public.email_verification_codes (user_id, created_at desc);

alter table public.email_verification_codes enable row level security;

-- Deliberately no client policies: OTP data is server-only.

revoke insert (is_verified) on public.profiles from anon, authenticated;
revoke update (is_verified) on public.profiles from anon, authenticated;
grant insert (id, full_name, phone, email, avatar_url) on public.profiles to authenticated;
grant update (full_name, phone, email, avatar_url, updated_at) on public.profiles to authenticated;

drop policy if exists "listings_insert" on public.listings;
create policy "listings_insert" on public.listings
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.profiles where id = auth.uid() and is_verified = true)
  );

drop policy if exists "listings_update" on public.listings;
create policy "listings_update" on public.listings
  for update using (
    auth.uid() = user_id
    and exists (select 1 from public.profiles where id = auth.uid() and is_verified = true)
  );

drop policy if exists "listings_delete" on public.listings;
create policy "listings_delete" on public.listings
  for delete using (
    auth.uid() = user_id
    and exists (select 1 from public.profiles where id = auth.uid() and is_verified = true)
  );