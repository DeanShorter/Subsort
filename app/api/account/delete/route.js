import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getServiceClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.slice(7));
    if (authErr || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();
    if (body.confirm !== 'DELETE') {
      return NextResponse.json({ error: 'Confirmation required' }, { status: 400 });
    }

    const userId = user.id;

    // Log deletion anonymously before deleting data
    const { data: profile } = await supabase.from('profiles').select('tier, created_at').eq('id', userId).maybeSingle();
    const { count: totalChannels } = await supabase.from('channels').select('id', { count: 'exact', head: true }).eq('user_id', userId);
    const { count: managedChannels } = await supabase.from('channels').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_active', true);

    const accountAgeDays = profile?.created_at
      ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (24 * 60 * 60 * 1000))
      : 0;

    await supabase.from('deletion_log').insert({
      plan: profile?.tier || 'free',
      account_age_days: accountAgeDays,
      total_channels: totalChannels || 0,
      managed_channels: managedChannels || 0,
    });

    // Delete all user data in dependency order
    await supabase.from('channel_categories').delete().eq('user_id', userId);
    await supabase.from('stash_items').delete().eq('user_id', userId);
    await supabase.from('stash_collections').delete().eq('user_id', userId);
    await supabase.from('user_channels').delete().eq('user_id', userId);
    await supabase.from('channels').delete().eq('user_id', userId);
    await supabase.from('subcategories').delete().eq('user_id', userId);
    await supabase.from('categories').delete().eq('user_id', userId);
    await supabase.from('recommendations').delete().eq('user_id', userId);
    await supabase.from('health_score_snapshots').delete().eq('user_id', userId);
    await supabase.from('events').delete().eq('user_id', userId);
    await supabase.from('api_usage').delete().eq('user_id', userId);
    await supabase.from('user_plans').delete().eq('user_id', userId);
    await supabase.from('cleanup_settings').delete().eq('user_id', userId);
    await supabase.from('profiles').delete().eq('id', userId);

    // Delete the auth user
    const { error: deleteErr } = await supabase.auth.admin.deleteUser(userId);
    if (deleteErr) {
      console.error('[DeleteAccount] Failed to delete auth user:', deleteErr);
      return NextResponse.json({ error: 'Failed to delete auth user' }, { status: 500 });
    }

    console.log(`[DeleteAccount] User ${userId} deleted successfully`);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[DeleteAccount] Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
