/**
 * YouTube Data API v3 helpers.
 * All functions require a valid Google OAuth access token.
 */

const YT_API = 'https://www.googleapis.com/youtube/v3';

/**
 * Fetch recent videos for a list of channels.
 * Returns an array of video objects sorted by publish date (newest first).
 */
export async function fetchRecentVideos(channels, accessToken, { maxPerChannel = 5, daysBack = 7 } = {}) {
  if (!accessToken || !channels.length) return [];

  const since = new Date();
  since.setDate(since.getDate() - daysBack);
  const sinceISO = since.toISOString();

  const allVideos = [];

  // Batch by upload playlist IDs
  const playlistIds = channels
    .map(ch => ch.uploadsPlaylistId)
    .filter(Boolean);

  for (const plId of playlistIds) {
    try {
      const res = await fetch(
        `${YT_API}/playlistItems?part=snippet&playlistId=${plId}&maxResults=${maxPerChannel}&key=&access_token=${accessToken}`
      );
      if (!res.ok) continue;
      const data = await res.json();
      if (!data.items) continue;

      for (const item of data.items) {
        const pub = item.snippet?.publishedAt;
        if (pub && new Date(pub) < since) continue;

        const ch = channels.find(c => c.uploadsPlaylistId === plId);
        allVideos.push({
          id: item.snippet?.resourceId?.videoId || '',
          title: item.snippet?.title || '',
          channel: ch?.name || item.snippet?.channelTitle || '',
          channelId: ch?.channelId || item.snippet?.channelId || '',
          thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
          publishedAt: pub,
          description: (item.snippet?.description || '').slice(0, 200),
        });
      }
    } catch (e) {
      console.error(`[YouTube] Failed to fetch playlist ${plId}:`, e);
    }
  }

  return allVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
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
