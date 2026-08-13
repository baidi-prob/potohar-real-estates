-- Potohar Real Estates — run this in Supabase SQL Editor
-- Dashboard → SQL → New query → paste all → Run

-- Profiles (seller info linked to auth users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone text,
  email text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Property listings
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete set null,
  title text not null,
  sector text not null,
  block text not null,
  size text not null,
  type text not null,
  feature text not null default 'Standard',
  price_pkr bigint not null,
  display_price text not null,
  location text not null,
  description text not null default '',
  seller_name text not null,
  seller_phone text not null,
  image_url text not null,
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Favorites table (saved properties per user)
create table if not exists public.favorites (
  user_id uuid references auth.users on delete cascade,
  property_id uuid references public.listings on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, property_id)
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.favorites enable row level security;

-- Profiles Policies
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Listings Policies
create policy "listings_select" on public.listings for select using (true);
create policy "listings_insert" on public.listings for insert with check (auth.uid() = user_id);
create policy "listings_update" on public.listings for update using (auth.uid() = user_id);
create policy "listings_delete" on public.listings for delete using (auth.uid() = user_id);

-- Favorites Policies
create policy "favorites_select" on public.favorites for select using (auth.uid() = user_id);
create policy "favorites_insert" on public.favorites for insert with check (auth.uid() = user_id);
create policy "favorites_delete" on public.favorites for delete using (auth.uid() = user_id);

-- Performance Indexes
create index if not exists idx_listings_sector on public.listings(sector);
create index if not exists idx_listings_block on public.listings(block);
create index if not exists idx_listings_type on public.listings(type);
create index if not exists idx_listings_size on public.listings(size);
create index if not exists idx_listings_feature on public.listings(feature);
create index if not exists idx_listings_price_pkr on public.listings(price_pkr);
create index if not exists idx_listings_user_id on public.listings(user_id);
create index if not exists idx_listings_created_at on public.listings(created_at desc);

-- Storage bucket for property photos
insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do nothing;

create policy "property_images_select"
  on storage.objects for select
  using (bucket_id = 'property-images');

create policy "property_images_insert"
  on storage.objects for insert
  with check (bucket_id = 'property-images' and auth.role() = 'authenticated');

create policy "property_images_delete"
  on storage.objects for delete
  using (bucket_id = 'property-images' and auth.uid()::text = (storage.foldername(name))[1]);

-- Sample listings (only if table is empty)
insert into public.listings (
  user_id, title, sector, block, size, type, feature,
  price_pkr, display_price, location, description,
  seller_name, seller_phone, image_url, created_at
)
select * from (values
  (
    null::uuid,
    '5 Kanal Luxurious Built Farmhouse in Executive Block',
    'Gulberg Greens', 'Executive Block', '5 Kanal', 'Built', 'Corner + Park Side',
    185000000::bigint, '18.5 Crore',
    'Executive Block, Gulberg Greens, Islamabad',
    'Ultra-modern 5 Kanal designer farmhouse with swimming pool, lush green lawns, servant quarters, and imported fixtures.',
    'Chaudhry & Sons Real Estate', '+92 300 8559922',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    now() - interval '2 hours'
  ),
  (
    null,
    '1 Kanal Prime Plot on Main Boulevard',
    'Gulberg Residencia', 'Block A', '1 Kanal', 'Plot', 'Main Road',
    32000000::bigint, '3.20 Crore',
    'Block A, Main Boulevard, Gulberg Residencia',
    'Ideal location plot ready for immediate construction. Direct connection to main commercial district.',
    'Malik Real Estate Consultants', '+92 321 5544332',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
    now() - interval '5 hours'
  ),
  (
    null,
    '7 Marla Newly Built Double Story House',
    'Gulberg Residencia', 'Block E', '7 Marla', 'Built', 'Park Side',
    24500000::bigint, '2.45 Crore',
    'Block E, Facing Park, Gulberg Residencia',
    '5 Bed, 6 Bath luxury house facing central park. Solid ash wood doors, Spanish tiles, and rooftop BBQ terrace.',
    'Gulberg Living Builders', '+92 333 9876543',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    now() - interval '1 day'
  ),
  (
    null,
    '4 Kanal Corner Farmhouse Plot',
    'Gulberg Greens', 'Block B', '4 Kanal', 'Plot', 'Corner',
    85000000::bigint, '8.50 Crore',
    'Block B, Gulberg Greens Islamabad',
    'Corner plot with dual road access. Ideal for constructing a high-end luxury farmhouse estate.',
    'Khan Property Network', '+92 301 4455667',
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    now() - interval '2 days'
  ),
  (
    null,
    '10 Marla Residential Plot in Block F',
    'Gulberg Residencia', 'Block F', '10 Marla', 'Plot', 'Standard',
    19500000::bigint, '1.95 Crore',
    'Block F, Gulberg Residencia Islamabad',
    'Level ground plot surrounded by constructed houses. All utility connections available.',
    'Islamabad Prime Estate', '+92 312 8877665',
    'https://images.unsplash.com/photo-1524813686514-a57563d77965?auto=format&fit=crop&w=800&q=80',
    now() - interval '3 days'
  ),
  (
    null,
    '10 Kanal Magnificent Palace Farmhouse',
    'Gulberg Greens', 'Block C', '10 Kanal', 'Built', 'Corner + Park Side',
    390000000::bigint, '39.0 Crore',
    'Block C, Gulberg Greens Islamabad',
    'Royal style 10 Kanal villa with private tennis court, infinity pool, 8 master suites, and security compound.',
    'Royal Properties Gulberg', '+92 300 1122334',
    'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80',
    now() - interval '4 days'
  )
) as seed(
  user_id, title, sector, block, size, type, feature,
  price_pkr, display_price, location, description,
  seller_name, seller_phone, image_url, created_at
)
where not exists (select 1 from public.listings limit 1);

