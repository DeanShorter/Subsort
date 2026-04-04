# Admin Dashboard — Implementation Prompt

## Context

Subsnub is a YouTube subscription organiser built with Next.js, Supabase, and Vercel. This is a solo-builder product — the admin dashboard is for Dean only. It needs to answer four questions: Are people using this? Is the core loop working? Is The Critic landing? Is the business model working?

The admin page lives at `/admin` and is protected behind a hardcoded admin check (Dean's user ID). No role-based auth system needed at this stage.

---

## Event Tracking System

### Table: `events`

All meaningful user actions are logged as events. This is the foundation for every metric on the admin page.

```sql
create table events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  event_name text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index idx_events_name_created on events(event_name, created_at desc);
create index idx_events_user_created on events(user_id, created_at desc);
create index idx_events_created on events(created_at desc);
```

### Events to track:

**Onboarding:**
| Event name | When | Metadata |
|-----------|------|----------|
| `onboarding_started` | User lands on Step 1 | `{}` |
| `onboarding_youtube_connected` | YouTube OAuth completes | `{ channel_count: number }` |
| `onboarding_watch_history_uploaded` | Watch history file uploaded during onboarding | `{ video_count: number }` |
| `onboarding_watch_history_skipped` | User clicks "Skip for now" | `{}` |
| `onboarding_autosort_run` | User clicks Auto-sort during onboarding | `{ channel_count: number, category_count: number }` |
| `onboarding_autosort_skipped` | User clicks "I'll sort manually" | `{}` |
| `onboarding_completed` | User reaches dashboard for the first time | `{ total_channels: number, health_score: number }` |

**Categorisation:**
| Event name | When | Metadata |
|-----------|------|----------|
| `channel_categorised` | Channel assigned to a category | `{ channel_id, category_id, source: 'manual' \| 'autosort' }` |
| `channel_subcategorised` | Channel assigned to a subcategory | `{ channel_id, subcategory_id, source: 'manual' \| 'autosort' }` |
| `channel_uncategorised` | Channel removed from category | `{ channel_id, previous_category_id }` |
| `autosort_run` | Auto-sort executed (outside onboarding) | `{ channels_sorted: number, categories_assigned: number, subcategories_assigned: number }` |
| `category_created` | User creates a new category | `{ category_id, name }` |
| `category_deleted` | User deletes a category | `{ category_id, channels_affected: number }` |

**Channel management:**
| Event name | When | Metadata |
|-----------|------|----------|
| `channel_unsubscribed` | User unsubscribes from a channel | `{ channel_id, was_dead: boolean, was_inactive: boolean, was_critic_flagged: boolean }` |
| `channel_favourited` | User marks channel as favourite | `{ channel_id }` |
| `channel_unfavourited` | User removes favourite | `{ channel_id }` |
| `sabbatical_started` | User starts a sabbatical | `{ channel_id, duration_days: number }` |
| `sabbatical_ended` | Sabbatical expires or user ends it | `{ channel_id, outcome: 'welcomed_back' \| 'extended' \| 'unsubscribed' }` |

**The Critic:**
| Event name | When | Metadata |
|-----------|------|----------|
| `critic_page_visited` | User navigates to /critic | `{ health_score: number, active_recommendations: number }` |
| `recommendation_acted` | User clicks the primary CTA on a recommendation | `{ recommendation_id, type, domain, priority }` |
| `recommendation_dismissed` | User dismisses a recommendation | `{ recommendation_id, type, domain, dismiss_count: number }` |
| `recommendation_snoozed` | User snoozes a recommendation | `{ recommendation_id, type, snooze_days: number }` |

**Stash:**
| Event name | When | Metadata |
|-----------|------|----------|
| `stash_video_added` | Video added to a collection or Watch Later | `{ video_id, collection_id \| 'watch_later' }` |
| `stash_video_removed` | Video removed from Stash | `{ video_id, reason: 'manual' \| 'watched' \| 'stale_cleanup' }` |
| `collection_created` | User creates a new collection | `{ collection_id, type: 'simple' \| 'curated' }` |

**Feed:**
| Event name | When | Metadata |
|-----------|------|----------|
| `feed_viewed` | User visits the Feed page | `{ video_count: number, category_breakdown: object }` |
| `feed_category_filtered` | User filters feed by category tab | `{ category_id }` |
| `feed_video_watched` | User clicks Watch on a feed card | `{ video_id, channel_id, category_id }` |

**Subscription & billing:**
| Event name | When | Metadata |
|-----------|------|----------|
| `free_cap_hit` | User reaches 50-sub limit | `{ total_channels: number }` |
| `upgrade_started` | User initiates Pro upgrade | `{ source: 'cap_prompt' \| 'settings' \| 'critic_prompt' }` |
| `upgrade_completed` | Pro subscription activated | `{ plan: 'monthly' \| 'annual' }` |
| `downgrade_completed` | User cancels Pro | `{ months_subscribed: number, reason?: string }` |

**Session:**
| Event name | When | Metadata |
|-----------|------|----------|
| `session_start` | User loads the app (first pageview of session) | `{ health_score: number }` |
| `session_end` | `beforeunload` / `visibilitychange` fires | `{ duration_seconds: number, pages_visited: number, actions_taken: number }` |

### Client-side tracking utility:

```typescript
// lib/track.ts

import { supabase } from './supabase';

export async function track(
  eventName: string,
  metadata: Record<string, any> = {}
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('events').insert({
    user_id: user.id,
    event_name: eventName,
    metadata,
  });
}
```

Keep this lightweight. Fire-and-forget — don't await in the UI flow. Events that fail to log shouldn't break the user experience.

### Beacon tracking for session end:

```typescript
// For session_end, use sendBeacon to survive page close
function trackSessionEnd(metadata: Record<string, any>) {
  const payload = JSON.stringify({
    user_id: currentUserId,
    event_name: 'session_end',
    metadata,
  });

  navigator.sendBeacon(
    `${SUPABASE_URL}/rest/v1/events`,
    new Blob([payload], { type: 'application/json' })
  );
}
```

Note: sendBeacon to the Supabase REST API requires the `apikey` header. Since sendBeacon doesn't support custom headers, POST to a lightweight API route (`/api/track`) that proxies to Supabase with the service role key.

---

## Admin Page Layout

### URL: `/admin`

### Access control:
```typescript
// Hardcoded admin check — replace with your user ID
const ADMIN_USER_ID = 'your-supabase-user-id-here';

if (user.id !== ADMIN_USER_ID) {
  redirect('/');
}
```

### Page structure:
Four sections, single scrollable page. No side menu needed — this is a solo dashboard.

---

## Section 1: Vital Signs

A row of metric cards showing today's key numbers. Each card shows the current value and a comparison to 7 days ago.

| Metric | Query | Comparison |
|--------|-------|-----------|
| Total users | `SELECT COUNT(*) FROM auth.users` | vs 7 days ago |
| Active today | `SELECT COUNT(DISTINCT user_id) FROM events WHERE created_at > NOW() - INTERVAL '1 day' AND event_name != 'session_start'` | vs same day last week |
| Active this week | `SELECT COUNT(DISTINCT user_id) FROM events WHERE created_at > NOW() - INTERVAL '7 days'` | vs previous week |
| Pro subscribers | `SELECT COUNT(*) FROM subscriptions WHERE status = 'active' AND plan != 'free'` | vs 7 days ago |
| Conversion rate | Pro subscribers / total users with 50+ channels | vs 7 days ago |
| Avg health score | `SELECT AVG(score) FROM health_score_snapshots WHERE snapshot_date = current_date` | vs 7 days ago |

### Card styling:
- Background: `var(--bg)`
- Value: Outfit 700, 28px
- Label: DM Sans, 13px, `var(--txt-light)`
- Comparison: 12px, green with ↑ for improvement, orange with ↓ for decline, grey with → for stable
- Grid: 6 columns, single row

---

## Section 2: Activity Feed

A reverse-chronological feed of meaningful actions across all users. Not every event — curated to show the actions that matter.

### Events to show in the feed:

| Event | Display format |
|-------|---------------|
| `onboarding_completed` | "{user} completed onboarding — {total_channels} channels, score: {health_score}" |
| `autosort_run` | "{user} ran auto-sort — {channels_sorted} channels into {categories_assigned} categories" |
| `channel_unsubscribed` | "{user} unsubscribed from {channel_name}" + flag if critic-flagged |
| `upgrade_completed` | "{user} upgraded to Pro ({plan})" |
| `downgrade_completed` | "{user} cancelled Pro after {months} months" |
| `free_cap_hit` | "{user} hit the 50-sub cap" |
| `sabbatical_started` | "{user} put {channel_name} on sabbatical for {duration} days" |
| `recommendation_acted` | "{user} acted on: {type} recommendation" |
| `collection_created` | "{user} created a {type} collection" |

### Feed styling:
- Each item: timestamp (relative, e.g. "2h ago"), user identifier (email or name), action description
- User identifier is a clickable link to a user detail view (see Section 5)
- Show last 50 events by default, "Load more" button
- Auto-refresh every 60 seconds (or manual refresh button)
- Filter dropdown: All / Onboarding / Categorisation / Billing / Critic

### Query:
```sql
SELECT e.*, u.email, u.raw_user_meta_data->>'name' as user_name
FROM events e
JOIN auth.users u ON e.user_id = u.id
WHERE e.event_name IN (
  'onboarding_completed', 'autosort_run', 'channel_unsubscribed',
  'upgrade_completed', 'downgrade_completed', 'free_cap_hit',
  'sabbatical_started', 'recommendation_acted', 'collection_created'
)
ORDER BY e.created_at DESC
LIMIT 50;
```

---

## Section 3: Retention

Weekly cohort retention chart. This is the most important chart on the page.

### How it works:

A cohort is defined by signup week. For each cohort, track what percentage of users were active in each subsequent week.

### Table: `user_cohorts` (materialised view or computed)

```sql
-- Compute weekly cohort retention
WITH cohorts AS (
  SELECT
    id as user_id,
    date_trunc('week', created_at)::date as cohort_week
  FROM auth.users
),
weekly_activity AS (
  SELECT DISTINCT
    user_id,
    date_trunc('week', created_at)::date as activity_week
  FROM events
  WHERE event_name NOT IN ('session_start')
)
SELECT
  c.cohort_week,
  wa.activity_week,
  EXTRACT(WEEK FROM wa.activity_week - c.cohort_week)::integer as week_number,
  COUNT(DISTINCT c.user_id) as active_users,
  (SELECT COUNT(*) FROM cohorts WHERE cohort_week = c.cohort_week) as cohort_size
FROM cohorts c
JOIN weekly_activity wa ON c.user_id = wa.user_id
WHERE wa.activity_week >= c.cohort_week
GROUP BY c.cohort_week, wa.activity_week
ORDER BY c.cohort_week, wa.activity_week;
```

### Display:

A heatmap table where:
- Rows = cohort weeks (most recent at top)
- Columns = Week 0, Week 1, Week 2, ... Week 12
- Cells = retention percentage, colour-coded (green for high retention, orange for medium, light for low)
- Week 0 is always 100% (signup week)

### Colour scale:
- 80-100%: dark green
- 60-79%: green
- 40-59%: light green
- 20-39%: orange-soft
- 0-19%: light grey

### Summary stats below the chart:
- Week 1 retention (average across all cohorts)
- Week 4 retention
- Week 8 retention
- Best/worst performing cohort

---

## Section 4: Feature Usage

A table showing which features are being used and how often. Updated daily or on page load.

### Columns:
| Column | Description |
|--------|-------------|
| Feature | Feature name |
| Users this week | Distinct users who used this feature in the last 7 days |
| % of active users | Users this week / total active users this week |
| Actions this week | Total event count for this feature in the last 7 days |
| Trend | ↑ ↓ → vs previous week |

### Feature-to-event mapping:

| Feature | Events counted |
|---------|---------------|
| Auto-sort | `autosort_run` |
| Manual categorisation | `channel_categorised` where source = 'manual' |
| Subcategory assignment | `channel_subcategorised` |
| Unsubscribe | `channel_unsubscribed` |
| Favourite | `channel_favourited` |
| Sabbatical | `sabbatical_started` |
| The Critic page | `critic_page_visited` |
| Recommendation actions | `recommendation_acted` |
| Recommendation dismissals | `recommendation_dismissed` |
| Feed browsing | `feed_viewed` |
| Feed filtering | `feed_category_filtered` |
| Stash | `stash_video_added` |
| Collections | `collection_created` |
| Watch history upload | `onboarding_watch_history_uploaded` |

### Query:
```sql
SELECT
  event_category,
  COUNT(DISTINCT user_id) as users_this_week,
  COUNT(*) as actions_this_week
FROM events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY event_category;
```

Map event names to feature categories in the application layer rather than SQL for flexibility.

### Table styling:
- Sortable by any column
- Highlight rows where "% of active users" is below 10% (potential dead features)
- Highlight rows where trend is strongly up (growing adoption)

---

## Section 5: User Detail View (Optional, Phase 2)

Clicking a user in the activity feed opens a detail panel or page showing:

- User info: email, signup date, plan (free/pro), total channels
- Current health score + sparkline
- Onboarding status: which steps completed
- Categorisation progress: % categorised, % subcategorised
- Feature usage: which features they've used and when
- Recent events: last 20 events for this user
- Billing: plan, upgrade/downgrade dates, time on current plan

This is a "Phase 2" feature — not needed for launch but valuable once you have enough users to investigate individual behaviour.

---

## Section 6: Funnel Metrics

### Onboarding funnel:

Track conversion through each onboarding step:

```
Started → Connected YouTube → Watch History (uploaded/skipped) → Auto-sort (run/skipped) → Completed
```

### Query:
```sql
SELECT
  COUNT(*) FILTER (WHERE event_name = 'onboarding_started') as started,
  COUNT(*) FILTER (WHERE event_name = 'onboarding_youtube_connected') as connected,
  COUNT(*) FILTER (WHERE event_name IN ('onboarding_watch_history_uploaded', 'onboarding_watch_history_skipped')) as history_step,
  COUNT(*) FILTER (WHERE event_name IN ('onboarding_autosort_run', 'onboarding_autosort_skipped')) as sort_step,
  COUNT(*) FILTER (WHERE event_name = 'onboarding_completed') as completed
FROM events
WHERE created_at > NOW() - INTERVAL '30 days';
```

### Display:
Horizontal funnel chart with percentage drop-off between each step. Highlight the biggest drop-off in orange.

### Cap-to-conversion funnel:

```
Hit 50-sub cap → Started upgrade → Completed upgrade
```

Track the time between cap hit and upgrade (or churn). Show median days to conversion.

---

## Section 7: Recommendation Effectiveness

A breakdown of how each recommendation type performs.

### Columns:
| Column | Description |
|--------|-------------|
| Recommendation type | e.g. "dead_channels", "uncategorised" |
| Times shown | Total times this type has been created |
| Action rate | % acted on |
| Dismiss rate | % dismissed |
| Snooze rate | % snoozed |
| Avg time to action | Median time between creation and action |

### Query:
```sql
SELECT
  type,
  COUNT(*) as total_shown,
  COUNT(*) FILTER (WHERE status = 'completed') as acted,
  COUNT(*) FILTER (WHERE status = 'dismissed') as dismissed,
  COUNT(*) FILTER (WHERE status = 'snoozed') as snoozed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'completed') / NULLIF(COUNT(*), 0), 1) as action_rate
FROM recommendations
GROUP BY type
ORDER BY action_rate DESC;
```

This tells you which Critic recommendations are actually useful and which are being ignored. If a recommendation type has a 5% action rate, it's noise — consider removing it or changing the trigger conditions.

---

## Data Retention

### Events table:
Keep 180 days of raw events. Older events can be aggregated into daily/weekly summary tables if needed for long-term trends, then purged.

```sql
-- Run monthly
DELETE FROM events WHERE created_at < NOW() - INTERVAL '180 days';
```

### Pre-aggregation (optional, for performance):

If the events table grows large, create a daily summary table:

```sql
create table daily_stats (
  stat_date date primary key,
  total_users integer,
  active_users integer,
  pro_users integer,
  events_count integer,
  new_signups integer,
  upgrades integer,
  downgrades integer,
  channels_categorised integer,
  channels_unsubscribed integer,
  autosorts_run integer,
  critic_visits integer,
  avg_health_score numeric(4,1),
  created_at timestamptz default now()
);
```

Populate this with a nightly aggregation query or compute on admin page load for the visible date range.

---

## Styling

Keep the admin page clean and functional. No brand styling needed — this is an internal tool.

- Background: white
- Cards: `var(--bg)` background, 12px border-radius, 16px padding
- Typography: DM Sans throughout, no Outfit headings
- Tables: simple, no shadow borders, alternating row backgrounds
- Charts: use Recharts (already available in your stack) for the retention heatmap and funnel
- Colours: use the existing green/orange/iris system for status indicators

### Page header:
```
Admin — Subsnub
Last refreshed: 2 minutes ago    [↻ Refresh]
```

---

## Edge Cases

1. **No events yet (fresh install):** Show empty states with "No data yet" messages. Don't show zeroes that look like errors.

2. **Single user (just Dean testing):** Everything still works — retention shows one row, activity feed shows your own actions. Useful for verifying the tracking is correct before real users arrive.

3. **Event tracking failures:** Events fire-and-forget. If a Supabase insert fails, it fails silently. Don't retry, don't queue. A few missing events won't skew the metrics meaningfully.

4. **Admin page performance:** The retention query and feature usage queries can be slow on large event tables. For launch, compute on page load with loading states. If it gets slow later, move to pre-aggregated daily stats.

5. **Privacy:** The admin page shows user emails and activity. This is fine for a solo builder managing their own product, but if you ever add team members, add proper access controls and consider anonymising user identifiers.

6. **Rate limiting events:** Don't track `feed_viewed` on every scroll or re-render. Debounce to once per page visit. Same for `feed_category_filtered` — debounce to prevent rapid filter toggles from flooding the events table.
