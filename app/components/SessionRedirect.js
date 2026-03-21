'use client';
import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function SessionRedirect() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.href = '/dashboard';
      }
    }).catch(() => {
      // No valid session — stay on landing page
    });
  }, []);

  return null;
}
