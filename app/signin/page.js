'use client'
import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cruqcglooudetpxstvsc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNydXFjZ2xvb3VkZXRweHN0dnNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3OTAyMjQsImV4cCI6MjA4OTM2NjIyNH0.ZqV49eayg6J-rk2yC5QKHMQ2XWEG24ALdB9UAbuTOIc';

export default function SignIn() {
  useEffect(() => {
    document.title = 'Subscrub - Sign in';
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard',
        scopes: 'https://www.googleapis.com/auth/youtube.readonly',
      },
    });
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f1117', color: '#e8eaf0', fontFamily: 'sans-serif' }}>
      Redirecting to sign in…
    </div>
  );
}
