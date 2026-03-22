/**
 * YouTube subscription sync.
 * Fetches all subscriptions + channel details from the YouTube API,
 * then upserts to Supabase.
 */
import { supabase } from './supabase';
import { trackApiUsage } from './api-usage';

const YT_API = 'https://www.googleapis.com/youtube/v3';

/**
 * Sync all YouTube subscriptions.
 * @param {string} accessToken - Google OAuth token
 * @param {string} userId - Supabase user ID
 * @param {Array} existingChannels - Current channels from context
 * @param {(label, detail, pct) => void} onProgress - Progress callback
 * @returns {{ channels: Array, newCount: number }} - Updated channels list
 */
export async function syncYouTubeSubscriptions(accessToken, userId, existingChannels, onProgress = () => {}) {
  if (!accessToken) throw new Error('No YouTube access token');

  const channels = [...existingChannels];
  let nextPage = '';
  let newCount = 0;
  let totalFetched = 0;

  // Phase 1: Get all subscriptions
  onProgress('Fetching subscriptions…', 'Loading your channel list', 10);

  do {
    const url = `${YT_API}/subscriptions?part=snippet&mine=true&maxResults=50${nextPage ? '&pageToken=' + nextPage : ''}`;
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    trackApiUsage('subscriptions.list');

    if (resp.status === 401) {
      throw new Error('SESSION_EXPIRED');
    }

    const data = await resp.json();
    if (data.error) {
      throw new Error(data.error.message || 'YouTube API error');
    }
    if (!data.items || !data.items.length) break;

    for (const item of data.items) {
      const s = item.snippet;
      const chId = s.resourceId.channelId;
      let existing = channels.find(c => c.channelId === chId);
      if (!existing) {
        existing = {
          id: null, channelId: chId, name: s.title,
          channelUrl: `https://www.youtube.com/channel/${chId}`,
          thumbnail: '', thumbnailHigh: '', bannerUrl: '',
          subscriberCount: 0, videoCount: 0, viewCount: 0,
          subscribedAt: s.publishedAt || '',
          channelCreatedAt: '', uploadsPlaylistId: '',
          description: s.description || '',
          topics: [], keywords: '', country: '',
          customUrl: '', notes: '', favourited: false,
          categories: [], subcategory: '',
        };
        channels.push(existing);
        newCount++;
      }
      existing.name = s.title;
      existing.description = s.description || existing.description || '';
      existing.thumbnail = s.thumbnails?.medium?.url || s.thumbnails?.default?.url || existing.thumbnail;
    }

    totalFetched += data.items.length;
    const pageInfo = data.pageInfo?.totalResults || totalFetched;
    const pct = Math.min(45, Math.round((totalFetched / Math.max(pageInfo, 1)) * 45));
    onProgress('Fetching subscriptions…', `${totalFetched} channels loaded`, 10 + pct);
    nextPage = data.nextPageToken || '';
  } while (nextPage);

  // Phase 2: Fetch channel details in batches of 50
  const idsToFetch = channels.map(c => c.channelId).filter(Boolean);
  const totalBatches = Math.ceil(idsToFetch.length / 50);

  onProgress('Loading channel details…', `Fetching stats for ${idsToFetch.length} channels`, 55);

  for (let i = 0; i < idsToFetch.length; i += 50) {
    const batch = idsToFetch.slice(i, i + 50).join(',');
    const batchNum = Math.floor(i / 50) + 1;
    const url = `${YT_API}/channels?part=snippet,statistics,brandingSettings,topicDetails,contentDetails&id=${batch}`;
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    trackApiUsage('channels.list');
    const data = await resp.json();

    if (data.items) {
      for (const item of data.items) {
        const ch = channels.find(c => c.channelId === item.id);
        if (!ch) continue;
        ch.subscriberCount = parseInt(item.statistics?.subscriberCount || '0');
        ch.videoCount = parseInt(item.statistics?.videoCount || '0');
        ch.viewCount = parseInt(item.statistics?.viewCount || '0');
        ch.bannerUrl = item.brandingSettings?.image?.bannerExternalUrl || '';
        ch.country = item.brandingSettings?.channel?.country || item.snippet?.country || '';
        ch.keywords = item.brandingSettings?.channel?.keywords || '';
        ch.customUrl = item.snippet?.customUrl || '';
        ch.thumbnail = item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || ch.thumbnail || '';
        ch.thumbnailHigh = item.snippet?.thumbnails?.high?.url || '';
        ch.description = item.snippet?.description || ch.description || '';
        const topicUrls = item.topicDetails?.topicCategories || [];
        ch.topics = topicUrls.map(url => decodeURIComponent(url.split('/wiki/')[1] || '').replace(/_/g, ' '));
        ch.uploadsPlaylistId = item.contentDetails?.relatedPlaylists?.uploads || '';
        ch.channelCreatedAt = item.snippet?.publishedAt || '';
      }
    }

    const pct = 55 + Math.round((batchNum / totalBatches) * 40);
    onProgress('Loading channel details…', `Batch ${batchNum} of ${totalBatches}`, Math.min(pct, 95));
  }

  // Phase 3: Save to Supabase
  onProgress('Saving to database…', `${channels.length} channels`, 96);

  const rows = channels.map(ch => ({
    user_id: userId,
    channel_id: ch.channelId,
    name: ch.name,
    custom_url: ch.customUrl || '',
    thumbnail: ch.thumbnail || '',
    thumbnail_high: ch.thumbnailHigh || '',
    banner_url: ch.bannerUrl || '',
    description: ch.description || '',
    subscriber_count: ch.subscriberCount || 0,
    video_count: ch.videoCount || 0,
    view_count: ch.viewCount || 0,
    subscribed_at: ch.subscribedAt || null,
    channel_created_at: ch.channelCreatedAt || null,
    uploads_playlist_id: ch.uploadsPlaylistId || '',
    topics: ch.topics || [],
    keywords: ch.keywords || '',
    country: ch.country || '',
    notes: ch.notes || '',
    favourited: ch.favourited || false,
  }));

  const CHUNK = 100;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await supabase.from('channels').upsert(
      rows.slice(i, i + CHUNK),
      { onConflict: 'user_id,channel_id' }
    );
    if (error) console.error('Bulk save error:', error);
  }

  onProgress('Done!', `${newCount} new channels added (${channels.length} total)`, 100);

  // Store sync timestamp
  localStorage.setItem('subsort_sync_ts', Date.now().toString());
  // Clear feed cache since channel data changed
  localStorage.removeItem('subsort_feed_cache');

  return { channels, newCount };
}
