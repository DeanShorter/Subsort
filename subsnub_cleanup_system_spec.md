# Subsnub — Cleanup & Recommendations System Spec

## Overview

The Critic's recommendations are organised into five cleanup domains. Each recommendation has a type, trigger condition, priority level, Critic copy, and a primary action. All recommendations feed into a centralised queue accessible from a persistent nav badge.

### Priority Levels

| Priority | Colour | Behaviour |
|----------|--------|-----------|
| **High** | Orange | Shown on dashboard, badge on nav, appears in relevant page context |
| **Medium** | Green | Shown on dashboard, appears in relevant page context |
| **Low** | Iris | Queue only — doesn't appear on other surfaces unless the user opens the panel |

### Recommendation Lifecycle

1. **Triggered** — condition met, recommendation created
2. **Shown** — displayed to user on relevant surface(s)
3. **Acted on** — user takes the recommended action → recommendation cleared
4. **Dismissed** — user explicitly dismisses → removed from active queue, logged
5. **Snoozed** — user defers → hidden for 7/14/30 days, then re-triggered
6. **Accepted** — user has been prompted twice without acting → Critic backs off, drops to Low priority with a graceful message

---

## Domain 1: Categories

### 1.1 Uncategorised channels

| Field | Value |
|-------|-------|
| **Trigger** | Channel count with no category > 0 |
| **Priority** | High (if > 5 channels), Medium (if 1-5) |
| **Critic copy** | `"{count} channels with no home. Want me to take a look, or would you rather sort them yourself?"` |
| **CTA** | Auto-sort uncategorised / Sort manually |
| **Surface** | Dashboard insight card, Subscriptions page header, Recommendations panel |
| **Back-off** | After 2 dismissals: `"Fine. {count} channels remain uncategorised. I'll stop asking, but they're there when you're ready."` Drop to Low. Re-engage only if count doubles. |

### 1.2 Channels without subcategory

| Field | Value |
|-------|-------|
| **Trigger** | Channels assigned to a category but no subcategory, AND that category has pre-defined subcategories available |
| **Priority** | Low |
| **Critic copy** | `"{count} channels in {category} have no subcategory. {suggestedCount} of them look like they could be {suggestedSubcategory}."` |
| **CTA** | Review suggestions / Dismiss |
| **Surface** | Recommendations panel, Category panel (subtle count indicator) |
| **Back-off** | After 1 dismissal: don't re-trigger for this category unless new channels are added |

### 1.3 Empty categories/subcategories

| Field | Value |
|-------|-------|
| **Trigger** | Category or subcategory contains 0 channels |
| **Priority** | Low |
| **Critic copy** | `"Your '{name}' {type} has 0 channels. Still need it?"` |
| **CTA** | Delete / Keep |
| **Surface** | Recommendations panel, Category panel (visual indicator) |
| **Back-off** | After 1 dismissal (Keep): don't re-trigger unless the container has been empty for 90+ days |

### 1.4 Category imbalance

| Field | Value |
|-------|-------|
| **Trigger** | Any category contains more than 40% of total subscriptions |
| **Priority** | Low |
| **Critic copy** | `"Your {category} category has {count} channels — that's {percentage}% of everything. Is it doing too much heavy lifting? Might be worth splitting into subcategories."` |
| **CTA** | Review category / Dismiss |
| **Surface** | Recommendations panel |
| **Back-off** | After 1 dismissal: don't re-trigger unless percentage increases by 10+ points |

### 1.5 Subcategory suggestions for large unsorted groups

| Field | Value |
|-------|-------|
| **Trigger** | Category has 10+ channels without subcategories AND keyword matching identifies a likely subcategory for 5+ of them |
| **Priority** | Medium |
| **Critic copy** | `"{count} channels in {category} with no subcategory. {matchCount} of them look like {suggestedSubcategory} channels. Want me to sort them?"` |
| **CTA** | Auto-assign / Review individually |
| **Surface** | Dashboard, Recommendations panel |
| **Back-off** | After 1 dismissal: don't re-trigger for this specific suggestion |

---

## Domain 2: Channel Health

### 2.1 Dead channels

| Field | Value |
|-------|-------|
| **Trigger** | Channel has not uploaded in 365+ days (default, user-adjustable) |
| **Priority** | High |
| **Critic copy** | `"{count} channels haven't uploaded in over a year. That's not a hiatus, that's retirement."` |
| **CTA** | Review channels (opens filtered list) |
| **Surface** | Dashboard insight card, Subscriptions page, Recommendations panel |
| **Per-channel copy** | `"Last upload: {timeAgo}. {subscriberCount} subscribers watching an empty stage."` |
| **Per-channel actions** | Keep / Sabbatical / Unsubscribe |

### 2.2 Inactive channels

| Field | Value |
|-------|-------|
| **Trigger** | Channel has not uploaded in 90-364 days (default, user-adjustable) |
| **Priority** | Medium |
| **Critic copy** | `"{count} channels have gone quiet. Not dead yet, but worth keeping an eye on."` |
| **CTA** | Review channels |
| **Surface** | Dashboard, Recommendations panel |
| **Per-channel copy** | `"Last upload {timeAgo}. Used to post {previousFrequency}."` |
| **Per-channel actions** | Keep / Sabbatical / Unsubscribe |

### 2.3 Upload frequency change

| Field | Value |
|-------|-------|
| **Trigger** | Channel's upload frequency in the last 90 days is less than 50% of its average over the prior 12 months |
| **Priority** | Low |
| **Critic copy** | `"{channelName} used to upload {previousFrequency}. It's been {currentFrequency} lately. Slowing down."` |
| **CTA** | View channel / Dismiss |
| **Surface** | Recommendations panel, Channel detail panel |
| **Back-off** | Don't re-trigger for same channel within 90 days |

### 2.4 Favourites hygiene

| Field | Value |
|-------|-------|
| **Trigger** | A favourited channel has not uploaded in 120+ days |
| **Priority** | Medium |
| **Critic copy** | `"{count} of your favourites haven't uploaded in months. Still your top tier?"` |
| **CTA** | Review favourites |
| **Surface** | Dashboard, Recommendations panel |
| **Per-channel copy** | `"Favourited, but last upload was {timeAgo}. Keep as favourite?"` |
| **Per-channel actions** | Keep favourite / Remove from favourites / Unsubscribe |

### 2.5 Long-tenure review

| Field | Value |
|-------|-------|
| **Trigger** | Channel subscribed for 5+ years, triggered once per year on subscription anniversary |
| **Priority** | Low |
| **Critic copy** | `"{count} channels you've followed for {years}+ years. That's loyalty. Or inertia. Worth a look?"` |
| **CTA** | Review long-tenure channels |
| **Surface** | Dashboard (On This Day observation), Recommendations panel |
| **Per-channel copy** | `"Subscribed {date}. That's {years} years. They've uploaded {videosSince} videos since."` |
| **Per-channel actions** | Keep / Sabbatical / Unsubscribe |

### User-adjustable parameters (Settings)

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| Dead threshold | 365 days | 180-730 days | Days without upload before flagging as dead |
| Inactive threshold | 90 days | 30-365 days | Days without upload before flagging as inactive |
| Frequency sensitivity | 50% | 25-75% | How much frequency must drop before flagging |

---

## Domain 3: Stash

### 3.1 Stale Watch Later items

| Field | Value |
|-------|-------|
| **Trigger** | Video in Watch Later collection for 30+ days without being watched |
| **Priority** | Low |
| **Critic copy** | `"{count} videos have been in your Watch Later for over a month. Still planning to watch them?"` |
| **CTA** | Review stale items |
| **Surface** | Stash page header, Recommendations panel |
| **Per-item actions** | Keep / Move to collection / Remove |
| **Back-off** | Re-trigger every 30 days, max 3 times. After 3rd: `"These {count} videos have been here for {months} months. I think we both know you're not watching them."` |

### 3.2 Empty collections

| Field | Value |
|-------|-------|
| **Trigger** | Collection contains 0 videos |
| **Priority** | Low |
| **Critic copy** | `"Your '{name}' collection is empty. Delete it?"` |
| **CTA** | Delete / Keep |
| **Surface** | Stash page, Recommendations panel |
| **Back-off** | After 1 Keep: don't re-trigger for 90 days |

### 3.3 Stale collections

| Field | Value |
|-------|-------|
| **Trigger** | No videos added to collection in 60+ days AND collection is not a curated collection |
| **Priority** | Low |
| **Critic copy** | `"You haven't added to '{name}' in {days} days. Archive it?"` |
| **CTA** | Archive / Keep active |
| **Surface** | Recommendations panel |
| **Back-off** | After 1 Keep: don't re-trigger for 90 days |

### 3.4 Watched videos still in Stash

| Field | Value |
|-------|-------|
| **Trigger** | Video marked as watched (via embedded player) still exists in a collection |
| **Priority** | Low |
| **Critic copy** | `"You've watched '{videoTitle}'. Remove from {collectionName}?"` |
| **CTA** | Remove / Keep |
| **Surface** | Inline prompt after video playback, Recommendations panel |
| **Back-off** | Show once per video. If kept, don't re-trigger. |

---

## Domain 4: Feed

Feed recommendations are **observational only** — they raise awareness but don't push actions. The Feed page is for browsing, not managing. Actions happen on the Subscriptions page.

### 4.1 Content balance indicator

| Field | Value |
|-------|-------|
| **Trigger** | Always shown (when feed has 5+ videos loaded) |
| **Priority** | N/A — passive display element |
| **Display** | Small pill row or bar at top of feed: `"Today: 70% Entertainment · 15% Music · 10% Sports · 5% Tech"` |
| **Surface** | Feed page header only |
| **Interaction** | Tapping a category pill filters the feed to that category |

### 4.2 Category dominance alert

| Field | Value |
|-------|-------|
| **Trigger** | Single category accounts for 70%+ of today's feed |
| **Priority** | Low |
| **Critic copy** | `"Your feed today is {percentage}% {category}. {otherCount} categories didn't show up at all."` |
| **Surface** | Feed page (subtle inline observation), Recommendations panel |
| **CTA** | View underrepresented categories (links to Subscriptions filtered by those categories) |

### 4.3 Category gaps

| Field | Value |
|-------|-------|
| **Trigger** | A category with 5+ channels has 0 videos in today's feed |
| **Priority** | Low |
| **Critic copy** | `"Nothing from {category} today. Your {count} channels in that category haven't uploaded recently."` |
| **Surface** | Feed page (inline, below the category tabs) |
| **Interaction** | Informational only |

### 4.4 Feed diversity trend

| Field | Value |
|-------|-------|
| **Trigger** | Weekly calculation — feed diversity dropped compared to previous month |
| **Priority** | Low |
| **Critic copy** | `"Your feed this week came from {categoryCount} of your {totalCategories} categories. Last month it was {previousCount}. Getting narrower."` |
| **Surface** | Recommendations panel, Dashboard weekly digest |
| **CTA** | Explore underrepresented categories |

---

## Domain 5: Subscription Behaviour

### 5.1 Subscription velocity spike

| Field | Value |
|-------|-------|
| **Trigger** | User subscribes to 5+ channels in a 7-day period (or 3x their weekly average) |
| **Priority** | Low |
| **Critic copy** | `"You subscribed to {count} channels this week. That's {multiplier}x your usual pace. Discovery spree or rabbit hole?"` |
| **Surface** | Dashboard, Recommendations panel |
| **CTA** | Review recent subscriptions |
| **Back-off** | Trigger once per spike, don't re-trigger for 14 days |

### 5.2 Sabbatical follow-up

| Field | Value |
|-------|-------|
| **Trigger** | Channel sabbatical period has ended |
| **Priority** | Medium |
| **Critic copy** | `"Your {duration}-day sabbatical on {channelName} just ended. They uploaded {videoCount} videos while you were away. Miss them?"` |
| **CTA** | Welcome back (restore) / Extend sabbatical / Unsubscribe |
| **Surface** | Dashboard, Recommendations panel, Channel detail panel |

### 5.3 On This Day

| Field | Value |
|-------|-------|
| **Trigger** | Daily — any channel with a subscription anniversary today |
| **Priority** | Low |
| **Critic copy** | `"{years} years ago today you subscribed to {channelName}. They've uploaded {videoCount} videos since. {commentary}"` |
| **Commentary variants** | Active: `"Still going strong."` / Inactive: `"Though they've been quiet lately."` / Favourite: `"One of your favourites — good taste."` / High tenure: `"That's commitment."` |
| **Surface** | Dashboard (On This Day card) |
| **CTA** | View channel |

### 5.4 Rising star alert

| Field | Value |
|-------|-------|
| **Trigger** | Channel's subscriber count has grown 50%+ since the user subscribed |
| **Priority** | Low |
| **Critic copy** | `"You subscribed to {channelName} at {subsAtSubscription}. They just hit {currentSubs}. You were early."` |
| **Surface** | Recommendations panel, Channel detail panel |
| **CTA** | View channel |
| **Back-off** | Trigger once per milestone (50%, 100%, 500%, 1000% growth) |

---

## Recommendations Panel

### Access point
Persistent badge in the sidebar nav, between Insights and Settings. Shows count of active (non-dismissed, non-snoozed) recommendations.

### Panel layout
Slide-in from the right (consistent with channel detail panel). Sections:

1. **Action required** — High priority items (orange headers)
2. **Suggestions** — Medium priority items (green headers)
3. **Observations** — Low priority items (iris headers)

Each item shows:
- Critic icon (mood-coloured)
- One-line observation
- Brief context (expandable)
- Primary CTA button
- Dismiss / Snooze options (snooze: 7d / 14d / 30d)

### Empty state
When all recommendations are cleared:
`"Nothing to report. Your subscriptions are in good shape. For now."`

---

## Data Staleness Prompts

These are a special case — they don't fit into the five domains but they use the same recommendation system.

### Watch history staleness

| Days old | Priority | Critic copy |
|----------|----------|-------------|
| 7-14 | Medium | `"Watch data is a week old. Still usable, but fresher is better."` |
| 14-30 | High | `"Your watch data is {days} days old. My recommendations are getting stale, {name}."` |
| 30+ | High | `"{weeks} weeks without fresh data. I'm basically guessing at this point. Help me help you."` |

**CTA**: Update watch history (links to Settings > Your Data)

**Additional surfaces at 14+ days**: Orange badge on Settings nav item

**Additional surfaces at 30+ days**: Inline prompt in channel detail panel activity section

---

## Summary Table

| Domain | Recommendation | Priority | Trigger |
|--------|---------------|----------|---------|
| Categories | Uncategorised channels | High/Med | Count > 0 |
| Categories | No subcategory | Low | Has category, no sub, subs available |
| Categories | Empty containers | Low | 0 channels in category/sub |
| Categories | Category imbalance | Low | Category > 40% of total |
| Categories | Subcategory suggestions | Med | 10+ unsorted, 5+ keyword match |
| Channel Health | Dead channels | High | No upload 365+ days |
| Channel Health | Inactive channels | Med | No upload 90-364 days |
| Channel Health | Frequency change | Low | Frequency dropped 50%+ |
| Channel Health | Favourites hygiene | Med | Favourite inactive 120+ days |
| Channel Health | Long-tenure review | Low | 5+ year anniversary |
| Stash | Stale Watch Later | Low | 30+ days unwatched |
| Stash | Empty collections | Low | 0 videos |
| Stash | Stale collections | Low | 60+ days no additions |
| Stash | Watched still in Stash | Low | Watched via player, still saved |
| Feed | Content balance | Passive | Always (5+ videos) |
| Feed | Category dominance | Low | 70%+ single category |
| Feed | Category gaps | Low | 0 feed items from 5+ channel category |
| Feed | Diversity trend | Low | Weekly drop vs monthly average |
| Behaviour | Velocity spike | Low | 5+ subs in 7 days or 3x average |
| Behaviour | Sabbatical follow-up | Med | Sabbatical ended |
| Behaviour | On This Day | Low | Daily anniversary |
| Behaviour | Rising star | Low | 50%+ subscriber growth |
| Data | Watch history staleness | Med/High | 7/14/30+ days old |
