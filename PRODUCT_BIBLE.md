# subscrub — Product bible

Last updated: March 2026

This document is the single source of truth for the subscrub product. It covers everything from brand identity to technical architecture, marketing strategy to feature specs. Keep it in your repo and update it as things evolve.

---

## 1. Product overview

**What it is:** A YouTube subscription organiser for viewers (not creators). Auto-sorts subscriptions by topic, delivers category-based feeds, flags inactive channels, and gives users a "subscrub score" measuring feed health.

**Tagline:** Your subscriptions, scrubbed of chaos.

**Domain:** getsubscrub.com

**Target audience:** Heavy YouTube viewers with 100+ subscriptions who find YouTube's native subscription page unusable. The pain point is universal — anyone who's been on YouTube for a few years has a bloated, unmanageable subscription list.

**Core value prop:** Connect your account, and subscrub sorts everything into clean feeds automatically. No manual setup, no tagging, no algorithm deciding what you should watch.

**Monetisation — currently undecided (intentionally):**

Launch with everything free. No paid tier, no feature gating. The priority is getting 100+ active users and understanding how they actually use the product before deciding how to monetise.

The previous Pro/Free split (auto-sort, smart categories, watch analytics behind a paywall) was abandoned because the best features — The Critic, the organised feed, split view, hover-to-preview — all need to be free to give users a reason to stay on subscrub instead of going back to YouTube. Gating them defeats the purpose.

**Models being explored (post-launch, after user data exists):**
- Ad-supported: non-intrusive sponsored cards in the feed, one every 15+ videos, clearly labelled. Needs meaningful traffic first.
- Affiliate/referral: category-aware product recommendations ("The Critic recommends" section). Cookbooks for cooking viewers, gear for tech viewers. Monetises existing data without gating features.
- Scale-based freemium: everything free up to ~200 subscriptions, unlimited for a small monthly fee. Gates on volume, not features. Power users pay naturally.
- Pay what you want / tip jar: a "Support subscrub" option for users who find it valuable. Low effort, validates willingness to pay.
- Creator tier (future): public shared collections, curator analytics, community ratings. Only viable with an active user base. Different product surface entirely — don't build until the viewer product is proven.

**The rule:** don't build a payment system until the product has found its audience. The monetisation model should emerge from observed user behaviour, not predicted behaviour.

Note: All previous references to "Free tier" and "Pro tier" feature splits throughout this document are now outdated. All features are free at launch. Feature references that mention "Pro" should be read as "future paid tier, model TBD."

---

## 2. Brand identity

### Name
"subscrub" — "sub" from subscriptions, "scrub" from cleaning up dead weight. One word, all lowercase.

### Logo
**Wordmark:** Outfit 700, 22px, -0.5px letter-spacing. "sub" in mint (#3ECFA0), "scrub" in primary text colour. Same split in both dark and light themes.

```html
<a class="logo"><span>sub</span>scrub</a>
```

**Logomark: The Critic (chameleon).** A stylised chameleon face in mint, representing The Critic. The chameleon's defining trait — colour change — IS the product mechanic. Mint when happy, amber when nudging, red when annoyed, grey when giving up. One SVG, dynamic colour via CSS. No need for multiple illustrations per mood.

**Why the chameleon:**
- Colour change IS the mood system: one illustration, swap the fill colour per mood state
- Eyes rotate independently: The Critic watches your feed from every angle, sees everything
- Curled tail: distinctive silhouette at any size, works as a question mark shape for the favicon
- Tongue: snatching dead channels from your feed. "The Critic caught 52 inactive channels."
- No major tech brand owns the chameleon — clear space to claim it
- Natural smirk: the curled detail under the mouth shifts meaning with colour (pleased in mint, grimace in red)

**Chameleon face style:** left variant from AI concepts selected — larger expressive eyes with visible whites, curled spiral under the mouth (natural smirk), pronounced crest/horn on top. Needs two versions:
- **Detailed version:** for large use (landing page hero, share cards, social media). Full shading, textured, characterful.
- **Simplified version:** for small use (favicon, sidebar, critic banner, UI elements). Same silhouette but flat fills, reduced detail.

**Colour palette for the chameleon:**
- Base/default: mint #3ECFA0
- Shading: teal #1D9E75, dark teal #0F6E56
- Mood shifts applied as fill colour changes across the entire illustration

**Mood variants (conveyed through colour, not different illustrations):**
- Encouraging: mint #3ECFA0 — the default, happy state
- Nudging: amber #EF9F27 — warming up, patience thinning
- Impatient: deeper amber — The Critic is changing colour
- Annoyed: red #E85D50 — visibly angry
- Giving up: grey/desaturated — colour drained, checked out
- Sunglasses variant: for high scores and social media avatar (needs separate illustration)

**Eye expression variants (optional, post-launch):**
- Looking straight: judgemental (default)
- Looking sideways: suspicious
- Half-closed: unimpressed
- Wide open: shocked at your subscription count

**Primary mark:** the encouraging/default state in mint with the natural smirk. Used everywhere by default.

**Usage:**
- Beside the wordmark on the landing page and marketing materials
- Critic banner on Home page (colour-shifted per mood next to "The Critic" label)
- Share cards (next to attribution line)
- Social media avatar (sunglasses variant — most distinctive in circle crop)
- Email newsletter sender avatar
- Landing page hero ("Meet The Critic" visual)

**The wordmark and logomark are independent.** The wordmark works alone in the sidebar and nav. The logomark works alone as an avatar and icon. Together they form the full brand lock-up for marketing and the landing page.

### The Colony (ant army) — future character system

The Critic (chameleon) is the face and voice. Behind The Critic is "The Colony" — an army of ants that represent subscrub's background processes and automation. The Critic gives orders, the ants execute. (Note: chameleons eat insects — The Critic could theoretically eat underperforming ants. Dark humour that writes itself.)

**Not needed for launch.** Introduce when cron jobs, bots, and automation features go live. The Colony expands the character world without changing the mascot.

**How it maps to product features:**
- RSS refresh cron job: "The night shift is working."
- Channel enrichment: "Scouts deployed."
- Auto-sort: "The workers are sorting your channels."
- Feed clean after scrub: "The colony rests."
- New channel discovered: "The scouts found 3 new channels you might like."
- Background processing: "The colony is busy. Check back shortly."

**If bots/automation become a major feature**, referring to them as "ants" is a natural marketing extension. "Deploy the colony" for batch operations. "Your ant army sorted 326 channels in 4 seconds." The infrastructure becomes narrative.

**The hierarchy:**
- The Critic (chameleon) — the character users interact with, the voice, the judge
- The Colony (ants) — the workers, invisible until referenced, the automation layer
- The roasts — can reference any creature for humour ("Your feed looks like something a dung beetle would enjoy")

### Favicon
Simplified chameleon head silhouette with the curled tail forming a question mark shape. Mint fill on dark background. At 16px the crest on top + curled tail at bottom create a distinctive vertical shape that no other app icon looks like. Two dots for eyes. Rounded square container.

### Previous logomark concepts (explored, not selected)
- Magnifying glass with face: explored with AI-generated concepts, felt too generic (search/detective associations)
- Owl: strong symbolism but too close to Duolingo
- Praying mantis: authority and precision, but required multiple illustrations for mood variants (posture-based). Chameleon solves this with colour swap.
- Dung beetle: funniest option, great for roast copy, but too niche for a primary logo
- Ant: lacked personality as a solo character, but evolved into The Colony supporting system

### Typography
- Display / headings: Outfit (weight 700 for logo, 600 for page titles, 500-800 range)
- Body / UI text: DM Sans (weights 400 and 500)

### Colour palette

**Dark theme (primary):**
- Mint accent: #3ECFA0 (hover: #34B88D)
- Background: #111110
- Surfaces: #1A1A18, #222220, #2A2A27
- Text: #E8E6E0 (primary), #9A9890 (mid), #5E5D58 (dim)

**Light theme (secondary):**
- Mint accent: #2EB88A (deeper for contrast on light)
- Background: #F8F7F4
- Text: #1A1A18 (primary), #6B6A65 (mid), #9A9890 (dim)

**Category colours:** Red (#E85D50), Blue (#378ADD), Purple (#B07CED), Amber (#EF9F27), Pink (#D4537E), Teal (#5DCAA5), Green (#97C459), Orange (#E8875C), Sky (#85B7EB)

### Tone of voice
Cheeky, observational, and warm. Like a friend roasting you gently — always directed at the situation (messy feeds, dead channels, subscription hoarding), never at the user personally. Self-deprecating where appropriate. Avoids corporate polish.

The product's voice is channelled through The Critic — the central character of subscrub.

### The Critic — character definition
The Critic is the personality engine of subscrub. It's a voice with a face — a chameleon that watches your feed with independently rotating eyes and changes colour based on how well you're managing your subscriptions. Think sharp-witted columnist who happens to be a colour-shifting reptile.

**What it is:**
- An entity that analyses your feed and delivers verdicts
- First person voice: "I've seen worse. I've also seen better."
- Has moods that escalate based on user behaviour (encouraging → giving up)
- Has opinions, patience, and memory
- Attributed on everything it says: "— The Critic, based on 326 subscriptions"
- Visually represented by the chameleon logomark — colour shifts to match mood
- Commands The Colony (ant army) for background automation (post-launch)

**What it isn't:**
- Not a chatbot or AI assistant
- Not mean — exasperated, dry, occasionally proud, but never cruel
- Not a separate product — it's the voice layer on top of the tool
- Not a children's mascot — the character has authority and editorial weight

**Visual identity:**
The chameleon logomark IS The Critic. Mood is conveyed through colour — one SVG, dynamic fill:
- Mint #3ECFA0 → encouraging mood (default)
- Amber #EF9F27 → nudging mood
- Deeper amber → impatient mood
- Red #E85D50 → annoyed mood
- Grey/desaturated → giving up mood
- Sunglasses variant → high score / social media avatar

The primary (mint) variant is used everywhere by default. Colour shifts appear contextually on the critic banner, share cards, and emails. The sunglasses version is the social media avatar.

**Where it appears (voice + visual):**
- Home page: critic banner with colour-shifted chameleon + typed roast + task list
- Onboarding sync screen: commentary during analysis with the chameleon watching
- Share cards: the verdict, attribution, and logomark
- Email newsletters: sender identity ("The Critic via subscrub") with avatar
- Social media: tweets as itself, sunglasses avatar
- Empty states and notifications: personality copy with small logomark
- Weekly/monthly summaries: "The Critic's March verdict"

**Where it doesn't appear:**
- Subscriptions page (control room — functional, no commentary)
- Settings page (purely functional)
- Admin pages (internal)

**Voice examples:**
- Encouraging: "I'll admit it — you've been putting in the work. I'm almost proud."
- Nudging: "The other 239 are just paying emotional rent in your feed."
- Impatient: "I gave you a list. You ignored it. I'm trying not to take this personally."
- Annoyed: "I can't help someone who won't help themselves."
- Giving up: "I'm not angry. I'm just disappointed. Actually, no — I am angry."

**The key principle:** if someone turns off The Critic (future "serious mode" toggle), the tool works perfectly without it. The Critic is the personality layer, not the product. But it's the reason people remember subscrub.

### Emoji usage
Native system emojis only — no emoji library needed. Emojis appear in personality content (roast cards, badges, empty states, thermometer labels, notifications). Never in structural UI elements (nav items, table headers, button labels, page titles).

Render at 32px for empty state hero icons, 16-18px inline with text in cards and badges.

**Feed health thermometer:**
- 🔥 Dumpster fire (0-30%)
- 😬 Needs an intervention (30-50%)
- 😐 Getting there (50-70%)
- 😎 Looking sharp (70-85%)
- ✨ Almost perfect (85-95%)
- 🤨 Suspiciously clean (95-100%)

**Achievement badges:**
- 🧹 First scrub
- 👻 Ghost hunter
- 🚨 Serial subscriber
- 👑 Category royalty
- ⭐ Picky viewer
- 🔒 Streak machine (locked)

**Empty states:**
- 😴 No new uploads / nothing here
- ✨ Spotless (all clean after scrub)
- 🤷 No search results
- 🧹 All scrubbed (post-cleanup)
- 😶 No videos this week
- 🐕 The Critic recommends a break / palate cleanser

**Roast card reactions:**
- 💀 Devastating stats
- 😅 Ironic callouts (fitness/gaming)
- 🫡 High score respect

**Notifications:**
- 📉 Score dropped
- 🎉 Score improved
- 🔔 Weekly nudge

**Tier badges (text, not emoji):**
- Free: no badge (default state)
- Pro: mint dim bg, mint text — `rgba(62, 207, 160, 0.12)` / `#3ECFA0`
- Pro+: amber dim bg, amber text — `rgba(239, 159, 39, 0.1)` / `#EF9F27`

Note: avoid 🫥 (dotted line face) — too new, may not render on older Android. Use 😶 as a safe alternative.

---

## 3. Design system

### Files
- `tokens.css` — all CSS custom properties (colours, spacing, type, radii, shadows, theme switching)
- `components.css` — all UI component classes (buttons, cards, nav, modals, etc.)

Load order: tokens first, then components. Theme switching via `data-theme="dark|light"` on html/body, falls back to `prefers-color-scheme`.

### Key component classes
- `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-danger` — button variants
- `.card`, `.stat-card`, `.video-card`, `.channel-card` — card surfaces
- `.tag-entertainment`, `.tag-tech`, `.tag-gaming` etc — category tags
- `.nav-item`, `.nav-item.active-page`, `.nav-item.active-cat` — sidebar navigation
- `.topbar`, `.tb-control`, `.view-btn` — top bar controls
- `.modal`, `.modal-backdrop` — modal system
- `.avatar-xs` through `.avatar-xl` — avatar sizes

### Icons
All hand-drawn inline SVGs at 16x16 viewBox, 1.5px stroke, round caps/joins, stroke="currentColor". Exception: Settings uses Lucide's gear at 24x24 viewBox rendered at 16x16.

**Nav icons:** Home, Subscriptions, Feeds, Discover, Favourites, Recently watched, Settings (Lucide gear), Blog (pen with baseline), Pro (lightning bolt), Watch analytics

### Layout structure
- Vertical collapsible sidebar for page nav + categories
- Horizontal topbar for page title, sort/filter/view controls, subcategory chips
- Content area with scrollable feed

---

## 4. Page structure

### Navigation hierarchy
**Sidebar (pages only — no categories):** Home, Subscriptions, Feed, Discover (post-launch, greyed out at launch), Insights
**Sidebar footer:** Settings, Pro
**Category navigation:** horizontal tabs in the content area of each page (dot + name format), not in the sidebar

### Pages
**Core pages (launch):**
- `/home` — Home: critic banner (shareable verdict), action card (evidence + scrub CTA), favourites grid, today summary bar, recent activity
- `/subscriptions` — Channel management with 3 view modes (table, grid, compact list), category tabs with "Manage" button, bulk edit, auto-sort
- `/feed` — Category-based video feeds grouped by time (today, earlier this week), subcategory chips, Critic break cards

**Post-launch pages:**
- `/discover` — Personalised channel recommendations in categorised sections (see Discover page spec in section 6). Greyed out in sidebar at launch with "Coming soon" tooltip. Build after 20+ users with accumulated click data.
- `/insights` — Watch analytics, punch card chart, category breakdown (subscribed vs watched), feed health deep dive, roast history. Unlocks progressively as click data accumulates.

**Utility pages:**
- `/settings` — Account, preferences, connected services
- `/privacy` — Privacy policy
- `/terms` — Terms of service
- `/blog` — Blog posts with gradient banners per category

### Page personalities
Each page has a distinct visual weight, density, and mood. Pages should NOT feel the same.

**Launch pages:**
- **Home** = "morning briefing" — personal, warm, content-forward. Critic banner at top (the only tinted card in the app), large favourites grid below. Asymmetric layout. The page that talks to you.
- **Feed** = "lean-back browsing" — big thumbnails dominate, less data, more content. Closest to YouTube's feel. Horizontal scroll rows, category-grouped video lists.
- **Subscriptions** = "control room" — data-dense, power-user tools. Table view with sortable columns, bulk actions. The only page that should feel like a spreadsheet.

**Post-launch pages:**
- **Discover** = "exploration" — bigger cards, more whitespace, looser grid. Browsing possibilities, not managing data. Build after 20+ users.
- **Insights** = "revelation" — full-width charts and visualisations, storytelling data. The punch card, the roast, the trends.

### Category navigation (reimagined)
Categories live in the content area as horizontal tabs (dot + name format), NOT in the sidebar. The sidebar is page-level navigation only. When a category tab is clicked, subcategories appear as pills directly below. One place, one interaction, no duplication.

A "Manage" button at the end of the category tab row opens a modal for renaming categories, changing colours, creating/editing/deleting subcategories, and reordering.

---

## 5. Technical architecture

### Stack
- Framework: Next.js (App Router)
- Hosting: Vercel
- Database: Supabase (production + separate test project)
- Email: Resend
- Auth: Google OAuth via Supabase Auth
- Domain registrar: GoDaddy

### Environment setup
- Production (main branch) → getsubscrub.com → production Supabase
- Preview (dev branch) → Vercel preview URLs → test Supabase
- Local development → localhost:3000 → test Supabase

`.env.local` points to test database only. Production credentials live only in Vercel's dashboard.

### Git workflow
- `main` = production (auto-deploys to getsubscrub.com)
- `dev` = working branch (gets Vercel preview URLs)
- Feature branches off dev for specific features
- Never commit directly to main

### Database tables (13 tables)
- `profiles` — user accounts, tier, google token, sync timestamps, newsletter opt-in
- `channels` — user's subscribed channels with metadata, notes, favourited status
- `categories` — user-created categories with colour and sort order
- `subcategories` — nested under categories
- `channel_categories` — junction table linking channels to categories
- `channel_recategorisations` — logs every user correction for consensus building
- `cached_videos` — video cache with title, thumbnail, published date, duration, view count, type
- `video_clicks` — logs every video click with user, video, channel, category, timestamp (powers insights and smart roasts)
- `feed_cache` — cached feed data with expiry
- `watch_history` — uploaded Takeout watch history (future enhancement via Takeout upload)
- `events` — activity logging
- `api_usage` — YouTube API quota tracking
- `newsletter_sends` — newsletter send history

### YouTube data strategy
- **RSS feeds** for detecting new uploads (free, unlimited, no API key needed)
- **YouTube API** reserved for: initial subscription sync, channel metadata, video details (duration, view count)
- RSS URL: `https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID`
- RSS returns: last 15 videos per channel with title, ID, published date, thumbnail
- RSS does NOT return: duration, view count, video type (short vs long-form)

### RSS refresh implementation
- Manual refresh button in topbar — user-triggered, fetches RSS in batches of 20 with 500ms delay
- First login trigger — RSS refresh runs automatically after initial YouTube API sync
- Cron job (post-launch) — automatic background refresh across all unique channels

### Video metadata backfill
- Separate API route that fetches duration, view count, and video type from YouTube API
- Processes up to 50 videos per API call (1 quota unit each)
- Detects Shorts (duration ≤60 seconds) and sets video_type accordingly
- Triggered after RSS finds new videos

### Quota maths (100 users, ~300 subs each, 10% crossover)
- ~27,000 unique channels
- RSS handles upload detection: 0 quota units
- Channel metadata refresh (~3,857/day): ~3,857 units
- Video details backfill (~500-1,000 new videos/day): ~10-20 units
- Total: ~4,500-5,000 units/day (well within 10,000 daily quota)

---

## 6. Features — personality and engagement

### Onboarding sync screen
Personalised loader that narrates the sync process in real time. Greeting adapts to time of day ("Good evening, Dean."). Checklist-style progress with six steps:
1. Connecting to YouTube
2. Checking subscriptions → shows count
3. Searching for recent uploads → shows video count
4. Preparing your feeds → shows category count
5. Scrutinising the mess → shows issue count
6. Judging [name]... → shows score

Ends with a roast card from "subscrub — Your subscription critic" and a "Show me the damage" CTA.

**Launch roast** uses: subscription count, inactive channels, category distribution, uncategorised channels. No watch history data needed — RSS and click tracking power everything.

**Future enhanced roast** (once click data accumulates): never-watched channels, watch frequency, category vs actual viewing habits (the fitness/gaming callout). This unlocks automatically as the user generates more click data — not behind a paywall.

### Dynamic roast copy
Roasts are built dynamically based on user data. Templates scale by subscription count (under 100 / 100-250 / 250-400 / 400+), category skew, inactive channel severity, and uncategorised count. Always observational, never mean.

### Subscription critic card
The critic is a living character with moods, patience, and memory. It appears on the Home page as two cards:

**Card 1 — The critic verdict (shareable).** Thin banner at the top of Home. Score ring, emoji, greeting, one-liner roast, score sparkline (7-14 points showing trend), and a share button. This is the subscrub signature — the first thing users see every time they open the app. The card has a tinted background that shifts colour based on the critic's mood (mint when encouraging, amber when nudging, red when annoyed, grey when giving up). This is the ONLY tinted card in the app — everything else uses neutral surfaces.

**Card 2 — The action card (evidence + CTA).** Sits below the critic card. Shows the specific problems (52 never watched, 32 inactive, 20 clickbait flagged) with a "Scrub now" CTA. The left border colour and weight escalates with the critic's mood. The copy gets more urgent over time.

### Critic mood escalation
The critic's personality intensifies based on how long since the user last took action (scrubbed, unsubscribed, recategorised). Track `last_critic_action` timestamp on the user profile.

**Encouraging (0-3 days since action):**
- Emoji: 😎 | Tint: mint | Sparkline: green, trending up
- Greeting: "Not bad, Dean."
- Roast: "You scrubbed 8 channels last week and your score jumped 4 points."
- Action: "A few loose ends to tidy up when you're ready."
- CTA: "Keep scrubbing"

**Nudging (4-7 days):**
- Emoji: 😐 | Tint: amber | Sparkline: amber, flat
- Greeting: "Getting there, Dean."
- Roast: "326 subscriptions and you engage with 87 of them. The other 239 are just paying emotional rent."
- Action: "Those 52 inactive channels aren't going to scrub themselves."
- CTA: "Scrub now"

**Impatient (1-2 weeks):**
- Emoji: 😤 | Tint: deeper amber | Sparkline: amber→red, trending down
- Greeting: "Still here, Dean?"
- Roast: "It's been 12 days since your last scrub. Your score dropped from 68% to 63%."
- Action: "Your feed is getting worse, not better. Fix it."
- CTA: "Scrub now"

**Annoyed (2-4 weeks):**
- Emoji: 😡 | Tint: red | Sparkline: red, downward
- Greeting: "We need to talk, Dean."
- Roast: "Remember when you said you'd fix your feed? That was 3 weeks ago. You've subscribed to 4 more channels since then."
- Action: "Seriously. 52 channels you've never watched. Just sitting there. Judging you."
- CTA: "Fix this mess"

**Giving up (4+ weeks):**
- Emoji: 💀 | Tint: grey | Border: dashed | Sparkline: grey, flat
- Greeting: "Fine. Whatever."
- Roast: "At this point I think you and your 52 dead channels deserve each other."
- Action: "I'll be here when you're ready. If you're ever ready."
- CTA: "Prove me wrong"

### Score history tracking
Store score history as a JSON array on the user profile:

```sql
ALTER TABLE profiles ADD COLUMN last_critic_action timestamptz;
ALTER TABLE profiles ADD COLUMN score_history jsonb DEFAULT '[]';
```

Each entry: `{date, score}`. Append on login/sync. Cap at 30 entries. The sparkline in the critic card renders the last 10-14 data points. Sparkline dot colours match the score tier at that point (mint/amber/red).

### Home page structure (above the fold)
1. **Critic banner** — score ring, emoji, greeting, roast, sparkline, share button. Tinted background based on mood.
2. **Action card** — problem breakdown (3 items with coloured dots and counts), scrub CTA, "maybe later" dismiss. Left border escalates with mood.
3. **New from favourites** — large video card grid (4 columns desktop, 2 mobile). Borderless cards with rounded thumbnails and hover overlay. NEW badges and durations.

### Home page structure (below the fold)
4. **Today summary bar** — single clickable row: "42 new videos today across 8 categories." Overlapping category dots. Links to Feed.
5. **Recent activity** — timeline of scrubs, sorts, favourites, badge earned.
6. **Discover teaser** — 3 new channel recommendations with avatars. Links to Discover.

### Feed health thermometer
Gradient bar from red through amber to mint with personality labels:
- 0-30%: "Dumpster fire"
- 30-50%: "Needs an intervention"
- 50-70%: "Getting there"
- 70-85%: "Looking sharp"
- 85-95%: "Almost perfect"
- 95-100%: "Suspiciously clean. Are you even subscribed to anything?"

### Achievement badges
Earned badges with cheeky descriptions:
- **First scrub** — "You finally cleaned up your feed. Proud of you."
- **Ghost hunter** — "Removed 10 channels that haven't uploaded in months."
- **Serial subscriber** — "5 new subscriptions in one week. Calm down."
- **Category royalty** — "Every single subscription is categorised. Perfection."
- **Picky viewer** — "Kept fewer than 50 subscriptions. Quality over quantity."
- **Streak machine** — "Use subscrub for 30 days straight." (locked state shows progress)

### Empty states
Every empty state has personality:
- No new videos: "Nothing here. Your favourites haven't uploaded anything. Maybe they need a subscrub too."
- All clean (no inactive): "Spotless. Not a single slacker in sight. Your feed is cleaner than your browser history."
- No search results: "Couldn't find that. Either it doesn't exist or YouTube's hiding it from us."

### Unsubscribe confirmations
Personalised roast using real data: "You were subscribed for 3 years and watched 2 videos. That's commitment to something, just not their content." Button labels: "Give them another chance" / "Break up"

### Re-subscribe shame
Toast notification when someone re-follows a channel they previously removed: "Welcome back to [channel name]. We won't tell anyone about the breakup."

### Weekly nudge
Dashboard notification: "Your feed got messier this week. 6 new dead channels crept in. Your score dropped from 82% to 74%. 30 seconds to fix it." With a "Quick scrub" action button.

### Subscrub alert
Notification card for inactive users: "You've been a sub-slacker lately. Your feed's getting cluttered again — time for a quick scrub."

### Video click tracking

**Concept:** Every time a user clicks a video in subscrub, we log it. Over time this builds a lightweight watch history without needing Takeout data or extra permissions. The data accumulates naturally as they use the product.

**Data captured per click:** user_id, video_id, channel_id, category_id, timestamp.

**Table:**
```sql
CREATE TABLE public.video_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  video_id text NOT NULL,
  channel_id text NOT NULL,
  category_id uuid REFERENCES public.categories(id),
  clicked_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

**What it enables (after ~50+ clicks over a couple of weeks):**

- Subscription critic score improves — factors in "channels you never click on" alongside inactive channels
- Category insights — "You spend 68% of your time in Tech and Gaming. Your 22 Music channels are basically decorative."
- Smarter roasts — "You scroll past VoxCraft every single time. At this point you're just keeping them around for emotional support."
- Better Discover recommendations — based on what they actually click, not just what they're subscribed to

All insights unlock automatically as click data accumulates. No feature gating — the product just gets smarter the more you use it.

### Video embedding
Videos play inline within the feed via embedded YouTube iframes — no modals, no redirects, no separate player page. The feed IS the player.

**Impact on stats:**
- Creator views: count normally (iframe views are real views)
- User's YouTube watch history: does NOT update (YouTube only tracks on youtube.com/app)
- subscrub tracking: logs click via events table (event: 'video_click')
- Watch duration: available via YouTube iframe API onStateChange callback (post-launch enhancement)

**Iframe parameters:**
```
autoplay=1&rel=0&modestbranding=1&enablejsapi=1&controls=1&origin=https://getsubscrub.com
```
- `rel=0` — related videos from same channel only
- `modestbranding=1` — removes YouTube logo from control bar (small one still appears on hover)
- `enablejsapi=1` — enables event listeners for play, pause, end states
- `controls=1` — YouTube's native controls fully accessible (settings, quality, fullscreen, captions)
- Must not overlay or obscure YouTube controls (API terms)
- Player minimum 200x200px, recommended 480x270px

No API quota cost. No special permissions.

### Feed page — Hover-to-preview

The core feed interaction. 3-column grid with large thumbnails. Hovering a card plays the video inline.

**Behaviour:**
- 400ms hover delay prevents accidental triggers while scrolling
- Thumbnail fades out (0.8s, 0.3s delay) revealing the YouTube iframe underneath already playing
- Video starts muted by default
- Mint border glow appears around the playing card
- Equaliser animation ("Playing") appears to the right of the card info
- Duration badge and play overlay fade out during playback
- YouTube's native controls are fully accessible (no overlay blocking them)
- Only one video plays at a time — hovering a new card stops the previous one

**Mute behaviour:**
- Each card has its own mute state (per-card, not global)
- Unmute button appears on the playing card (bottom-left of thumbnail)
- When muted: video stops on mouse leave (just previewing)
- When unmuted: video continues playing on mouse leave (committed to watching)

**Key principle:** The user never leaves the feed to watch a video. They browse by hovering, commit by unmuting, and go fullscreen via YouTube's native button if they want immersion.

### Feed page — Split view (multi-watch)

Two videos playing simultaneously, side by side. The feature that justifies watching on subscrub instead of YouTube.

**Use case:** Podcast audio + sports visuals. Music livestream + coding tutorial. Two camera angles of the same event.

**How it works:**
1. While browsing the feed, hover a video card — a "Split" button with a split-screen icon appears on the thumbnail (bottom-left, on hover)
2. Click "Split" — the video gets added to the split view container at the top of the feed
3. If no split view exists: creates one with the video in the left panel
4. If split view already has one video: adds to the right panel
5. If both panels are full: replaces the less recently interacted panel
6. Toast notification confirms: "Added to split view: [title]"
7. Page scrolls to the top to show the split view

**Split view container:**
- Sits at the top of the feed content area, above "Today" section
- Two video panels with a draggable resize handle between them
- Three layout presets: equal (50/50), left focus (60/40), right focus (40/60)
- Each panel has: YouTube iframe (full native controls accessible), info bar below with category badge, title, channel, equaliser, swap button, and close button
- No overlay on the iframe — all subscrub controls live in the info bar below each video

**Independent audio:**
- Each panel has its own mute/unmute state
- Typical use: sports on left (muted), podcast on right (unmuted)

**Floating mini bar:**
- When the user scrolls past the split view, a thin bar (34px) slides in below the category tabs
- Shows both video titles with category dots and equaliser state (muted/unmuted)
- "Back to split view" link scrolls to top
- Audio keeps playing regardless of scroll position — the mini bar is a reminder, not a controller

**Theatre mode (same feature, not separate):**
- Button in the split view to "black out" the rest of the UI — sidebar, topbar, and feed hide
- The two videos expand to fill the viewport
- Exit via button or Escape key
- Minimal effort: one CSS class toggle

**Limits:**
- Maximum 2 videos — not a video wall
- Split view is a persistent container, not a layout mode — the rest of the feed continues below it
- On mobile (<900px): panels stack vertically

### Blog card style
Each blog post gets a gradient banner (56px) at the top of its card using category-specific colours:

| Category | Gradient | Tag bg | Tag text |
|---|---|---|---|
| Product | `#1D9E75 → #3ECFA0` | `rgba(62,207,160,0.1)` | `#1D9E75` |
| Guide | `#185FA5 → #85B7EB` | `rgba(55,138,221,0.1)` | `#185FA5` |
| Data | `#BA7517 → #FAC775` | `rgba(239,159,39,0.1)` | `#854F0B` |
| Update | `#534AB7 → #CECBF6` | `rgba(176,124,237,0.1)` | `#534AB7` |
| Tutorial | `#993C1D → #F0997B` | `rgba(216,90,48,0.1)` | `#993C1D` |
| Opinion | `#993556 → #ED93B1` | `rgba(212,83,126,0.1)` | `#993556` |
| News | `#A32D2D → #F09595` | `rgba(226,75,74,0.1)` | `#A32D2D` |

Each card shows: gradient banner, category tag with colour, title (Outfit 15px 600), excerpt (2-line clamp), date + read time.

### Discover page

Personalised channel recommendations served from the `discover_channels` table (populated via admin-controlled enrichment using YouTube API). All sections exclude channels the user is already subscribed to.

**Launch sections (work immediately with enrichment data):**

1. **Popular in [top category]** — high subscriber-count channels matching the user's most-subscribed category. No personalisation needed beyond knowing their category distribution.

2. **Popular in [second category]** — same logic, second largest category. Showing two category sections immediately gives the page substance.

3. **Based on your favourites** — channels with matching topics/keywords to the user's favourited channels. Favourites are a stronger signal than subscriptions, so these recommendations feel more relevant even without watch data.

4. **Try something new** — cross-category recommendation. "Other users obsessed with Tech also have channels in the Education category." Powered by analysing category overlap across users. Needs 20-30+ users to show meaningful patterns. Pushes people outside their bubble.

5. **The Critic recommends a break** — mood-based counterbalance section. The Critic detects when a user's feed is heavy on intense categories (News, Politics, True Crime) and intervenes with wholesome alternatives: cooking, nature, animals, art, comedy, lo-fi music. Only shows when applicable to that user's feed. This isn't a standalone feature with its own branding — it's The Critic caring about you.

   Copy examples (in The Critic's voice):
   - "I've been watching you scroll through 8 news videos. Here's something lighter."
   - "Your feed is 40% News and Politics. Your cortisol levels called — they'd like a word."
   - "That's a lot of heavy stuff today. The Critic recommends a palate cleanser."
   - "It's January. Everyone's doom-scrolling. Here's your antidote."

   In the Feed page: appears as an inline break card between category groups after a cluster of heavy content. Dismissable, once per session.
   In Discover: appears as a recommendation section for finding new wholesome channels to subscribe to.
   Channels tagged as "wholesome" or "feel-good" during enrichment. Softer card treatment to distinguish from regular recommendations.

**Post-launch sections (need accumulated data):**

6. **Based on what you watch** — powered by click tracking data. After a few weeks of usage, this becomes the most accurate section. Show 2-3 results for free, blur the rest with a Pro badge as an upsell teaser.

7. **Users who watch [channel] also subscribe to...** — collaborative filtering. Needs 50+ users with overlapping subscriptions for statistically meaningful results. Starts obvious ("MKBHD → Linus Tech Tips") but gets interesting as user base grows and niche patterns emerge.

**Deferred sections (not worth building yet):**

- "Trending this week" — generic, YouTube already does this. Only worth adding if category-specific.
- "Rising creators" — requires tracking subscriber count changes over time through refresh cycles. Build once historical data exists.

**Data source:** `discover_channels` table, populated via admin-controlled enrichment (manual YouTube API calls from the admin page). Each channel has a `category` field for section filtering and is indexed by subscriber count for sorting. Minimum 1,000 subscribers threshold.

**Pro integration:** The free Discover page shows all launch sections fully. Pro adds the click-powered "Based on what you watch" section and the collaborative filtering section. The distinction is personalisation depth, not access.

### Channel notes

Free feature. Stays on the channel modal. Reframe the placeholder copy to make purpose obvious: "Why did you subscribe? What's worth watching?" — this turns a generic text box into a contextual prompt that people actually use.

### Video saves and collections

**Phased rollout — three stages:**

**Phase 1 — Watch Later (free, launch):**
Basic video bookmarking. Click "Save" on any video, it goes to a Watch Later list. No notes, no organisation, just a flat list. Accessible from the sidebar under Quick Access.

**Phase 2 — Annotated saves with private collections (Pro, post-launch):**
Pro users can add notes to saved videos: "The bit at 14:30 about pricing strategy", "Share with Sarah", "Rewatch this." Pro users can also create named collections to organise saves: "Weekend binge", "Work references", "Music production tutorials." Collections are private by default.

Database additions for Phase 2:
```sql
CREATE TABLE public.saved_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  video_id text NOT NULL,
  channel_id text,
  notes text,
  collection_id uuid REFERENCES public.collections(id) ON DELETE SET NULL,
  saved_at timestamptz DEFAULT now()
);

CREATE TABLE public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  description text,
  is_public bool DEFAULT false,
  sort_order int4 DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

All save features are free at launch: bookmarks, notes, and collections.

**Phase 3 — Shared collections / curated playlists (future, 6-12 months post-launch):**
Users can toggle a collection to public via a share link. Anyone with the link can view the playlist. Shared collections appear in Discover as user-curated content.

Later additions to Phase 3 (requires active user base):
- Community ratings on shared collections (thumbs up/down or 5-star)
- Comments on shared collections
- "Course" formatting — ordered steps, progress tracking for viewers
- Curator analytics — views, saves, ratings on your shared collections
- Featured placement in Discover for highly-rated collections
- Potential future paid tier: creator/curator tools could be the monetisation surface here (analytics, promotion, featured placement). Model TBD based on user behaviour.

**Key principle:** Each phase is independently valuable. Phase 1 works alone. Phase 2 works without Phase 3. Phase 3 only makes sense with an active community. Don't build the next phase until the current one is proven and used.

### Wellbeing features

Features tied to The Critic's personality that help users manage their viewing habits. These aren't health warnings — they're The Critic caring about you in character.

**The Critic recommends a break (feed palate cleanser):**
Inline break card in the Feed page that appears after a cluster of heavy content (News, Politics, True Crime). The Critic intervenes with 2-3 wholesome video suggestions. Dismissable, once per session. See Discover section for the channel recommendation version.

**Bedtime mode (post-launch):**
The Critic notices when the user is browsing late at night and comments on it. Escalates based on time and session activity. Implemented client-side using local time + session click count. No server-side logic needed.

Escalation:
- 11pm: subtle toast. "Getting late. Just saying."
- Midnight: direct. "It's midnight. You've watched 14 videos since 10pm."
- 1am: concerned. "It's 1am. I'm not judging. Actually, I am judging."
- 2am: giving up. "Fine. I'll be here when you wake up at noon."

The tone is caring, not preachy. It's The Critic's personality, not a health warning. The user can dismiss it and keep browsing — this is a nudge, not a lock.

Optional settings: users can set their own bedtime threshold in Settings, or disable it entirely. Default: enabled at 11pm.

**Rabbit holes — the tension:**
Uncontrolled rabbit holes at 2am are unhealthy — The Critic intervenes via bedtime mode. Intentional rabbit holes during the day (saved as collections, curated as playlists, shared as courses) are the product's value. The difference is awareness and agency:
- Bedtime mode gives awareness ("you've been here 2 hours")
- Collections give agency ("save this rabbit hole for later")

Both features can coexist. The Critic's bedtime nudge could even reference collections: "It's 1am and you've clicked on 12 music production videos. Want me to save these as a collection so you can pick up tomorrow?"

This framing turns a wellbeing feature into a conversion mechanism: the bedtime nudge naturally introduces the collections feature (Pro) at the exact moment the user has content worth saving.

---

## 7. Marketing strategy

### Core strategy: The Critic IS the marketing
The Critic is the brand. Not the features, not the design system, not the pricing — The Critic. Every marketing touchpoint should feel like it comes from or references The Critic. The product's personality is its competitive moat — someone can clone the features, they can't clone the character.

### The Critic as brand persona
The Critic is an entity within subscrub that analyses the user's feed and delivers verdicts. It has moods (encouraging → giving up), opinions, and a first-person voice. It's not a mascot — it's a columnist. Think of it as a character with:
- A name and title: "The Critic"
- A voice: first person, observational, dry humour, slightly exasperated
- Moods that escalate based on user behaviour
- Attribution on everything it says: "— The Critic, based on 326 subscriptions"

### Landing page (product-first, Critic second)
The landing page sells the problem/solution first, then introduces The Critic as the personality layer.

1. **Hero:** "Your YouTube subscriptions are a mess. subscrub fixes that." Product-first, clear value proposition. Stats bar (326 sorted, 14 categories, 52 flagged). Mini app preview showing the actual interface. CTA: "Get started free."
2. **Enter The Critic:** "Every kingdom needs a ruler." Two-card comparison: "A kind ruler" (encouraging, mint) vs "Or a tyrant" (annoyed, red). Introduces the character after the product is understood.
3. **How it works:** Connect → Auto-sort → Get your verdict → Scrub. Narrated by The Critic but focused on the practical steps.
4. **The Critic's patience:** Mood timeline showing the 5 escalation states with quotes. "Ignore it long enough and it gets personal."
5. **Features:** "Everything you need. Nothing you don't." Six feature cards + Free/Pro split comparison.
6. **Pricing:** "Start free. Go Pro when you're ready." Two-card layout, Free vs Pro.
7. **Story:** Personal founder quote about why subscrub exists.
8. **Final CTA:** "Your subscriptions won't scrub themselves."

**Visual effects:**
- Floating roasts: The Critic's commentary typed out at varying sizes (12-72px), opacities (2-18%), blur depths (0-6px), angles (-18° to +18°), and travel directions (8 patterns). Up to 12 active at once, spawning every 0.4-2s. Five depth layers create parallax effect. Hidden on mobile.
- Section separators: diagonal gradient washes between sections with colour progression (mint→amber→red→mint→purple→amber). 120px tall with gradient line and coloured dots.
- Section background glows: subtle radial gradients per section matching the content mood. Full-bleed behind max-width content.
- Trust badges: Google OAuth only, read-only access, no algorithm, 2-minute setup.

### The Critic animation (landing page + future video)
Animated sequence showing The Critic (chameleon) at work. Placeholder HTML mockup built, to be refined into a polished animation or video.

**Narrative sequence:**
1. The Critic sits on his throne (top-left), speech bubble to his right. Channel cards scroll past on a conveyor below. His eyes dart downward, tracking each channel. He stays mint. Speech bubble: "Premier League... Sports. Fine." "Andrew Huang... Music. Approved."
2. A dead channel approaches. The Critic turns amber. "Wait. What is this?" Then red: "DailyClick TV. No uploads in 14 months."
3. All other cards fade away — the dead channel is isolated and alone. It panics, sprouting legs and trembling in place.
4. The Critic doesn't move. He's too powerful for that. The channel card reaches The Critic's horizontal position. His tongue shoots out and snatches the card. It shrinks and spins into nothing.
5. Scrub popup: "No uploads in 14 months. 0 videos watched. Subscribed since 2019." Speech bubble: "Scrubbed. You're welcome."
6. The Critic turns mint. Other cards fade back in. Conveyor resumes. "Now, where were we..."

**Stats bar** (top-right) counts up throughout: Reviewed, Active, Scrubbed, Score.

**Key principle:** The Critic never chases. The tongue does the work. He is unbothered authority — channels come to him, not the other way around.

### "Roast my subscriptions" viral loop
The pre-signup hook: connect Google account → The Critic analyses → delivers the verdict → generates a shareable card. No account needed. The share card IS the ad.

The shareable card shows: The Critic's verdict, the score ring, the one-liner roast, and "Get your verdict at getsubscrub.com." Low scores drive "look how bad my feed is" sharing. High scores drive "beat this" sharing.

Share card formats:
- **Twitter/X landscape (1.91:1)** — score ring, The Critic's verdict, stat breakdown, branding
- **Instagram square (1:1)** — larger ring, centred roast copy, stat pills
- **Badge earned card** — badge icon, name, cheeky Critic commentary
- **Before/after comparison** — score improvement, "The Critic's verdict: Redemption arc"

### Social media: The Critic's account
The Critic tweets as itself — not the founder, not the brand. It has opinions, reacts to aggregate data, and has moods:

- "Someone just connected 847 subscriptions. I need a moment."
- "A user completed all 3 tasks today. I don't know what to do with my hands."
- "New achievement unlocked: 'Serial Subscriber.' This is not a compliment."
- "You're subscribed to 400 channels. You watch 12 of them. The other 388 are just paying emotional rent in your feed."
- "The average subscrub user removes 47 channels on their first scrub. That's 47 channels that were just... there."

### Reddit launch
Lead with The Critic's voice, not a product pitch. Post titles:
- "I built a tool that roasts your YouTube subscriptions — mine scored 43% (dumpster fire)"
- "The Critic gave me a 43%. It called my feed a dumpster fire. I deserved it."

Show real data, the breakdown, and The Critic's commentary. The product reveal comes naturally at the end.

Target subreddits: r/YouTube, r/SideProject, r/InternetIsBeautiful, r/gaming (gamer audience angle: "Your YouTube subscriptions are a raid boss. The Critic is your quest giver.")

### Gamer audience angle
A large portion of users will be gamers. The product already has gamification elements (score, badges, streaks, task list, rank progression). Lean into this for the gamer audience specifically:

- The Critic as a quest-giving NPC
- Tasks as a quest log
- Score tiers as rank progression
- Badges as achievements
- Seasonal resets: "March review: The Critic's verdict — Redemption arc"
- Optional leaderboard: "Your score is higher than 73% of subscrub users" (opt-in, anonymous)

What NOT to do: daily login rewards, points currencies, loot boxes, streak punishment. The gamification should feel like a fitness tracker, not a mobile game. Completing tasks makes your actual feed better — the reward is real, not artificial.

### Email newsletters from The Critic
Subject lines: "The Critic's weekly report: you got worse." / "6 channels died while you weren't looking." / "You earned a badge. It's not a good one." / "The Critic's March verdict: Redemption arc."

The newsletter sender name: "The Critic via subscrub" — not "subscrub" or a personal name.

Sent via Resend. Audience targeting: all subscribers, free only, pro only, active last 7 days, inactive 30+ days.

### Onboarding as meeting The Critic
The sync screen becomes the user's first meeting with The Critic. Progress steps are The Critic's commentary:
- "Checking subscriptions... 326. The Critic has seen enough."
- "Counting inactive channels... 52. The Critic is taking a deep breath."
- "Calculating your score... The Critic is trying to be kind."
- Final verdict: "The Critic's verdict: Getting there. Barely."

### Blog content
- "Meet The Critic — Why Your YouTube Subscriptions Need Roasting" (launch post)
- "Why I Built Subscrub" — personal, honest, leads with the problem (written, ready to publish)
- Data-driven: "The Critic Analysed 10,000 YouTube Subscriptions. Here's What It Found."
- SEO-targeted: "how to organise youtube subscriptions", "clean up youtube subscriptions", "youtube subscription manager"

Blog card gradient categories: Product (mint), Guide (blue), Data (amber), Update (purple), Tutorial (coral), Opinion (pink), News (red).

### Product Hunt
Launch with The Critic's voice. Tagline: "Meet The Critic. It analyses your YouTube subscriptions and gets increasingly annoyed until you fix them." Screenshots showing the mood escalation. First comment from The Critic's perspective.

### SEO
- Meta tags + Open Graph on all pages (OG image should show The Critic's verdict card)
- sitemap.xml via Next.js app/sitemap.ts
- robots.txt in public folder
- Submit to Google Search Console
- Blog content targeting long-tail queries
- Backlinks from Product Hunt, Reddit, AlternativeTo, directories

### Key principle
The Critic is the differentiator. The features are table stakes (any tool can sort subscriptions). The personality is the moat. If someone asks "what's subscrub?" the answer isn't "a YouTube subscription organiser." It's "it's this character that roasts your YouTube feed and gets angrier the longer you ignore it."

---

## 8. Legal

### Privacy policy
UK GDPR compliant. Includes Google API Services Limited Use disclosure. Covers: data collected (account info, YouTube subscriptions, usage data, Takeout data, technical data), third-party services (Google OAuth, Supabase, Vercel, Resend), data retention (30 day deletion after account closure), user rights, cookies (essential only), and contact info.

Route: `/privacy`

### Terms of service
UK jurisdiction (England and Wales courts). Covers: service description, account requirements (13+), permitted use, prohibited use, free/pro plan terms, data ownership, YouTube API compliance (links to YouTube ToS and Google Privacy Policy), IP, availability, limitation of liability, termination, and changes with 14 days notice.

Route: `/terms`

Both need a proper legal review before handling real user data at scale.

### YouTube API compliance

subscrub uses the YouTube Data API v3 and must comply with the YouTube API Terms of Service.

**What subscrub does (all compliant):**
- Read-only OAuth access to user subscriptions (minimum scopes)
- YouTube iframe embeds for video playback (official embed player, serves YouTube ads, counts views)
- RSS feeds for detecting new uploads (not subject to API terms — RSS is separate from the API)
- API calls for channel metadata only (names, thumbnails, subscriber counts, topics)
- Displays YouTube thumbnails linked to YouTube content

**What subscrub does NOT do:**
- Download, rip, or re-host video content
- Strip or bypass YouTube ads
- Bypass age restrictions or content restrictions
- Scrape data outside of the official API
- Claim YouTube content as its own
- Request write access or broader OAuth scopes than needed

**Required YouTube branding:**
- YouTube logo displayed near embedded players where required
- Links back to YouTube for video content
- "subscrub is not affiliated with or endorsed by YouTube or Google" in footer/FAQ

### Data caching policy

The YouTube API terms require that API-sourced data is refreshed periodically and that deleted content is eventually removed. This applies to data fetched via the API — not to data subscrub generates itself.

**Data that IS subject to API caching rules (refresh periodically):**
- Channel metadata: names, descriptions, thumbnails, subscriber counts, video counts, topics, country
- Video metadata: titles, thumbnails, durations (if cached via API)
- Channel status: whether a channel still exists on YouTube

**Data that is NOT subject to API caching rules (subscrub's own data):**
- User categories, subcategories, and channel assignments
- Favourites, notes, and channel organisation
- Click events and viewing activity (logged by subscrub, not from YouTube)
- Scores, critic history, score_history, last_critic_action
- Collections, saved videos, annotations
- Badges, streaks, and achievement data
- User preferences and settings

**Data obtained via RSS (not subject to API terms):**
- New video upload detection (video IDs, titles, publish dates from RSS feeds)
- RSS is a separate protocol, not the YouTube Data API

**Refresh requirements:**
- User channel metadata: refreshed on each sync (login/manual refresh)
- Discover channel metadata: refreshed via enrichment cycle, stale after 7 days, flagged for refresh
- General staleness threshold: any API-sourced data not refreshed in 30+ days should be flagged for the next enrichment run
- All API data uses `updated_at` timestamps to track freshness

**Cleanup jobs (post-launch):**
- Video cleanup: monthly check whether cached videos still exist on YouTube. If API returns 404, remove from cache.
- Channel cleanup: if a channel ID returns nothing from the API, remove from discover_channels and flag for user notification. "The Critic noticed one of your channels disappeared from YouTube."
- Deleted user data: when a user deletes their account, all their data (subscriptions, events, preferences, scores) removed within 30 days per privacy policy.

**API quota and approval:**
- Default quota: 10,000 units/day
- Current estimated usage: ~4,500-5,000 units/day at 100 users
- If growth requires more, apply for quota increase via Google Cloud Console
- Google reviews applications for API terms compliance — clean usage, proper branding, and a clear privacy policy are checked
- subscrub's architecture (RSS for uploads, API for metadata only) is efficient and would present well in a review

### Google OAuth scopes
Only request minimum scopes needed. Currently: read-only access to YouTube subscriptions. Verify the scopes in Google Cloud Console match what's documented in the privacy policy. Do not request write access or broader scopes.

### GDPR / UK data protection
- Clear data deletion process: account deletion removes all user data within 30 days
- Right to data export: users can request their data
- Cookie policy: essential cookies only, no tracking cookies
- Privacy policy accessible from every page (footer link)

### Trademark
- subscrub is not affiliated with or endorsed by YouTube or Google
- Add this disclaimer to: landing page footer, FAQ if created, About page if created
- "YouTube" is a trademark of Google LLC — use correctly, don't modify or abbreviate

---

## 9. Infrastructure checklist

### Domain (getsubscrub.com)
- DNS: A record → 76.76.21.21, CNAME www → cname.vercel-dns.com
- Managed at: GoDaddy (or Vercel DNS if migrated)
- SSL: Automatic via Vercel

### Vercel
- Production branch: main
- Preview branch: dev
- Environment variables split: production vs preview/development
- Cron jobs: configured in vercel.json (post-launch)

### Supabase
- Production project: connected to main branch deployments
- Test project: connected to dev branch and local development
- Auth: Google OAuth configured on both projects
- Test project redirect URLs: wildcard for Vercel preview URLs

### Google Cloud Console
- OAuth 2.0 credentials: redirect URIs for both production and test Supabase callbacks
- YouTube Data API v3: enabled
- Quota: 10,000 units/day default (apply for increase when needed)

### Resend
- Domain verified: getsubscrub.com
- DNS records: SPF, DKIM, DMARC added at registrar
- Free tier: 3,000 emails/month
- From address: hello@getsubscrub.com (or similar)
- Reply-to: configured to forward to personal email

### Old domain (usefreedly.com)
- Redirect to getsubscrub.com via Vercel
- Google OAuth redirect URIs updated
- Supabase auth URLs updated
- All code references updated from Freedly to subscrub

---

## 10. Roadmap

### Completed
- Landing page live at getsubscrub.com
- Design system (tokens + components)
- Dark and light theme support
- All mockup pages designed
- Privacy policy and terms of service
- Blog post ("Why I Built Freedly" — needs updating to subscrub)
- Resend email setup
- Google OAuth working on preview and production
- Test Supabase database with full schema
- Vercel preview deployments with separate test DB
- Git branching (main/dev)
- Manual RSS refresh working
- Domain migration from usefreedly.com to getsubscrub.com

### Before launch
- Get primary logomark (chameleon face, left variant) designed as production SVG — detailed + simplified versions
- Create simplified favicon from chameleon head silhouette with curled tail (question mark shape, 16px)
- Update landing page hero with "Meet The Critic" and chameleon visual
- Implement sync screen with personalised onboarding
- Trigger RSS refresh on first login
- Build the critic banner and action card for Home page (two-card split with mood escalation)
- Add The Critic logomark to critic banner next to "The Critic" label
- Implement typing animation on critic roast (first visit per session only)
- Implement breathing pulse on score ring
- Build critic task list with checkboxes, progress bar, and reactive quips
- Implement score history tracking (last_critic_action + score_history on profiles table)
- Build Home page with favourites grid, today summary bar, activity timeline
- Add "Discover — Coming soon" greyed out item in sidebar nav
- Rename pages: Dashboard→Home, Feeds→Feed, Analytics→Insights
- Move categories from sidebar to content area as horizontal tabs (dot + name format)
- Build category management modal (rename, recolour, subcategories, reorder)
- Implement 3 view modes for Subscriptions (table, grid, compact list)
- Build the subscription critic / feed health scoring
- Create at least the "First scrub" and "Ghost hunter" badges
- Add cheeky empty states throughout the app
- Implement video click tracking via events table (event: 'video_click', metadata: {video_id, channel_id, category, source})
- Build hover-to-preview feed (3-column grid, 400ms hover delay, per-card mute, mint border glow, equaliser indicator)
- Build split view (click-to-split button on feed cards, two-panel container, independent mute, resize handle, layout presets)
- Build floating mini bar for split view (appears on scroll, shows both titles + mute state, "Back to split view" link)
- Build split view theatre mode (CSS class toggle to hide sidebar/topbar/feed, videos fill viewport)
- Apply refined design tokens (softer borders, slower transitions, muted category colours, ghost buttons)
- Add staggered fade-up animations on category/view switching
- Apply blog card gradient banners per category
- Record 30-60 second demo video for landing page
- Update blog post and all references from Freedly to subscrub
- Get legal review of privacy policy and terms

### Post-launch
- Commission full chameleon mood variant SVGs (sunglasses version + eye expression variants)
- Implement dynamic colour swap on chameleon SVG based on critic mood (CSS fill)
- Set up social media accounts with chameleon avatar (sunglasses variant)
- Introduce "The Colony" (ant army) branding when automation features go live
- Implement cron job for automatic RSS refresh ("The night shift is working")
- Implement video metadata backfill via YouTube API
- Implement monthly video cleanup job (check cached videos still exist, remove 404s)
- Implement channel cleanup check (remove deleted channels from discover_channels, notify users)
- Add staleness flag for API data not refreshed in 30+ days
- Add "not affiliated with YouTube" disclaimer to landing page footer
- Build shareable score cards (server-side image generation)
- Implement full achievement badges system
- Build click-powered insights (category distribution, never-clicked channels, smart roasts)
- Build admin enrichment panel (manual fill gaps, discover channels, refresh stale)
- Create discover_channels table in both production and test databases
- Seed discover_channels table via admin enrichment (all 8 categories)
- Build Discover page with launch sections: "Popular in [category]" x2, "Based on your favourites" (after 20+ users)
- Discover page: add "Try something new" cross-category section (needs 20-30+ users)
- Discover page: add "The Critic recommends a break" wholesome channel section (tag channels during enrichment)
- Discover page: add "Based on what you watch" section (needs click data accumulation)
- Discover page: add collaborative filtering "Users who watch X also subscribe to..." (needs 50+ users)
- Add Discover teaser card to Home page once Discover is live
- Build admin dashboard with real Supabase queries
- Implement category correction consensus algorithm
- Explore monetisation: ad-supported, affiliate, scale-based freemium, or tip jar — based on observed user behaviour
- Weekly nudge notifications
- Unsubscribe confirmation roasts
- Re-subscribe shame toasts
- Competitive score sharing between users
- Launch on Product Hunt, Reddit, Hacker News
- Implement bedtime mode (client-side time check + session click count, escalating Critic toasts)
- Add bedtime threshold setting to Settings page (default 11pm, disable option)

### Phase 2 features (after initial traction, 1-3 months post-launch)
- Video saves: annotated saves with private collections
- saved_videos and collections database tables
- Collections management UI (create, rename, reorder, delete)
- Bedtime mode → collections conversion: "Want me to save these as a collection so you can pick up tomorrow?"

### Phase 3 features (with active community, 6-12 months post-launch)
- Public shared collections via share link
- Shared collections appear in Discover as user-curated content
- Community ratings on shared collections
- Comments on shared collections
- "Course" formatting with ordered steps and progress tracking
- Curator analytics (views, saves, ratings)
- Featured placement in Discover for top-rated collections
- Evaluate creator/curator paid tier based on demand — model TBD

---

## 11. Mockup files reference

All mockups are HTML files that can be opened in a browser:

- `freedly-landing.html` — original landing page
- `freedly-home-dashboard.html` — home dashboard (dark)
- `freedly-home-light.html` — home dashboard (light)
- `freedly-dashboard.html` — subscriptions v1 (collapsible sidebar)
- `freedly-dashboard-v2.html` — subscriptions v2 (subcategories + chips)
- `freedly-discover.html` — discover page
- `channel-modal.html` — channel modal (light)
- `freedly-channel-modal-dark.html` — channel modal (dark)
- `freedly-admin.html` — admin overview dashboard
- `freedly-admin-newsletter.html` — admin newsletter compose
- `subscrub-hero-v2.html` — hero with floating animations
- `subscrub-landing-v2.html` — competitor redesign in subscrub style
- `subscrub-critic.html` — subscription critic + alert cards
- `subscrub-personality.html` — roasts, badges, empty states, unsubscribe confirms
- `subscrub-share-cards.html` — shareable social media cards
- `subscrub-sync-screen.html` — personalised sync/onboarding experience (original, narrow centred layout)
- `subscrub-sync-v2.html` — sync screen v2 (split layout with chameleon placeholder — for when mascot is ready)
- `subscrub-sync-v3.html` — sync screen v3 (centred, no mascot, Critic voice via speech bubble — current version)
- `subscrub-feeds.html` — feeds page with sections, subcategories, Critic break card (early version, superseded by hover-to-preview)
- `subscrub-page-headers.html` — consistent page header patterns (6 variants + mobile)
- `subscrub-dashboard-tiers.html` — dashboard with tier comparison (outdated — all features now free)
- `subscrub-dashboard-critic.html` — dashboard with critic card as right-side panel
- `subscrub-page-personalities.html` — page personality comparison + category navigation reimagined
- `subscrub-home-revised.html` — Home page with thin critic banner + favourites grid
- `subscrub-home-critic-moods.html` — Home page with escalating critic moods (5 states, interactive)
- `subscrub-home-critic-typing.html` — Home page with typing animation, breathing pulse, task list with reactive quips
- `subscrub-subscriptions-views.html` — Subscriptions with 3 view modes + category management modal
- `subscrub-topbar-revised.html` — decompressed topbar layouts for Feed and Subscriptions (before/after comparison)
- `subscrub-landing-critic.html` — landing page v2 (Critic-led, superseded by v3)
- `subscrub-landing-v3.html` — landing page v3 (product-first hero + floating roasts + gradient separators)
- `subscrub-critic-animation.html` — The Critic animation: chameleon reviewing/snatching channels (placeholder for production)
- `subscrub-video-modal.html` — single video modal with channel info and Critic note (superseded by inline approach)
- `subscrub-video-modal-3col.html` — 3-column video modal with More From / Discover panels (superseded by inline approach)
- `subscrub-inline-video.html` — inline 3-col expand with side panels (superseded by simpler approach)
- `subscrub-inline-expand.html` — inline card expansion, full-width (superseded)
- `subscrub-inline-expand-v3.html` — inline expand with directional animation (superseded)
- `subscrub-inline-expand-v4.html` — inline expand with gap-fill attempts (superseded by hover-to-preview)
- `subscrub-feed-hover-play.html` — feed with hover-to-preview video playback (current feed approach)
- `subscrub-split-view.html` — split view with click-to-split buttons, floating mini bar, theatre mode concept
- `subscrub-tokens-refined.css` — refined design tokens (softer borders, transitions, muted colours)

### Code files
- `rss-refresh.ts` — RSS fetcher, refresh API route, client hook, refresh button component
- `cron-and-backfill.ts` — cron job route, metadata backfill route, vercel.json config
- `channel-enrichment.ts` — YouTube API utilities, enrichment cron job, discover_channels schema, Discover API route
- `test-schema.sql` — complete test database schema

### Style files
- `freedly-design-system.css` — combined tokens + components (original)
- `components.css` — components only (separated)
- `subscrub-tokens-refined.css` — refined tokens with softer surfaces, slower transitions, muted category colours, ghost buttons

### Assets
- `subscrub-sparkle.svg` — two four-pointed sparkle stars (mint), used next to The Critic logomark and as decorative accents

### Documents
- `privacy-policy.md` — privacy policy
- `terms-of-service.md` — terms of service
- `why-i-built-freedly.md` — blog post (needs subscrub rebrand)