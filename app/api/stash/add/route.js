import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    }
  );

  // Verify user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return Response.json({ error: 'Invalid token' }, { status: 401 });
  }

  // Check Pro status
  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .single();

  if (!profile || profile.tier === 'free') {
    return Response.json({ error: 'Pro subscription required' }, { status: 403 });
  }

  // Parse request body
  const { youtube_video_id, collection_id } = await request.json();

  if (!youtube_video_id) {
    return Response.json({ error: 'Video ID required' }, { status: 400 });
  }

  // Add to stash
  const { error: insertError } = await supabase
    .from('stash_items')
    .upsert({
      user_id: user.id,
      video_id: youtube_video_id,
      collection_id: collection_id || null,
      saved_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,video_id',
    });

  if (insertError) {
    return Response.json({ error: 'Failed to add to Stash' }, { status: 500 });
  }

  return Response.json({ success: true });
}
