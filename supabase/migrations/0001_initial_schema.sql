-- =====================================================================
-- 0001_initial_schema.sql
-- Potohar Real Estates — initial schema
-- Tables: profiles (users), listings (properties), favorites (saved ads)
-- Run order: 0001 -> 0002 -> 0003 -> 0004
-- (You can also run supabase/schema.sql once instead of all four.)
-- =====================================================================

-- ---------------------------------------------------------------------
-- PROFILES (one row per authenticated Supabase Auth user)
-- The handle_new_user trigger keeps this table in sync automatically.
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid references auth.users (id) on delete cascade primary key,
  full_name  text,
  phone      text,
  email      text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up
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
-- LISTINGS (property ads)
-- user_id  = the owner of the listing (RLS uses this to scope edit/delete)
-- images   = array of photo URLs; image_url is the primary/hero photo
-- ---------------------------------------------------------------------
create table if not exists public.listings (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users (id) on delete set null,
  title         text not null,
  sector        text not null,          -- 'Gulberg Residencia' | 'Gulberg Greens'
  block         text not null,
  size          text not null,
  type          text not null,          -- 'Plot' | 'Built'
  feature       text not null default 'Standard', -- Corner / Main Road / Park Side / Corner + Park Side / Standard
  price_pkr     bigint not null,        -- full price in PKR (for sorting)
  display_price text not null,          -- human friendly e.g. '2.5 Crore'
  location      text not null,
  description   text not null default '',
  seller_name   text not null,
  seller_phone  text not null,
  image_url     text not null,          -- hero image
  images        text[] not null default '{}',
  status        text not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Keep updated_at fresh on any update (in addition to app-side updates)
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
-- FAVORITES (which user saved which listing)
-- ---------------------------------------------------------------------
create table if not exists public.favorites (
  user_id     uuid references auth.users (id) on delete cascade,
  property_id uuid references public.listings (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, property_id)
);

-- ---------------------------------------------------------------------
-- Indexes for fast filtering / sorting
-- ---------------------------------------------------------------------
create index if not exists idx_listings_sector on public.listings (sector);
create index if not exists idx_listings_block on public.listings (block);
create index if not exists idx_listings_size on public.listings (size);
create index if not exists idx_listings_type on public.listings (type);
create index if not exists idx_listings_feature on public.listings (feature);
create index if not exists idx_listings_price_pkr on public.listings (price_pkr);
create index if not exists idx_listings_user_id on public.listings (user_id);
create index if not exists idx_listings_created_at on public.listings (created_at desc);
