/**
 * YouTube Data API v3 helpers.
 * All functions require a valid Google OAuth access token.
 */

const YT_API = 'https://www.googleapis.com/youtube/v3';
const BATCH_SIZE = 10; // concurrent requests per batch

/**
 * Fetch recent videos for a list of channels.
 * Returns an array of video objects sorted by publish date (newest first).
 */
export async function fetchRecentVideos(channels, accessToken, { maxPerChannel = 5, daysBack = 7 } = {}) {
  if (!accessToken || !channels.length) return [];

  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  const playlistIds = channels
    .map(ch => ch.uploadsPlaylistId)
    .filter(Boolean);

  const allVideos = [];

  // Fetch in parallel batches
  for (let i = 0; i < playlistIds.length; i += BATCH_SIZE) {
    const batch = playlistIds.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (plId) => {
        const res = await fetch(
          `${YT_API}/playlistItems?part=snippet&playlistId=${plId}&maxResults=${maxPerChannel}&access_token=${accessToken}`
        );
        if (!res.ok) return [];
        const data = await res.json();
        if (!data.items) return [];

        const ch = channels.find(c => c.uploadsPlaylistId === plId);
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
          }));
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        allVideos.push(...result.value);
      }
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
