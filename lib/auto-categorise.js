/**
 * Auto-categorise channels based on YouTube topic data and keyword matching.
 * Extracted from the SPA's autoCategoriseConfirmed() function.
 */

const TOPIC_MAP = {
  'Music': 'Music', 'Music of Asia': 'Music', 'Music of Latin America': 'Music',
  'Electronic music': 'Music', 'Hip hop music': 'Music', 'Independent music': 'Music',
  'Pop music': 'Music', 'Rock music': 'Music', 'Soul music': 'Music',
  'Christian music': 'Music', 'Classical music': 'Music', 'Country music': 'Music',
  'Jazz': 'Music', 'Rhythm and blues': 'Music', 'Reggae': 'Music',
  'Gaming': 'Gaming', 'Video game culture': 'Gaming', 'Action game': 'Gaming',
  'Action-adventure game': 'Gaming', 'Role-playing video game': 'Gaming',
  'Casual game': 'Gaming', 'Puzzle video game': 'Gaming', 'Strategy video game': 'Gaming',
  'Simulation video game': 'Gaming', 'Sports game': 'Gaming',
  'Massively multiplayer online role-playing game': 'Gaming',
  'Entertainment': 'Entertainment', 'Entertainment (TV)': 'Entertainment',
  'Humor': 'Entertainment', 'Television program': 'Entertainment',
  'Film': 'Film & TV', 'Movies': 'Film & TV', 'Television': 'Film & TV', 'TV shows': 'Film & TV',
  'Performing arts': 'Arts & Performance',
  'Professional wrestling': 'Sports', 'Sport': 'Sports', 'Sports': 'Sports',
  'Association football': 'Sports', 'American football': 'Sports', 'Baseball': 'Sports',
  'Basketball': 'Sports', 'Boxing': 'Sports', 'Cricket': 'Sports', 'Golf': 'Sports',
  'Ice hockey': 'Sports', 'Mixed martial arts': 'Sports', 'Motorsport': 'Sports',
  'Tennis': 'Sports', 'Volleyball': 'Sports',
  'Technology': 'Technology',
  'Science': 'Science & Education', 'Knowledge': 'Science & Education',
  'Lifestyle': 'Lifestyle', 'Lifestyle (sociology)': 'Lifestyle',
  'Health': 'Health & Fitness', 'Fitness': 'Health & Fitness', 'Physical fitness': 'Health & Fitness',
  'Food': 'Food & Cooking', 'Cooking': 'Food & Cooking', 'Cuisine': 'Food & Cooking',
  'Fashion': 'Fashion & Beauty', 'Beauty': 'Fashion & Beauty',
  'Hobby': 'Hobbies & DIY', 'DIY': 'Hobbies & DIY',
  'Vehicles': 'Automotive', 'Automobile': 'Automotive',
  'Tourism': 'Travel', 'Travel': 'Travel',
  'Pet': 'Pets & Animals', 'Pets': 'Pets & Animals', 'Animal': 'Pets & Animals',
  'Politics': 'News & Politics', 'Society': 'News & Politics',
  'Business': 'Business', 'Marketing': 'Business', 'Entrepreneurship': 'Business',
  'Religion': 'Religion & Spirituality', 'Christianity': 'Religion & Spirituality',
  'Islam': 'Religion & Spirituality', 'Buddhism': 'Religion & Spirituality',
  'Animated cartoon': 'Animation', 'Animation': 'Animation', 'Anime': 'Animation', 'Comics': 'Animation',
  "Children's music": 'Kids & Family', "Children's film": 'Kids & Family', 'Family': 'Kids & Family',
  'Military': 'History & Military', 'History': 'History & Military',
};

const KEYWORD_PATTERNS = [
  { pattern: /\b(game|gaming|gamer|playthrough|lets?\s*play|xbox|playstation|nintendo|steam)\b/i, category: 'Gaming' },
  { pattern: /\b(music|song|album|singer|band|rap|hip\s*hop|edm|guitar|piano|dj)\b/i, category: 'Music' },
  { pattern: /\b(tech|software|hardware|programming|code|coding|developer|computer|ai|gadget)\b/i, category: 'Technology' },
  { pattern: /\b(cook|recipe|food|baking|chef|kitchen|meal|eat)\b/i, category: 'Food & Cooking' },
  { pattern: /\b(fitness|workout|gym|exercise|muscle|health|yoga|weight)\b/i, category: 'Health & Fitness' },
  { pattern: /\b(travel|adventure|explore|trip|vacation|destination|backpack)\b/i, category: 'Travel' },
  { pattern: /\b(fashion|beauty|makeup|skincare|style|outfit|clothing)\b/i, category: 'Fashion & Beauty' },
  { pattern: /\b(news|politic|journalist|report|current\s*events|debate)\b/i, category: 'News & Politics' },
  { pattern: /\b(science|physics|chemistry|biology|space|nasa|research|experiment)\b/i, category: 'Science & Education' },
  { pattern: /\b(learn|education|tutorial|teach|course|lesson|study|how\s*to)\b/i, category: 'Science & Education' },
  { pattern: /\b(film|movie|cinema|director|actor|review|trailer)\b/i, category: 'Film & TV' },
  { pattern: /\b(sport|football|soccer|basketball|tennis|cricket|rugby|mma|boxing|f1)\b/i, category: 'Sports' },
  { pattern: /\b(car|auto|vehicle|motor|drive|engine|racing)\b/i, category: 'Automotive' },
  { pattern: /\b(diy|craft|build|woodwork|maker|project|handmade)\b/i, category: 'Hobbies & DIY' },
  { pattern: /\b(anime|manga|otaku|waifu|weeb|vtuber)\b/i, category: 'Animation' },
  { pattern: /\b(business|entrepreneur|startup|invest|finance|money|stock|crypto)\b/i, category: 'Business' },
  { pattern: /\b(comedy|funny|humor|laugh|skit|parody|meme|prank)\b/i, category: 'Entertainment' },
  { pattern: /\b(cat|dog|pet|animal|puppy|kitten|wildlife)\b/i, category: 'Pets & Animals' },
  { pattern: /\b(kid|child|family|parent|baby|toddler)\b/i, category: 'Kids & Family' },
];

/**
 * Determine the best category for a channel based on its topics, name, description, keywords.
 * @param {Object} ch - Channel object with topics, name, description, keywords fields
 * @returns {string|null} Category name or null if no match
 */
export function categoriseChannel(ch) {
  // Step 1: Try topics (most reliable)
  if (ch.topics && ch.topics.length) {
    const categoryCounts = {};
    for (const topic of ch.topics) {
      const mapped = TOPIC_MAP[topic];
      if (mapped) {
        categoryCounts[mapped] = (categoryCounts[mapped] || 0) + 1;
      }
    }
    let maxCount = 0;
    let best = null;
    for (const [cat, count] of Object.entries(categoryCounts)) {
      if (count > maxCount) { maxCount = count; best = cat; }
    }
    if (best) return best;
  }

  // Step 2: Keyword matching on name + description + keywords
  const text = [ch.name, ch.description, ch.keywords].filter(Boolean).join(' ');
  for (const { pattern, category } of KEYWORD_PATTERNS) {
    if (pattern.test(text)) return category;
  }

  return null;
}

/**
 * Auto-categorise all uncategorised channels.
 * @param {Array} channels - Array of channel objects
 * @param {Function} chIsUncategorised - Function to check if channel is uncategorised
 * @returns {{ assignments: Array<{channel: Object, category: string}>, assigned: number, skipped: number }}
 */
export function autoCategoriseAll(channels, chIsUncategorised) {
  const assignments = [];
  const unmatched = [];
  let assigned = 0;
  let skipped = 0;

  for (const ch of channels) {
    if (!chIsUncategorised(ch)) { skipped++; continue; }

    const category = categoriseChannel(ch);
    if (category) {
      assignments.push({ channel: ch, category });
      assigned++;
    } else {
      unmatched.push(ch);
    }
  }

  return { assignments, assigned, skipped, unmatched };
}

/**
 * Persist auto-categorise results to Supabase.
 * Creates missing categories and inserts channel_categories rows.
 * @param {Object} supabase - Supabase client
 * @param {Object} user - Auth user { id }
 * @param {Array} assignments - From autoCategoriseAll
 * @param {Array} dbCategories - Existing DB categories
 * @param {Function} onProgress - Optional (assigned, total) callback
 * @returns {{ categoriesCreated: number, channelsAssigned: number }}
 */
export async function persistAutoSort(supabase, user, assignments, dbCategories, onProgress) {
  if (!assignments.length) return { categoriesCreated: 0, channelsAssigned: 0 };

  // Ensure all needed categories exist
  const neededCats = [...new Set(assignments.map(a => a.category))];
  const existingNames = new Set(dbCategories.map(c => c.name));
  const newCats = neededCats.filter(c => !existingNames.has(c));

  if (newCats.length) {
    for (const name of newCats) {
      await supabase.from('categories').upsert(
        { name, user_id: user.id, sort_order: dbCategories.length },
        { onConflict: 'user_id,name', ignoreDuplicates: true }
      );
    }
  }

  // Re-fetch categories to get IDs
  const { data: allCats } = await supabase.from('categories').select('*');
  const catLookup = {};
  (allCats || []).forEach(c => { catLookup[c.name] = c.id; });

  // Upsert channel_categories in batches (avoids duplicates)
  const inserts = assignments
    .map(a => ({ channel_id: a.channel.id, category_id: catLookup[a.category], user_id: user.id }))
    .filter(row => row.category_id);

  // Deduplicate by channel_id + category_id
  const seen = new Set();
  const unique = inserts.filter(row => {
    const key = `${row.channel_id}_${row.category_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  let assigned = 0;
  for (let i = 0; i < unique.length; i += 100) {
    await supabase.from('channel_categories').upsert(unique.slice(i, i + 100), { onConflict: 'channel_id,category_id', ignoreDuplicates: true });
    assigned = Math.min(i + 100, unique.length);
    onProgress?.(assigned, unique.length);
  }

  return { categoriesCreated: newCats.length, channelsAssigned: inserts.length };
}
