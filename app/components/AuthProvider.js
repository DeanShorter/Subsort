'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { AuthContext } from './AuthContext';
import { trackEvent } from '../../lib/track';

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

    let resolved = false;

    const handleSession = async (session) => {
      if (!session) {
        setLoading(false);
        return;
      }
      setUser(session.user);

      if (session.provider_token) {
        setAccessToken(session.provider_token);
        localStorage.setItem('subsort_yt_token', session.provider_token);
      }

      // Track session start (debounced — max once per 5 minutes)
      const lastSession = parseInt(localStorage.getItem('subsnub_last_session_ts') || '0');
      if (Date.now() - lastSession > 5 * 60 * 1000) {
        localStorage.setItem('subsnub_last_session_ts', String(Date.now()));
        trackEvent('session_start');
      }

      // Check profile and route based on auth action
      setLoading(false);
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('tier')
          .eq('id', session.user.id)
          .maybeSingle();

        const hasProfile = !!profile;
        const authAction = sessionStorage.getItem('subsnub_auth_action');
        sessionStorage.removeItem('subsnub_auth_action');
        const onOnboardingPage = typeof window !== 'undefined' && window.location.pathname === '/onboarding';

        if (profile?.tier) {
          setUserTier(profile.tier);
          localStorage.setItem('subsort_user_tier', profile.tier);
        }

        // Don't redirect if already on the onboarding page
        if (!onOnboardingPage) {
          if (authAction === 'signin' && !hasProfile) {
            // Scenario 2: Sign in but no account
            window.location.href = '/auth/no-account';
            return;
          }
          if (authAction === 'signup' && hasProfile) {
            // Scenario 4: Sign up but account exists
            window.location.href = '/auth/account-exists';
            return;
          }
        }

        // Scenario 1 (signin + profile) → normal dashboard
        // Scenario 3 (signup + no profile) → onboarding page handles it
        // No authAction (returning session) → normal dashboard
      } catch (e) {
        // Non-fatal — falls back to cached value
      }
    };

    // Explicitly get session first — don't rely solely on onAuthStateChange
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!resolved) {
        resolved = true;
        handleSession(session);
      }
    }).catch(() => {
      if (!resolved) { resolved = true; setLoading(false); }
    });

    // Also listen for future auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') {
          // Only handle if getSession hasn't resolved yet
          if (!resolved) {
            resolved = true;
            handleSession(session);
          }
        } else if (event === 'SIGNED_IN') {
          handleSession(session);
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

    // Safety timeout — if neither resolves in 5s, stop loading
    const timeout = setTimeout(() => {
      if (!resolved) { resolved = true; setLoading(false); }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signIn = useCallback(async (action = 'signin') => {
    sessionStorage.setItem('subsnub_auth_action', action);
    const redirectTo = window.location.origin + '/home';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        scopes: 'https://www.googleapis.com/auth/youtube.readonly',
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) console.error('Sign in failed:', error.message);
  }, []);

  const signOut = useCallback(async () => {
    // Use sendBeacon so the event survives the redirect
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        navigator.sendBeacon('/api/track', new Blob([JSON.stringify({
          user_id: session.user.id,
          event_name: 'session_end',
        })], { type: 'application/json' }));
      }
    } catch {}
    // Clear all subsort/subsnub localStorage keys
    Object.keys(localStorage).filter(k => k.startsWith('subsort') || k.startsWith('subsnub')).forEach(k => localStorage.removeItem(k));
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
