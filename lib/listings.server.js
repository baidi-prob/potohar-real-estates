import { createServerSupabase } from './supabase/server';
import { mapListingRow } from './listings';

// Server-only data access for SSG / ISR pages and the sitemap.
// RLS guarantees public read access for these queries.

export async function getListingById(id) {
  const supabase = createServerSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapListingRow(data, null);
}

export async function getAllListingIds() {
  const supabase = createServerSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase.from('listings').select('id');
  if (error) throw error;
  return (data || []).map((row) => row.id);
}
