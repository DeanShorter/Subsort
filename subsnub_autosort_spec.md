# Subsnub — Auto-Sort Implementation Spec

## Overview

Auto-sort assigns each channel a **top-level category** and optionally a **pre-defined subcategory**. It uses two data sources in sequence: YouTube's topic data for the top-level category, then keyword matching against channel metadata for the subcategory.

Channels that don't confidently match any category are left as "Uncategorised." Channels that match a top-level category but no subcategory stay at the category level. Both cases are flagged for the user to review.

---

## Data Sources (per channel)

All data comes from a single `channels.list` API call with `part=snippet,topicDetails,brandingSettings`. Cost: **1 unit per call**, up to 50 channels per request.

### Fields used for classification:

| Field | Source | Use |
|-------|--------|-----|
| `topicDetails.topicCategories[]` | Wikipedia URLs | Top-level category mapping |
| `topicDetails.topicIds[]` | Freebase topic IDs | Top-level + some subcategory hints |
| `snippet.description` | Channel description | Keyword matching for subcategory |
| `snippet.title` | Channel name | Keyword matching (supplementary) |
| `brandingSettings.channel.keywords` | Channel tags/keywords | Keyword matching for subcategory |

### Optional supplementary data:

| Field | Source | Use | Cost |
|-------|--------|-----|------|
| Recent video titles (5-10) | `playlistItems.list` on uploads playlist | Keyword matching when description is sparse | 1 unit per call |

Only fetch recent video titles if the channel description is empty or very short (< 50 chars) AND the topic data doesn't provide enough signal.

---

## Step 1: Top-Level Category Assignment

### YouTube Topic ID → Subsnub Category Mapping

YouTube returns `topicIds[]` as Freebase IDs from a fixed set (since Feb 2017). Map these to subsnub categories:

```
TOPIC_TO_CATEGORY = {
  # Music
  "/m/04rlf":   "Music",         # Music (parent)
  "/m/02mscn":  "Music",         # Christian music
  "/m/0ggq0m":  "Music",         # Classical music
  "/m/01lyv":   "Music",         # Country
  "/m/02lkt":   "Music",         # Electronic music
  "/m/0glt670": "Music",         # Hip hop music
  "/m/05rwpb":  "Music",         # Independent music
  "/m/03_d0":   "Music",         # Jazz
  "/m/028sqc":  "Music",         # Music of Asia
  "/m/0g293":   "Music",         # Music of Latin America
  "/m/064t9":   "Music",         # Pop music
  "/m/06cqb":   "Music",         # Reggae
  "/m/06j6l":   "Music",         # Rhythm and blues
  "/m/06by7":   "Music",         # Rock music
  "/m/0gywn":   "Music",         # Soul music

  # Gaming
  "/m/0bzvm2":  "Gaming",        # Gaming (parent)
  "/m/025zzc":  "Gaming",        # Action game
  "/m/02ntfj":  "Gaming",        # Action-adventure game
  "/m/0b1vjn":  "Gaming",        # Casual game
  "/m/02hygl":  "Gaming",        # Music video game
  "/m/04q1x3q": "Gaming",        # Puzzle video game
  "/m/01sjng":  "Gaming",        # Racing video game
  "/m/0403l3g": "Gaming",        # Role-playing video game
  "/m/021bp2":  "Gaming",        # Simulation video game
  "/m/022dc6":  "Gaming",        # Sports game
  "/m/03hf_rm": "Gaming",        # Strategy video game

  # Sports
  "/m/06ntj":   "Sports",        # Sports (parent)
  "/m/0jm_":    "Sports",        # American football
  "/m/018jz":   "Sports",        # Baseball
  "/m/018w8":   "Sports",        # Basketball
  "/m/01cgz":   "Sports",        # Boxing
  "/m/09xp_":   "Sports",        # Cricket
  "/m/02vx4":   "Sports",        # Football
  "/m/037hz":   "Sports",        # Golf
  "/m/03tmr":   "Sports",        # Ice hockey
  "/m/01h7lh":  "Sports",        # Mixed martial arts
  "/m/0410tth": "Sports",        # Motorsport
  "/m/07bs0":   "Sports",        # Tennis
  "/m/07_53":   "Sports",        # Volleyball
  "/m/02jjt":   "Sports",        # Wrestling

  # Entertainment
  "/m/02jjt":   "Entertainment", # Entertainment (parent)
  "/m/09kqc":   "Entertainment", # Humor
  "/m/02vxn":   "Entertainment", # Movies
  "/m/05qjc":   "Entertainment", # Performing arts
  "/m/066wd":   "Entertainment", # Professional wrestling
  "/m/0f2f9":   "Entertainment", # TV shows

  # Lifestyle
  "/m/019_rr":  "Lifestyle",     # Lifestyle (parent)
  "/m/032tl":   "Lifestyle",     # Fashion
  "/m/027x7n":  "Lifestyle",     # Fitness
  "/m/02wbm":   "Lifestyle",     # Food
  "/m/03glg":   "Lifestyle",     # Hobby
  "/m/068hy":   "Lifestyle",     # Pets
  "/m/041xxh":  "Lifestyle",     # Physical attractiveness
  "/m/07c1v":   "Lifestyle",     # Technology
  "/m/07bxq":   "Lifestyle",     # Tourism
  "/m/01k8wb":  "Lifestyle",     # Vehicles

  # Science & Education
  "/m/01k8wb":  "Science & Education",  # Knowledge
  "/m/098wr":   "Science & Education",  # Society

  # News & Politics
  "/m/09s1f":   "News & Politics",  # Business
  "/m/0kt51":   "News & Politics",  # Health
  "/m/01h6rj":  "News & Politics",  # Military
  "/m/05qt0":   "News & Politics",  # Politics
  "/m/06bvp":   "News & Politics",  # Religion
}
```

### YouTube topicCategories[] → Subsnub Category Mapping

YouTube also returns `topicCategories[]` as Wikipedia URLs. These provide a secondary signal:

```
WIKI_TO_CATEGORY = {
  "https://en.wikipedia.org/wiki/Music":                "Music",
  "https://en.wikipedia.org/wiki/Electronic_music":     "Music",
  "https://en.wikipedia.org/wiki/Hip_hop_music":        "Music",
  "https://en.wikipedia.org/wiki/Rock_music":           "Music",
  "https://en.wikipedia.org/wiki/Pop_music":            "Music",
  "https://en.wikipedia.org/wiki/Independent_music":    "Music",
  "https://en.wikipedia.org/wiki/Country_music":        "Music",
  "https://en.wikipedia.org/wiki/Soul_music":           "Music",
  "https://en.wikipedia.org/wiki/Jazz":                 "Music",
  "https://en.wikipedia.org/wiki/Classical_music":      "Music",
  "https://en.wikipedia.org/wiki/Rhythm_and_blues":     "Music",
  "https://en.wikipedia.org/wiki/Reggae":               "Music",

  "https://en.wikipedia.org/wiki/Video_game_culture":   "Gaming",
  "https://en.wikipedia.org/wiki/Action_game":          "Gaming",
  "https://en.wikipedia.org/wiki/Role-playing_video_game": "Gaming",
  "https://en.wikipedia.org/wiki/Strategy_video_game":  "Gaming",

  "https://en.wikipedia.org/wiki/Sport":                "Sports",
  "https://en.wikipedia.org/wiki/Association_football":  "Sports",
  "https://en.wikipedia.org/wiki/Basketball":           "Sports",
  "https://en.wikipedia.org/wiki/Tennis":               "Sports",
  "https://en.wikipedia.org/wiki/Cricket":              "Sports",
  "https://en.wikipedia.org/wiki/Mixed_martial_arts":   "Sports",
  "https://en.wikipedia.org/wiki/Boxing":               "Sports",
  "https://en.wikipedia.org/wiki/Golf":                 "Sports",
  "https://en.wikipedia.org/wiki/Motorsport":           "Sports",
  "https://en.wikipedia.org/wiki/American_football":    "Sports",
  "https://en.wikipedia.org/wiki/Baseball":             "Sports",
  "https://en.wikipedia.org/wiki/Ice_hockey":           "Sports",
  "https://en.wikipedia.org/wiki/Professional_wrestling": "Sports",

  "https://en.wikipedia.org/wiki/Entertainment":        "Entertainment",
  "https://en.wikipedia.org/wiki/Humor":                "Entertainment",
  "https://en.wikipedia.org/wiki/Television_program":   "Entertainment",
  "https://en.wikipedia.org/wiki/Film":                 "Film & TV",
  "https://en.wikipedia.org/wiki/Performing_arts":      "Entertainment",

  "https://en.wikipedia.org/wiki/Lifestyle_(sociology)": "Lifestyle",
  "https://en.wikipedia.org/wiki/Fashion":              "Lifestyle",
  "https://en.wikipedia.org/wiki/Food":                 "Lifestyle",
  "https://en.wikipedia.org/wiki/Cooking":              "Lifestyle",
  "https://en.wikipedia.org/wiki/Pet":                  "Lifestyle",
  "https://en.wikipedia.org/wiki/Physical_fitness":     "Fitness & Health",
  "https://en.wikipedia.org/wiki/Tourism":              "Lifestyle",
  "https://en.wikipedia.org/wiki/Hobby":                "Lifestyle",

  "https://en.wikipedia.org/wiki/Technology":           "Technology",
  "https://en.wikipedia.org/wiki/Vehicle":              "Automotive",
  "https://en.wikipedia.org/wiki/Knowledge":            "Science & Education",
  "https://en.wikipedia.org/wiki/Society":              "News & Politics",
  "https://en.wikipedia.org/wiki/Business":             "Finance & Business",
  "https://en.wikipedia.org/wiki/Health":               "Fitness & Health",
  "https://en.wikipedia.org/wiki/Military":             "News & Politics",
  "https://en.wikipedia.org/wiki/Politics":             "News & Politics",
  "https://en.wikipedia.org/wiki/Religion":             "Lifestyle",
}
```

### Category assignment logic:

1. Collect all topic IDs and topic categories from the channel
2. Map each to a subsnub category using the tables above
3. Count occurrences per category
4. Assign the category with the most matches
5. If tied, prefer the category that appears in `topicIds[]` over `topicCategories[]` (topicIds are more specific)
6. If no topic data exists, fall through to keyword matching for category assignment too

---

## Step 2: Subcategory Assignment (Keyword Matching)

Once a channel has a top-level category, match against the keyword lists below using the channel's:
- `snippet.description` (primary)
- `brandingSettings.channel.keywords` (secondary)
- `snippet.title` (supplementary)
- Recent video titles (fallback, only if description is sparse)

### Matching rules:

1. Normalise all text to lowercase
2. Check for keyword presence (whole word matching, not substring — "mix" should not match "remix" unless "remix" is also a keyword)
3. Score each subcategory by number of keyword matches
4. Assign subcategory only if score >= 2 (at least 2 keywords match) to avoid false positives from single-word coincidences
5. If no subcategory reaches threshold, leave channel at category level only

### Keyword Lists by Category → Subcategory:

```
SUBCATEGORY_KEYWORDS = {

  "Music": {
    "Production": ["producer", "production", "mixing", "mastering", "daw", "ableton", "logic pro", "fl studio", "pro tools", "plugin", "plugins", "vst", "synth", "synthesis", "eq", "compression", "reverb", "recording", "studio", "beatmaking", "beat making", "sample", "samples", "sampling"],
    "Performance": ["cover", "covers", "live performance", "acoustic", "session", "musician", "perform", "performer", "band", "orchestra", "recital", "concert", "busking", "jam"],
    "Reviews & Reactions": ["album review", "reaction", "react", "music review", "track review", "first listen", "listening party", "music opinion", "ranking", "tier list"],
    "Music Videos": ["official video", "official audio", "music video", "vevo", "record label", "official channel", "lyrics video"],
    "Theory & Education": ["music theory", "theory", "ear training", "composition", "harmony", "chord", "chords", "scale", "scales", "interval", "intervals", "melody", "arrangement", "songwriting", "song writing"],
    "DJs & Electronic": ["dj", "disc jockey", "turntable", "edm", "techno", "house music", "drum and bass", "dubstep", "trance", "remix", "set", "live set", "club"]
  },

  "Gaming": {
    "Let's Play & Walkthroughs": ["let's play", "lets play", "playthrough", "play through", "walkthrough", "walk through", "gameplay", "game play", "blind playthrough", "first playthrough", "commentary", "longplay"],
    "Esports & Competitive": ["esports", "esport", "competitive", "ranked", "tournament", "pro player", "league", "championship", "elo", "mmr", "grandmaster", "predator", "champion"],
    "Reviews & News": ["game review", "review", "preview", "first impressions", "gaming news", "game news", "release date", "announcement", "trailer reaction", "industry"],
    "Speedrunning": ["speedrun", "speed run", "speedrunning", "world record", "any%", "100%", "glitchless", "wr", "personal best", "pb"],
    "Game Development": ["game dev", "gamedev", "indie dev", "unity", "unreal engine", "godot", "devlog", "dev log", "game design", "level design", "pixel art"],
    "Retro & Nostalgia": ["retro", "retro gaming", "classic", "nostalgia", "vintage", "old school", "emulation", "emulator", "snes", "nes", "ps1", "ps2", "n64", "dreamcast", "gameboy"]
  },

  "Entertainment": {
    "Comedy & Sketch": ["comedy", "comedian", "standup", "stand-up", "stand up", "sketch", "skit", "funny", "humor", "humour", "parody", "satire", "improv", "roast"],
    "Commentary & Opinion": ["commentary", "video essay", "opinion", "analysis", "deep dive", "explained", "hot take", "cultural", "critique", "editorial", "think piece"],
    "Reality & Challenges": ["challenge", "prank", "social experiment", "dare", "extreme", "stunt", "reality", "vlog", "daily vlog"],
    "Animation": ["animation", "animated", "animator", "cartoon", "motion graphics", "2d animation", "3d animation", "anime", "manga"],
    "Podcasts & Talk Shows": ["podcast", "talk show", "interview", "conversation", "episode", "ep.", "guest", "host", "panel", "roundtable", "discussion"],
    "Variety & Stunts": ["stunt", "spectacle", "elaborate", "massive", "extreme", "team", "crew", "production", "event"]
  },

  "Technology": {
    "Programming & Dev": ["programming", "coding", "code", "developer", "software", "javascript", "python", "typescript", "react", "node", "api", "github", "tutorial", "web dev", "web development", "frontend", "backend", "full stack", "fullstack"],
    "Gadgets & Reviews": ["review", "unboxing", "hands on", "hands-on", "comparison", "versus", "vs", "best", "top", "smartphone", "laptop", "tablet", "gadget", "device", "specs"],
    "AI & Data Science": ["ai", "artificial intelligence", "machine learning", "deep learning", "neural network", "gpt", "llm", "data science", "data engineering", "nlp", "computer vision", "model", "training"],
    "Cybersecurity & Privacy": ["cybersecurity", "cyber security", "hacking", "ethical hacking", "security", "privacy", "vpn", "encryption", "penetration testing", "pentest", "bug bounty", "infosec"],
    "Self-Hosted & Linux": ["linux", "ubuntu", "arch", "debian", "homelab", "home lab", "self-hosted", "selfhosted", "docker", "kubernetes", "open source", "server", "nas", "raspberry pi"],
    "Productivity & Tools": ["productivity", "workflow", "notion", "obsidian", "tools", "apps", "automation", "efficiency", "organization", "setup", "desk setup"]
  },

  "Science & Education": {
    "Physics & Space": ["physics", "quantum", "space", "nasa", "astronomy", "astrophysics", "cosmos", "universe", "planet", "rocket", "spacex", "orbital", "relativity", "particle"],
    "Biology & Nature": ["biology", "nature", "wildlife", "animal", "animals", "ecology", "evolution", "marine", "ocean", "plant", "botany", "zoology", "documentary"],
    "History & Archaeology": ["history", "historical", "ancient", "archaeology", "civilization", "war", "battle", "empire", "medieval", "century", "era", "period", "artifact"],
    "Mathematics": ["math", "maths", "mathematics", "equation", "theorem", "calculus", "algebra", "geometry", "statistics", "probability", "proof", "number theory"],
    "Psychology & Philosophy": ["psychology", "philosophy", "mind", "consciousness", "cognitive", "behavior", "behaviour", "ethics", "morality", "existential", "stoic", "stoicism", "mental model"],
    "General Explainers": ["explained", "explainer", "how does", "what is", "why do", "science", "educational", "learn", "knowledge", "curious", "fascinating"]
  },

  "Sports": {
    "Football": ["football", "soccer", "premier league", "epl", "la liga", "champions league", "world cup", "fifa", "goal", "match", "transfer", "manager", "tactics"],
    "Combat Sports": ["boxing", "mma", "ufc", "fight", "fighter", "martial arts", "kickboxing", "wrestling", "knockout", "ko", "bout", "ring", "octagon", "bellator"],
    "American Sports": ["nfl", "nba", "mlb", "nhl", "touchdown", "quarterback", "slam dunk", "home run", "super bowl", "playoffs", "draft", "franchise"],
    "Motorsport": ["f1", "formula 1", "formula one", "motorsport", "racing", "nascar", "rally", "motogp", "indycar", "le mans", "lap", "circuit", "driver", "constructor"],
    "Analysis & Tactics": ["analysis", "tactical", "tactics", "breakdown", "film study", "scout", "scouting", "stats", "statistics", "xg", "expected goals", "advanced metrics"],
    "Extreme & Outdoor": ["skateboarding", "surfing", "climbing", "snowboarding", "skiing", "bmx", "parkour", "adventure", "extreme sport", "outdoor"]
  },

  "News & Politics": {
    "World News": ["news", "breaking", "current affairs", "world news", "global", "report", "update", "headline", "developing"],
    "Political Commentary": ["politics", "political", "democrat", "republican", "conservative", "liberal", "left", "right", "policy", "election", "vote", "debate", "government"],
    "Investigative & Documentary": ["investigation", "investigative", "documentary", "expose", "exposé", "in-depth", "report", "journalist", "journalism", "undercover"],
    "Local & Regional": ["local news", "city", "state", "regional", "community", "council", "borough", "county"],
    "Business & Economics": ["economy", "economic", "gdp", "inflation", "market", "trade", "tariff", "supply chain", "recession", "growth"]
  },

  "Lifestyle": {
    "Food & Cooking": ["recipe", "recipes", "cooking", "cook", "chef", "kitchen", "baking", "bake", "meal prep", "food", "cuisine", "restaurant", "ingredient", "ingredients"],
    "Travel & Adventure": ["travel", "travelling", "traveling", "trip", "adventure", "destination", "explore", "backpack", "nomad", "tourist", "hotel", "flight", "country"],
    "Fashion & Style": ["fashion", "style", "outfit", "ootd", "haul", "try on", "clothing", "wardrobe", "trend", "designer", "streetwear"],
    "Home & Interior": ["home", "interior", "renovation", "decor", "decorating", "furniture", "room tour", "house tour", "apartment", "makeover", "diy home"],
    "Relationships & Self-Help": ["relationship", "dating", "self-help", "self help", "motivation", "motivational", "personal development", "growth mindset", "confidence", "habits", "mindset"],
    "ASMR": ["asmr", "tingles", "relaxation", "whisper", "tapping", "triggers", "sleep", "calming", "soothing"]
  },

  "Finance & Business": {
    "Personal Finance": ["budget", "budgeting", "saving", "savings", "debt", "credit", "credit card", "money", "frugal", "financial", "personal finance", "emergency fund"],
    "Investing": ["invest", "investing", "stock", "stocks", "crypto", "cryptocurrency", "bitcoin", "ethereum", "portfolio", "dividend", "index fund", "etf", "real estate investing"],
    "Entrepreneurship": ["entrepreneur", "startup", "start-up", "business", "side hustle", "founder", "launch", "company", "revenue", "profit", "saas", "ecommerce"],
    "Career & Professional": ["career", "job", "interview", "resume", "cv", "salary", "negotiation", "promotion", "workplace", "professional", "linkedin"]
  },

  "Film & TV": {
    "Reviews & Analysis": ["movie review", "film review", "series review", "film analysis", "cinema", "cinematography", "director", "screenplay", "plot", "film essay"],
    "Behind the Scenes": ["behind the scenes", "bts", "filmmaking", "film making", "vfx", "visual effects", "cgi", "practical effects", "set design", "post-production"],
    "Trailers & News": ["trailer", "teaser", "upcoming", "release", "casting", "announcement", "sequel", "franchise", "box office"],
    "Fan Content": ["fan theory", "theory", "fan edit", "ranking", "top 10", "worst", "best", "tier list", "retrospective", "rewatch"]
  },

  "Fitness & Health": {
    "Workouts & Training": ["workout", "exercise", "training", "hiit", "strength", "cardio", "yoga", "pilates", "calisthenics", "gym", "fitness", "reps", "sets"],
    "Nutrition & Diet": ["nutrition", "diet", "macro", "macros", "protein", "calories", "meal plan", "supplement", "supplements", "keto", "vegan", "vegetarian", "healthy eating"],
    "Mental Health & Wellness": ["mental health", "meditation", "mindfulness", "anxiety", "depression", "therapy", "therapist", "wellbeing", "well-being", "self care", "self-care", "stress"],
    "Sports Performance": ["athletic", "athlete", "performance", "recovery", "injury", "rehab", "mobility", "flexibility", "sports science", "conditioning"]
  },

  "Art & Creative": {
    "Visual Art": ["drawing", "painting", "illustration", "digital art", "sketch", "watercolor", "watercolour", "oil painting", "acrylic", "portrait", "canvas", "art tutorial"],
    "Photography & Videography": ["photography", "photo", "camera", "lens", "lightroom", "photoshop", "videography", "cinematography", "drone", "timelapse", "composition"],
    "Design": ["design", "graphic design", "ui", "ux", "ui/ux", "typography", "branding", "logo", "figma", "adobe", "illustrator", "creative"],
    "Crafts & DIY": ["craft", "crafts", "diy", "woodworking", "3d printing", "maker", "build", "project", "handmade", "sewing", "knitting", "electronics"]
  },

  "Automotive": {
    "Car Reviews": ["car review", "test drive", "first drive", "comparison", "sedan", "suv", "electric car", "ev", "hybrid", "horsepower"],
    "Modifications & Builds": ["mod", "modification", "build", "project car", "tuning", "restoration", "restore", "engine swap", "turbo", "supercharger", "custom"],
    "Motorsport": ["racing", "track day", "lap time", "circuit", "formula", "rally", "endurance", "drag race", "drift", "drifting"],
    "Motorcycles": ["motorcycle", "motorbike", "bike", "riding", "rider", "superbike", "cruiser", "adventure bike", "helmet"]
  },

  "Education & How-To": {
    "Language Learning": ["language", "learn", "spanish", "french", "german", "japanese", "korean", "mandarin", "chinese", "polyglot", "vocabulary", "grammar", "fluent", "immersion"],
    "Academic Lectures": ["lecture", "professor", "university", "academic", "course", "curriculum", "thesis", "research", "study", "seminar"],
    "Professional Skills": ["excel", "spreadsheet", "presentation", "public speaking", "writing", "project management", "agile", "scrum", "leadership", "management"],
    "Life Skills": ["how to", "diy", "fix", "repair", "maintenance", "tutorial", "guide", "step by step", "beginner", "tips", "hack", "hacks"]
  }
}
```

---

## Step 3: Processing Pipeline

For each channel in the user's subscription list:

```
function autoSortChannel(channel):
  category = null
  subcategory = null

  // STEP 1: Top-level category from YouTube topic data
  topicIds = channel.topicDetails.topicIds || []
  topicCategories = channel.topicDetails.topicCategories || []

  categoryCounts = {}

  for id in topicIds:
    mapped = TOPIC_TO_CATEGORY[id]
    if mapped:
      categoryCounts[mapped] = (categoryCounts[mapped] || 0) + 2  // weight topicIds higher

  for url in topicCategories:
    mapped = WIKI_TO_CATEGORY[url]
    if mapped:
      categoryCounts[mapped] = (categoryCounts[mapped] || 0) + 1

  if categoryCounts is not empty:
    category = key with highest count

  // STEP 2: Fallback — keyword match for category if no topic data
  if category is null:
    textCorpus = buildTextCorpus(channel)
    category = keywordMatchCategory(textCorpus)

  // STEP 3: Subcategory from keyword matching
  if category is not null:
    textCorpus = buildTextCorpus(channel)
    subcategory = keywordMatchSubcategory(category, textCorpus)

  return { category, subcategory }


function buildTextCorpus(channel):
  text = toLowerCase(
    channel.snippet.title + " " +
    channel.snippet.description + " " +
    (channel.brandingSettings.channel.keywords || "")
  )
  // If description is sparse (< 50 chars), fetch recent video titles
  if channel.snippet.description.length < 50:
    recentTitles = fetchRecentVideoTitles(channel.id, count=10)
    text += " " + toLowerCase(recentTitles.join(" "))
  return text


function keywordMatchSubcategory(category, textCorpus):
  subcategoryScores = {}
  keywords = SUBCATEGORY_KEYWORDS[category]

  for subcategory, keywordList in keywords:
    score = 0
    for keyword in keywordList:
      if wholeWordMatch(keyword, textCorpus):
        score += 1
    if score >= 2:  // minimum threshold
      subcategoryScores[subcategory] = score

  if subcategoryScores is not empty:
    return key with highest score
  return null  // no confident subcategory match


function keywordMatchCategory(textCorpus):
  // Used as fallback when no YouTube topic data exists
  // Check all subcategory keywords across all categories
  // The category with the most total keyword matches wins
  categoryCounts = {}
  for category, subcategories in SUBCATEGORY_KEYWORDS:
    totalScore = 0
    for subcategory, keywordList in subcategories:
      for keyword in keywordList:
        if wholeWordMatch(keyword, textCorpus):
          totalScore += 1
    if totalScore >= 3:  // higher threshold for category-level fallback
      categoryCounts[category] = totalScore

  if categoryCounts is not empty:
    return key with highest count
  return null  // truly uncategorisable
```

---

## Step 4: Post-Processing

After all channels are processed:

1. **Count uncategorised channels** — report to user: "X channels couldn't be categorised automatically"
2. **Count category-only channels** (no subcategory) — these are normal, not errors
3. **Detect potential miscategorisations** — if a channel's topic data says "Music" but keyword matching strongly suggests "Entertainment" (e.g., a music reaction channel), flag for review
4. **Generate Critic summary** — "Sorted 534 channels into 14 categories. 27 have subcategories. 8 were too ambiguous — I'll leave those to you."

---

## API Quota Budget

For a user with 500 subscriptions:

| Operation | Calls | Units per call | Total units |
|-----------|-------|----------------|-------------|
| `channels.list` (50 per request) | 10 | 1 | 10 |
| `playlistItems.list` for sparse channels (~20% need video titles) | ~100 | 1 | ~100 |
| **Total** | | | **~110 units** |

This is ~1.1% of the daily 10,000 unit quota. Auto-sort is cheap.

---

## Edge Cases

**Channel with no topic data AND no description**: Assign to "Uncategorised". The Critic flags it.

**Channel matching multiple categories equally**: Prefer the first match in this priority order: Music > Gaming > Sports > Entertainment > Technology > Science & Education > (rest alphabetical). These are ordered by how distinctive their topic signals tend to be.

**Channel that's clearly wrong**: Users can recategorise at any time. The auto-sort is a starting point, not a prison. The Critic should frame it this way: "I've done my best. Move anything I got wrong."

**Very small subscription lists (< 20)**: Still run auto-sort but the Critic adjusts tone: "Only 15 channels. I could sort these in my sleep."

**Re-running auto-sort**: Users should be able to re-run auto-sort on uncategorised channels only, or on all channels (with a warning that it'll override existing assignments).
