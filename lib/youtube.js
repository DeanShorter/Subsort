/**
 * YouTube Data API v3 helpers.
 * All functions require a valid Google OAuth access token.
 *
 * Caching strategy (3 layers):
 * 1. In-memory (instant, lost on page reload)
 * 2. localStorage (survives reload, per-browser)
 * 3. Supabase cached_videos table (shared across users, 1hr TTL)
 *
 * Shorts detection uses heuristics (title hashtags) to avoid
 * burning quota on a separate UUSH playlist call per channel.
 */

import { trackApiUsage } from './api-usage';
import { supabase } from './supabase';

const YT_API = 'https://www.googleapis.com/youtube/v3';
const BATCH_SIZE = 10;
const CACHE_KEY = 'subsort_feed_cache';
const LOCAL_CACHE_TTL = 30 * 60 * 1000; // 30 min localStorage
const SERVER_CACHE_TTL = 60 * 60 * 1000; // 1 hour server-side

// In-memory cache (survives navigations within same session)
let _memCache = { ts: 0, videos: [] };

/**
 * Read cached feed from localStorage if still fresh.
 */
function getLocalCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, videos, complete } = JSON.parse(raw);
    // Only trust the local cache if it was from a complete fetch
    if (complete && Date.now() - ts < LOCAL_CACHE_TTL && videos?.length) return videos;
  } catch (e) {}
  return null;
}

/**
 * Write feed to localStorage cache.
 * @param {boolean} complete — true if this was a full fetch (no quota errors)
 */
function setLocalCache(videos, complete = true) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), videos, complete }));
  } catch (e) {}
}

/**
 * Check Supabase for cached videos for the given channel IDs.
 * Uses a two-part check:
 * 1. Get videos from cache for channels fetched within TTL
 * 2. Check which channels were recently checked (even if they had no videos)
 *    by looking for a sentinel row with video_id = '__checked__'
 * Returns { cachedVideos, uncachedChannelIds }
 */
async function getServerCache(channelIds, since) {
  try {
    const cutoff = new Date(Date.now() - SERVER_CACHE_TTL).toISOString();
    const allData = [];
    const checkedChannels = new Set();

    const QUERY_BATCH = 50;
    for (let i = 0; i < channelIds.length; i += QUERY_BATCH) {
      const batch = channelIds.slice(i, i + QUERY_BATCH);

      // Get all cached rows (videos + sentinel rows) for these channels
      const { data, error } = await supabase
        .from('cached_videos')
        .select('*')
        .in('channel_id', batch)
        .gte('fetched_at', cutoff);

      if (!error && data) {
        data.forEach(row => {
          if (row.video_id.startsWith('__checked__')) {
            // Sentinel: this channel was checked but may have had no recent videos
            checkedChannels.add(row.channel_id);
          } else if (row.published_at && new Date(row.published_at) >= since) {
            allData.push(row);
            checkedChannels.add(row.channel_id);
          }
        });
      }
    }

    const uncachedChannelIds = channelIds.filter(id => !checkedChannels.has(id));

    const cachedVideos = allData.map(row => ({
      id: row.video_id,
      title: row.title || '',
      channel: '',  // filled in by caller
      channelId: row.channel_id,
      thumbnail: row.thumbnail || '',
      publishedAt: row.published_at,
      description: '',
      type: row.video_type || 'video',
      _fromCache: true,
    }));

    return { cachedVideos, uncachedChannelIds };
  } catch (e) {
    return { cachedVideos: [], uncachedChannelIds: channelIds };
  }
}

/**
 * Store fetched videos in Supabase cache, plus sentinel rows for
 * channels that were checked but had no recent videos.
 * Fire-and-forget.
 */
function setServerCache(videos, fetchedChannelIds = []) {
  const now = new Date().toISOString();

  const rows = videos.map(v => ({
    channel_id: v.channelId,
    video_id: v.id,
    title: v.title,
    thumbnail: v.thumbnail,
    published_at: v.publishedAt,
    video_type: v.type || 'video',
    fetched_at: now,
  }));

  // Add sentinel rows for channels that were fetched but had no videos
  const channelsWithVideos = new Set(videos.map(v => v.channelId));
  for (const chId of fetchedChannelIds) {
    if (!channelsWithVideos.has(chId)) {
      rows.push({
        channel_id: chId,
        video_id: `__checked__${chId}`,
        title: null,
        thumbnail: null,
        published_at: null,
        video_type: 'sentinel',
        fetched_at: now,
      });
    }
  }

  if (!rows.length) return;

  // Upsert in batches to handle large inserts
  const UPSERT_BATCH = 50;
  for (let i = 0; i < rows.length; i += UPSERT_BATCH) {
    const batch = rows.slice(i, i + UPSERT_BATCH);
    supabase
      .from('cached_videos')
      .upsert(batch, { onConflict: 'video_id' })
      .then(() => {});
  }
}

/**
 * Detect if a video is likely a Short based on title/description heuristics.
 */
function looksLikeShort(title, description) {
  const text = (title + ' ' + description).toLowerCase();
  if (/#shorts?\b/.test(text)) return true;
  return false;
}

/**
 * Fetch recent videos for a list of channels.
 * Checks server cache first, only hits YouTube API for uncached channels.
 */
export async function fetchRecentVideos(channels, accessToken, { maxPerChannel = 10, daysBack = 30, forceRefresh = false } = {}) {
  if (!accessToken || !channels.length) return [];

  console.log(`[YT] fetchRecentVideos called — channels: ${channels.length}, token: ${!!accessToken}, forceRefresh: ${forceRefresh}`);

  // Layer 1: in-memory cache
  if (!forceRefresh && _memCache.videos.length && Date.now() - _memCache.ts < LOCAL_CACHE_TTL) {
    console.log(`[YT] Returning in-memory cache (${_memCache.videos.length} videos)`);
    return _memCache.videos;
  }

  // Layer 2: localStorage cache
  if (!forceRefresh) {
    const local = getLocalCache();
    if (local) {
      console.log(`[YT] Returning localStorage cache (${local.length} videos)`);
      _memCache = { ts: Date.now(), videos: local };
      return local;
    }
  }

  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  const eligibleChannels = channels.filter(ch => ch.channelId);
  const channelMap = {};
  eligibleChannels.forEach(ch => { channelMap[ch.channelId] = ch; });

  console.log(`[YT] Total channels: ${channels.length}, eligible (have channelId): ${eligibleChannels.length}`);

  // Layer 3: server cache — get what we can from Supabase
  const allChannelIds = eligibleChannels.map(ch => ch.channelId);
  const { cachedVideos, uncachedChannelIds } = await getServerCache(allChannelIds, since);

  console.log(`[YT] Server cache: ${cachedVideos.length} videos cached, ${uncachedChannelIds.length} channels need fetching`);

  // Fill in channel names from our local data
  cachedVideos.forEach(v => {
    const ch = channelMap[v.channelId];
    if (ch) v.channel = ch.name || '';
  });

  // Fetch uncached channels from YouTube API
  const freshVideos = [];
  const fetchedChannelIds = []; // Track all channels we attempted to fetch
  let quotaError = false;

  const uncachedChannels = uncachedChannelIds.map(id => channelMap[id]).filter(Boolean);

  for (let i = 0; i < uncachedChannels.length; i += BATCH_SIZE) {
    if (quotaError) break;

    const batch = uncachedChannels.slice(i, i + BATCH_SIZE);
    // Record that we're checking these channels
    batch.forEach(ch => fetchedChannelIds.push(ch.channelId));

    const results = await Promise.allSettled(
      batch.map(async (ch) => {
        const plId = ch.uploadsPlaylistId
          || (ch.channelId.startsWith('UC') ? 'UU' + ch.channelId.substring(2) : null);
        if (!plId) return [];

        const resp = await fetch(
          `${YT_API}/playlistItems?part=snippet&playlistId=${plId}&maxResults=${maxPerChannel}&access_token=${accessToken}`
        );
        trackApiUsage('playlistItems.list');

        if (!resp.ok) {
          if (resp.status === 403) {
            const body = await resp.json().catch(() => ({}));
            const reason = body?.error?.errors?.[0]?.reason;
            const err = new Error(reason === 'quotaExceeded' ? 'YouTube quota exceeded' : 'YouTube API forbidden');
            err.status = 403;
            err.reason = reason;
            quotaError = true;
            throw err;
          }
          return [];
        }

        const data = await resp.json();
        if (!data.items) return [];

        return data.items
          .filter(item => {
            const pub = item.snippet?.publishedAt;
            return pub && new Date(pub) >= since;
          })
          .map(item => {
            const videoId = item.snippet?.resourceId?.videoId || '';
            const title = item.snippet?.title || '';
            const desc = (item.snippet?.description || '').slice(0, 300);

            return {
              id: videoId,
              title,
              channel: ch.name || item.snippet?.channelTitle || '',
              channelId: ch.channelId || item.snippet?.channelId || '',
              thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
              publishedAt: item.snippet?.publishedAt,
              description: desc.split('\n')[0].substring(0, 120),
              type: looksLikeShort(title, desc) ? 'short' : 'video',
            };
          });
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        freshVideos.push(...result.value);
      } else if (result.status === 'rejected' && result.reason?.status === 403) {
        throw result.reason;
      }
    }
  }

  // Store fresh videos + sentinel rows for empty channels in server cache
  if (freshVideos.length || fetchedChannelIds.length) {
    setServerCache(freshVideos, fetchedChannelIds);
  }

  console.log(`[YT] Fresh from API: ${freshVideos.length} videos, quota error: ${quotaError}, channels fetched: ${fetchedChannelIds.length}`);

  // Combine cached + fresh
  const allVideos = [...cachedVideos, ...freshVideos]
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  console.log(`[YT] Total result: ${allVideos.length} videos`);

  // Update local caches — only mark as "complete" if no quota error
  const fetchComplete = !quotaError;
  if (allVideos.length) {
    setLocalCache(allVideos, fetchComplete);
    _memCache = { ts: Date.now(), videos: allVideos };
  }

  return allVideos;
}

/**
 * Format a relative time string (e.g. "2 days ago").
 */
export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
