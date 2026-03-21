'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [userTier, setUserTier] = useState('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore cached token while waiting for auth
    const cachedToken = localStorage.getItem('subsort_yt_token');
    if (cachedToken) setAccessToken(cachedToken);

    const cachedTier = localStorage.getItem('subsort_user_tier');
    if (cachedTier) setUserTier(cachedTier);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
          setUser(session.user);

          // Extract Google provider token for YouTube API
          if (session.provider_token) {
            setAccessToken(session.provider_token);
            localStorage.setItem('subsort_yt_token', session.provider_token);
          }

          // Fetch user tier
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('tier')
              .eq('id', session.user.id)
              .single();
            if (profile?.tier) {
              setUserTier(profile.tier);
              localStorage.setItem('subsort_user_tier', profile.tier);
            }
          } catch (e) {
            // Non-fatal — falls back to cached value
          }

          setLoading(false);
        } else if (event === 'INITIAL_SESSION' && !session) {
          // No session on initial load
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setAccessToken(null);
          setUserTier('free');
          localStorage.removeItem('subsort_yt_token');
          localStorage.removeItem('subsort_user_tier');
        } else if (event === 'TOKEN_REFRESHED' && session) {
          if (session.provider_token) {
            setAccessToken(session.provider_token);
            localStorage.setItem('subsort_yt_token', session.provider_token);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard',
        scopes: 'https://www.googleapis.com/auth/youtube.readonly',
      },
    });
    if (error) console.error('Sign in failed:', error.message);
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem('subsort_yt_token');
    localStorage.removeItem('subsort_user_tier');
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    window.location.href = '/';
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, userTier, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
