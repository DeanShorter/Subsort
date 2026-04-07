/**
 * Video metadata cache — fetches duration, YouTube category, and YouTube tags
 * from the YouTube API with Supabase-backed caching.
 */

import { parseDuration } from './tagging';
import { trackApiUsage } from './api-usage';

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} accessToken - YouTube OAuth token
 * @param {string[]} videoIds
 * @returns {Promise<Record<string, { duration_seconds: number, youtube_category_id: string|null, youtube_tags: string[] }>>}
 */
export async function getVideoMeta(supabase, accessToken, videoIds) {
  if (!videoIds.length) return {};

  // 1. Check cache
  const cacheMap = {};
  const BATCH = 300;
  for (let i = 0; i < videoIds.length; i += BATCH) {
    const batch = videoIds.slice(i, i + BATCH);
    const { data } = await supabase
      .from('video_duration_cache')
      .select('youtube_video_id, duration_seconds, youtube_category_id, youtube_tags')
      .in('youtube_video_id', batch);
    (data || []).forEach(r => {
      cacheMap[r.youtube_video_id] = {
        duration_seconds: r.duration_seconds,
        youtube_category_id: r.youtube_category_id || null,
        youtube_tags: r.youtube_tags || [],
      };
    });
  }

  // 2. Identify misses (includes entries without youtube_tags populated)
  const missingIds = videoIds.filter(id => {
    const entry = cacheMap[id];
    return !entry || (entry.youtube_category_id === null && entry.youtube_tags.length === 0);
  });
  if (!missingIds.length) return cacheMap;

  // 3. Fetch from YouTube API in batches of 50
  const newEntries = [];
  for (let i = 0; i < missingIds.length; i += 50) {
    const batch = missingIds.slice(i, i + 50);
    try {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${batch.join(',')}&maxResults=50`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        console.error('[VideoMetaCache] API error:', res.status);
        continue;
      }
      const data = await res.json();
      trackApiUsage('videos.list', batch.length, 1);

      for (const item of (data.items || [])) {
        if (item.id && item.contentDetails?.duration) {
          const seconds = parseDuration(item.contentDetails.duration);
          const ytCatId = item.snippet?.categoryId || null;
          const ytTags = item.snippet?.tags || [];
          cacheMap[item.id] = { duration_seconds: seconds, youtube_category_id: ytCatId, youtube_tags: ytTags };
          newEntries.push({
            youtube_video_id: item.id,
            duration_seconds: seconds,
            youtube_category_id: ytCatId,
            youtube_tags: ytTags,
          });
        }
      }
    } catch (err) {
      console.error('[VideoMetaCache] Fetch error:', err.message);
    }
  }

  // 4. Persist new entries
  if (newEntries.length) {
    supabase
      .from('video_duration_cache')
      .upsert(newEntries, { onConflict: 'youtube_video_id' })
      .then(({ error }) => { if (error) console.error('[VideoMetaCache] Upsert error:', error.message); });
  }

  return cacheMap;
}
