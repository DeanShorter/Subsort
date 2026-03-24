/**
 * RSS feed fetching and parsing for YouTube channels.
 * No API key required — free and unlimited.
 * YouTube RSS returns the most recent 15 videos per channel.
 */

/**
 * Fetch and parse a single YouTube channel's RSS feed.
 * @param {string} channelId - YouTube channel ID
 * @returns {Promise<Array>} Array of video objects
 */
export async function fetchChannelRSS(channelId) {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`[RSS] Fetch failed for ${channelId}: ${response.status}`);
      return [];
    }

    const xml = await response.text();
    return parseRSSXml(xml);
  } catch (error) {
    console.error(`[RSS] Fetch error for ${channelId}:`, error);
    return [];
  }
}

/**
 * Parse YouTube RSS XML (Atom format) into structured video objects.
 */
function parseRSSXml(xml) {
  const videos = [];
  const entries = xml.split('<entry>').slice(1);

  for (const entry of entries) {
    const videoId = extractTag(entry, 'yt:videoId');
    const title = extractTag(entry, 'title');
    const channelId = extractTag(entry, 'yt:channelId');
    const channelName = extractAttribute(entry, 'author', 'name');
    const publishedAt = extractTag(entry, 'published');
    const updatedAt = extractTag(entry, 'updated');
    const description = extractTag(entry, 'media:description');

    const thumbnail = extractAttributeValue(entry, 'media:thumbnail', 'url')
      || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;

    // Extract thumbnail dimensions to detect vertical (shorts) aspect ratio
    const thumbWidth = parseInt(extractAttributeValue(entry, 'media:thumbnail', 'width') || '0');
    const thumbHeight = parseInt(extractAttributeValue(entry, 'media:thumbnail', 'height') || '0');
    const isVertical = thumbWidth > 0 && thumbHeight > 0 && thumbHeight > thumbWidth;

    // Detect shorts: title/description keywords or vertical thumbnail
    const titleLower = (title || '').toLowerCase();
    const descLower = (description || '').toLowerCase();
    const isShort = isVertical
      || titleLower.includes('#shorts')
      || titleLower.includes('#short')
      || titleLower.endsWith('| shorts')
      || titleLower.endsWith('- shorts')
      || titleLower.endsWith('(shorts)')
      || /\bshorts?\s*$/.test(titleLower)
      || descLower.includes('#shorts')
      || descLower.includes('#short');

    if (videoId && title) {
      videos.push({
        videoId,
        title,
        channelId: channelId || '',
        channelName: channelName || '',
        publishedAt: publishedAt || '',
        updatedAt: updatedAt || '',
        thumbnail,
        description: description || '',
        isShort,
      });
    }
  }

  return videos;
}

/** Extract text content between XML tags (handles CDATA) */
function extractTag(xml, tag) {
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`);
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`);
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

/** Extract a nested tag within a parent tag */
function extractAttribute(xml, parentTag, childTag) {
  const parentRegex = new RegExp(`<${parentTag}[^>]*>([\\s\\S]*?)</${parentTag}>`);
  const parentMatch = xml.match(parentRegex);
  if (!parentMatch) return '';
  return extractTag(parentMatch[1], childTag);
}

/** Extract an attribute value from a tag */
function extractAttributeValue(xml, tag, attr) {
  const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"[^>]*/?>`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : '';
}

/**
 * Fetch RSS feeds for multiple channels in parallel batches.
 * @param {string[]} channelIds - Array of YouTube channel IDs
 * @param {number} batchSize - Channels per batch (default 20)
 * @param {number} delayMs - Delay between batches in ms (default 500)
 * @returns {Promise<Map<string, Array>>} Map of channelId → videos
 */
export async function fetchMultipleChannelRSS(channelIds, batchSize = 20, delayMs = 500) {
  const results = new Map();

  for (let i = 0; i < channelIds.length; i += batchSize) {
    const batch = channelIds.slice(i, i + batchSize);

    const batchResults = await Promise.allSettled(
      batch.map(async (channelId) => {
        const videos = await fetchChannelRSS(channelId);
        return { channelId, videos };
      })
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.set(result.value.channelId, result.value.videos);
      }
    }

    // Delay between batches to be respectful
    if (i + batchSize < channelIds.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
