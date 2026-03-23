import { NextResponse } from 'next/server';
import { fetchMultipleChannelRSS } from '@/lib/rss';

function getSupabaseAdmin() {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function POST(request) {
  try {
    const supabase = getSupabaseAdmin();

    // Authenticate
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { createClient: createAnonClient } = require('@supabase/supabase-js');
    const authClient = createAnonClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // Get user's subscribed channel IDs
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('channel_id')
      .eq('user_id', user.id);

    if (channelsError) {
      return NextResponse.json({ error: channelsError.message }, { status: 500 });
    }

    if (!channels || channels.length === 0) {
      return NextResponse.json({ message: 'No channels to refresh', newVideos: 0 });
    }

    const channelIds = channels.map(c => c.channel_id).filter(Boolean);

    console.log(`[RSS] User ${user.id}: ${channels.length} channels in DB, ${channelIds.length} with channel_id`);

    if (channelIds.length === 0) {
      return NextResponse.json({
        message: 'No channel IDs found — channels may not have channel_id populated',
        channelsInDb: channels.length,
        channelIds: channels.slice(0, 5).map(c => ({ id: c.channel_id })),
        newVideos: 0,
      });
    }

    // Fetch RSS feeds in batches
    const rssResults = await fetchMultipleChannelRSS(channelIds, 20, 500);

    // Count total videos found across all feeds
    let totalRssVideos = 0;
    let feedsWithVideos = 0;
    for (const [, videos] of rssResults) {
      totalRssVideos += videos.length;
      if (videos.length > 0) feedsWithVideos++;
    }

    console.log(`[RSS] Fetched ${rssResults.size} feeds, ${feedsWithVideos} had videos, ${totalRssVideos} total videos`);

    // Get existing video IDs to avoid duplicates
    const allVideoIds = Array.from(rssResults.values())
      .flat()
      .map(v => v.videoId);

    if (allVideoIds.length === 0) {
      return NextResponse.json({
        message: 'RSS feeds returned no videos',
        channelsChecked: channelIds.length,
        feedsWithVideos,
        sampleChannelIds: channelIds.slice(0, 3),
        newVideos: 0,
      });
    }

    // Batch the dedup check — Supabase .in() has limits on large arrays
    const existingVideoIds = new Set();
    const BATCH = 300;
    for (let i = 0; i < allVideoIds.length; i += BATCH) {
      const batch = allVideoIds.slice(i, i + BATCH);
      const { data: existing } = await supabase
        .from('cached_videos')
        .select('video_id')
        .in('video_id', batch);
      if (existing) existing.forEach(v => existingVideoIds.add(v.video_id));
    }

    // Insert only new videos
    const newVideos = [];

    for (const [channelId, videos] of rssResults) {
      for (const video of videos) {
        if (!existingVideoIds.has(video.videoId)) {
          newVideos.push({
            channel_id: channelId,
            video_id: video.videoId,
            title: video.title,
            thumbnail: video.thumbnail,
            published_at: video.publishedAt,
            playlist_type: 'uploads',
            video_type: 'video',
            fetched_at: new Date().toISOString(),
          });
        }
      }
    }

    console.log(`[RSS] Dedup: ${existingVideoIds.size} already cached, ${newVideos.length} new to insert`);

    if (newVideos.length > 0) {
      let insertErrors = 0;
      for (let i = 0; i < newVideos.length; i += 500) {
        const batch = newVideos.slice(i, i + 500);
        const { error: insertError } = await supabase
          .from('cached_videos')
          .upsert(batch, { onConflict: 'video_id' });

        if (insertError) {
          console.error('[RSS] Insert error:', insertError);
          insertErrors++;
        }
      }
      if (insertErrors) console.error(`[RSS] ${insertErrors} batch insert(s) failed`);
    }

    // Log the refresh event
    await supabase.from('events').insert({
      user_id: user.id,
      event: 'rss_refresh',
    });

    return NextResponse.json({
      message: 'Refresh complete',
      channelsChecked: channelIds.length,
      totalFromRSS: totalRssVideos,
      alreadyCached: existingVideoIds.size,
      newVideos: newVideos.length,
    });

  } catch (error) {
    console.error('[RSS] Refresh error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
