/**
 * YouTube Data API v3 helpers.
 * All functions require a valid Google OAuth access token.
 *
 * Playlist ID prefixes (derived from channel ID by replacing "UC" prefix):
 *   UU   — All uploads
 *   UUSH — Short videos only (used for detection, not as a video source)
 */

const YT_API = 'https://www.googleapis.com/youtube/v3';
const BATCH_SIZE = 10;

/**
 * Fetch recent videos for a list of channels.
 * For each channel, fetches the UU uploads playlist for videos, and the
 * UUSH playlist to detect which of those are Shorts. Tags each video
 * with type: 'video' or 'short'.
 */
export async function fetchRecentVideos(channels, accessToken, { maxPerChannel = 5, daysBack = 7 } = {}) {
  if (!accessToken || !channels.length) return [];

  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  const allVideos = [];

  const eligibleChannels = channels.filter(ch => ch.uploadsPlaylistId && ch.channelId);

  // Process channels in parallel batches
  for (let i = 0; i < eligibleChannels.length; i += BATCH_SIZE) {
    const batch = eligibleChannels.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (ch) => {
        const plId = ch.uploadsPlaylistId;

        // Build UUSH playlist ID to detect shorts
        const uushId = ch.channelId.startsWith('UC')
          ? 'UUSH' + ch.channelId.substring(2)
          : null;

        // Fetch uploads + shorts IDs in parallel
        const [uploadsResp, shortsResp] = await Promise.all([
          fetch(`${YT_API}/playlistItems?part=snippet&playlistId=${plId}&maxResults=${maxPerChannel}&access_token=${accessToken}`),
          uushId
            ? fetch(`${YT_API}/playlistItems?part=snippet&playlistId=${uushId}&maxResults=50&access_token=${accessToken}`)
            : Promise.resolve(null),
        ]);

        // Build set of short video IDs
        const shortIds = new Set();
        if (shortsResp?.ok) {
          const shortsData = await shortsResp.json();
          (shortsData.items || []).forEach(item => {
            const vid = item.snippet?.resourceId?.videoId;
            if (vid) shortIds.add(vid);
          });
        }

        if (!uploadsResp.ok) return [];
        const data = await uploadsResp.json();
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
            const isShort = shortIds.has(videoId) || /#shorts?\b/i.test(title + ' ' + desc);

            return {
              id: videoId,
              title,
              channel: ch.name || item.snippet?.channelTitle || '',
              channelId: ch.channelId || item.snippet?.channelId || '',
              thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
              publishedAt: item.snippet?.publishedAt,
              description: desc.split('\n')[0].substring(0, 120),
              type: isShort ? 'short' : 'video',
            };
          });
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
