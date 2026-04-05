import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function GET(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const supabase = getServiceClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.tier !== 'admin' && profile.tier !== 'pro')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const now = new Date();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  // Fetch all data in parallel
  const [usersRes, channelsRes, catAssignRes, eventsRes, recentEventsRes, healthRes] = await Promise.all([
    supabase.from('profiles').select('*'),
    supabase.from('channels').select('channel_id, user_id, subscriber_count, video_count'),
    supabase.from('channel_categories').select('channel_id'),
    supabase.from('events').select('event_name, user_id, metadata, created_at').gte('created_at', weekAgo).neq('event_name', 'session_start').order('created_at', { ascending: false }),
    supabase.from('events').select('event_name, user_id, metadata, created_at').neq('event_name', 'session_start').order('created_at', { ascending: false }).limit(50),
    supabase.from('health_score_snapshots').select('user_id, score, mood, snapshot_date').order('snapshot_date', { ascending: false }).limit(50),
  ]);

  const users = usersRes.data || [];
  const allChannels = channelsRes.data || [];
  const catAssignments = catAssignRes.data || [];
  const events = eventsRes.data || [];
  const recentEvents = recentEventsRes.data || [];
  const healthScores = healthRes.data || [];

  // Deduplicated channel count (distinct channel_id)
  const uniqueChannels = new Set(allChannels.map(c => c.channel_id)).size;

  // Categorised channel count
  const categorisedIds = new Set(catAssignments.map(c => c.channel_id));
  const categorisedCount = allChannels.filter(c => categorisedIds.has(c.channel_id)).length;

  // Vital signs
  const activeToday = new Set(events.filter(e => new Date(e.created_at) >= new Date(dayAgo)).map(e => e.user_id)).size;
  const activeWeek = new Set(events.map(e => e.user_id)).size;
  const proCount = users.filter(u => u.tier === 'pro').length;

  // Live health score — compute from channel data
  const totalCh = uniqueChannels;
  const catCoverage = totalCh > 0 ? Math.round(25 * (categorisedCount / totalCh) * 10) / 10 : 25;
  const activeCh = allChannels.filter(c => c.video_count > 0 && c.subscriber_count >= 500).length;
  const chHealth = totalCh > 0 ? Math.round(20 * (activeCh / totalCh) * 10) / 10 : 20;
  const liveScore = Math.round(Math.min(100, Math.max(0, catCoverage + 0 + 5 + chHealth + 10 + 10 + 0)));
  const avgHealth = liveScore;

  // Feature usage
  const featureMap = {
    'Auto-sort': ['autosort_run'],
    'Manual categorisation': ['channel_categorised'],
    'Subcategory': ['channel_subcategorised'],
    'Unsubscribe': ['channel_unsubscribed'],
    'Favourite': ['channel_favourited'],
    'The Critic': ['critic_page_visited'],
    'Recommendations': ['recommendation_acted', 'recommendation_dismissed'],
    'Feed': ['feed_viewed', 'feed_category_filtered'],
    'Stash': ['stash_video_added', 'collection_created'],
    'Watch history': ['onboarding_watch_history_uploaded'],
  };

  const featureUsage = Object.entries(featureMap).map(([feature, eventNames]) => {
    const matching = events.filter(e => eventNames.includes(e.event_name));
    return {
      feature,
      usersThisWeek: new Set(matching.map(e => e.user_id)).size,
      actionsThisWeek: matching.length,
    };
  }).filter(f => f.actionsThisWeek > 0 || f.usersThisWeek > 0);

  // Activity feed — enrich with user names
  const userMap = {};
  users.forEach(u => { userMap[u.id] = u.display_name || u.email || u.id.substring(0, 8); });

  const activityFeed = recentEvents
    .filter(e => [
      'onboarding_completed', 'autosort_run', 'channel_unsubscribed',
      'upgrade_completed', 'downgrade_completed', 'free_cap_hit',
      'sabbatical_started', 'recommendation_acted', 'collection_created',
      'channel_favourited', 'channel_unfavourited', 'channel_categorised',
      'sync', 'session_start', 'session_end',
    ].includes(e.event_name))
    .slice(0, 50)
    .map(e => ({
      ...e,
      userName: userMap[e.user_id] || 'Unknown',
    }));

  return NextResponse.json({
    users,
    totalChannels: uniqueChannels,
    vitals: {
      totalUsers: users.length,
      activeToday,
      activeWeek,
      proCount,
      avgHealth,
    },
    featureUsage,
    activityFeed,
  });
}
