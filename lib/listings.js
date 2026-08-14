import { getSupabase } from './supabase/client';
import { formatRelativeDate } from './format';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80';

export function mapListingRow(row, currentUserId) {
  return {
    id: row.id,
    title: row.title,
    sector: row.sector,
    block: row.block,
    size: row.size,
    type: row.type,
    feature: row.feature,
    pricePKR: row.price_pkr,
    displayPrice: row.display_price,
    location: row.location,
    description: row.description,
    sellerName: row.seller_name,
    sellerPhone: row.seller_phone,
    image: row.image_url || (row.images && row.images[0]) || DEFAULT_IMAGE,
    images: row.images || [],
    isMyListing: Boolean(currentUserId && row.user_id === currentUserId),
    date: formatRelativeDate(row.created_at),
    createdAt: row.created_at,
    userId: row.user_id,
  };
}

// Fetch listings with optional DB-side filtering + sorting.
// All filter/sort logic runs in Supabase (Postgres), not in React state.
// myListingsOnly: restrict to the current user's own ads (used on "My Listings").
export async function fetchListingsFromDb({
  currentUserId = null,
  sector,
  block,
  size,
  type,
  feature,
  maxPrice,
  searchQuery,
  sortOrder = 'newest',
  myListingsOnly = false,
} = {}) {
  const supabase = getSupabase();
  if (!supabase) return null;

  let query = supabase.from('listings').select('*');

  if (myListingsOnly) {
    if (!currentUserId) return [];
    query = query.eq('user_id', currentUserId);
  }

  if (sector && sector !== 'All') query = query.eq('sector', sector);
  if (block && block !== 'All') query = query.eq('block', block);
  if (size && size !== 'All') query = query.eq('size', size);
  if (type && type !== 'All') query = query.eq('type', type);
  if (feature && feature !== 'All Features') query = query.eq('feature', feature);
  if (maxPrice && Number(maxPrice) > 0) query = query.lte('price_pkr', Number(maxPrice));

  const q = (searchQuery || '').trim();
  if (q) {
    query = query.or(
      `title.ilike.%${q}%,block.ilike.%${q}%,sector.ilike.%${q}%,location.ilike.%${q}%,description.ilike.%${q}%`
    );
  }

  if (sortOrder === 'price_high') query = query.order('price_pkr', { ascending: false });
  else if (sortOrder === 'price_low') query = query.order('price_pkr', { ascending: true });
  else query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) throw error;
  return (data || []).map((row) => mapListingRow(row, currentUserId));
}

export async function insertListing(listing, userId) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Database not configured');

  const { data, error } = await supabase
    .from('listings')
    .insert({
      user_id: userId,
      title: listing.title,
      sector: listing.sector,
      block: listing.block,
      size: listing.size,
      type: listing.type,
      feature: listing.feature,
      price_pkr: listing.pricePKR,
      display_price: listing.displayPrice,
      location: listing.location,
      description: listing.description,
      seller_name: listing.sellerName,
      seller_phone: listing.sellerPhone,
      image_url: listing.image,
    })
    .select()
    .single();

  if (error) throw error;
  return mapListingRow(data, userId);
}

export async function updateListing(id, listing, userId) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Database not configured');

  const { data, error } = await supabase
    .from('listings')
    .update({
      title: listing.title,
      sector: listing.sector,
      block: listing.block,
      size: listing.size,
      type: listing.type,
      feature: listing.feature,
      price_pkr: listing.pricePKR,
      display_price: listing.displayPrice,
      location: listing.location,
      description: listing.description,
      seller_name: listing.sellerName,
      seller_phone: listing.sellerPhone,
      image_url: listing.image,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return mapListingRow(data, userId);
}

export async function removeListing(id) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Database not configured');

  const { error } = await supabase.from('listings').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadPropertyImage(file, userId) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Database not configured');

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('property-images')
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('property-images').getPublicUrl(path);
  return data.publicUrl;
}

export async function upsertProfile(userId, { fullName, phone, email }) {
  const supabase = getSupabase();
  if (!supabase) return;

  await supabase.from('profiles').upsert({
    id: userId,
    full_name: fullName || null,
    phone: phone || null,
    email: email || null,
    updated_at: new Date().toISOString(),
  });
}

export async function getProfile(userId) {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  return data;
}

export async function fetchFavoritesFromDb(userId) {
  const supabase = getSupabase();
  if (!supabase || !userId) return [];

  const { data, error } = await supabase
    .from('favorites')
    .select('property_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }

  return (data || []).map((f) => f.property_id);
}

export async function toggleFavoriteInDb(userId, propertyId, isCurrentlyFav) {
  const supabase = getSupabase();
  if (!supabase || !userId) return;

  if (isCurrentlyFav) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('property_id', propertyId);
    if (error) console.error('Error removing favorite:', error);
  } else {
    const { error } = await supabase
      .from('favorites')
      .insert({ user_id: userId, property_id: propertyId });
    if (error) console.error('Error adding favorite:', error);
  }
}

