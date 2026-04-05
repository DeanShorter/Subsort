# Discover Page — Implementation Spec

## Overview

The Discover page (`/discover`) helps users find channels and content they don't currently subscribe to. It's the growth surface of subscrub — the place where users expand their subscription library rather than manage it.

**Colour**: Iris (#8B6FE8)

**Priority order at launch**:
1. Browse channels by category/subcategory (core feature)
2. Public curated collections from other users
3. Community-contributed topic paths (post-launch)
4. Trending/growing channels in your existing categories (post-launch)

**Access control**: Collections are publicly accessible without a subscrub account (SEO indexable). Everything else requires login.

---

## Page Structure

### Layout
Nav | Main content area (full width, no side panel at launch)

### Top section
Page title "Discover" with iris colour accent. Search bar spanning full width — searches across channels, collections, and categories.

### Content sections (scrollable page):

1. **Category browser** (primary feature)
2. **Featured collections** (curated highlights)
3. **Recent public collections** (community feed)

---

## Section 1: Category Browser

The main feature. Users browse channels organised by subscrub's category/subcategory tree, filtered to show channels they're NOT already subscribed to.

### How it works

Subscrub maintains a database of channels that users have subscribed to and categorised. When any user categorises a channel, that channel-to-category mapping is stored. Over time, this builds a crowd-sourced directory of YouTube channels organised by topic.

The Discover page queries this directory, excludes channels the current user already subscribes to, and presents the remainder as browsable suggestions.

### Data source

```sql
-- Channels in a given category that this user doesn't subscribe to
SELECT 
  c.youtube_channel_id,
  c.title,
  c.description,
  c.subscriber_count,
  c.video_count,
  c.last_upload_at,
  cat.name as category_name,
  sub.name as subcategory_name,
  COUNT(DISTINCT uc.user_id) as subscrub_users -- how many subscrub users subscribe to this
FROM channels c
JOIN user_channels uc ON c.youtube_channel_id = uc.youtube_channel_id
JOIN categories cat ON uc.category_id = cat.id
LEFT JOIN subcategories sub ON uc.subcategory_id = sub.id
WHERE cat.name = $category
AND c.youtube_channel_id NOT IN (
  SELECT youtube_channel_id FROM user_channels WHERE user_id = $current_user
)
GROUP BY c.youtube_channel_id, c.title, c.description, c.subscriber_count, 
         c.video_count, c.last_upload_at, cat.name, sub.name
ORDER BY subscrub_users DESC, c.subscriber_count DESC
LIMIT 20;
```

### UI: Category tabs + channel grid

**Category tabs**: Horizontal scrollable tabs showing all 15 top-level categories. Clicking a category shows its channels. Below the top-level tabs, a secondary row of subcategory pills appears for the selected category.

```
[Music] [Gaming] [Entertainment] [Technology] [Science & Edu] [Sports] ...
         ↓ (Technology selected)
[All] [Programming] [Gadgets] [AI & Data Science] [Cybersecurity] [Self-Hosted] [Productivity]
```

**Channel cards**: Grid of cards (3 or 4 columns) for each channel in the selected category.

Each card shows:
- Channel avatar (from YouTube API, cached)
- Channel name
- Subscriber count
- Video count
- Last upload date (relative: "2 days ago", "3 weeks ago")
- Subcategory badge
- "Subscrub users: X" — social proof showing how many subscrub users subscribe to this channel
- **Subscribe on YouTube** button (opens YouTube channel page in new tab)
- **+ Add to Subscriptions** button (if subscrub ever supports subscribing via API — for now, this could be a "Track" or "Watch" button that adds the channel to a personal watchlist within subscrub)

**"Why this channel"**: For channels that appear because they share a subcategory with the user's existing subscriptions, show a subtle line: "Also in Music › Production" or "4 of your subscriptions are in this category."

### Empty state

If a category has no channels to suggest (user subscribes to all known channels in that category, or nobody has categorised channels in that category yet):

"No suggestions in {category} yet. As more people use Subscrub, this will grow."

### Sorting options

Dropdown in the category section header:
- **Most popular on Subscrub** (default) — sorted by subscrub_users count
- **Most subscribers** — YouTube subscriber count
- **Most active** — most recent upload date
- **Newest to Subscrub** — most recently categorised by any user

---

## Section 2: Public Curated Collections

Collections created by subscrub users who have chosen to make them public. These are the SEO and sharing engine.

### Public collection requirements

For a collection to be public, the creator must:
- Have a subscrub account (free or Pro)
- Mark the collection as "Public" in Stash settings
- The collection must have at least 5 videos
- The collection must have a title and description

### Display on Discover page

**Featured collections**: A hand-curated row of 4-6 highlighted collections. Initially curated by you (Dean) manually via admin. Later, could be algorithmically selected based on views/forks/ratings.

**Recent public collections**: A grid of recently published collections, newest first. Each collection card shows:
- Collection title
- Creator name (or anonymous)
- Video count
- Category badge(s) — derived from the channels in the collection
- Fork count (how many users have copied it to their Stash)
- View count
- Thumbnail mosaic (2×2 grid of video thumbnails from the collection)
- Collection type badge: "Curated" (ordered path) or "Collection" (unordered)

### Collection detail page (public)

**URL**: `/discover/collections/[slug]`

This page is publicly accessible without login — it's the SEO landing page.

**Structure**:
- Collection title (h1)
- Creator attribution + publish date
- Description (supports basic formatting)
- Stats row: X videos · Y forks · Z views · estimated watch time
- Category/subcategory tags
- Video list: each video shows thumbnail, title, channel name, duration, and the creator's context notes (for curated collections)
- For curated collections: videos are numbered and ordered as a path

**CTAs**:
- **Fork to Stash** (requires login — if not logged in, prompts signup)
- **Subscribe to all channels** (lists unique channels in the collection, links to YouTube)
- Individual video: **Watch on YouTube** (external link)

**SEO**:
- Unique page title: "{Collection title} — Subscrub"
- Meta description from collection description (first 160 chars)
- Open Graph tags with thumbnail mosaic as image
- Schema markup: ItemList with individual video entries
- Canonical URL at `/discover/collections/[slug]`

**Public view vs logged-in view**:
- Public: no progress tracking, no notes, "Fork to Stash" prompts signup, CTA to "Sign up to create your own collections"
- Logged in: shows fork button directly, "Add to Stash" per video, progress tracking if already forked

---

## Section 3: Community Topic Paths (Post-Launch)

Structured learning journeys contributed by users. Think "syllabus" — a multi-collection, multi-channel guide to learning a topic from scratch.

### How it differs from curated collections

A **collection** is a flat list of videos (optionally ordered).
A **topic path** is a structured journey with stages, milestones, and progression.

Example: "Learn Music Production from Zero"
- Stage 1: Understanding your DAW (5 videos from 3 channels)
- Stage 2: Basic mixing (8 videos from 4 channels)
- Stage 3: Sound design fundamentals (6 videos from 2 channels)
- Stage 4: Your first complete track (4 videos + a challenge)

### Implementation (post-launch)

This is a post-launch feature. For launch, curated collections with context notes per video serve a similar purpose. Topic paths add the stage/progression structure on top.

Flag this as a future feature that builds on the collection infrastructure.

---

## Section 4: Trending in Your Categories (Post-Launch)

Channels in the user's existing categories that are growing fast or gaining subscrub users rapidly.

### Data required

- Track subscriber count snapshots over time (from periodic YouTube API calls)
- Calculate growth rate per channel over 30/60/90 days
- Filter to channels in categories the user has subscriptions in
- Exclude channels the user already subscribes to

### Display

A horizontal scrollable row of channel cards with a growth indicator:
"↑ 45% subscribers in 30 days" or "12 Subscrub users added this week"

### Why post-launch

This requires enough users to generate meaningful "trending on Subscrub" data, and enough API calls to track subscriber growth across channels the user doesn't subscribe to. Both require scale that won't exist at launch.

---

## Search

### Global search bar at the top of Discover

Searches across:
1. Channel names and descriptions (from subscrub's channel database)
2. Collection titles and descriptions
3. Category and subcategory names

### Results grouped by type

```
Channels (12 results)
  [Channel cards in a row]

Collections (3 results)
  [Collection cards in a row]

Categories (2 results)
  [Category pills linking to the category browser filtered to that category]
```

### Search behaviour

- Debounced (300ms) live search as user types
- Minimum 2 characters
- Results from subscrub's database only — not a YouTube search proxy
- "Search YouTube directly" link at the bottom of results for queries with few matches

---

## Channel Database Architecture

The Discover page depends on a shared channel database that grows as users categorise channels.

### Table: `channels` (shared)

```sql
create table channels (
  youtube_channel_id text primary key,
  title text,
  description text,
  custom_url text,
  subscriber_count bigint,
  video_count integer,
  last_upload_at timestamptz,
  thumbnail_url text,
  country text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### Table: `user_channels` (per-user)

```sql
create table user_channels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  youtube_channel_id text references channels(youtube_channel_id),
  category_id uuid references categories(id),
  subcategory_id uuid references subcategories(id),
  is_favourite boolean default false,
  subscribed_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, youtube_channel_id)
);
```

### How channel data grows

1. User connects YouTube → their subscriptions are imported to `channels` (if not already present) and linked in `user_channels`
2. User categorises a channel → `user_channels.category_id` is updated
3. The Discover page queries `channels` joined with `user_channels` to find channels categorised by other users

### Privacy

- Users' subscription lists are never exposed to other users
- The Discover page only shows aggregate data: "12 Subscrub users subscribe to this channel"
- Individual user-to-channel relationships are never revealed
- Category assignments are aggregated — if 8 users categorise a channel as "Music" and 2 as "Entertainment," the majority wins for Discover display

### Category consensus

When multiple users categorise the same channel differently, use majority vote:

```sql
SELECT category_id, COUNT(*) as votes
FROM user_channels
WHERE youtube_channel_id = $channel_id
AND category_id IS NOT NULL
GROUP BY category_id
ORDER BY votes DESC
LIMIT 1;
```

Same logic for subcategories. This crowd-sourced categorisation improves over time and self-corrects misclassifications.

---

## Public Collection URLs and SEO

### URL structure

- Browse: `/discover`
- Category: `/discover/channels/[category-slug]`
- Subcategory: `/discover/channels/[category-slug]/[subcategory-slug]`
- Collection: `/discover/collections/[slug]`

### Sitemap

Generate a dynamic sitemap including:
- All category and subcategory browse pages
- All public collections with >5 videos
- Update frequency: weekly for browse pages, on-publish for collections

### Target search queries (examples)

- "best youtube channels for music production"
- "youtube channels to learn programming"
- "curated youtube playlist for astrophysics"
- "organised youtube channel list for cooking"
- "youtube subscription recommendations gaming"

Each category browse page and public collection is a potential landing page for these queries.

---

## API Routes

### GET `/api/discover/channels`
Query params: `category`, `subcategory`, `sort` (popular/subscribers/active/newest), `page`, `limit`
Returns: channel list with subscriber counts, subscrub user counts, category info
Auth: required

### GET `/api/discover/collections`
Query params: `featured` (boolean), `category`, `sort` (recent/popular/most-forked), `page`, `limit`
Returns: collection list with metadata, fork counts, view counts
Auth: not required (public)

### GET `/api/discover/collections/[slug]`
Returns: full collection detail with videos, context notes, creator info
Auth: not required (public)

### POST `/api/discover/collections/[slug]/fork`
Copies collection to user's Stash
Auth: required

### GET `/api/discover/search`
Query params: `q`, `type` (channels/collections/all), `page`, `limit`
Returns: grouped search results
Auth: required for channel results, not required for collection results

---

## Styling

### Page colour
Iris (#8B6FE8) as the accent colour for the Discover page. Category tabs, active states, and CTAs use iris. Channel cards and collection cards use the clean card style (no shadow border).

### Category tabs
```css
.discover-tab {
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  background: var(--bg);
  color: var(--txt-mid);
  cursor: pointer;
  border: none;
}
.discover-tab.active {
  background: var(--iris);
  color: #fff;
}
```

### Subcategory pills
Same style but smaller (12px font, 6px 14px padding) and using iris-soft/iris-text for active state.

### Channel cards
Clean card style. Avatar prominent (48px), stats compact below name, action buttons at bottom. Hover lift effect.

### Collection cards
Clean card style. Thumbnail mosaic (2×2 grid, 4px gap, 8px radius) at top, metadata below, fork/view counts as subtle stats.

---

## Edge Cases

1. **New product with few users**: The category browser will be sparse. Seed it with your own categorised subscriptions (328 channels). Show honest counts — "1 Subscrub user" is fine. Don't fake social proof.

2. **User subscribes to every channel in a category**: Show empty state with encouragement. "You're subscribed to every {category} channel we know about. As more people join, new suggestions will appear."

3. **Category consensus disagreements**: If votes are tied (e.g., 3 users say "Music," 3 say "Entertainment"), use the auto-sort algorithm's classification as the tiebreaker since it's based on YouTube's own topic data.

4. **Spam/low-quality public collections**: At launch, manually review collections before they appear on Discover. Add a "Report" button on collection pages. Consider requiring a minimum account age (7 days) before publishing public collections.

5. **Channel data freshness**: Channel metadata (subscriber count, video count, last upload) goes stale. Re-fetch when a channel appears on Discover and the data is >7 days old. Rate-limit these refreshes to stay within API quota.

6. **Public collections with deleted/private videos**: Check video availability when the collection is viewed. Mark unavailable videos with a "Video unavailable" state rather than removing them (the creator's context notes may still be valuable).

---

## Launch Plan

### Phase 1 (Launch):
- Category browser with channel cards
- Public curated collections (view + fork)
- Search across channels and collections
- Seed data from your own 328 subscriptions

### Phase 2 (Post-launch, once user base grows):
- Featured collections (admin-curated highlights)
- "Subscrub users" counts become meaningful
- Community topic paths

### Phase 3 (Scale):
- Trending in your categories
- Algorithmic collection recommendations
- Category consensus improves with more data
