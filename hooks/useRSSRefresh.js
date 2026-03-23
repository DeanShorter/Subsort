'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function useRSSRefresh() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function refresh() {
    if (loading) return;

    setLoading(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('[RSS] No session token available');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          channelsChecked: data.channelsChecked,
          newVideos: data.newVideos,
        });
      } else {
        console.error('[RSS] Refresh failed:', data.error);
      }
    } catch (error) {
      console.error('[RSS] Refresh error:', error);
    } finally {
      setLoading(false);
    }
  }

  return { refresh, loading, result };
}
