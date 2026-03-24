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

    // ── Shorts detection: multiple signals ──────────────────

    // 1. Link href: /shorts/ = 100% certain short
    const linkHref = extractAttributeValue(entry, 'link', 'href') || '';
    const linkIsShort = linkHref.includes('/shorts/');

    // 2. media:content dimensions: height > width = vertical = short
    const contentWidth = parseInt(extractAttributeValue(entry, 'media:content', 'width') || '0');
    const contentHeight = parseInt(extractAttributeValue(entry, 'media:content', 'height') || '0');
    const isVerticalContent = contentWidth > 0 && contentHeight > 0 && contentHeight > contentWidth;

    // 3. Thumbnail dimensions (fallback, less commonly available)
    const thumbWidth = parseInt(extractAttributeValue(entry, 'media:thumbnail', 'width') || '0');
    const thumbHeight = parseInt(extractAttributeValue(entry, 'media:thumbnail', 'height') || '0');
    const isVerticalThumb = thumbWidth > 0 && thumbHeight > 0 && thumbHeight > thumbWidth;

    const isVertical = isVerticalContent || isVerticalThumb;

    // 4. Title/description keywords
    const titleLower = (title || '').toLowerCase();
    const descLower = (description || '').toLowerCase();
    const titleHashtags = (titleLower.match(/#\w+/g) || []);
    const hashCount = titleHashtags.length;

    const hasExplicitShort = titleLower.includes('#shorts') || titleLower.includes('#short')
      || descLower.includes('#shorts') || descLower.includes('#short')
      || /\bshorts?\s*$/.test(titleLower);

    // ── Classification ──────────────────────────────────────
    let videoType;
    if (linkIsShort) {
      videoType = 'short';             // link contains /shorts/ — 100% certain
    } else if (isVertical) {
      videoType = 'short';             // vertical dimensions — definite short
    } else if (hasExplicitShort) {
      videoType = 'short';             // explicit #shorts tag
    } else if (hashCount >= 3) {
      videoType = 'short';             // 3+ hashtags → definite short
    } else if (hashCount === 2) {
      videoType = 'short';             // 2 hashtags → short
    } else if (hashCount === 1) {
      videoType = 'video';             // 1 hashtag = SEO, not a short
    } else {
      videoType = 'video';             // no signals → definite video
    }

    const isShort = videoType === 'short' || videoType === 'suspected_short';

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
        videoType,
      });
    }
  }

  return videos;
}

/** Extract text content between XML tags (handles CDATA) */
/** Decode HTML entities */
function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(n));
}

function extractTag(xml, tag) {
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`);
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return decodeEntities(cdataMatch[1].trim());

  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`);
  const match = xml.match(regex);
  return match ? decodeEntities(match[1].trim()) : '';
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
