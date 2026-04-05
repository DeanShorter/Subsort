'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useChannelData } from './ChannelDataContext';
import { supabase } from '../../lib/supabase';
import { calculateHealthScore, buildHealthScoreInput, saveHealthSnapshot } from '../../lib/health-score';

/**
 * Invisible component that manages health score snapshots.
 *
 * Session start: compares current score to last snapshot.
 *   - If unchanged → reuse last snapshot with today's date.
 *   - If changed or no previous → save new snapshot.
 *
 * Session end: if data changed during the session, save a final snapshot.
 *
 * Sits inside ChannelDataProvider so it has access to all channel data.
 */
export default function HealthSnapshotManager() {
  const { user } = useAuth();
  const {
    channels, categories, subcategories,
    chIsUncategorised, getChannelState, feedVideos,
    loading,
  } = useChannelData();

  const sessionStartSaved = useRef(false);
  const lastSavedScore = useRef(null);
  const latestResult = useRef(null);

  // Compute current score
  const computeScore = useCallback(() => {
    if (!channels.length) return null;
    // No stash data here — pass empty arrays (stash doesn't change between page loads without user action)
    const { input, needAttentionCount } = buildHealthScoreInput(
      channels, categories, subcategories, chIsUncategorised, getChannelState,
      feedVideos, [], []
    );
    const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';
    return calculateHealthScore(input, userName, needAttentionCount);
  }, [channels, categories, subcategories, chIsUncategorised, getChannelState, feedVideos, user]);

  // Session start: save or reuse snapshot
  useEffect(() => {
    if (!user || loading || !channels.length || sessionStartSaved.current) return;
    sessionStartSaved.current = true;

    const result = computeScore();
    if (!result) return;
    latestResult.current = result;

    const lastScore = parseInt(localStorage.getItem('subsnub_last_health_score') || '-1');
    const today = new Date().toISOString().split('T')[0];
    const lastSnapshotDate = localStorage.getItem('subsnub_last_snapshot_date');

    if (lastScore === result.total && lastSnapshotDate === today) {
      console.log(`[HealthSnapshot] Score unchanged (${result.total}), already saved today`);
      return;
    }

    // Save snapshot — only update localStorage on success
    saveHealthSnapshot(supabase, user.id, result).then(ok => {
      if (ok) {
        localStorage.setItem('subsnub_last_health_score', String(result.total));
        localStorage.setItem('subsnub_last_snapshot_date', today);
        lastSavedScore.current = result.total;
      }
    });
  }, [user, loading, channels, computeScore]);

  // Track score changes during session
  useEffect(() => {
    if (!user || loading || !channels.length) return;
    const result = computeScore();
    if (result) latestResult.current = result;
  }, [user, loading, channels, categories, subcategories, feedVideos, computeScore]);

  // Session end: save final snapshot if score changed
  useEffect(() => {
    if (!user) return;

    const handleUnload = () => {
      if (!latestResult.current || !user) return;
      const currentScore = latestResult.current.total;
      if (lastSavedScore.current !== null && currentScore === lastSavedScore.current) return;

      // Use sendBeacon for reliable delivery on page close
      const today = new Date().toISOString().split('T')[0];
      const row = {
        user_id: user.id,
        score: latestResult.current.total,
        category_coverage_score: latestResult.current.categoryCoverage,
        subcategory_coverage_score: latestResult.current.subcategoryCoverage,
        category_hygiene_score: latestResult.current.categoryHygiene,
        channel_health_score: latestResult.current.channelHealth,
        feed_health_score: latestResult.current.feedHealth,
        stash_health_score: latestResult.current.stashHealth,
        data_freshness_score: latestResult.current.dataFreshness,
        total_channels: latestResult.current.counts.totalChannels,
        categorised_channels: latestResult.current.counts.categorisedChannels,
        subcategorised_channels: latestResult.current.counts.subcategorisedChannels,
        active_channels: latestResult.current.counts.activeChannels,
        dead_channels: latestResult.current.counts.deadChannels,
        inactive_channels: latestResult.current.counts.inactiveChannels,
        mood: latestResult.current.mood,
        snapshot_date: today,
      };

      // sendBeacon with Supabase REST API
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/health_score_snapshots?on_conflict=user_id,snapshot_date`;
      const headers = {
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Prefer': 'resolution=merge-duplicates',
      };

      try {
        navigator.sendBeacon(
          url,
          new Blob([JSON.stringify(row)], { type: 'application/json' })
        );
        localStorage.setItem('subsnub_last_health_score', String(currentScore));
        localStorage.setItem('subsnub_last_snapshot_date', today);
      } catch (e) {
        // sendBeacon failed — not critical
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [user]);

  return null; // invisible component
}
