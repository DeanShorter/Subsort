# Subscrub — Product Bible

*Last updated: 3 April 2026*

---

## 1. Product Overview

**Subscrub** is a YouTube subscription organiser built as a solo product. The core philosophy is selling convenience rather than running a traditional business — lean and focused over feature-heavy. Success looks like a tight, polished product that drives upgrades through genuine utility, not bloat.

### Monetisation

- **Free tier**: Capped at 50 subscriptions, all features included — deliberately tight to drive upgrades
- **Pro tier**: £3/month or £24/year — unlimited subscriptions plus Chrome extension as a perk

### Solo Builder Principles

- Decisions reduce operational complexity and avoid scope creep
- Product bible maintained as a living document
- Marketing strategy built around character-first storytelling
- Iterative brand exploration with rapid concept cycling before locking in

---

## 2. Brand Identity

### The Critic

The Critic is subscrub's in-product personality — an opinionated, observant subscription advisor who watches your habits, spots patterns, and tells you what you need to hear. With a smile.

**Voice**: "Cheeky smile" — enjoys the roast, playful rather than burdened. Opens up humour without edge.

**Visual identity**: Emoji-style face with monocle and wink on a rounded square background. Minimal enough to work as favicon, app icon, toast header, and social avatar. The face is graphically simple — two strokes (wink + smile) plus a monocle circle with lens reflection. The monocle breaking the boundary of the square gives it energy.

**Mood system**: The Critic's background colour shifts based on mood:
- **Green (#00A651)** — impressed, positive, approval
- **Orange (#FF8C42)** — fired up, concerned, nudging action
- **Iris (#8B6FE8)** — curious, suggesting, discovery-oriented

At small sizes (favicon, toast icon, nav), can crop to just the monocle. At larger sizes (social, landing page, onboarding), the full wink + smile + monocle plays.

**FYI / disclaimer approach**: The Critic handles caveats and data limitations inline within existing observations rather than as separate disclaimer components. Honesty is embedded in the commentary, not bolted on. Example: "97 subscriptions in 2019 — at least, that's what survived. The real number was probably higher."

### Colour System

Colour-as-navigation: each colour maps to a page, not decorative.

| Colour | Hex | Page | Meaning |
|--------|-----|------|---------|
| Green | #00A651 | Subscriptions | Chameleon at rest |
| Orange | #FF8C42 | Feed | Incoming content |
| Iris | #8B6FE8 | Discover | Curiosity |
| Ocean | #2D9CDB | Stash | Saved for later |

**Soft variants** for backgrounds: green-soft (#E8F8EF), orange-soft (#FFF2E8), iris-soft (#F0ECFD), ocean-soft (#E8F4FC)

**Text variants** for labels on soft backgrounds: green-text (#006B35), orange-text (#8A4A15), iris-text (#4A3A8A), ocean-text (#155A80)

**Structural colours**: Background #f4f4f5, card #fff, text #1a1a1a, text-mid #555, text-light #999

Categories do NOT need colour coding — they're always visible as text labels.

The Critic travels the full colour spectrum based on mood (green = impressed, iris = curious, orange = fired up).

### Typography

- **Headings**: Outfit 700
- **Body**: DM Sans 400/500
- **Wordmark**: Dark pill (#1a1a1a background), Outfit 700, 14px, tight tracking (-0.3px), "SUB" in green + "SCRUB" in white, border-radius: 20px, capitalised
- **In-sentence usage**: Capitalised "Subscrub" (logo stays as designed element)

### Design System

- **Card style**: 2px solid #1a1a1a border + 4px 4px 0px box-shadow for feature/insight cards
- **Structural borders**: 3px thick borders separate nav from content and major sections
- **Border radius**: 16px cards, 12px inner elements
- **Background**: #f4f4f5 for dashboard, white for page content areas

---

## 3. Navigation Structure

Sidebar nav with colour dots for core pages, divider, then utility pages:

1. Home (active = green pill)
2. Subscriptions (green dot)
3. Feed (orange dot)
4. Discover (iris dot)
5. *divider*
6. Stash (ocean dot)
7. Insights (icon)
8. *spacer*
9. Settings (icon, bottom)

---

## 4. Pages

### 4.1 Dashboard (Home)

**Sections in order**:
1. Critic score card
2. "The Critic noticed..." observation cards
3. Insight recommendation cards
4. Feed summary
5. Favourites

**Critic observations**: 3 shadow-bordered cards (On This Day/green, Pattern/orange, Milestone/iris) with quirky personalised insights. Free-tier feature that teases the paid Insights page.

**Subscription age timeline**: Free tier visual showing subscription history over time. Yearly bar chart with phase annotations and Critic commentary. Data source: subscription dates from API only (no watch history needed). Timeline note: only shows channels currently subscribed to — channels previously unsubscribed from are not included. Subscrub tracks unsubscriptions going forward from the moment of connection.

### 4.2 Subscriptions Page

**Layout**: Nav | Category Panel | Table | Channel Detail Panel (when open)

**Category panel (slide-in, left)**:
- Open by default on first visit, remembers user preference
- Collapsed state: 40px thin strip with vertical "Categories" text + green count badge
- Collapse toggle: chevron in panel header
- Search field at top
- "All" and "Favourites" above divider, user categories below
- Multi-select checkboxes for filtering
- Per-category hover actions: add subcategory (+), edit (pencil), delete (trashcan with red hover)
- Always-visible chevrons for categories with subcategories (right-aligned, after count)
- Chevrons only appear on categories that have subcategories
- Subcategories show with dash connector, have edit + delete on hover
- Counts right-aligned in fixed 32px column
- "Add category" button at footer

**Controls row**: Active filter tags + "Clear all" on left; search icon (expandable) + Status toggle ("Status: All" combined pill) + Sort + Columns on right.

**Insight cards**: 3 shadow-bordered cards above the table with actionable recommendations and CTAs (Auto-sort/green, Review/orange, Discover/iris).

**Channel detail panel (slide-in, right)**:
- Compact, no-scroll layout
- Top zone: avatar + name + handle → Critic toast (mood-coloured) → Favourite + Open on YouTube buttons
- Stats below: channel stats, your activity with progress bar, category + subcategory with Edit/Add links
- Critic per-channel opinion shifts colour based on mood
- Channel name links through to dedicated channel page for deep-dive

**Delete modal wording**:
- Category: "Delete '[name]'? [X] channels are assigned to this category. They'll be uncategorised until you reassign them." Buttons: Cancel / Delete
- Subcategory: "Delete '[sub name]'? [X] channels will move back to [parent name]." Buttons: Cancel / Delete

### 4.3 Feed Page

- Pure chronological feed from subscriptions — no algorithm, no "most relevant" injection
- Scrollable horizontal category tabs (not the slide-in panel — Feed is for browsing, not managing)
- Single-select categories (multi-select not needed for content browsing)

### 4.4 Stash Page

**Named**: "Subscrub Stash" — alliterative, memorable, extensible.

**Colour**: Ocean (#2D9CDB)

**Features**:
- Collections (user-created groups)
- Recently saved video grid
- Critic commentary on saved content
- Chrome extension right-click "Add to Stash" (from YouTube or subscrub Feed)
- Seasons: automated Stash collections based on category filters that auto-populate with recent uploads

**YouTube playlist sync** (Pro feature):
- Can pull from regular user-created playlists via API (NOT Watch Later — deprecated since Sept 2016)
- Cost: 1 quota unit per `playlistItems.list` call, returns 50 items per page
- Use etag for differential sync — only re-fetch when content changes
- Sync frequency: once or twice daily is sufficient

**Watch Later workaround**: Chrome extension can read the Watch Later page DOM when user navigates to youtube.com/playlist?list=WL, offering a "Send to Stash" action.

### 4.5 Insights Page

Aggregate view — trends across all subscriptions, overall content diet, platform-wide observations. Individual channel deep-dives live on their own dedicated channel pages.

### 4.6 Channel Page

Dedicated page for deep-dive into individual channels, accessible from the channel detail panel (click-through from channel name). URL structure: `/channel/[id]`.

Content: subscription age timeline for that channel, upload history, viewing patterns, related channels, The Critic's full assessment with historical mood changes, and future deep-dive features.

### 4.7 Settings Page

**YouTube account**: Connected account info with disconnect option.

**Watch history** ("Your data" section):
- Shadow-bordered card showing: last updated, staleness badge, stats (videos tracked, channels matched, match rate)
- Upload + delete buttons
- "How to export from Google Takeout" help link
- Freshness warning bar colour-coded by staleness

**Layered update prompts by urgency**:
- Layer 1 (7-14 days): Gentle green Critic observation on dashboard
- Layer 2 (14-30 days): Orange Critic nudge on dashboard + orange badge on Settings nav
- Layer 3 (30+ days): Prompts in channel detail panel + persistent orange Critic card on dashboard

---

## 5. Onboarding Flow

### Step 1 — Welcome
Wordmark, one-liner ("Your subscriptions, organised."), brief description mentioning The Critic, "Let's go" button. No skip option.

### Step 2 — Connect YouTube
Framed as "Import your subscriptions." Shows read-only permissions (view subscriptions, view channel info, no write/delete). No "do this later" option — connection is mandatory.

### Step 2b — Loading sequence (after auth)
Progress steps with personality:
1. Connecting to YouTube ✓
2. Pulling subscriptions ✓
3. Scanning for uploads ✓
4. Scrutinising the mess (active)
5. Judging [user's first name]... (pending)

### Step 3 — The Critic's Initial Assessment
Stat pills (sub count + inactive count), Critic quote with personality, then fork:

**Upload path**: "Want more accurate insights?" → 6-step Google Takeout how-to guide → drag-drop upload zone → "I'll do this later in Settings" escape

**Skip path**: Auto-sort proposition with value explanation ("analyse your [X] subscriptions and organise them into categories") + reassurance ("rename, move, or create your own categories at any time") + "Auto-sort my subscriptions" CTA + "I'll sort manually" escape

### Auto-sort completion
Sorting progress screen with live counter → completion screen showing stat pills (channels sorted, categories created) + category preview as pills → Critic closing remark: "Done. [X] channels sorted into [Y] categories. Not bad for 30 seconds of work." → "Go to dashboard"

**Tooltips** (shown once, dismissible):
1. The Critic card — "This is The Critic — your subscription advisor"
2. Insight cards — "Recommendations based on your subscription data"
3. Category panel — "Organise your subscriptions into categories"

---

## 6. Chrome Extension

- Pro-only perk (not standalone product)
- Uses Side Panel API to persist across tabs
- Does NOT consume YouTube API quota (uses standard iframes)
- Right-click "Add to Stash" from YouTube or subscrub Feed
- Can read Watch Later page DOM as workaround for deprecated API

---

## 7. Feature Roadmap

### Features NOT requiring watch history

All of these use subscription dates, channel metadata, or subscrub's own data:

| Feature | Description | Tier | Priority |
|---------|-------------|------|----------|
| **Pure chronological feed** | No-algorithm feed from subscriptions only. Solves YouTube's "Most relevant" injection frustration. | Free | High |
| **Subscription age timeline** | Visual history of subscription dates over time. Bar chart with phase annotations. | Free | High |
| **Dead channel detection** | Track channels with no uploads in X months, reduced upload frequency, or content direction changes. | Free | High |
| **Channel sabbatical** | Mute a channel from all subscrub surfaces for 30/60/90 days. Critic check-in when it ends: "Did you miss it?" | Free | Medium |
| **Scrub streaks & achievements** | Gamified cleanup. "First Purge", "Tidy Shelf", "The Minimalist". Critic awards with personality. | Free | Medium |
| **Creator milestones feed** | Track and surface milestones for subscribed channels (subscriber counts, upload counts, channel anniversaries). | Free | Medium |
| **Subscription export/backup** | Download full subscription list with categories, notes, metadata as JSON/CSV. | Free | Medium |
| **Seasons (Stash collections)** | Automated Stash collections based on category filters. Auto-populate with recent uploads. Archive when done. | Pro | Medium |
| **Channel relationship mapping** | Map connections between subscriptions — collaborations, shared audiences, content ecosystems. Network graph. | Pro | Low |
| **Subscription sharing/gifting** | Share curated lists of subscriptions as links. Recipients preview and subscribe to all or some. | Pro | Low |
| **Duplicate/related channel detection** | Detect multiple channels from same creator and group them. | Free | Low |
| **"If you're leaving" suggestions** | When unsubscribing, suggest creator's other channels or formats. | Free | Low |
| **Notification management** | Per-category notification preferences: immediate for favourites, daily digest, weekly summary. Subscrub's own layer. | Pro | Low |
| **"On This Day" memories** | Daily Critic observation: "3 years ago today you subscribed to X. They've uploaded 247 videos since." Zero API cost — uses stored subscription dates. | Free | High |
| **Subscription velocity tracker** | Track subscription pace over time. Critic flags sprees: "12 channels in 3 days. Are you actually going to watch all of these?" Uses subscrub's own database only. | Free | Medium |
| **Channel upload calendar** | Weekly view of which subscribed channels upload on which days. Helps users understand content flow. Cached from recent video publish dates. | Free | Medium |
| **Abandoned category detection** | Flag categories where all channels have gone inactive or been moved out. "Your Fitness category has 2 channels left, both inactive. Time to retire it?" | Free | Medium |
| **Channel growth alerts** | Monitor subscriber growth rate. Flag channels crossing milestones or losing significant subscribers. Entirely API-driven, low cost. | Free | Medium |
| **The Critic's weekly digest** | Weekly summary: channels that returned from hiatus, favourite milestones, uncategorised count, Critic recommendations. Email or in-app card. | Free | High |
| **Subscription age tiers** | Auto-tag channels by tenure: OG (5+ years), Veteran (2-5), Recent (under 1 year), New (under 1 month). Filterable in table. | Free | Low |
| **Upload gap detector** | Track channels breaking their usual upload pattern. "This channel usually uploads every Tuesday. It's been 4 weeks." Uses cached upload history. | Free | Medium |
| **Category health dashboard** | Aggregate view per category: active %, avg upload frequency, newest/oldest subscription. Derived from API data + category assignments. | Free | Medium |
| **"Rising star" detection** | Identify channels growing significantly faster than average. "You subscribed at 5K. They just hit 200K. You were early." One channels.list call per sync. | Free | High |
| **Unsubscribe impact preview** | Before unsubscribing, show what the user loses: upload frequency, % of Feed content, active days. Calculated from upload data, no watch history. | Free | Medium |
| **Subscription overlap (social)** | Opt-in comparison between subscrub users. "You and Jake share 47 subscriptions. Here are 12 channels Jake follows that you don't." | Pro | Low |

### Features requiring watch history

These need Takeout data and are lower priority given data accuracy concerns:

| Feature | Description | Tier |
|---------|-------------|------|
| Content diet tracker | Weekly/monthly breakdown of viewing by category with trends | Pro |
| Watch pace insights | Binge vs drip-feed patterns per channel | Pro |
| Scrub score | Composite relevance metric per channel | Pro |
| "Why did I subscribe?" | Cross-reference subscription date with channel's uploads around that time | Pro |

### Playlist sync (Pro)

- Sync regular YouTube playlists to Stash automatically
- Cost: ~11 quota units per user per sync (for 5 playlists averaging 100 videos)
- 500 users syncing daily ≈ 5,500 units (55% of 10,000 daily quota)
- Use etag for differential sync

---

## 8. Pre-Launch Marketing

### @TheCriticYT (Twitter/X)

**Content calendar**:
- Weeks 1-2: Pure observational Critic posts (no product mention)
- Weeks 3-5: Gradual tease escalation
- Launch reveal at end

**Voice**: The Critic's "cheeky smile" personality. Enjoys the roast, playful rather than burdened.

Reply templates and seven repeatable content formats documented separately.

---

## 9. Technical Considerations

### Google OAuth
- Verification for YouTube readonly scope is longest lead-time item
- Test users: must add exact Google email (not alias) to OAuth consent screen
- Users click "Advanced" → "Go to app (unsafe)" during testing
- Workspace accounts may be blocked by admin policies
- Refresh tokens expire after 7 days in testing mode

### YouTube API
- Default quota: 10,000 units/day
- `playlistItems.list`: 1 unit per call (50 items per page)
- `subscriptions.list`: 1 unit per call
- `channels.list`: 1 unit per call
- `search.list`: 100 units per call (avoid)
- `playlistItems.insert`: 50 units per call (avoid for reads)
- Watch Later playlist: deprecated since Sept 2016, returns empty lists
- Quota increase application should be submitted before launch

### Watch History (Google Takeout)
- JSON format: fields include title, titleUrl, time (ISO 8601), subtitles array (channel name + URL)
- Known gaps: paused history periods, deleted/privated videos, channel URL format inconsistency (/channel/ vs /c/ vs /@), ads/system plays missing subtitles
- Matching checks all possible channel ID formats

### Chrome Web Store
- Submission requirements to be addressed before launch

---

## 10. Mockup Reference Files

All HTML mockups created during design sessions:

| File | Description |
|------|-------------|
| `subscrub_subscriptions_complete_reference.html` | Complete subscriptions page with all panels |
| `subscrub_channel_panel_compact.html` | Compact channel detail panels (3 mood states) |
| `subscrub_category_panel_v3.html` | Category panel with right-aligned chevrons and counts |
| `subscrub_category_panel_states.html` | Open vs collapsed panel states |
| `subscrub_dashboard_with_observations.html` | Dashboard with Critic observation cards |
| `subscrub_stash_page.html` | Full Stash page mockup |
| `subscrub_landing_page.html` | Test group landing page |
| `subscrub_onboarding_refined.html` | Full onboarding flow (steps 1-3b) |
| `subscrub_onboarding_autosort_complete.html` | Auto-sort completion screen |
| `subscrub_settings_data.html` | Settings page with layered update prompts |
| `subscrub_subscription_timeline.html` | Subscription age timeline (2 options) |
| `subscrub_control_bar_variations.html` | Category style options for controls row |
| `subscrub_category_menu_options.html` | Dropdown vs slide-in comparison |