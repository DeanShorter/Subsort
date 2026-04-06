import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function GET(req) {
  const supabase = getServiceClient();
  const authHeader = req.headers.get('authorization');
  const { searchParams } = new URL(req.url);

  const categoryName = searchParams.get('category');
  const subcategory = searchParams.get('subcategory'); // filter grid by subcategory name
  const search = searchParams.get('q');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 50);
  const excludeIds = (searchParams.get('exclude') || '').split(',').filter(Boolean); // featured IDs to exclude from grid
  const section = searchParams.get('section'); // 'featured', 'grid', or null (both)

  // Get current user
  let currentUserId = null;
  if (authHeader?.startsWith('Bearer ')) {
    const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
    if (user) currentUserId = user.id;
  }

  // Get user's subscribed channel IDs
  let userSubIds = new Set();
  if (currentUserId) {
    const [ucRes, legacyRes] = await Promise.all([
      supabase.from('user_channels').select('youtube_channel_id').eq('user_id', currentUserId),
      supabase.from('channels').select('channel_id').eq('user_id', currentUserId),
    ]);
    userSubIds = new Set([
      ...((ucRes.data || []).map(s => s.youtube_channel_id)),
      ...((legacyRes.data || []).map(s => s.channel_id)),
    ]);
  }

  // Get all channels in this category from channel_categories (across all users)
  const { data: catAssignments } = await supabase
    .from('channel_categories')
    .select('youtube_channel_id, categories!inner(name)')
    .eq('categories.name', categoryName);

  const categoryChannelIds = new Set();
  (catAssignments || []).forEach(ca => {
    if (ca.youtube_channel_id) categoryChannelIds.add(ca.youtube_channel_id);
  });

  // Remove user's own subscriptions
  const discoverableIds = [...categoryChannelIds].filter(id => !userSubIds.has(id));
  if (!discoverableIds.length) {
    return NextResponse.json({
      featured: [], subcategories: [], channels: [],
      total: 0, page: 1, has_more: false,
    });
  }

  // Fetch shared_channels data for all discoverable channels
  const BATCH = 300;
  let allChannelData = [];
  for (let i = 0; i < discoverableIds.length; i += BATCH) {
    const batch = discoverableIds.slice(i, i + BATCH);
    const { data } = await supabase
      .from('shared_channels')
      .select('youtube_channel_id, title, description, subscriber_count, video_count, thumbnail_url, custom_url')
      .in('youtube_channel_id', batch);
    if (data) allChannelData.push(...data);
  }

  const scMap = {};
  allChannelData.forEach(sc => { scMap[sc.youtube_channel_id] = sc; });

  // Count subsnub users per channel
  const { data: ucCounts } = await supabase
    .from('user_channels')
    .select('youtube_channel_id')
    .in('youtube_channel_id', discoverableIds.slice(0, 500));

  const userCountMap = {};
  (ucCounts || []).forEach(uc => {
    userCountMap[uc.youtube_channel_id] = (userCountMap[uc.youtube_channel_id] || 0) + 1;
  });

  // Get subcategory assignments for discoverable channels from ALL users
  // (including the current user's assignments — they categorised these channels even though they subscribe to them)
  const allCategoryChannelIds = [...categoryChannelIds]; // all channels in this category, before exclusion
  const [subFromUc, subFromLegacy] = await Promise.all([
    supabase
      .from('user_channels')
      .select('youtube_channel_id, subcategory_id, subcategories!inner(id, name)')
      .in('youtube_channel_id', allCategoryChannelIds.slice(0, 500))
      .not('subcategory_id', 'is', null),
    supabase
      .from('channels')
      .select('channel_id, subcategory_id, subcategories!inner(id, name)')
      .in('channel_id', allCategoryChannelIds.slice(0, 500))
      .not('subcategory_id', 'is', null),
  ]);

  // Build consensus subcategory per channel (mode across all users)
  const channelSubVotes = {};
  (subFromUc.data || []).forEach(sa => {
    const ytId = sa.youtube_channel_id;
    const subName = sa.subcategories?.name;
    if (!ytId || !subName) return;
    if (!channelSubVotes[ytId]) channelSubVotes[ytId] = {};
    channelSubVotes[ytId][subName] = (channelSubVotes[ytId][subName] || 0) + 1;
  });
  (subFromLegacy.data || []).forEach(sa => {
    const ytId = sa.channel_id;
    const subName = sa.subcategories?.name;
    if (!ytId || !subName) return;
    if (!channelSubVotes[ytId]) channelSubVotes[ytId] = {};
    channelSubVotes[ytId][subName] = (channelSubVotes[ytId][subName] || 0) + 1;
  });

  const channelSubcategory = {};
  Object.entries(channelSubVotes).forEach(([ytId, votes]) => {
    const best = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
    if (best) channelSubcategory[ytId] = best[0];
  });

  // Build subcategory counts
  const subCounts = {};
  discoverableIds.forEach(id => {
    const sub = channelSubcategory[id];
    if (sub) {
      subCounts[sub] = (subCounts[sub] || 0) + 1;
    }
  });
  const subcategoriesList = Object.entries(subCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Build enriched channel list
  const enrichedChannels = discoverableIds
    .filter(id => scMap[id])
    .map(id => ({
      ...scMap[id],
      subsnub_users: userCountMap[id] || 0,
      subcategory: channelSubcategory[id] || null,
    }))
    .sort((a, b) => (b.subsnub_users || 0) - (a.subsnub_users || 0) || (b.subscriber_count || 0) - (a.subscriber_count || 0));

  const result = {};

  // ── Featured section ──
  if (section !== 'grid') {
    let featuredSubcategory = null;
    let featuredChannels = [];

    if (currentUserId) {
      // Find user's top subcategory in this category
      const { data: userSubs } = await supabase
        .from('user_channels')
        .select('subcategory_id, subcategories!inner(id, name, category_id, categories!inner(name))')
        .eq('user_id', currentUserId)
        .not('subcategory_id', 'is', null);

      const subCatCounts = {};
      (userSubs || []).forEach(us => {
        const catName = us.subcategories?.categories?.name;
        const subName = us.subcategories?.name;
        if (catName === categoryName && subName) {
          subCatCounts[subName] = (subCatCounts[subName] || 0) + 1;
        }
      });

      const topSub = Object.entries(subCatCounts).sort((a, b) => b[1] - a[1])[0];
      if (topSub) {
        featuredSubcategory = topSub[0];
        featuredChannels = enrichedChannels
          .filter(ch => ch.subcategory === featuredSubcategory)
          .slice(0, 6);
      }
    }

    // Fallback: popular channels in this category
    if (!featuredChannels.length) {
      featuredSubcategory = null;
      featuredChannels = enrichedChannels.slice(0, 6);
    }

    result.featured = featuredChannels;
    result.featured_subcategory = featuredSubcategory;
  }

  // ── Subcategories ──
  if (section !== 'grid') {
    result.subcategories = subcategoriesList;
  }

  // ── Grid section ──
  if (section !== 'featured') {
    let gridChannels = enrichedChannels;

    // Exclude featured IDs
    if (excludeIds.length) {
      const excSet = new Set(excludeIds);
      gridChannels = gridChannels.filter(ch => !excSet.has(ch.youtube_channel_id));
    }

    // Filter by subcategory
    if (subcategory) {
      gridChannels = gridChannels.filter(ch => ch.subcategory === subcategory);
    }

    // Search
    if (search) {
      const q = search.toLowerCase();
      gridChannels = gridChannels.filter(ch =>
        (ch.title || '').toLowerCase().includes(q) ||
        (ch.description || '').toLowerCase().includes(q)
      );
    }

    const total = gridChannels.length;
    const paged = gridChannels.slice((page - 1) * limit, page * limit);

    result.channels = paged;
    result.total = total;
    result.page = page;
    result.has_more = page * limit < total;
  }

  return NextResponse.json(result);
}
