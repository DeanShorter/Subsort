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
    return NextResponse.json({ channels: [], reason: 'unauthenticated' });
  }

  const supabase = getServiceClient();
  const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
  if (!user) return NextResponse.json({ channels: [], reason: 'unauthenticated' });

  // Get user's top categories by channel count (using category names, not IDs)
  const { data: userCats } = await supabase
    .from('channel_categories')
    .select('category_id, categories!inner(id, name)')
    .eq('user_id', user.id);

  if (!userCats || userCats.length < 3) {
    return NextResponse.json({ channels: [], reason: 'insufficient_categories' });
  }

  const catCounts = {};
  userCats.forEach(cc => {
    const name = cc.categories?.name;
    if (!name) return;
    if (!catCounts[name]) catCounts[name] = { name, count: 0 };
    catCounts[name].count++;
  });

  const topCatNames = Object.values(catCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(c => c.name);

  // Get user's subscribed channel IDs (ALL — active and inactive)
  const [ucRes, legacyRes] = await Promise.all([
    supabase.from('user_channels').select('youtube_channel_id').eq('user_id', user.id),
    supabase.from('channels').select('channel_id').eq('user_id', user.id),
  ]);
  const userSubIds = new Set([
    ...((ucRes.data || []).map(s => s.youtube_channel_id)),
    ...((legacyRes.data || []).map(s => s.channel_id)),
  ]);

  // Get all channel_categories across ALL users for the top category names
  const { data: allCatAssignments } = await supabase
    .from('channel_categories')
    .select('youtube_channel_id, categories!inner(name)')
    .filter('categories.name', 'in', `(${topCatNames.map(n => `"${n}"`).join(',')})`);

  // Build a map of youtube_channel_id → category name, excluding user's own channels
  const channelCatMap = {};
  (allCatAssignments || []).forEach(cc => {
    const ytId = cc.youtube_channel_id;
    if (!ytId || userSubIds.has(ytId)) return;
    if (!channelCatMap[ytId]) channelCatMap[ytId] = cc.categories?.name || '';
  });

  const candidateIds = Object.keys(channelCatMap);
  if (!candidateIds.length) {
    return NextResponse.json({ channels: [], topCategories: topCatNames });
  }

  // Count how many Subsnub users subscribe to each candidate
  const { data: ucCounts } = await supabase
    .from('user_channels')
    .select('youtube_channel_id')
    .in('youtube_channel_id', candidateIds.slice(0, 500));

  const userCountMap = {};
  (ucCounts || []).forEach(uc => {
    userCountMap[uc.youtube_channel_id] = (userCountMap[uc.youtube_channel_id] || 0) + 1;
  });

  // Fetch shared_channels data for candidates
  // Sort candidates by user count first to pick the best ones
  const sorted = candidateIds
    .map(id => ({ id, users: userCountMap[id] || 0 }))
    .sort((a, b) => b.users - a.users)
    .slice(0, 50);

  const { data: scData } = await supabase
    .from('shared_channels')
    .select('youtube_channel_id, title, subscriber_count, thumbnail_url')
    .in('youtube_channel_id', sorted.map(s => s.id));

  const scMap = {};
  (scData || []).forEach(sc => { scMap[sc.youtube_channel_id] = sc; });

  const results = sorted
    .filter(s => scMap[s.id])
    .slice(0, 12)
    .map(s => {
      const sc = scMap[s.id];
      return {
        youtube_channel_id: sc.youtube_channel_id,
        title: sc.title,
        subscriber_count: sc.subscriber_count,
        thumbnail_url: sc.thumbnail_url,
        category: channelCatMap[sc.youtube_channel_id] || '',
        subsnub_users: s.users,
      };
    });

  return NextResponse.json({ channels: results, topCategories: topCatNames });
}
