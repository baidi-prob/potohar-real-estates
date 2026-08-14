const PLACEHOLDER_MARKERS = ['your-', 'placeholder', 'example.com', '<your'];

function isRealUrl(url) {
  return (
    typeof url === 'string' &&
    /^https?:\/\//.test(url) &&
    !PLACEHOLDER_MARKERS.some((marker) => url.includes(marker))
  );
}

function isRealKey(key) {
  return (
    typeof key === 'string' &&
    key.length >= 40 &&
    !PLACEHOLDER_MARKERS.some((marker) => key.includes(marker))
  );
}

// Returns true only when both values look like a real Supabase project
// URL and anon key. Placeholder values (e.g. "your-project.supabase.co"
// from env examples) are treated as not-configured so they can never be
// used to attempt real requests and crash a production build.
export function isSupabaseConfigured() {
  return (
    isRealUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    isRealKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}
