let _client = null;

function getClient() {
  if (!_client) {
    const { createClient } = require('@supabase/supabase-js');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars');
    }
    _client = createClient(url, key);
  }
  return _client;
}

// All consumers import `supabase` — this getter defers creation to first access
export const supabase = new Proxy({}, {
  get(_, prop) {
    return getClient()[prop];
  }
});
