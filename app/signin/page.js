'use client';
import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function SignIn() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action') || 'signin';
    sessionStorage.setItem('subsnub_auth_action', action);
    document.title = action === 'signup' ? 'Subsnub - Sign up' : 'Subsnub - Sign in';

    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/home',
        scopes: 'https://www.googleapis.com/auth/youtube.readonly',
        queryParams: { prompt: 'select_account' },
      },
    });
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#fff', color: '#1a1a1a', fontFamily: 'sans-serif' }}>
      Redirecting...
    </div>
  );
}
