import { createServerSupabase } from './supabase/server';
import { mapListingRow } from './listings';

// Server-only data access for SSG / ISR pages and the sitemap.
// RLS guarantees public read access for these queries.

export async function getListingById(id) {
  const supabase = createServerSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.warn(`[getListingById] Error fetching listing ${id}:`, error.message);
      return null;
    }
    if (!data) return null;
    return mapListingRow(data, null);
  } catch (err) {
    console.warn(`[getListingById] Network/DNS error for listing ${id}:`, err.message);
    return null;
  }
}

export async function getAllListingIds() {
  const supabase = createServerSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase.from('listings').select('id');
    if (error) {
      console.warn('[getAllListingIds] Error fetching IDs from Supabase:', error.message);
      return [];
    }
    return (data || []).map((row) => row.id);
  } catch (err) {
    console.warn('[getAllListingIds] Network/DNS error reaching Supabase:', err.message);
    return [];
  }
}
