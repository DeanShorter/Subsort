/**
 * Feed enrichment pipeline — takes raw video objects from the feed,
 * enriches with YouTube metadata, and generates multi-signal tags in memory.
 */

import { generateTags } from './tagging';
import { getVideoMeta } from './duration-cache';
import { FEATURE_FLAGS } from './feature-flags';

/**
 * Enrich a list of feed videos with duration + multi-signal tags.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} accessToken - YouTube OAuth token
 * @param {Array} videos - feed video objects with { id, title, channelId, type, description }
 * @param {Record<string, { category_name, subcategory_name }>} channelContexts - per-channel context
 * @param {{ includeDebug?: boolean }} options
 * @returns {Promise<Array>} enriched videos
 */
export async function enrichFeed(supabase, accessToken, videos, channelContexts, options = {}) {
  if (!videos.length) return videos;

  // Fetch metadata (cache first, API for misses)
  const videoIds = videos.map(v => v.id).filter(Boolean);
  const metaMap = await getVideoMeta(supabase, accessToken, videoIds);

  // Generate tags in memory
  const enriched = videos.map(video => {
    const meta = metaMap[video.id] || {};
    const durationSeconds = meta.duration_seconds ?? 0;
    const channelCtx = channelContexts?.[video.channelId] || null;

    const { tags, debug } = generateTags(
      { title: video.title || '', description: video.description || '', videoType: video.type || 'video' },
      durationSeconds,
      meta,
      channelCtx
    );

    const result = {
      ...video,
      duration_seconds: durationSeconds,
      youtube_category_id: meta.youtube_category_id || null,
      youtube_tags: meta.youtube_tags || [],
      ...tags,
    };

    if (options.includeDebug) result._debug = debug;

    return result;
  });

  if (FEATURE_FLAGS.persistVideos) {
    await persistVideos(enriched);
  }

  return enriched;
}

async function persistVideos(_videos) {
  // No-op stub. See lib/feature-flags.js
}
