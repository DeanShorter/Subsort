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
  const supabase = getServiceClient();

  // Get current user
  let currentUserId = null;
  if (authHeader?.startsWith('Bearer ')) {
    const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
    if (user) currentUserId = user.id;
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const sort = searchParams.get('sort') || 'popular';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const search = searchParams.get('q');

  // Try materialised view first, fall back to direct query
  let channels = [];
  const { data: discoverData, error: discoverErr } = await supabase
    .from('channel_discover')
    .select('*, categories:consensus_category_id(name)');

  if (discoverErr || !discoverData?.length) {
    // Fallback: aggregate from user_channels + shared_channels
    const { data: ucData } = await supabase
      .from('user_channels')
      .select('youtube_channel_id, user_id');

    const { data: scData } = await supabase
      .from('shared_channels')
      .select('*');

    const { data: ccData } = await supabase
      .from('channel_categories')
      .select('youtube_channel_id, category_id, categories!inner(name)');

    const sharedMap = {};
    (scData || []).forEach(sc => { sharedMap[sc.youtube_channel_id] = sc; });

    const userCounts = {};
    (ucData || []).forEach(uc => {
      userCounts[uc.youtube_channel_id] = (userCounts[uc.youtube_channel_id] || 0) + 1;
    });

    const catMap = {};
    (ccData || []).forEach(cc => {
      if (cc.youtube_channel_id && cc.categories?.name) {
        catMap[cc.youtube_channel_id] = cc.categories.name;
      }
    });

    const seen = new Set();
    (scData || []).forEach(sc => {
      if (seen.has(sc.youtube_channel_id)) return;
      seen.add(sc.youtube_channel_id);
      channels.push({
        youtube_channel_id: sc.youtube_channel_id,
        title: sc.title,
        description: (sc.description || '').substring(0, 200),
        subscriber_count: sc.subscriber_count,
        video_count: sc.video_count,
        thumbnail_url: sc.thumbnail_url,
        custom_url: sc.custom_url,
        category: catMap[sc.youtube_channel_id] || '',
        subsnub_users: userCounts[sc.youtube_channel_id] || 0,
      });
    });
  } else {
    channels = discoverData.map(d => ({
      youtube_channel_id: d.youtube_channel_id,
      title: d.title,
      description: (d.description || '').substring(0, 200),
      subscriber_count: d.subscriber_count,
      video_count: d.video_count,
      thumbnail_url: d.thumbnail_url,
      custom_url: d.custom_url,
      category: d.categories?.name || '',
      subsnub_users: d.subsnub_user_count || 0,
    }));
  }

  // Filter by category
  if (category) {
    channels = channels.filter(c => c.category === category);
  }

  // Exclude current user's subscriptions (check BOTH tables — user_channels and legacy channels)
  if (currentUserId) {
    const [ucRes, legacyRes] = await Promise.all([
      supabase.from('user_channels').select('youtube_channel_id').eq('user_id', currentUserId),
      supabase.from('channels').select('channel_id').eq('user_id', currentUserId),
    ]);
    const userSubIds = new Set([
      ...((ucRes.data || []).map(s => s.youtube_channel_id)),
      ...((legacyRes.data || []).map(s => s.channel_id)),
    ]);
    channels = channels.filter(c => !userSubIds.has(c.youtube_channel_id));
  }

  // Search
  if (search) {
    const q = search.toLowerCase();
    channels = channels.filter(c =>
      (c.title || '').toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q)
    );
  }

  // Sort
  channels.sort((a, b) => {
    switch (sort) {
      case 'subscribers': return (b.subscriber_count || 0) - (a.subscriber_count || 0);
      case 'active': return (b.video_count || 0) - (a.video_count || 0);
      default: return (b.subsnub_users || 0) - (a.subsnub_users || 0);
    }
  });

  const total = channels.length;
  const paged = channels.slice((page - 1) * limit, page * limit);

  return NextResponse.json({ channels: paged, total, page, has_more: page * limit < total });
}
