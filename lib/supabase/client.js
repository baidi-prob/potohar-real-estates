import { createClient } from '@supabase/supabase-js';
import { isSupabaseConfigured } from './config';

export { isSupabaseConfigured };

let supabaseClient = null;

export function getSupabase() {
  if (!isSupabaseConfigured()) return null;

  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }

  return supabaseClient;
}
