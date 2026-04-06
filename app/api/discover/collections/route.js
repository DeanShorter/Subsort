import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function GET(req) {
  try {
  const supabase = getServiceClient();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type'); // learning, playlist, rabbithole, or null for all types

  const types = type ? [type] : ['learning', 'playlist', 'rabbithole'];
  const result = {};

  for (const t of types) {
    const { data: collections, error } = await supabase
      .from('collections')
      .select('id, slug, title, description, collection_type, video_count, estimated_duration_seconds, tags, user_id, created_at')
      .eq('collection_type', t)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error || !collections?.length) {
      result[t] = [];
      continue;
    }

    // Get author profiles
    const userIds = [...new Set(collections.map(c => c.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds);

    const profileMap = {};
    (profiles || []).forEach(p => { profileMap[p.id] = p; });

    // Get ratings
    const collectionIds = collections.map(c => c.id);
    const { data: ratings } = await supabase
      .from('collection_rating_summary')
      .select('collection_id, average_rating, review_count')
      .in('collection_id', collectionIds);

    const ratingMap = {};
    (ratings || []).forEach(r => { ratingMap[r.collection_id] = r; });

    result[t] = collections.map(c => {
      const profile = profileMap[c.user_id] || {};
      const rating = ratingMap[c.id] || {};
      return {
        id: c.id,
        slug: c.slug,
        title: c.title,
        description: c.description,
        collection_type: c.collection_type,
        video_count: c.video_count,
        estimated_duration_seconds: c.estimated_duration_seconds,
        tags: c.tags || [],
        author_name: profile.display_name || 'Anonymous',
        author_avatar: profile.avatar_url || null,
        average_rating: rating.average_rating || 0,
        review_count: rating.review_count || 0,
      };
    });
  }

  return NextResponse.json(result);
  } catch (e) {
    console.error('[Collections] Error:', e);
    return NextResponse.json({ learning: [], playlist: [], rabbithole: [] });
  }
}
