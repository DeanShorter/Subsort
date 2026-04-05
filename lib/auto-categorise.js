/**
 * Auto-categorise channels based on the Subsnub Auto-Sort Spec.
 * Uses YouTube topic IDs, Wikipedia topic URLs, and keyword matching.
 */

// ── STEP 1: Topic ID → Category (Freebase IDs, weighted x2) ──
const TOPIC_TO_CATEGORY = {
  '/m/04rlf': 'Music', '/m/02mscn': 'Music', '/m/0ggq0m': 'Music', '/m/01lyv': 'Music',
  '/m/02lkt': 'Music', '/m/0glt670': 'Music', '/m/05rwpb': 'Music', '/m/03_d0': 'Music',
  '/m/028sqc': 'Music', '/m/0g293': 'Music', '/m/064t9': 'Music', '/m/06cqb': 'Music',
  '/m/06j6l': 'Music', '/m/06by7': 'Music', '/m/0gywn': 'Music',

  '/m/0bzvm2': 'Gaming', '/m/025zzc': 'Gaming', '/m/02ntfj': 'Gaming', '/m/0b1vjn': 'Gaming',
  '/m/02hygl': 'Gaming', '/m/04q1x3q': 'Gaming', '/m/01sjng': 'Gaming', '/m/0403l3g': 'Gaming',
  '/m/021bp2': 'Gaming', '/m/022dc6': 'Gaming', '/m/03hf_rm': 'Gaming',

  '/m/06ntj': 'Sports', '/m/0jm_': 'Sports', '/m/018jz': 'Sports', '/m/018w8': 'Sports',
  '/m/01cgz': 'Sports', '/m/09xp_': 'Sports', '/m/02vx4': 'Sports', '/m/037hz': 'Sports',
  '/m/03tmr': 'Sports', '/m/01h7lh': 'Sports', '/m/0410tth': 'Sports', '/m/07bs0': 'Sports',
  '/m/07_53': 'Sports', '/m/02jjt': 'Sports',

  '/m/09kqc': 'Entertainment', '/m/02vxn': 'Entertainment', '/m/05qjc': 'Entertainment',
  '/m/066wd': 'Entertainment', '/m/0f2f9': 'Entertainment',

  '/m/019_rr': 'Lifestyle', '/m/032tl': 'Lifestyle', '/m/027x7n': 'Lifestyle',
  '/m/02wbm': 'Lifestyle', '/m/03glg': 'Lifestyle', '/m/068hy': 'Lifestyle',
  '/m/041xxh': 'Lifestyle', '/m/07bxq': 'Lifestyle', '/m/01k8wb': 'Lifestyle',

  '/m/07c1v': 'Technology',

  '/m/098wr': 'Science & Education',

  '/m/09s1f': 'News & Politics', '/m/0kt51': 'News & Politics', '/m/01h6rj': 'News & Politics',
  '/m/05qt0': 'News & Politics', '/m/06bvp': 'News & Politics',
};

// ── Wikipedia URL → Category ──
const WIKI_TO_CATEGORY = {
  'Music': 'Music', 'Electronic music': 'Music', 'Hip hop music': 'Music', 'Rock music': 'Music',
  'Pop music': 'Music', 'Independent music': 'Music', 'Country music': 'Music', 'Soul music': 'Music',
  'Jazz': 'Music', 'Classical music': 'Music', 'Rhythm and blues': 'Music', 'Reggae': 'Music',

  'Video game culture': 'Gaming', 'Action game': 'Gaming', 'Role-playing video game': 'Gaming',
  'Strategy video game': 'Gaming',

  'Sport': 'Sports', 'Association football': 'Sports', 'Basketball': 'Sports', 'Tennis': 'Sports',
  'Cricket': 'Sports', 'Mixed martial arts': 'Sports', 'Boxing': 'Sports', 'Golf': 'Sports',
  'Motorsport': 'Sports', 'American football': 'Sports', 'Baseball': 'Sports', 'Ice hockey': 'Sports',
  'Professional wrestling': 'Sports',

  'Entertainment': 'Entertainment', 'Humor': 'Entertainment', 'Television program': 'Entertainment',
  'Performing arts': 'Entertainment',

  'Film': 'Film & TV',

  'Lifestyle (sociology)': 'Lifestyle', 'Fashion': 'Lifestyle', 'Food': 'Lifestyle',
  'Cooking': 'Lifestyle', 'Pet': 'Lifestyle', 'Tourism': 'Lifestyle', 'Hobby': 'Lifestyle',
  'Religion': 'Lifestyle',

  'Physical fitness': 'Fitness & Health', 'Health': 'Fitness & Health',

  'Technology': 'Technology',
  'Vehicle': 'Automotive',
  'Knowledge': 'Science & Education',
  'Society': 'News & Politics', 'Business': 'Finance & Business',
  'Military': 'News & Politics', 'Politics': 'News & Politics',
};

// ── Category priority for tie-breaking ──
const CATEGORY_PRIORITY = [
  'Music', 'Gaming', 'Sports', 'Entertainment', 'Technology',
  'Science & Education', 'Film & TV', 'Lifestyle', 'Fitness & Health',
  'News & Politics', 'Finance & Business', 'Art & Creative',
  'Automotive', 'Education & How-To',
];

// ── STEP 2: Subcategory Keywords ──
const SUBCATEGORY_KEYWORDS = {
  'Music': {
    'Production': ['producer', 'production', 'mixing', 'mastering', 'daw', 'ableton', 'logic pro', 'fl studio', 'pro tools', 'plugin', 'plugins', 'vst', 'synth', 'synthesis', 'eq', 'compression', 'reverb', 'recording', 'studio', 'beatmaking', 'beat making', 'sample', 'samples', 'sampling'],
    'Performance': ['cover', 'covers', 'live performance', 'acoustic', 'session', 'musician', 'perform', 'performer', 'band', 'orchestra', 'recital', 'concert', 'busking', 'jam'],
    'Reviews & Reactions': ['album review', 'reaction', 'react', 'music review', 'track review', 'first listen', 'listening party', 'music opinion', 'ranking', 'tier list'],
    'Music Videos': ['official video', 'official audio', 'music video', 'vevo', 'record label', 'official channel', 'lyrics video'],
    'Theory & Education': ['music theory', 'theory', 'ear training', 'composition', 'harmony', 'chord', 'chords', 'scale', 'scales', 'interval', 'intervals', 'melody', 'arrangement', 'songwriting', 'song writing'],
    'DJs & Electronic': ['dj', 'disc jockey', 'turntable', 'edm', 'techno', 'house music', 'drum and bass', 'dubstep', 'trance', 'remix', 'set', 'live set', 'club'],
  },
  'Gaming': {
    "Let's Play & Walkthroughs": ["let's play", 'lets play', 'playthrough', 'play through', 'walkthrough', 'walk through', 'gameplay', 'game play', 'blind playthrough', 'first playthrough', 'commentary', 'longplay'],
    'Esports & Competitive': ['esports', 'esport', 'competitive', 'ranked', 'tournament', 'pro player', 'league', 'championship', 'elo', 'mmr', 'grandmaster', 'predator', 'champion'],
    'Reviews & News': ['game review', 'review', 'preview', 'first impressions', 'gaming news', 'game news', 'release date', 'announcement', 'trailer reaction', 'industry'],
    'Speedrunning': ['speedrun', 'speed run', 'speedrunning', 'world record', 'any%', '100%', 'glitchless', 'wr', 'personal best', 'pb'],
    'Game Development': ['game dev', 'gamedev', 'indie dev', 'unity', 'unreal engine', 'godot', 'devlog', 'dev log', 'game design', 'level design', 'pixel art'],
    'Retro & Nostalgia': ['retro', 'retro gaming', 'classic', 'nostalgia', 'vintage', 'old school', 'emulation', 'emulator', 'snes', 'nes', 'ps1', 'ps2', 'n64', 'dreamcast', 'gameboy'],
  },
  'Entertainment': {
    'Comedy & Sketch': ['comedy', 'comedian', 'standup', 'stand-up', 'stand up', 'sketch', 'skit', 'funny', 'humor', 'humour', 'parody', 'satire', 'improv', 'roast'],
    'Commentary & Opinion': ['commentary', 'video essay', 'opinion', 'analysis', 'deep dive', 'explained', 'hot take', 'cultural', 'critique', 'editorial', 'think piece'],
    'Reality & Challenges': ['challenge', 'prank', 'social experiment', 'dare', 'extreme', 'stunt', 'reality', 'vlog', 'daily vlog'],
    'Animation': ['animation', 'animated', 'animator', 'cartoon', 'motion graphics', '2d animation', '3d animation', 'anime', 'manga'],
    'Podcasts & Talk Shows': ['podcast', 'talk show', 'interview', 'conversation', 'episode', 'ep.', 'guest', 'host', 'panel', 'roundtable', 'discussion'],
    'Variety & Stunts': ['stunt', 'spectacle', 'elaborate', 'massive', 'extreme', 'team', 'crew', 'event'],
  },
  'Technology': {
    'Programming & Dev': ['programming', 'coding', 'code', 'developer', 'software', 'javascript', 'python', 'typescript', 'react', 'node', 'api', 'github', 'tutorial', 'web dev', 'web development', 'frontend', 'backend', 'full stack', 'fullstack'],
    'Gadgets & Reviews': ['review', 'unboxing', 'hands on', 'hands-on', 'comparison', 'versus', 'vs', 'best', 'top', 'smartphone', 'laptop', 'tablet', 'gadget', 'device', 'specs'],
    'AI & Data Science': ['ai', 'artificial intelligence', 'machine learning', 'deep learning', 'neural network', 'gpt', 'llm', 'data science', 'data engineering', 'nlp', 'computer vision', 'model', 'training'],
    'Cybersecurity & Privacy': ['cybersecurity', 'cyber security', 'hacking', 'ethical hacking', 'security', 'privacy', 'vpn', 'encryption', 'penetration testing', 'pentest', 'bug bounty', 'infosec'],
    'Self-Hosted & Linux': ['linux', 'ubuntu', 'arch', 'debian', 'homelab', 'home lab', 'self-hosted', 'selfhosted', 'docker', 'kubernetes', 'open source', 'server', 'nas', 'raspberry pi'],
    'Productivity & Tools': ['productivity', 'workflow', 'notion', 'obsidian', 'tools', 'apps', 'automation', 'efficiency', 'organization', 'setup', 'desk setup'],
  },
  'Science & Education': {
    'Physics & Space': ['physics', 'quantum', 'space', 'nasa', 'astronomy', 'astrophysics', 'cosmos', 'universe', 'planet', 'rocket', 'spacex', 'orbital', 'relativity', 'particle'],
    'Biology & Nature': ['biology', 'nature', 'wildlife', 'animal', 'animals', 'ecology', 'evolution', 'marine', 'ocean', 'plant', 'botany', 'zoology', 'documentary'],
    'History & Archaeology': ['history', 'historical', 'ancient', 'archaeology', 'civilization', 'war', 'battle', 'empire', 'medieval', 'century', 'era', 'period', 'artifact'],
    'Mathematics': ['math', 'maths', 'mathematics', 'equation', 'theorem', 'calculus', 'algebra', 'geometry', 'statistics', 'probability', 'proof', 'number theory'],
    'Psychology & Philosophy': ['psychology', 'philosophy', 'mind', 'consciousness', 'cognitive', 'behavior', 'behaviour', 'ethics', 'morality', 'existential', 'stoic', 'stoicism', 'mental model'],
    'General Explainers': ['explained', 'explainer', 'how does', 'what is', 'why do', 'science', 'educational', 'learn', 'knowledge', 'curious', 'fascinating'],
  },
  'Sports': {
    'Football': ['football', 'soccer', 'premier league', 'epl', 'la liga', 'champions league', 'world cup', 'fifa', 'goal', 'match', 'transfer', 'manager', 'tactics'],
    'Combat Sports': ['boxing', 'mma', 'ufc', 'fight', 'fighter', 'martial arts', 'kickboxing', 'wrestling', 'knockout', 'ko', 'bout', 'ring', 'octagon', 'bellator'],
    'American Sports': ['nfl', 'nba', 'mlb', 'nhl', 'touchdown', 'quarterback', 'slam dunk', 'home run', 'super bowl', 'playoffs', 'draft', 'franchise'],
    'Motorsport': ['f1', 'formula 1', 'formula one', 'motorsport', 'racing', 'nascar', 'rally', 'motogp', 'indycar', 'le mans', 'lap', 'circuit', 'driver', 'constructor'],
    'Analysis & Tactics': ['analysis', 'tactical', 'tactics', 'breakdown', 'film study', 'scout', 'scouting', 'stats', 'statistics', 'xg', 'expected goals', 'advanced metrics'],
    'Extreme & Outdoor': ['skateboarding', 'surfing', 'climbing', 'snowboarding', 'skiing', 'bmx', 'parkour', 'adventure', 'extreme sport', 'outdoor'],
  },
  'News & Politics': {
    'World News': ['news', 'breaking', 'current affairs', 'world news', 'global', 'report', 'update', 'headline', 'developing'],
    'Political Commentary': ['politics', 'political', 'democrat', 'republican', 'conservative', 'liberal', 'left', 'right', 'policy', 'election', 'vote', 'debate', 'government'],
    'Investigative & Documentary': ['investigation', 'investigative', 'documentary', 'expose', 'in-depth', 'report', 'journalist', 'journalism', 'undercover'],
    'Business & Economics': ['economy', 'economic', 'gdp', 'inflation', 'market', 'trade', 'tariff', 'supply chain', 'recession', 'growth'],
  },
  'Lifestyle': {
    'Food & Cooking': ['recipe', 'recipes', 'cooking', 'cook', 'chef', 'kitchen', 'baking', 'bake', 'meal prep', 'food', 'cuisine', 'restaurant', 'ingredient', 'ingredients'],
    'Travel & Adventure': ['travel', 'travelling', 'traveling', 'trip', 'adventure', 'destination', 'explore', 'backpack', 'nomad', 'tourist', 'hotel', 'flight', 'country'],
    'Fashion & Style': ['fashion', 'style', 'outfit', 'ootd', 'haul', 'try on', 'clothing', 'wardrobe', 'trend', 'designer', 'streetwear'],
    'Home & Interior': ['home', 'interior', 'renovation', 'decor', 'decorating', 'furniture', 'room tour', 'house tour', 'apartment', 'makeover', 'diy home'],
    'Relationships & Self-Help': ['relationship', 'dating', 'self-help', 'self help', 'motivation', 'motivational', 'personal development', 'growth mindset', 'confidence', 'habits', 'mindset'],
    'ASMR': ['asmr', 'tingles', 'relaxation', 'whisper', 'tapping', 'triggers', 'sleep', 'calming', 'soothing'],
  },
  'Finance & Business': {
    'Personal Finance': ['budget', 'budgeting', 'saving', 'savings', 'debt', 'credit', 'credit card', 'money', 'frugal', 'financial', 'personal finance', 'emergency fund'],
    'Investing': ['invest', 'investing', 'stock', 'stocks', 'crypto', 'cryptocurrency', 'bitcoin', 'ethereum', 'portfolio', 'dividend', 'index fund', 'etf', 'real estate investing'],
    'Entrepreneurship': ['entrepreneur', 'startup', 'start-up', 'business', 'side hustle', 'founder', 'launch', 'company', 'revenue', 'profit', 'saas', 'ecommerce'],
    'Career & Professional': ['career', 'job', 'interview', 'resume', 'cv', 'salary', 'negotiation', 'promotion', 'workplace', 'professional', 'linkedin'],
  },
  'Film & TV': {
    'Reviews & Analysis': ['movie review', 'film review', 'series review', 'film analysis', 'cinema', 'cinematography', 'director', 'screenplay', 'plot', 'film essay'],
    'Behind the Scenes': ['behind the scenes', 'bts', 'filmmaking', 'film making', 'vfx', 'visual effects', 'cgi', 'practical effects', 'set design', 'post-production'],
    'Trailers & News': ['trailer', 'teaser', 'upcoming', 'release', 'casting', 'announcement', 'sequel', 'franchise', 'box office'],
    'Fan Content': ['fan theory', 'theory', 'fan edit', 'ranking', 'top 10', 'worst', 'best', 'tier list', 'retrospective', 'rewatch'],
  },
  'Fitness & Health': {
    'Workouts & Training': ['workout', 'exercise', 'training', 'hiit', 'strength', 'cardio', 'yoga', 'pilates', 'calisthenics', 'gym', 'fitness', 'reps', 'sets'],
    'Nutrition & Diet': ['nutrition', 'diet', 'macro', 'macros', 'protein', 'calories', 'meal plan', 'supplement', 'supplements', 'keto', 'vegan', 'vegetarian', 'healthy eating'],
    'Mental Health & Wellness': ['mental health', 'meditation', 'mindfulness', 'anxiety', 'depression', 'therapy', 'therapist', 'wellbeing', 'well-being', 'self care', 'self-care', 'stress'],
    'Sports Performance': ['athletic', 'athlete', 'performance', 'recovery', 'injury', 'rehab', 'mobility', 'flexibility', 'sports science', 'conditioning'],
  },
  'Art & Creative': {
    'Visual Art': ['drawing', 'painting', 'illustration', 'digital art', 'sketch', 'watercolor', 'watercolour', 'oil painting', 'acrylic', 'portrait', 'canvas', 'art tutorial'],
    'Photography & Videography': ['photography', 'photo', 'camera', 'lens', 'lightroom', 'photoshop', 'videography', 'cinematography', 'drone', 'timelapse', 'composition'],
    'Design': ['design', 'graphic design', 'ui', 'ux', 'ui/ux', 'typography', 'branding', 'logo', 'figma', 'adobe', 'illustrator', 'creative'],
    'Crafts & DIY': ['craft', 'crafts', 'diy', 'woodworking', '3d printing', 'maker', 'build', 'project', 'handmade', 'sewing', 'knitting', 'electronics'],
  },
  'Automotive': {
    'Car Reviews': ['car review', 'test drive', 'first drive', 'comparison', 'sedan', 'suv', 'electric car', 'ev', 'hybrid', 'horsepower'],
    'Modifications & Builds': ['mod', 'modification', 'build', 'project car', 'tuning', 'restoration', 'restore', 'engine swap', 'turbo', 'supercharger', 'custom'],
    'Motorsport': ['racing', 'track day', 'lap time', 'circuit', 'formula', 'rally', 'endurance', 'drag race', 'drift', 'drifting'],
    'Motorcycles': ['motorcycle', 'motorbike', 'bike', 'riding', 'rider', 'superbike', 'cruiser', 'adventure bike', 'helmet'],
  },
  'Education & How-To': {
    'Language Learning': ['language', 'learn', 'spanish', 'french', 'german', 'japanese', 'korean', 'mandarin', 'chinese', 'polyglot', 'vocabulary', 'grammar', 'fluent', 'immersion'],
    'Academic Lectures': ['lecture', 'professor', 'university', 'academic', 'course', 'curriculum', 'thesis', 'research', 'study', 'seminar'],
    'Professional Skills': ['excel', 'spreadsheet', 'presentation', 'public speaking', 'writing', 'project management', 'agile', 'scrum', 'leadership', 'management'],
    'Life Skills': ['how to', 'diy', 'fix', 'repair', 'maintenance', 'tutorial', 'guide', 'step by step', 'beginner', 'tips', 'hack', 'hacks'],
  },
};

// ── Whole-word match helper ──
function wholeWordMatch(keyword, text) {
  // Escape regex special chars in keyword
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
}

// ── Build text corpus from channel data ──
function buildTextCorpus(ch) {
  return [ch.name, ch.description, ch.keywords].filter(Boolean).join(' ').toLowerCase();
}

// ── STEP 1: Assign top-level category ──
function assignCategory(ch) {
  const categoryCounts = {};

  // Freebase topic IDs (weighted x2)
  const topicIds = ch.topicIds || [];
  for (const id of topicIds) {
    const mapped = TOPIC_TO_CATEGORY[id];
    if (mapped) categoryCounts[mapped] = (categoryCounts[mapped] || 0) + 2;
  }

  // Wikipedia topic URLs / decoded topic names
  const topics = ch.topics || [];
  for (const topic of topics) {
    const mapped = WIKI_TO_CATEGORY[topic];
    if (mapped) categoryCounts[mapped] = (categoryCounts[mapped] || 0) + 1;
  }

  // Also try raw URLs if available
  const topicUrls = ch.topicUrls || [];
  for (const url of topicUrls) {
    for (const [wikiKey, cat] of Object.entries(WIKI_TO_CATEGORY)) {
      if (url.includes(wikiKey.replace(/ /g, '_'))) {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        break;
      }
    }
  }

  if (Object.keys(categoryCounts).length > 0) {
    // Find max score, break ties using priority
    const maxScore = Math.max(...Object.values(categoryCounts));
    const tied = Object.entries(categoryCounts).filter(([, v]) => v === maxScore).map(([k]) => k);
    if (tied.length === 1) return tied[0];
    // Break tie using priority order
    for (const cat of CATEGORY_PRIORITY) {
      if (tied.includes(cat)) return cat;
    }
    return tied[0];
  }

  return null;
}

// ── STEP 2: Keyword fallback for category ──
function keywordMatchCategory(textCorpus) {
  const categoryCounts = {};
  for (const [category, subcategories] of Object.entries(SUBCATEGORY_KEYWORDS)) {
    let totalScore = 0;
    for (const [, keywordList] of Object.entries(subcategories)) {
      for (const keyword of keywordList) {
        if (wholeWordMatch(keyword, textCorpus)) totalScore++;
      }
    }
    if (totalScore >= 3) categoryCounts[category] = totalScore;
  }

  if (Object.keys(categoryCounts).length > 0) {
    const maxScore = Math.max(...Object.values(categoryCounts));
    const tied = Object.entries(categoryCounts).filter(([, v]) => v === maxScore).map(([k]) => k);
    for (const cat of CATEGORY_PRIORITY) {
      if (tied.includes(cat)) return cat;
    }
    return tied[0];
  }
  return null;
}

// ── STEP 3: Subcategory assignment ──
function assignSubcategory(category, textCorpus) {
  const keywords = SUBCATEGORY_KEYWORDS[category];
  if (!keywords) return null;

  const scores = {};
  for (const [subcategory, keywordList] of Object.entries(keywords)) {
    let score = 0;
    for (const keyword of keywordList) {
      if (wholeWordMatch(keyword, textCorpus)) score++;
    }
    if (score >= 2) scores[subcategory] = score;
  }

  if (Object.keys(scores).length > 0) {
    return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  }
  return null;
}

/**
 * Categorise a single channel.
 * Returns { category, subcategory } or { category: null, subcategory: null }
 */
export function categoriseChannel(ch) {
  // Step 1: Topic data
  let category = assignCategory(ch);

  // Step 2: Keyword fallback if no topic data matched
  const textCorpus = buildTextCorpus(ch);
  if (!category) {
    category = keywordMatchCategory(textCorpus);
  }

  if (!category) return { category: null, subcategory: null };

  // Step 3: Subcategory
  const subcategory = assignSubcategory(category, textCorpus);

  return { category, subcategory };
}

/**
 * Auto-categorise all uncategorised channels.
 * Returns { assignments, assigned, skipped, unmatched }
 */
export function autoCategoriseAll(channels, chIsUncategorised) {
  const assignments = [];
  const unmatched = [];
  let assigned = 0;
  let skipped = 0;

  for (const ch of channels) {
    if (!chIsUncategorised(ch)) { skipped++; continue; }

    const { category, subcategory } = categoriseChannel(ch);
    if (category) {
      assignments.push({ channel: ch, category, subcategory });
      assigned++;
    } else {
      unmatched.push(ch);
    }
  }

  return { assignments, assigned, skipped, unmatched };
}

/**
 * Persist auto-categorise results to Supabase.
 */
export async function persistAutoSort(supabase, user, assignments, dbCategories, onProgress) {
  if (!assignments.length) return { categoriesCreated: 0, channelsAssigned: 0, subcategoriesAssigned: 0 };

  // Ensure all needed categories exist
  const neededCats = [...new Set(assignments.map(a => a.category))];
  const existingNames = new Set(dbCategories.map(c => c.name));
  const newCats = neededCats.filter(c => !existingNames.has(c));

  if (newCats.length) {
    for (const name of newCats) {
      console.log('[AutoSort] Creating category:', name, 'for user:', user.id);
      const { error } = await supabase.from('categories')
        .insert({ name, user_id: user.id, sort_order: dbCategories.length });
      if (error) {
        console.error('[AutoSort] Failed to create category:', name, 'error:', error.message, 'code:', error.code, 'details:', error.details);
      } else {
        console.log('[AutoSort] Category created:', name);
      }
    }
  }

  // Re-fetch categories to get IDs — filter by user_id to avoid mixing with other users
  const { data: allCats, error: catFetchErr } = await supabase.from('categories').select('*').eq('user_id', user.id);
  if (catFetchErr) console.error('[AutoSort] Failed to fetch categories:', catFetchErr);
  console.log('[AutoSort] Fetched categories for user:', (allCats || []).length, 'rows:', (allCats || []).map(c => c.name));
  const catLookup = {};
  (allCats || []).forEach(c => { catLookup[c.name] = c.id; });

  // Ensure needed subcategories exist
  const neededSubs = assignments.filter(a => a.subcategory).map(a => ({ category: a.category, subcategory: a.subcategory }));
  const uniqueSubs = [];
  const seenSubs = new Set();
  for (const s of neededSubs) {
    const key = `${s.category}|${s.subcategory}`;
    if (!seenSubs.has(key)) { seenSubs.add(key); uniqueSubs.push(s); }
  }

  // Fetch existing subcategories for this user
  const { data: existingSubs } = await supabase.from('subcategories').select('*').eq('user_id', user.id);
  const existingSubKeys = new Set((existingSubs || []).map(s => `${s.category_id}|${s.name}`));

  for (const { category, subcategory } of uniqueSubs) {
    const catId = catLookup[category];
    if (!catId) continue;
    const key = `${catId}|${subcategory}`;
    if (!existingSubKeys.has(key)) {
      const { error } = await supabase.from('subcategories')
        .insert({ name: subcategory, category_id: catId, user_id: user.id, sort_order: 0 });
      if (error && error.code !== '23505') {
        console.error('[AutoSort] Failed to create subcategory:', subcategory, error);
      }
    }
  }

  // Re-fetch subcategories for ID lookup — filter by user_id
  const { data: allSubs } = await supabase.from('subcategories').select('*').eq('user_id', user.id);
  const subLookup = {};
  (allSubs || []).forEach(s => { subLookup[`${s.category_id}|${s.name}`] = s.id; });

  // Insert channel_categories
  const inserts = assignments
    .map(a => {
      const catId = catLookup[a.category];
      if (!catId) return null;
      return { channel_id: a.channel.id, category_id: catId, user_id: user.id, youtube_channel_id: a.channel.channelId || null };
    })
    .filter(Boolean);

  // Deduplicate
  const seen = new Set();
  const unique = inserts.filter(row => {
    const key = `${row.channel_id}_${row.category_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  let assignedCount = 0;
  for (let i = 0; i < unique.length; i += 100) {
    const batch = unique.slice(i, i + 100);
    const { error } = await supabase.from('channel_categories').insert(batch);
    if (error) console.error('[AutoSort] Failed to insert channel_categories:', error.message, 'code:', error.code);
    else console.log('[AutoSort] Inserted', batch.length, 'channel_categories');
    assignedCount = Math.min(i + 100, unique.length);
    onProgress?.(assignedCount, unique.length);
  }

  // Assign subcategories to channels
  let subcategoriesAssigned = 0;
  for (const a of assignments) {
    if (!a.subcategory) continue;
    const catId = catLookup[a.category];
    if (!catId) continue;
    const subId = subLookup[`${catId}|${a.subcategory}`];
    if (!subId) continue;
    await supabase.from('channels').update({ subcategory_id: subId }).eq('id', a.channel.id);
    if (a.channel.channelId) {
      await supabase.from('user_channels').update({ subcategory_id: subId }).eq('youtube_channel_id', a.channel.channelId).eq('user_id', user.id);
    }
    subcategoriesAssigned++;
  }

  console.log(`[AutoSort] Done: ${newCats.length} new categories, ${unique.length} assignments, ${subcategoriesAssigned} subcategories`);
  return { categoriesCreated: newCats.length, channelsAssigned: unique.length, subcategoriesAssigned };
}
