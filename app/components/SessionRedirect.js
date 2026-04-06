'use client';
import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function SessionRedirect() {
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;

      // Only redirect to /home if user has a profile (completed onboarding)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile) {
        window.location.href = '/home';
      }
      // No profile = user abandoned onboarding or hasn't signed up — stay on landing page
    }).catch(() => {});
  }, []);

  return null;
}
