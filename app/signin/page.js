'use client'
import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function SignIn() {
  useEffect(() => {
    document.title = 'Subscrub - Sign in';
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/home',
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
