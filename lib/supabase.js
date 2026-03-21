let _client = null;

function getClient() {
  if (!_client) {
    // Dynamic import at call time, not module evaluation time
    const { createClient } = require('@supabase/supabase-js');
    _client = createClient(
      'https://cruqcglooudetpxstvsc.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNydXFjZ2xvb3VkZXRweHN0dnNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3OTAyMjQsImV4cCI6MjA4OTM2NjIyNH0.ZqV49eayg6J-rk2yC5QKHMQ2XWEG24ALdB9UAbuTOIc'
    );
  }
  return _client;
}

// All consumers import `supabase` — this getter defers creation to first access
export const supabase = new Proxy({}, {
  get(_, prop) {
    return getClient()[prop];
  }
});
