import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { enrichFeed } from '../../../lib/enrich-feed';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getServiceClient();
    const token = authHeader.slice(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    // YouTube OAuth token for duration API calls
    const ytToken = req.headers.get('x-youtube-token') || '';

    // Fetch user's channels with category/subcategory info
    const { data: channels } = await supabase
      .from('channels')
      .select('channel_id, name, subcategory_id, subcategories(name)')
      .eq('user_id', user.id);

    const channelIds = (channels || []).map(c => c.channel_id).filter(Boolean);

    // Build channel info map
    const channelMap = {};
    (channels || []).forEach(c => {
      if (c.channel_id) channelMap[c.channel_id] = { name: c.name, subcategory: c.subcategories?.name || null };
    });

    // Get category assignments for user's channels
    const { data: catAssignments } = await supabase
      .from('channel_categories')
      .select('youtube_channel_id, categories!inner(name)')
      .eq('user_id', user.id);

    const channelCatMap = {};
    (catAssignments || []).forEach(ca => {
      if (ca.youtube_channel_id && ca.categories?.name) {
        channelCatMap[ca.youtube_channel_id] = ca.categories.name;
      }
    });
    if (!channelIds.length) {
      return NextResponse.json({ videos: [], stats: { total: 0, cached: 0, fetched: 0, tagged: 0 } });
    }

    // Get recent videos from cache
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const BATCH = 300;
    let allVideos = [];
    for (let i = 0; i < channelIds.length; i += BATCH) {
      const batch = channelIds.slice(i, i + BATCH);
      const { data } = await supabase
        .from('cached_videos')
        .select('video_id, title, channel_id, thumbnail, published_at, video_type')
        .in('channel_id', batch)
        .gte('published_at', since)
        .neq('video_type', 'sentinel')
        .order('published_at', { ascending: false })
        .limit(50);
      if (data) allVideos.push(...data);
    }

    // Map to feed video shape
    const feedVideos = allVideos.slice(0, 50).map(v => ({
      id: v.video_id,
      title: v.title,
      channelId: v.channel_id,
      thumbnail: v.thumbnail,
      publishedAt: v.published_at,
      type: v.video_type || 'video',
      description: '',
    }));

    // Check how many durations are already cached
    const videoIds = feedVideos.map(v => v.id);
    let cachedCount = 0;
    if (videoIds.length) {
      const { data: cachedBefore } = await supabase
        .from('video_duration_cache')
        .select('youtube_video_id')
        .in('youtube_video_id', videoIds.slice(0, 300));
      cachedCount = (cachedBefore || []).length;
    }

    // Enrich with durations + tags (uses YouTube token for API calls)
    const enriched = await enrichFeed(supabase, ytToken, feedVideos);

    // Attach channel name, category, subcategory
    const results = enriched.map(v => ({
      ...v,
      channelName: channelMap[v.channelId]?.name || '',
      category: channelCatMap[v.channelId] || '',
      subcategory: channelMap[v.channelId]?.subcategory || '',
    }));

    const taggedCount = results.filter(v => v.content_tags?.length > 0).length;

    return NextResponse.json({
      videos: results,
      stats: {
        total: enriched.length,
        cached: cachedCount,
        fetched: Math.max(0, videoIds.length - cachedCount),
        tagged: taggedCount,
      },
    });
  } catch (e) {
    console.error('[VibeTest] Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
