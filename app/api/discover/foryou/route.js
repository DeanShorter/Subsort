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

  // Get user's top categories by channel count
  const { data: userCats } = await supabase
    .from('channel_categories')
    .select('category_id, categories!inner(id, name)')
    .eq('user_id', user.id);

  if (!userCats || userCats.length < 3) {
    return NextResponse.json({ channels: [], reason: 'insufficient_categories' });
  }

  // Count channels per category
  const catCounts = {};
  userCats.forEach(cc => {
    const name = cc.categories?.name;
    const id = cc.categories?.id;
    if (!name) return;
    if (!catCounts[name]) catCounts[name] = { id, name, count: 0 };
    catCounts[name].count++;
  });

  const topCats = Object.values(catCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Get user's subscribed channel IDs (ALL — active and inactive)
  const [ucRes, legacyRes] = await Promise.all([
    supabase.from('user_channels').select('youtube_channel_id').eq('user_id', user.id),
    supabase.from('channels').select('channel_id').eq('user_id', user.id),
  ]);
  const userSubIds = new Set([
    ...((ucRes.data || []).map(s => s.youtube_channel_id)),
    ...((legacyRes.data || []).map(s => s.channel_id)),
  ]);

  // Try channel_discover view first
  const topCatIds = topCats.map(c => c.id);
  let results = [];

  const { data: discoverData, error: discoverErr } = await supabase
    .from('channel_discover')
    .select('*')
    .in('consensus_category_id', topCatIds)
    .order('subsnub_user_count', { ascending: false })
    .limit(50);

  if (!discoverErr && discoverData?.length) {
    // Get category names for these channels
    const catNameMap = {};
    topCats.forEach(c => { catNameMap[c.id] = c.name; });

    results = discoverData
      .filter(d => !userSubIds.has(d.youtube_channel_id))
      .slice(0, 12)
      .map(d => ({
        youtube_channel_id: d.youtube_channel_id,
        title: d.title,
        subscriber_count: d.subscriber_count,
        thumbnail_url: d.thumbnail_url,
        category: catNameMap[d.consensus_category_id] || '',
        subsnub_users: d.subsnub_user_count || 0,
      }));
  } else {
    // Fallback: use shared_channels + channel_categories
    const { data: ccData } = await supabase
      .from('channel_categories')
      .select('youtube_channel_id, category_id, categories!inner(id, name)')
      .in('category_id', topCatIds);

    const channelCats = {};
    (ccData || []).forEach(cc => {
      if (cc.youtube_channel_id && cc.categories?.name) {
        channelCats[cc.youtube_channel_id] = cc.categories.name;
      }
    });

    const candidateIds = Object.keys(channelCats).filter(id => !userSubIds.has(id));
    if (candidateIds.length) {
      const { data: scData } = await supabase
        .from('shared_channels')
        .select('youtube_channel_id, title, subscriber_count, thumbnail_url')
        .in('youtube_channel_id', candidateIds.slice(0, 100))
        .order('subscriber_count', { ascending: false })
        .limit(12);

      results = (scData || []).map(sc => ({
        ...sc,
        category: channelCats[sc.youtube_channel_id] || '',
        subsnub_users: 0,
      }));
    }
  }

  return NextResponse.json({ channels: results, topCategories: topCats.map(c => c.name) });
}
