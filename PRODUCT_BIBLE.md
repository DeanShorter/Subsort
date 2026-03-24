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

**Pricing:**
- Free tier: Manual sorting, feed health check, basic feeds, category browsing
- Pro tier (£4.99/month): Auto cleanup, smart categorisation, Discover page, watch analytics (Takeout upload), full roast with watch history data

---

## 2. Brand identity

### Name
"subscrub" — "sub" from subscriptions, "scrub" from cleaning up dead weight. One word, all lowercase.

### Logo
Wordmark in Outfit 700, 22px, -0.5px letter-spacing. "sub" in mint (#3ECFA0), "scrub" in primary text colour. Same split in both dark and light themes.

```html
<a class="logo"><span>sub</span>scrub</a>
```

### Favicon
Feed lines concept: three staggered horizontal bars on dark background, top bar in mint. Rounded square container. Works at 16px.

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

Examples:
- "Your feed scored 43%. Apparently that's a dumpster fire."
- "347 channels. That's not a subscription list, that's a census."
- "You've been subscribed for 3 years and watched 2 videos. That's commitment to something, just not their content."

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
**Sidebar top:** Home, Subscriptions, Feeds, Discover
**Sidebar middle (Quick access):** All, Favourites, Recently watched
**Sidebar bottom:** Categories with expandable subcategories
**Sidebar footer:** Settings, Blog, Pro

### Pages
- `/dashboard` — Home: greeting, stats cards, favourites feed, category breakdown
- `/subscriptions` — All channels with sidebar category filtering and topbar subcategory chips
- `/feeds` — Category-based video feeds
- `/discover` — Personalised channel recommendations in categorised sections (see Discover page spec in section 6)
- `/settings` — Account, preferences, connected services
- `/privacy` — Privacy policy
- `/terms` — Terms of service
- `/blog` — Blog posts

### Admin pages (separate layout)
- `/admin` — Overview dashboard with stats, signups chart, feature usage, recent signups table
- `/admin/newsletter` — Compose and send newsletters with audience targeting

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
- `video_clicks` — logs every video click with user, video, channel, category, timestamp (powers free tier insights)
- `feed_cache` — cached feed data with expiry
- `watch_history` — uploaded Takeout watch history (Pro tier, via Takeout upload)
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

**Free tier roast** uses: subscription count, inactive channels, category distribution, uncategorised channels. No watch history data.

**Pro tier roast** adds: never-watched channels, watch frequency, category vs actual viewing habits (the fitness/gaming callout).

### Dynamic roast copy
Roasts are built dynamically based on user data. Templates scale by subscription count (under 100 / 100-250 / 250-400 / 400+), category skew, inactive channel severity, and uncategorised count. Always observational, never mean.

### Subscription critic card
Dashboard widget showing subscrub score (percentage), score bar, breakdown rows (never watched, inactive, clickbait), and "Let's fix this" CTA. Score colour: red (0-40), amber (40-70), mint (70-100).

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

### Video click tracking (free tier intelligence)

**Concept:** Every time a free user clicks a video in subscrub, we log it. Over time this builds a lightweight watch history without needing Takeout data or extra permissions. The data accumulates naturally as they use the product.

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

**What it enables for free users (after ~50+ clicks over a couple of weeks):**

- Subscription critic score improves — factors in "channels you never click on" alongside inactive channels
- Category insights — "You spend 68% of your time in Tech and Gaming. Your 22 Music channels are basically decorative."
- Smarter roasts — "You scroll past VoxCraft every single time. At this point you're just keeping them around for emotional support."
- Better Discover recommendations — based on what they actually click, not just what they're subscribed to

**Free-to-Pro conversion strategy:**

The free tier gets increasingly smart over time as click data accumulates. Show the headline insight for free, tease the depth for Pro:

- Free: "You've clicked on videos from 34 of your 347 channels this month."
- Pro upsell: "Want to see which 313 you're ignoring? Upgrade to Pro for the full breakdown."

- Free roast: "You clicked on 0 News videos this month despite being subscribed to 34 News channels."
- Pro roast adds: "And looking at your full YouTube watch history, you haven't watched a News video since October 2024. Just saying."

**Upsell touchpoints:**
- Dashboard card after enough click data: "Based on your activity in subscrub, you've clicked on 12 Entertainment videos this week but 0 from your 34 News channels. Full watch analytics can tell you exactly where your time goes."
- Discover page: show 2 personalised recommendations based on clicks, blur the rest with a Pro badge
- Subscription critic: show the click-enhanced score, teaser for the full Takeout-powered breakdown

**Key principle:** The free tier should feel increasingly smart over time. The user thinks "this app really knows me" — then the Pro upsell is "imagine what it could tell you with your full watch history." They're already sold on the concept because the free version proved it works.

### Discover page

Free tier feature. Personalised channel recommendations served from the `discover_channels` table (populated via admin-controlled enrichment using YouTube API). All sections exclude channels the user is already subscribed to.

**Launch sections (work immediately with enrichment data):**

1. **Popular in [top category]** — high subscriber-count channels matching the user's most-subscribed category. No personalisation needed beyond knowing their category distribution.

2. **Popular in [second category]** — same logic, second largest category. Showing two category sections immediately gives the page substance.

3. **Based on your favourites** — channels with matching topics/keywords to the user's favourited channels. Favourites are a stronger signal than subscriptions, so these recommendations feel more relevant even without watch data.

4. **Try something new** — cross-category recommendation. "Other users obsessed with Tech also have channels in the Education category." Powered by analysing category overlap across users. Needs 20-30+ users to show meaningful patterns. Pushes people outside their bubble.

5. **Amygdala Scrub** — mood-based counterbalance section. Detects when a user's feed is heavy on intense categories (News, Politics, True Crime) and offers wholesome alternatives: cooking, nature, animals, art, comedy, lo-fi music. Only shows when applicable to that user's feed.

   Copy examples:
   - "Your feed is 40% News and Politics. Your cortisol levels called — they'd like a word. Here are some channels that might help."
   - "It's January. Everyone's doom-scrolling. Here's your antidote."
   - "Feeling drained from the terrible news in the world? Check out some of these wholesome channels to scrub your amygdala clean."

   Channels tagged as "wholesome" or "feel-good" during enrichment. Softer card treatment to distinguish from regular recommendations.

**Post-launch sections (need accumulated data):**

6. **Based on what you watch** — powered by click tracking data. After a few weeks of usage, this becomes the most accurate section. Show 2-3 results for free, blur the rest with a Pro badge as an upsell teaser.

7. **Users who watch [channel] also subscribe to...** — collaborative filtering. Needs 50+ users with overlapping subscriptions for statistically meaningful results. Starts obvious ("MKBHD → Linus Tech Tips") but gets interesting as user base grows and niche patterns emerge.

**Deferred sections (not worth building yet):**

- "Trending this week" — generic, YouTube already does this. Only worth adding if category-specific.
- "Rising creators" — requires tracking subscriber count changes over time through refresh cycles. Build once historical data exists.

**Data source:** `discover_channels` table, populated via admin-controlled enrichment (manual YouTube API calls from the admin page). Each channel has a `category` field for section filtering and is indexed by subscriber count for sorting. Minimum 1,000 subscribers threshold.

**Pro integration:** The free Discover page shows all launch sections fully. Pro adds the click-powered "Based on what you watch" section and the collaborative filtering section. The distinction is personalisation depth, not access.

---

## 7. Marketing strategy

### Core strategy
The product's personality IS the marketing. Every touchpoint inside the product is a potential social media post. Build the product to be shareable by default.

### "Roast my subscriptions" viral loop
Let people run the subscription analysis without signing up. Connect Google account → get the roast → see the score → share. The share card is the ad. Every share drives curious people to try their own score.

### Shareable score cards
Generated server-side via @vercel/og or satori. Four formats:
- **Twitter/X landscape (1.91:1)** — score ring, verdict, stat breakdown, "Get your score at getsubscrub.com"
- **Instagram square (1:1)** — larger ring, centred roast copy, stat pills
- **Badge earned card** — badge icon, name, cheeky description, subscrub branding
- **Before/after comparison** — subscription count bars + score improvement, "from dumpster fire to looking sharp"

Low score cards drive "look how bad my feed is" sharing. High score cards drive "beat my score" competitive sharing.

### Social media (Twitter/X)
Tweet the way subscrub talks. Observational humour about subscription habits without always mentioning the product:
- "You're subscribed to 400 channels. You watch 12 of them. The other 388 are just paying emotional rent in your feed."
- "The average subscrub user removes 47 channels on their first scrub. That's 47 channels that were just... there. Watching you not watch them."

### Reddit launch
Lead with the roast, not the product. Post titles like "I analysed my 400+ YouTube subscriptions and the results were embarrassing." Show real data and the breakdown. The product reveal comes naturally at the end.

Target subreddits: r/YouTube, r/SideProject, r/InternetIsBeautiful

### Blog content
- "Why I Built Subscrub" — personal, honest, leads with the problem (written, ready to publish)
- Data-driven posts: "We analysed 10,000 YouTube subscriptions. Here's what we found."
- SEO-targeted: "how to organise youtube subscriptions", "clean up youtube subscriptions", "youtube subscription manager"

### Product Hunt
Launch with attitude. Tagline: "Your YouTube subscription page is a mess and you know it." Screenshots, first comment, and all copy in the subscrub voice.

### Email newsletter
Subject lines match the voice: "Your feed got worse this week. Sorry." / "6 channels died while you weren't looking." / "You earned a badge. It's not a good one."

Sent via Resend. Audience targeting: all subscribers, free only, pro only, active last 7 days, inactive 30+ days.

### SEO
- Meta tags + Open Graph on all pages
- sitemap.xml via Next.js app/sitemap.ts
- robots.txt in public folder
- Submit to Google Search Console
- Blog content targeting long-tail queries
- Backlinks from Product Hunt, Reddit, AlternativeTo, directories

---

## 8. Legal

### Privacy policy
UK GDPR compliant. Includes Google API Services Limited Use disclosure. Covers: data collected (account info, YouTube subscriptions, usage data, Takeout data, technical data), third-party services (Google OAuth, Supabase, Vercel, Resend), data retention (30 day deletion after account closure), user rights, cookies (essential only), and contact info.

Route: `/privacy`

### Terms of service
UK jurisdiction (England and Wales courts). Covers: service description, account requirements (13+), permitted use, prohibited use, free/pro plan terms, data ownership, YouTube API compliance (links to YouTube ToS and Google Privacy Policy), IP, availability, limitation of liability, termination, and changes with 14 days notice.

Route: `/terms`

Both need a proper legal review before handling real user data at scale.

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
- Implement sync screen with personalised onboarding
- Trigger RSS refresh on first login
- Build the subscription critic / feed health scoring
- Create at least the "First scrub" and "Ghost hunter" badges
- Add cheeky empty states throughout the app
- Implement video click tracking (video_clicks table + logging on every video card click)
- Build admin enrichment panel (manual fill gaps, discover channels, refresh stale)
- Seed discover_channels table via admin enrichment (all 8 categories)
- Build Discover page with launch sections: "Popular in [category]" x2, "Based on your favourites"
- Create discover_channels table in both production and test databases
- Record 30-60 second demo video for landing page
- Update blog post and all references from Freedly to subscrub
- Get legal review of privacy policy and terms

### Post-launch
- Implement cron job for automatic RSS refresh
- Implement video metadata backfill via YouTube API
- Build shareable score cards (server-side image generation)
- Implement full achievement badges system
- Build click-powered free tier insights (category distribution, never-clicked channels, smart roasts)
- Build Pro upsell touchpoints based on click data (blurred recommendations, teaser breakdowns)
- Discover page: add "Try something new" cross-category section (needs 20-30+ users)
- Discover page: add "Amygdala Scrub" wholesome channel section (tag channels during enrichment)
- Discover page: add "Based on what you watch" Pro section (needs click data accumulation)
- Discover page: add collaborative filtering "Users who watch X also subscribe to..." (needs 50+ users)
- Build admin dashboard with real Supabase queries
- Implement category correction consensus algorithm
- Set up Google AdSense for free tier (or affiliate partnerships)
- Weekly nudge notifications
- Unsubscribe confirmation roasts
- Re-subscribe shame toasts
- Competitive score sharing between users
- Launch on Product Hunt, Reddit, Hacker News

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
- `subscrub-sync-screen.html` — personalised sync/onboarding experience

### Code files
- `rss-refresh.ts` — RSS fetcher, refresh API route, client hook, refresh button component
- `cron-and-backfill.ts` — cron job route, metadata backfill route, vercel.json config
- `channel-enrichment.ts` — YouTube API utilities, enrichment cron job, discover_channels schema, Discover API route
- `test-schema.sql` — complete test database schema

### Style files
- `freedly-design-system.css` — combined tokens + components (original)
- `components.css` — components only (separated)

### Documents
- `privacy-policy.md` — privacy policy
- `terms-of-service.md` — terms of service
- `why-i-built-freedly.md` — blog post (needs subscrub rebrand)