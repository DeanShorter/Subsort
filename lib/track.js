import { supabase } from './supabase';

/**
 * Log a user event. Fire-and-forget — never blocks UI.
 * Usage: trackEvent('sync') or trackEvent('video_play', { video_id: 'abc' })
 */
export function trackEvent(event, metadata) {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session?.user?.id) return;
    const row = { user_id: session.user.id, event };
    if (metadata) row.metadata = metadata;
    supabase.from('events').insert(row).then(() => {});
  });
}
