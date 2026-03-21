import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cruqcglooudetpxstvsc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNydXFjZ2xvb3VkZXRweHN0dnNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3OTAyMjQsImV4cCI6MjA4OTM2NjIyNH0.ZqV49eayg6J-rk2yC5QKHMQ2XWEG24ALdB9UAbuTOIc';

let _client = null;

export function getSupabase() {
  if (!_client) {
    _client = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _client;
}

// Lazy getter — only creates the client when first accessed on the client side
export const supabase = typeof window !== 'undefined'
  ? getSupabase()
  : new Proxy({}, { get(_, prop) { return () => {}; } });
