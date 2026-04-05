# Subscrub — Product Bible

*Last updated: 5 April 2026*

---

## 1. Product Overview

**Subscrub** (subscrub.me) is a YouTube subscription organiser built as a solo product. The core philosophy is selling convenience rather than running a traditional business — lean and focused over feature-heavy. Success looks like a tight, polished product that drives upgrades through genuine utility, not bloat.

**Name origin**: "Sub" (subscription) + "scrub" (to clean up, review, maintain). Mycelium networks are nature's cleanup crew — they decompose, recycle, and redistribute. That's what the product does with subscriptions.

### Monetisation

- **Free tier**: Capped at 50 subscriptions, all features included — deliberately tight to drive upgrades
- **Pro tier**: £4.99/month or £39.99/year (33% annual discount) — unlimited subscriptions plus Chrome extension as a perk
- **50-sub cap logic**: enough to show value, too tight for real use. The upgrade prompt is delivered in the system's direct voice, not a character performance

### Solo Builder Principles

- Decisions reduce operational complexity and avoid scope creep
- Product bible maintained as a living document
- Marketing strategy built around product value, not character storytelling
- The product is the sell — the network concept adds depth without demanding attention

---

## 2. Brand Identity

### Concept: The Mycelium Network

Subscrub's identity is built around the concept of a mycelium network — a vast, intelligent system working quietly underneath a simple surface. The user sees a clean, minimal interface. Underneath, the system is monitoring channel health, detecting patterns, tracking relationships, and surfacing what matters.

The network concept influences how features are described on the landing page and how new features are introduced, but it does NOT appear in the in-product UI language. Users see "subscriptions," "categories," and "channels" — not "nodes," "clusters," or "signals."

### Logo

**Mark**: Mushroom silhouette. Solid fill, no outline, no face. Clean geometric shape — dome cap with subtle dot detail, simple tapered stem. Works at every size from favicon (16px) to social avatar (400px+).

**Colours**: Default is brand green (#00A651) on white, or white on green. The mushroom cap colour shifts for mood states:
- **Green (#00A651)** — healthy, positive, all clear
- **Orange (#FF8C42)** — attention needed, action required
- **Iris (#8B6FE8)** — discovery, suggestions, observations

**Key constraint**: The mushroom must NOT resemble Nintendo's Toad character. No thick black outlines, no cartoon spots, no round body/stem, no face. Keep it geometric, modern, and abstract enough to read as a brand mark rather than a game character.

### Voice

**Tone**: Informed and direct, with warmth underneath. Not cheeky, not corporate, not performative. The system states facts, explains why they matter, and suggests actions. Personality comes through word choice and brevity, not jokes or catchphrases.

**Principles**:
- Say what it is, then say why it matters
- Be specific over clever — numbers and concrete outcomes over quips
- Warm, not cheeky — helpful and considered, not performing for an audience
- Use "you" and "your" freely, minimise "I" — the focus is on the user's data, not the system's personality
- Allow personality in small doses through word choice ("Worth a look," "Your call," "Noted")
- Reactions are brief acknowledgements, not commentary — most actions get no reaction at all

**Phrases the system uses**: "Noted." / "Worth a look." / "Your call." / "All clear." / "Done." / "Worth reviewing."

**Phrases the system never uses**: "Great job!" / "Awesome!" / "Your funeral." / "I'm almost disappointed." / anything self-referential or performative

**Example copy**:
- Uncategorised: "7 channels aren't categorised yet. Auto-sort can handle most of these."
- Dead channels: "4 channels haven't uploaded in over a year. Worth reviewing — they're taking up space without giving anything back."
- Health score high: "Everything's in good shape. Nothing needs your attention right now."
- Health score low: "There's a fair bit to work through here. Start with the uncategorised channels — that'll make the biggest difference."

### Colour System

Colour-as-navigation: each colour maps to a page.

| Colour | Hex | Page | Meaning |
|--------|-----|------|---------|
| Green | #00A651 | Subscriptions | Organisation, health |
| Orange | #FF8C42 | Feed | Incoming content |
| Iris | #8B6FE8 | Discover | Curiosity, exploration |
| Ocean | #2D9CDB | Stash | Saved for later |

**Soft variants** for backgrounds: green-soft (#E8F8EF), orange-soft (#FFF2E8), iris-soft (#F0ECFD), ocean-soft (#E8F4FC)

**Text variants** for labels on soft backgrounds: green-text (#006B35), orange-text (#8A4A15), iris-text (#4A3A8A), ocean-text (#155A80)

**Structural colours**: Background #f4f4f5, card #fff, text #1a1a1a, text-mid #555, text-light #999

### Typography

- **Headings**: Outfit 700
- **Body**: DM Sans 400/500
- **Wordmark**: Dark pill (#1a1a1a background), Outfit 700, 14px, tight tracking (-0.3px), "SUB" in green + "SCRUB" in white, border-radius: 20px, capitalised
- **In-sentence usage**: Capitalised "Subscrub"

### Design System

- **Card tiers**: Shadow-bordered cards (2px solid #1a1a1a border + 4px box-shadow) for feature/system cards. Clean cards (0.5px border, no shadow) for content cards (feed videos, channel lists, domain summaries). Shadow = system speaking. Clean = content flowing through.
- **Structural borders**: 3px thick borders separate nav from content and major sections
- **Border radius**: 16px cards, 12px inner elements
- **Background**: #f4f4f5 for dashboard/background areas, white for page content

---

## 3. Navigation Structure

Sidebar nav with colour dots for core pages, divider, then utility pages:

1. Home
2. Subscriptions (green dot)
3. Feed (orange dot)
4. Discover (iris dot)
5. *divider*
6. Stash (ocean dot)
7. Insights
8. The Critic (notification dot when new recommendations)
9. *spacer*
10. Settings (bottom)

**Notification icon**: Top nav bar (not sidebar), shows dot when new recommendations land on The Critic page.

---

## 4. Pages

### 4.1 Dashboard (Home)

The dashboard is the "good morning" screen — what's happening in your subscription world, not what's wrong with it. Cleanup lives on The Critic page.

**Structure**:
1. **Greeting + date** — "Morning, Dean." with today's date
2. **Critic strip** — single line: health score circle (32px) + system quote + "The Critic →" link
3. **Quick stats row** — 4 cards: total subs, uploads this week, longest subscription, newest subscription
4. **Two-column layout**:
   - Left: Today's feed summary (video count, category breakdown bars) + On This Day (subscription anniversary)
   - Right: Your favourites (latest uploads from favourited channels) + Latest uploads (5 most recent)

### 4.2 Subscriptions Page

**Layout**: Nav | Category Panel | Table | Channel Detail Panel (when open)

**Action bar** (replaces old observation cards): Compact collapsible bar between page header and controls row.
- Left: clickable stat pills (uncategorised, dead, inactive, active) — each filters the table
- Centre: system inline prompt with highest-priority recommendation + CTA
- Right: "The Critic →" link + collapse chevron
- Clean state: green success bar with Critic link + dismiss
- Remembers collapsed/expanded preference in localStorage

**Category panel (slide-in, left)**: Multi-select checkboxes, per-category hover actions (add sub, edit, delete), always-visible chevrons for subcategories (right-aligned), collapsible to 40px strip with vertical text + count badge. Open by default on first visit, remembers preference.

**Controls row**: filter tags + clear all on left; search, status, sort, columns on right.

**Channel detail panel (slide-in, right)**: Compact no-scroll layout — identity, system assessment (mood-coloured), stats, activity, category. Links through to channel page.

**Feed cards**: No shadow border. Thumbnail with category badge + duration, 2-line title truncation, separated channel row + action row (Watch + Stash + overflow).

### 4.3 Feed Page

- Pure chronological feed — no algorithm
- Scrollable horizontal category tabs (single-select)
- Feed observations are passive/informational only — awareness not action

### 4.4 Stash Page

**Colour**: Ocean (#2D9CDB)

**Features**: Collections (simple + curated), recently saved grid, Chrome extension "Add to Stash." Public curated collections as SEO opportunity.

**YouTube playlist sync** (Pro): regular playlists via API with etag differential sync. Watch Later workaround via Chrome extension DOM reading.

### 4.5 The Critic Page

**Dedicated page at `/critic`** — centralised hub for all recommendations.

**Side menu**: Overview | divider | Actions (orange) / Suggestions (green) / Observations (iris) | divider | Dismissed / Snoozed | footer: Cleanup settings

**Overview**: Health score card (shadow-bordered, mood-coloured header) + domain summary cards (3×2 grid) + top 3 picks

**Health score** (100 points): Categorisation 50pts (coverage 25 + subcategory 15 + hygiene 10), Channel health 20pts, Feed health 10pts, Stash health 10pts, Data freshness 10pts

**Score snapshots**: HealthSnapshotManager (client-side, session start + sendBeacon on end). `health_score_snapshots` table, 365-day retention.

### 4.6 Channel Page

Dedicated deep-dive at `/channel/[id]`. Two-column: left (system assessment, upload activity chart, recent uploads), right (tier badge, relationship stats, growth, category, related channels, actions).

### 4.7 Settings Page

YouTube account, watch history ("Your data"), cleanup thresholds (dead/inactive/frequency), general preferences.

---

## 5. Cleanup & Recommendations System

5 domains, 23 types. Priority: High (orange) / Medium (green) / Low (iris). User-adjustable thresholds. Back-off rules on dismissal.

**"Need attention" count**: Deduplicated unique channels with at least one issue (uncategorised OR dead OR inactive OR inactive favourite).

Full spec: `subscrub_cleanup_system_spec.md`

---

## 6. Auto-Sort System

YouTube topic IDs → top-level category, then keyword matching → subcategory. 15 categories, 4-6 pre-defined subcategories each. Minimum 2 keyword matches. ~110 API units for 500 channels.

Full spec: `subscrub_autosort_spec.md` + `subscrub_subcategory_tree.md`

---

## 7. Onboarding

1. Welcome — wordmark, one-liner, "Let's go"
2. Connect YouTube — mandatory, read-only, no skip
3. Loading sequence — functional steps
4. Assessment — data-driven summary, then fork: upload watch history OR skip → auto-sort OR manual
5. Dashboard

---

## 8. Chrome Extension

Pro-only perk. Side Panel API. No API quota consumption. "Add to Stash" + Watch Later DOM reading.

---

## 9. Feature Roadmap

**High**: chronological feed, dead channel detection, auto-sort with subcategories, The Critic page, On This Day, weekly digest

**Medium**: sabbatical, rising star, velocity tracking, upload gaps, category health, seasons, unsubscribe preview, growth alerts

**Lower**: relationship mapping, subscription sharing, duplicate detection, notification management, social overlap

**Requires watch history** (deprioritised): content diet, watch pace, relevance score, "why did I subscribe?"

---

## 10. Pre-Launch

- Landing page: consider dark theme with mushroom logo and mycelium network visual
- SEO: public curated collections targeting long-tail queries
- Social: approach TBD

---

## 11. Technical

**Stack**: Next.js, Supabase, Vercel. **Email**: Cloudflare Email Routing.

**YouTube API**: 10,000 units/day. Key costs: channels/playlists/subscriptions.list = 1 unit. search.list = 100 (avoid). Watch Later deprecated Sept 2016.

**OAuth**: verification for readonly scope is longest lead-time. Refresh tokens 7-day expiry in testing.

**Admin**: event tracking, retention cohorts, funnel metrics, recommendation effectiveness. Spec: `subscrub_admin_prompt.md`

---

## 12. Spec Files

| File | Description |
|------|-------------|
| `subscrub_cleanup_system_spec.md` | 23 recommendation types, triggers, priorities, back-off |
| `subscrub_autosort_spec.md` | Topic mapping + keyword matching |
| `subscrub_subcategory_tree.md` | 15 categories with pre-defined subcategories |
| `subscrub_critic_page_prompt.md` | The Critic page implementation |
| `subscrub_actionbar_prompt.md` | Subscriptions page action bar |
| `subscrub_health_score_prompt.md` | Health score with snapshots and trends |
| `subscrub_admin_prompt.md` | Admin dashboard with event tracking |