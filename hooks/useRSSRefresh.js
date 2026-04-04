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
      console.log('[RSS] Manual refresh triggered');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.warn('[RSS] No session token available');
        setLoading(false);
        return;
      }

      console.log('[RSS] Fetching feeds…');
      const response = await fetch('/api/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`[RSS] Complete: ${data.channelsChecked || 0} channels checked, ${data.newVideos || 0} new videos`);
        setResult({
          channelsChecked: data.channelsChecked || 0,
          newVideos: data.newVideos || 0,
        });
        window.dispatchEvent(new Event('subsnub:rss-refreshed'));
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
