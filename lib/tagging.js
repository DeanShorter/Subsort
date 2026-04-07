/**
 * Video tagging system — pure functions that generate content tags,
 * length buckets, energy, and format from video metadata + duration.
 * Foundation for the vibe filter system.
 *
 * These functions never touch the database. They take data in, return tags out.
 */

// ── Length buckets ──

export function getLengthBucket(durationSeconds) {
  if (!durationSeconds || durationSeconds <= 0) return 'medium'; // fallback
  if (durationSeconds < 60) return 'short';
  if (durationSeconds < 600) return 'quick';
  if (durationSeconds < 1800) return 'medium';
  if (durationSeconds < 3600) return 'long';
  return 'extended';
}

// ── ISO 8601 duration parser (PT5M30S → 330) ──

export function parseDuration(isoDuration) {
  if (!isoDuration) return 0;
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (parseInt(match[1] || '0', 10) * 3600) +
         (parseInt(match[2] || '0', 10) * 60) +
         (parseInt(match[3] || '0', 10));
}

// ── Content tag extraction ──

const TAG_RULES = [
  {
    tag: 'news',
    patterns: [/\bnews\b/i, /\bheadlines?\b/i, /\btoday's\b/i, /\bbreaking\b/i, /\bupdate on\b/i, /\bthis week in\b/i, /\bwhat happened\b/i, /\bbriefing\b/i],
  },
  {
    tag: 'comedy',
    patterns: [/\bfunny\b/i, /\bjoke\b/i, /\bcomedy\b/i, /\bsketch\b/i, /\bi tried\b/i, /\bchallenge\b/i, /\bprank\b/i, /\bhilarious\b/i],
  },
  {
    tag: 'music',
    patterns: [/\bsong\b/i, /\btrack\b/i, /\bcover\b/i, /\blive performance\b/i, /\bofficial (music )?video\b/i, /\blyric video\b/i, /\bofficial audio\b/i, /\bremix\b/i],
  },
  {
    tag: 'tutorial',
    patterns: [/\bhow to\b/i, /\btutorial\b/i, /\bguide\b/i, /\blearn\b/i, /\bstep by step\b/i, /\bexplained\b/i, /\bbeginner\b/i, /\bcrash course\b/i],
  },
  {
    tag: 'review',
    patterns: [/\breview\b/i, /\btested\b/i, /\b(vs|versus)\b/i, /\bcomparison\b/i, /\bfirst impressions\b/i, /\bis it worth\b/i, /\bunboxing\b/i],
  },
  {
    tag: 'vlog',
    patterns: [/\bvlog\b/i, /\bday in the life\b/i, /\bmy week\b/i, /\bbehind the scenes\b/i, /\bdiary\b/i, /\bhaul\b/i],
  },
  {
    tag: 'gaming',
    patterns: [/\bplaythrough\b/i, /\blet's play\b/i, /\bgameplay\b/i, /\bspeedrun\b/i, /\bminecraft\b/i, /\bfortnite\b/i, /\belden ring\b/i, /\bgta\b/i],
  },
  {
    tag: 'podcast',
    patterns: [/\bpodcast\b/i, /\bepisode\b/i, /\bep\.\s*\d+\b/i, /\binterview with\b/i, /\bin conversation\b/i, /\btalks to\b/i, /\bsits down with\b/i],
  },
  {
    tag: 'reaction',
    patterns: [/\breacting to\b/i, /\breaction\b/i, /\bi react\b/i, /\bfirst time hearing\b/i, /\bfirst time watching\b/i],
  },
  {
    tag: 'sport',
    patterns: [/\bhighlights\b/i, /\bchampions league\b/i, /\bpremier league\b/i, /\bnba\b/i, /\bnfl\b/i, /\bf1\b/i, /\btraining session\b/i, /\bworkout\b/i],
  },
  {
    tag: 'documentary',
    patterns: [/\bdocumentary\b/i, /\bthe story of\b/i, /\bthe truth about\b/i, /\binvestigated\b/i, /\brevealed\b/i, /\bthe rise of\b/i, /\bthe fall of\b/i],
  },
  {
    tag: 'discussion',
    patterns: [/\btalking about\b/i, /\blet's discuss\b/i, /\bthoughts on\b/i, /\bdebate\b/i, /\baddressing\b/i, /\bopinion\b/i],
  },
  {
    tag: 'personal',
    patterns: [/\bi need to talk\b/i, /\bi'm sorry\b/i, /\bimportant announcement\b/i, /\bwhat really happened\b/i, /\bin memory of\b/i, /\brip\b/i, /\bhealth update\b/i],
  },
];

export function extractContentTags(title, description) {
  const text = `${title || ''} ${(description || '').slice(0, 200)}`;
  const tags = [];
  for (const rule of TAG_RULES) {
    if (rule.patterns.some(p => p.test(text))) {
      tags.push(rule.tag);
    }
  }
  return tags;
}

// ── Energy ──

export function getEnergy(lengthBucket, contentTags) {
  const tags = contentTags || [];

  if ((lengthBucket === 'short' || lengthBucket === 'quick') &&
      (tags.includes('news') || tags.includes('reaction') || tags.includes('comedy'))) {
    return 'quick';
  }

  if (tags.includes('sport') || tags.includes('gaming') ||
      (tags.includes('reaction') && lengthBucket !== 'short')) {
    return 'high';
  }

  if ((lengthBucket === 'long' || lengthBucket === 'extended') &&
      (tags.includes('podcast') || tags.includes('documentary') ||
       tags.includes('discussion') || tags.includes('tutorial'))) {
    return 'chill';
  }

  return 'neutral';
}

// ── Format ──

export function getFormat(title, videoType, durationSeconds) {
  if (videoType === 'short' || (durationSeconds && durationSeconds < 60 && /#shorts?/i.test(title || ''))) {
    return 'short';
  }
  if (videoType === 'live') return 'live';
  if (videoType === 'premiere' || videoType === 'upcoming') return 'premiere';
  return 'standard';
}

// ── Main entry point (pure function) ──

/**
 * Generate all tags for a video.
 * @param {object} video - { title, description, videoType }
 * @param {number} durationSeconds - video duration in seconds
 * @returns {{ length_bucket, content_tags, energy, format }}
 */
export function generateTags(video, durationSeconds) {
  const lengthBucket = getLengthBucket(durationSeconds);
  const contentTags = extractContentTags(video.title, video.description);
  const format = getFormat(video.title, video.videoType, durationSeconds);
  const energy = getEnergy(lengthBucket, contentTags);

  return {
    length_bucket: lengthBucket,
    content_tags: contentTags,
    energy,
    format,
  };
}
