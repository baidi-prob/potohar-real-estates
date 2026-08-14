import { createClient } from '@supabase/supabase-js';
import { isSupabaseConfigured } from './config';

// Server-side client for Server Components / SSG pages.
// Public read access is enforced by the database RLS policies.
export function createServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!isSupabaseConfigured()) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}
