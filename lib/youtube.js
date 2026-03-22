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
    const { ts, videos } = JSON.parse(raw);
    if (Date.now() - ts < LOCAL_CACHE_TTL && videos?.length) return videos;
  } catch (e) {}
  return null;
}

/**
 * Write feed to localStorage cache.
 */
function setLocalCache(videos) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), videos }));
  } catch (e) {}
}

/**
 * Check Supabase for cached videos for the given channel IDs.
 * Returns { cachedVideos, uncachedChannelIds }
 */
async function getServerCache(channelIds, since) {
  try {
    const cutoff = new Date(Date.now() - SERVER_CACHE_TTL).toISOString();
    const allData = [];

    // Batch queries — Supabase .in() has URL length limits with large arrays
    const QUERY_BATCH = 50;
    for (let i = 0; i < channelIds.length; i += QUERY_BATCH) {
      const batch = channelIds.slice(i, i + QUERY_BATCH);
      const { data, error } = await supabase
        .from('cached_videos')
        .select('*')
        .in('channel_id', batch)
        .gte('fetched_at', cutoff)
        .gte('published_at', since.toISOString());

      if (!error && data) allData.push(...data);
    }

    if (!allData.length) return { cachedVideos: [], uncachedChannelIds: channelIds };

    const cachedChannels = new Set(allData.map(v => v.channel_id));
    const uncachedChannelIds = channelIds.filter(id => !cachedChannels.has(id));

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
 * Store fetched videos in Supabase cache. Fire-and-forget.
 */
function setServerCache(videos) {
  if (!videos.length) return;

  const rows = videos.map(v => ({
    channel_id: v.channelId,
    video_id: v.id,
    title: v.title,
    thumbnail: v.thumbnail,
    published_at: v.publishedAt,
    video_type: v.type || 'video',
    fetched_at: new Date().toISOString(),
  }));

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
export async function fetchRecentVideos(channels, accessToken, { maxPerChannel = 5, daysBack = 7, forceRefresh = false } = {}) {
  if (!accessToken || !channels.length) return [];

  // Layer 1: in-memory cache
  if (!forceRefresh && _memCache.videos.length && Date.now() - _memCache.ts < LOCAL_CACHE_TTL) {
    return _memCache.videos;
  }

  // Layer 2: localStorage cache
  if (!forceRefresh) {
    const local = getLocalCache();
    if (local) {
      _memCache = { ts: Date.now(), videos: local };
      return local;
    }
  }

  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  const eligibleChannels = channels.filter(ch => ch.channelId);
  const channelMap = {};
  eligibleChannels.forEach(ch => { channelMap[ch.channelId] = ch; });

  // Layer 3: server cache — get what we can from Supabase
  const allChannelIds = eligibleChannels.map(ch => ch.channelId);
  const { cachedVideos, uncachedChannelIds } = await getServerCache(allChannelIds, since);

  // Fill in channel names from our local data
  cachedVideos.forEach(v => {
    const ch = channelMap[v.channelId];
    if (ch) v.channel = ch.name || '';
  });

  // Fetch uncached channels from YouTube API
  const freshVideos = [];
  let quotaError = false;

  const uncachedChannels = uncachedChannelIds.map(id => channelMap[id]).filter(Boolean);

  for (let i = 0; i < uncachedChannels.length; i += BATCH_SIZE) {
    if (quotaError) break;

    const batch = uncachedChannels.slice(i, i + BATCH_SIZE);
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

  // Store fresh videos in server cache
  if (freshVideos.length) {
    setServerCache(freshVideos);
  }

  // Combine cached + fresh
  const allVideos = [...cachedVideos, ...freshVideos]
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  // Update local caches
  if (allVideos.length) {
    setLocalCache(allVideos);
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
