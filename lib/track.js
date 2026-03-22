import { supabase } from './supabase';

/**
 * Log a user event. Fire-and-forget — never blocks UI.
 * Usage: trackEvent('sync') or trackEvent('favourite')
 */
export function trackEvent(event) {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session?.user?.id) return;
    supabase.from('events').insert({ user_id: session.user.id, event }).then(() => {});
  });
}
