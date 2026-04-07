/**
 * Multi-signal video tagging system.
 * Combines 5 signal sources with confidence scoring to produce
 * content_tags (high confidence) and inferred_tags (low confidence).
 *
 * Pure functions — no database access.
 */

// ── ISO 8601 duration parser ──

export function parseDuration(isoDuration) {
  if (!isoDuration) return 0;
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] || '0', 10) * 3600) +
         (parseInt(match[2] || '0', 10) * 60) +
         (parseInt(match[3] || '0', 10));
}

// ── Length buckets ──

export function getLengthBucket(durationSeconds) {
  if (!durationSeconds || durationSeconds <= 0) return 'medium';
  if (durationSeconds < 60) return 'short';
  if (durationSeconds < 600) return 'quick';
  if (durationSeconds < 1800) return 'medium';
  if (durationSeconds < 3600) return 'long';
  return 'extended';
}

// ── Signal weights & thresholds ──

const WEIGHTS = {
  channel_subcategory: 3,
  channel_category: 2,
  youtube_category: 1,
  youtube_tags: 2,
  regex_strict: 3,
};

const HIGH_CONFIDENCE = 4;
const MEDIUM_CONFIDENCE = 2;

// ══════════════════════════════════════════════════════════════
// Signal 1: Subscrub subcategory → content tags
// ══════════════════════════════════════════════════════════════

const SUBCATEGORY_TO_TAGS = {
  'Comedy & Sketch': ['comedy'],
  'Reality & Challenges': ['comedy', 'reaction'],
  'Variety & Stunts': ['comedy'],
  'Podcasts & Talk Shows': ['podcast', 'discussion'],
  'Commentary & Opinion': ['discussion'],
  'Animation': [],
  'Production': ['music', 'tutorial'],
  'Performance': ['music'],
  'Reviews & Reactions': ['music', 'review'],
  'Music Videos': ['music'],
  'Theory & Education': ['music', 'tutorial'],
  'DJs & Electronic': ['music'],
  'Football': ['sport'],
  'Combat Sports': ['sport'],
  'American Sports': ['sport'],
  'Motorsport': ['sport'],
  'Analysis & Tactics': ['sport', 'discussion'],
  'Extreme & Outdoor': ['sport'],
  "Let's Play & Walkthroughs": ['gaming'],
  'Esports & Competitive': ['gaming', 'sport'],
  'Speedrunning': ['gaming'],
  'Game Development': ['gaming', 'tutorial'],
  'Retro & Nostalgia': ['gaming'],
  'World News': ['news'],
  'Political Commentary': ['news', 'discussion'],
  'Investigative & Documentary': ['news', 'documentary'],
  'Business & Economics': ['news', 'discussion'],
  'Programming & Dev': ['tutorial'],
  'Gadgets & Reviews': ['review'],
  'AI & Data Science': ['tutorial', 'discussion'],
  'Cybersecurity & Privacy': ['tutorial'],
  'Self-Hosted & Linux': ['tutorial'],
  'Productivity & Tools': ['tutorial'],
  'Physics & Space': ['documentary', 'tutorial'],
  'Biology & Nature': ['documentary'],
  'History & Archaeology': ['documentary'],
  'Mathematics': ['tutorial'],
  'Psychology & Philosophy': ['discussion', 'tutorial'],
  'General Explainers': ['tutorial'],
  'Food & Cooking': ['tutorial'],
  'Travel & Adventure': ['vlog'],
  'Fashion & Style': ['vlog', 'review'],
  'Home & Interior': ['vlog', 'tutorial'],
  'Relationships & Self-Help': ['discussion'],
  'ASMR': [],
};

function getTagsFromSubcategory(name) {
  if (!name) return [];
  return SUBCATEGORY_TO_TAGS[name] || [];
}

// ══════════════════════════════════════════════════════════════
// Signal 2: Subscrub category → content tags
// ══════════════════════════════════════════════════════════════

const CATEGORY_TO_TAGS = {
  'Entertainment': [],
  'Music': ['music'],
  'Sports': ['sport'],
  'News & Politics': ['news'],
  'Gaming': ['gaming'],
  'Technology': [],
  'Science & Education': ['documentary'],
  'Lifestyle': ['vlog'],
  'Food': ['tutorial'],
};

function getTagsFromCategory(name) {
  if (!name) return [];
  return CATEGORY_TO_TAGS[name] || [];
}

// ══════════════════════════════════════════════════════════════
// Signal 3: YouTube category_id → content tags
// ══════════════════════════════════════════════════════════════

const YT_CATEGORY_TO_TAGS = {
  1: [],               // Film & Animation
  2: [],               // Autos & Vehicles
  10: ['music'],       // Music
  15: [],              // Pets & Animals
  17: ['sport'],       // Sports
  19: ['vlog'],        // Travel & Events
  20: ['gaming'],      // Gaming
  22: ['vlog'],        // People & Blogs
  23: ['comedy'],      // Comedy
  24: [],              // Entertainment (dumping ground)
  25: ['news'],        // News & Politics
  26: ['tutorial'],    // Howto & Style
  27: ['tutorial'],    // Education
  28: ['tutorial', 'documentary'], // Science & Technology
  29: ['documentary'], // Nonprofits & Activism
};

function getTagsFromYouTubeCategory(categoryId) {
  if (!categoryId) return [];
  return YT_CATEGORY_TO_TAGS[Number(categoryId)] || [];
}

// ══════════════════════════════════════════════════════════════
// Signal 4: YouTube snippet.tags → content tags
// ══════════════════════════════════════════════════════════════

const YT_TAG_KEYWORDS = [
  { keyword: 'podcast', tag: 'podcast' },
  { keyword: 'comedy', tag: 'comedy' },
  { keyword: 'sketch', tag: 'comedy' },
  { keyword: 'stand up', tag: 'comedy' },
  { keyword: 'standup', tag: 'comedy' },
  { keyword: 'music', tag: 'music' },
  { keyword: 'song', tag: 'music' },
  { keyword: 'album', tag: 'music' },
  { keyword: 'cover', tag: 'music' },
  { keyword: 'tutorial', tag: 'tutorial' },
  { keyword: 'how to', tag: 'tutorial' },
  { keyword: 'guide', tag: 'tutorial' },
  { keyword: 'review', tag: 'review' },
  { keyword: 'unboxing', tag: 'review' },
  { keyword: 'vs', tag: 'review' },
  { keyword: 'gaming', tag: 'gaming' },
  { keyword: 'gameplay', tag: 'gaming' },
  { keyword: 'walkthrough', tag: 'gaming' },
  { keyword: 'football', tag: 'sport' },
  { keyword: 'soccer', tag: 'sport' },
  { keyword: 'basketball', tag: 'sport' },
  { keyword: 'f1', tag: 'sport' },
  { keyword: 'formula 1', tag: 'sport' },
  { keyword: 'nba', tag: 'sport' },
  { keyword: 'nfl', tag: 'sport' },
  { keyword: 'news', tag: 'news' },
  { keyword: 'politics', tag: 'news' },
  { keyword: 'breaking', tag: 'news' },
  { keyword: 'documentary', tag: 'documentary' },
  { keyword: 'vlog', tag: 'vlog' },
  { keyword: 'daily vlog', tag: 'vlog' },
  { keyword: 'reaction', tag: 'reaction' },
  { keyword: 'react', tag: 'reaction' },
  { keyword: 'interview', tag: 'discussion' },
  { keyword: 'discussion', tag: 'discussion' },
  { keyword: 'debate', tag: 'discussion' },
];

function getTagsFromYouTubeTags(ytTags) {
  if (!ytTags?.length) return [];
  const found = new Set();
  for (const ytTag of ytTags) {
    const norm = ytTag.toLowerCase();
    for (const { keyword, tag } of YT_TAG_KEYWORDS) {
      if (norm.includes(keyword)) found.add(tag);
    }
  }
  return [...found];
}

// ══════════════════════════════════════════════════════════════
// Signal 5: Strict regex (title + first 200 chars of description)
// ══════════════════════════════════════════════════════════════

const STRICT_REGEX_RULES = [
  { tag: 'music', patterns: [/\bofficial music video\b/i, /\bofficial audio\b/i, /\blyric video\b/i, /\bmusic video\b/i] },
  { tag: 'tutorial', patterns: [/\bhow to \w+/i, /\bstep by step\b/i, /\btutorial\b/i, /\bcrash course\b/i] },
  { tag: 'podcast', patterns: [/\bep\.?\s*#?\d+\b/i, /\bepisode \d+\b/i, /#\d+\b/, /\bpodcast\b/i] },
  { tag: 'comedy', patterns: [/#funny\b/i, /#comedy\b/i, /\bstand[\- ]?up comedy\b/i, /\bcomedy special\b/i] },
  { tag: 'news', patterns: [/\bbreaking news\b/i, /\btoday's (news|headlines)\b/i, /\bheadlines for\b/i] },
  { tag: 'documentary', patterns: [/\bdocumentary\b/i, /\bfull documentary\b/i, /\bthe rise and fall of\b/i] },
  { tag: 'reaction', patterns: [/\bfirst time (hearing|watching|seeing)\b/i, /\breacting to\b/i, /\bmy reaction to\b/i] },
];

function extractStrictRegexTags(title, description) {
  const text = `${title || ''} ${(description || '').slice(0, 200)}`;
  const tags = [];
  for (const rule of STRICT_REGEX_RULES) {
    if (rule.patterns.some(p => p.test(text))) tags.push(rule.tag);
  }
  return tags;
}

// ══════════════════════════════════════════════════════════════
// Personal override detection
// ══════════════════════════════════════════════════════════════

const PERSONAL_PATTERNS = [
  /\ban update (on|about) my\b/i,
  /\bhealth update\b/i,
  /\bi'?m sorry\b/i,
  /\bmy apology\b/i,
  /\bimportant announcement\b/i,
  /\bwhat (really )?happened\b/i,
  /\bin memory of\b/i,
  /\brip\s+\w+\b/i,
  /\bgoodbye\b/i,
  /\bthe end of (my|our)\b/i,
  /\bi need to (talk|tell)\b/i,
  /\blosing (my|our) \w+\b/i,
];

function isPersonalVideo(title) {
  return PERSONAL_PATTERNS.some(p => p.test(title || ''));
}

// ══════════════════════════════════════════════════════════════
// Energy
// ══════════════════════════════════════════════════════════════

export function getEnergy(lengthBucket, contentTags) {
  const tags = contentTags || [];
  if ((lengthBucket === 'short' || lengthBucket === 'quick') &&
      (tags.includes('news') || tags.includes('comedy'))) return 'quick';
  if (tags.includes('sport') || tags.includes('gaming')) return 'high';
  if ((lengthBucket === 'long' || lengthBucket === 'extended') &&
      (tags.includes('podcast') || tags.includes('documentary') || tags.includes('discussion'))) return 'chill';
  return 'neutral';
}

// ══════════════════════════════════════════════════════════════
// Format
// ══════════════════════════════════════════════════════════════

export function getFormat(title, videoType, durationSeconds) {
  if (videoType === 'short' || (durationSeconds && durationSeconds < 60 && /#shorts?/i.test(title || ''))) return 'short';
  if (videoType === 'live') return 'live';
  if (videoType === 'premiere' || videoType === 'upcoming') return 'premiere';
  return 'standard';
}

// ══════════════════════════════════════════════════════════════
// Main entry point — multi-signal scoring
// ══════════════════════════════════════════════════════════════

/**
 * Generate tags using multi-signal confidence scoring.
 *
 * @param {object} video - { title, description, videoType }
 * @param {number} durationSeconds
 * @param {{ youtube_category_id, youtube_tags }} meta - YouTube API metadata
 * @param {{ category_name, subcategory_name }|null} channelContext - Subscrub channel info
 * @returns {{ tags: { length_bucket, content_tags, inferred_tags, energy, format }, debug: object }}
 */
export function generateTags(video, durationSeconds, meta, channelContext) {
  const lengthBucket = getLengthBucket(durationSeconds);
  const format = getFormat(video.title, video.videoType, durationSeconds);

  // Score accumulator
  const scores = {};
  const signals = [];

  function addVotes(tags, source, weight) {
    for (const tag of tags) {
      scores[tag] = (scores[tag] || 0) + weight;
      signals.push({ source, tag, weight });
    }
  }

  // Signal 1: Subscrub subcategory (weight 3)
  if (channelContext?.subcategory_name) {
    addVotes(getTagsFromSubcategory(channelContext.subcategory_name), 'channel_subcategory', WEIGHTS.channel_subcategory);
  }

  // Signal 2: Subscrub category (weight 2)
  if (channelContext?.category_name) {
    addVotes(getTagsFromCategory(channelContext.category_name), 'channel_category', WEIGHTS.channel_category);
  }

  // Signal 3: YouTube category_id (weight 1)
  if (meta?.youtube_category_id) {
    addVotes(getTagsFromYouTubeCategory(meta.youtube_category_id), 'youtube_category', WEIGHTS.youtube_category);
  }

  // Signal 4: YouTube snippet.tags (weight 2)
  if (meta?.youtube_tags?.length) {
    addVotes(getTagsFromYouTubeTags(meta.youtube_tags), 'youtube_tags', WEIGHTS.youtube_tags);
  }

  // Signal 5: Strict regex (weight 3)
  addVotes(extractStrictRegexTags(video.title, video.description), 'regex_strict', WEIGHTS.regex_strict);

  // Apply thresholds
  let content_tags = [];
  let inferred_tags = [];

  for (const [tag, score] of Object.entries(scores)) {
    if (score >= HIGH_CONFIDENCE) content_tags.push(tag);
    else if (score >= MEDIUM_CONFIDENCE) inferred_tags.push(tag);
  }

  // Personal override
  const personal_override = isPersonalVideo(video.title);
  if (personal_override) {
    inferred_tags = [...inferred_tags, ...content_tags];
    content_tags = ['personal'];
  }

  const energy = getEnergy(lengthBucket, content_tags);

  return {
    tags: { length_bucket: lengthBucket, content_tags, inferred_tags, energy, format },
    debug: { signals, scores, personal_override, final_content_tags: content_tags, final_inferred_tags: inferred_tags },
  };
}
