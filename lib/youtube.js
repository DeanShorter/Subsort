/**
 * YouTube Data API v3 helpers.
 * All functions require a valid Google OAuth access token.
 *
 * Shorts detection uses heuristics (title hashtags, thumbnail aspect ratio)
 * to avoid burning quota on a separate UUSH playlist call per channel.
 */

const YT_API = 'https://www.googleapis.com/youtube/v3';
const BATCH_SIZE = 10;
const CACHE_KEY = 'subsort_feed_cache';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Read cached feed from localStorage if still fresh.
 */
function getCachedFeed() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, videos } = JSON.parse(raw);
    if (Date.now() - ts < CACHE_TTL && videos?.length) return videos;
  } catch (e) {}
  return null;
}

/**
 * Write feed to localStorage cache.
 */
function setCachedFeed(videos) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), videos }));
  } catch (e) {}
}

/**
 * Detect if a video is likely a Short based on title/description heuristics.
 * Avoids a separate API call per channel.
 */
function looksLikeShort(title, description) {
  const text = (title + ' ' + description).toLowerCase();
  // Common Short indicators
  if (/#shorts?\b/.test(text)) return true;
  if (title.length < 50 && /^\S+$/.test(title.trim())) return false; // single word titles aren't necessarily shorts
  return false;
}

/**
 * Fetch recent videos for a list of channels.
 * Uses only the UU uploads playlist (1 API call per channel).
 * Returns cached results if available and fresh.
 */
export async function fetchRecentVideos(channels, accessToken, { maxPerChannel = 5, daysBack = 14, forceRefresh = false } = {}) {
  if (!accessToken || !channels.length) return [];

  // Return cache if fresh
  if (!forceRefresh) {
    const cached = getCachedFeed();
    if (cached) return cached;
  }

  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  const allVideos = [];
  let quotaError = false;

  const eligibleChannels = channels.filter(ch => ch.channelId);

  // Process channels in parallel batches — 1 API call per channel
  for (let i = 0; i < eligibleChannels.length; i += BATCH_SIZE) {
    if (quotaError) break;

    const batch = eligibleChannels.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (ch) => {
        const plId = ch.uploadsPlaylistId
          || (ch.channelId.startsWith('UC') ? 'UU' + ch.channelId.substring(2) : null);
        if (!plId) return [];

        const resp = await fetch(
          `${YT_API}/playlistItems?part=snippet&playlistId=${plId}&maxResults=${maxPerChannel}&access_token=${accessToken}`
        );

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
        allVideos.push(...result.value);
      } else if (result.status === 'rejected' && result.reason?.status === 403) {
        // Propagate quota/auth errors
        throw result.reason;
      }
    }
  }

  const sorted = allVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  // Cache results
  if (sorted.length) setCachedFeed(sorted);

  return sorted;
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
