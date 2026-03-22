import { supabase } from './supabase';

/**
 * Log a YouTube API call. Fire-and-forget.
 * @param {string} endpoint - e.g. 'playlistItems.list', 'subscriptions.list', 'channels.list'
 * @param {number} units - quota units consumed (default 1)
 */
export function trackApiUsage(endpoint, units = 1) {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session?.user?.id) return;
    supabase.from('api_usage').insert({
      user_id: session.user.id,
      endpoint,
      units,
    }).then(() => {});
  });
}
