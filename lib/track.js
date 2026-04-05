import { supabase } from './supabase';

/**
 * Log a user event. Fire-and-forget — never blocks UI.
 * Usage: trackEvent('sync') or trackEvent('video_play', { video_id: 'abc' })
 */
export function trackEvent(eventName, metadata) {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session?.user?.id) return;
    const row = { user_id: session.user.id, event_name: eventName };
    if (metadata) row.metadata = metadata;
    supabase.from('events').insert(row).then(({ error }) => {
      if (error) console.error('[Track] Failed to log event:', eventName, error);
    });
  });
}

/**
 * Track session end using sendBeacon (survives page close).
 */
export function trackSessionEnd(userId, metadata) {
  if (!userId) return;
  try {
    const url = '/api/track';
    navigator.sendBeacon(url, new Blob([JSON.stringify({
      user_id: userId,
      event_name: 'session_end',
      metadata,
    })], { type: 'application/json' }));
  } catch {}
}
