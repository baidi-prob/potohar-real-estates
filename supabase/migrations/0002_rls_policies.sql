-- =====================================================================
-- 0002_rls_policies.sql
-- Row Level Security (RLS) for Potohar Real Estates
--
-- Business rules:
--   * Everyone (logged in or not) can READ / browse all listings.
--   * Only the OWNER of a listing can insert / update / delete it.
--   * Profiles: readable by everyone, but only the owner edits their own.
--   * Favorites: users only see/manage their own saved properties.
-- =====================================================================

alter table public.profiles  enable row level security;
alter table public.listings  enable row level security;
alter table public.favorites enable row level security;

-- ---------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (true);

drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update using (auth.uid() = id);

-- ---------------------------------------------------------------------
-- LISTINGS
-- Everyone can read. Owners can insert/update/delete their own rows.
-- ---------------------------------------------------------------------
drop policy if exists "listings_select" on public.listings;
create policy "listings_select" on public.listings
  for select using (true);

drop policy if exists "listings_insert" on public.listings;
create policy "listings_insert" on public.listings
  for insert with check (auth.uid() = user_id);

drop policy if exists "listings_update" on public.listings;
create policy "listings_update" on public.listings
  for update using (auth.uid() = user_id);

drop policy if exists "listings_delete" on public.listings;
create policy "listings_delete" on public.listings
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- FAVORITES
-- Each user only sees / manages their own saved listings.
-- ---------------------------------------------------------------------
drop policy if exists "favorites_select" on public.favorites;
create policy "favorites_select" on public.favorites
  for select using (auth.uid() = user_id);

drop policy if exists "favorites_insert" on public.favorites;
create policy "favorites_insert" on public.favorites
  for insert with check (auth.uid() = user_id);

drop policy if exists "favorites_delete" on public.favorites;
create policy "favorites_delete" on public.favorites
  for delete using (auth.uid() = user_id);
