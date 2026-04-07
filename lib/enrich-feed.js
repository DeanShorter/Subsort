/**
 * Feed enrichment pipeline — takes raw video objects from the feed,
 * enriches with duration data, and generates tags in memory.
 * Nothing is persisted except the duration cache.
 */

import { generateTags } from './tagging';
import { getDurations } from './duration-cache';
import { FEATURE_FLAGS } from './feature-flags';

/**
 * Enrich a list of feed videos with duration + tags.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} accessToken - YouTube OAuth token
 * @param {Array<{ id: string, title: string, channelId: string, type?: string, [k:string]: any }>} videos
 * @returns {Promise<Array>} videos with duration_seconds, length_bucket, content_tags, energy, format
 */
export async function enrichFeed(supabase, accessToken, videos) {
  if (!videos.length) return videos;

  // Fetch durations (cache first, API for misses)
  const videoIds = videos.map(v => v.id).filter(Boolean);
  const durations = await getDurations(supabase, accessToken, videoIds);

  // Generate tags in memory
  const enriched = videos.map(video => {
    const durationSeconds = durations[video.id] ?? 0;
    const tags = generateTags(
      { title: video.title || '', description: video.description || '', videoType: video.type || 'video' },
      durationSeconds
    );
    return {
      ...video,
      duration_seconds: durationSeconds,
      ...tags,
    };
  });

  // Optional persistence (feature flag, off by default)
  if (FEATURE_FLAGS.persistVideos) {
    await persistVideos(enriched);
  }

  return enriched;
}

/**
 * Stub for future video persistence.
 * Enable via FEATURE_FLAGS.persistVideos when ready for analytics.
 */
async function persistVideos(_videos) {
  // No-op. See lib/feature-flags.js
}
