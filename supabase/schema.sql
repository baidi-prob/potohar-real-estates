-- =====================================================================
-- Potohar Real Estates — complete setup script (single file)
--
-- Use this if you prefer one big paste, OR run the individual files in
-- supabase/migrations/ in order instead:
--   1. 0001_initial_schema.sql
--   2. 0002_rls_policies.sql
--   3. 0003_storage.sql
--   4. 0004_seed_data.sql
--   5. 0005_email_otp_verification.sql
--
-- How to run:  Supabase Dashboard → SQL → New query → paste → Run
-- =====================================================================

-- ---------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid references auth.users (id) on delete cascade primary key,
  full_name  text,
  phone      text,
  email      text,
  avatar_url text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Upgrade existing projects created before email OTP verification was added.
alter table public.profiles
  add column if not exists is_verified boolean not null default false;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- EMAIL VERIFICATION CODES
-- Raw OTP values are never stored. Service-role API routes write/read this table.
-- ---------------------------------------------------------------------
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

-- No client policy is intentional. OTPs are managed only by server API routes.

-- ---------------------------------------------------------------------
-- LISTINGS
-- ---------------------------------------------------------------------
create table if not exists public.listings (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users (id) on delete set null,
  title         text not null,
  sector        text not null,
  block         text not null,
  size          text not null,
  type          text not null,
  feature       text not null default 'Standard',
  price_pkr     bigint not null,
  display_price text not null,
  location      text not null,
  description   text not null default '',
  seller_name   text not null,
  seller_phone  text not null,
  image_url     text not null,
  images        text[] not null default '{}',
  status        text not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_listings_updated_at on public.listings;
create trigger set_listings_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- FAVORITES
-- ---------------------------------------------------------------------
create table if not exists public.favorites (
  user_id     uuid references auth.users (id) on delete cascade,
  property_id uuid references public.listings (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, property_id)
);

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------
create index if not exists idx_listings_sector on public.listings (sector);
create index if not exists idx_listings_block on public.listings (block);
create index if not exists idx_listings_size on public.listings (size);
create index if not exists idx_listings_type on public.listings (type);
create index if not exists idx_listings_feature on public.listings (feature);
create index if not exists idx_listings_price_pkr on public.listings (price_pkr);
create index if not exists idx_listings_user_id on public.listings (user_id);
create index if not exists idx_listings_created_at on public.listings (created_at desc);

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.profiles  enable row level security;
alter table public.listings  enable row level security;
alter table public.favorites enable row level security;

-- The browser may edit profile details, but only the server OTP route may
-- change is_verified. The service role used by that route is not affected.
revoke insert (is_verified) on public.profiles from anon, authenticated;
revoke update (is_verified) on public.profiles from anon, authenticated;
grant insert (id, full_name, phone, email, avatar_url) on public.profiles to authenticated;
grant update (full_name, phone, email, avatar_url, updated_at) on public.profiles to authenticated;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (true);

drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "listings_select" on public.listings;
create policy "listings_select" on public.listings
  for select using (true);

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

drop policy if exists "favorites_select" on public.favorites;
create policy "favorites_select" on public.favorites
  for select using (auth.uid() = user_id);

drop policy if exists "favorites_insert" on public.favorites;
create policy "favorites_insert" on public.favorites
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.profiles where id = auth.uid() and is_verified = true)
  );

drop policy if exists "favorites_delete" on public.favorites;
create policy "favorites_delete" on public.favorites
  for delete using (
    auth.uid() = user_id
    and exists (select 1 from public.profiles where id = auth.uid() and is_verified = true)
  );

-- ---------------------------------------------------------------------
-- STORAGE
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do nothing;

drop policy if exists "property_images_select" on storage.objects;
create policy "property_images_select" on storage.objects
  for select
  using (bucket_id = 'property-images');

drop policy if exists "property_images_insert" on storage.objects;
create policy "property_images_insert" on storage.objects
  for insert
  with check (bucket_id = 'property-images' and auth.role() = 'authenticated');

drop policy if exists "property_images_delete" on storage.objects;
create policy "property_images_delete" on storage.objects
  for delete
  using (
    bucket_id = 'property-images'
    and auth.role() = 'authenticated'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ---------------------------------------------------------------------
-- NOTE: No sample/seed listings are inserted.
-- The marketplace starts empty — users add their own listings via the app.
-- ---------------------------------------------------------------------
