/**
 * YouTube Data API v3 helpers.
 * All functions require a valid Google OAuth access token.
 *
 * Playlist ID prefixes (derived from channel ID by replacing "UC" prefix):
 *   UU   — All uploads
 *   UUSH — Short videos only
 *   UULF — Long-form videos only
 *   UULV — Live streams
 *   UULP — Popular videos
 */

const YT_API = 'https://www.googleapis.com/youtube/v3';
const BATCH_SIZE = 10;

/**
 * Derive a typed playlist ID from a channel's uploads playlist.
 * uploadsPlaylistId starts with "UU" — swap prefix for the desired type.
 */
function toPlaylistId(uploadsPlId, prefix) {
  if (!uploadsPlId || !uploadsPlId.startsWith('UU')) return null;
  return prefix + uploadsPlId.slice(2);
}

/**
 * Fetch a single playlist page and return parsed video objects.
 */
async function fetchPlaylist(plId, accessToken, channels, since, type, max) {
  const res = await fetch(
    `${YT_API}/playlistItems?part=snippet&playlistId=${plId}&maxResults=${max}&access_token=${accessToken}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  if (!data.items) return [];

  // Find the channel that owns this playlist
  const ch = channels.find(c =>
    c.uploadsPlaylistId === plId ||
    toPlaylistId(c.uploadsPlaylistId, 'UUSH') === plId ||
    toPlaylistId(c.uploadsPlaylistId, 'UULF') === plId
  );

  return data.items
    .filter(item => {
      const pub = item.snippet?.publishedAt;
      return pub && new Date(pub) >= since;
    })
    .map(item => ({
      id: item.snippet?.resourceId?.videoId || '',
      title: item.snippet?.title || '',
      channel: ch?.name || item.snippet?.channelTitle || '',
      channelId: ch?.channelId || item.snippet?.channelId || '',
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
      publishedAt: item.snippet?.publishedAt,
      description: (item.snippet?.description || '').slice(0, 200),
      type,
    }));
}

/**
 * Fetch recent videos for a list of channels.
 * Fetches both regular uploads (UU) and shorts (UUSH) playlists,
 * tags each video with type: 'video' or 'short'.
 * Returns an array sorted by publish date (newest first).
 */
export async function fetchRecentVideos(channels, accessToken, { maxPerChannel = 5, daysBack = 7 } = {}) {
  if (!accessToken || !channels.length) return [];

  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  // Build fetch jobs: each channel gets a videos fetch + a shorts fetch
  const jobs = [];
  for (const ch of channels) {
    const plId = ch.uploadsPlaylistId;
    if (!plId) continue;

    const shortsPlId = toPlaylistId(plId, 'UUSH');

    jobs.push({ plId, type: 'video' });
    if (shortsPlId) jobs.push({ plId: shortsPlId, type: 'short' });
  }

  const allVideos = [];

  // Fetch in parallel batches
  for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
    const batch = jobs.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(job => fetchPlaylist(job.plId, accessToken, channels, since, job.type, maxPerChannel))
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        allVideos.push(...result.value);
      }
    }
  }

  // Deduplicate — a video from UU uploads may also appear in UUSH shorts
  const seen = new Set();
  const deduped = [];
  for (const v of allVideos) {
    if (!seen.has(v.id)) {
      seen.add(v.id);
      // If a video appears in both, prefer the 'short' tag
      deduped.push(v);
    } else {
      // Update type to 'short' if we see it in the shorts playlist
      if (v.type === 'short') {
        const existing = deduped.find(d => d.id === v.id);
        if (existing) existing.type = 'short';
      }
    }
  }

  return deduped.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
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
