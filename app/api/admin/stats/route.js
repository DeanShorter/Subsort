import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function GET(req) {
  // Verify the caller is an admin via their session
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const supabase = getServiceClient();

  // Verify token and check admin tier
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

  // Fetch all admin data with service role (bypasses RLS)
  const [usersRes, channelsRes] = await Promise.all([
    supabase.from('profiles').select('*'),
    supabase.from('channels').select('id', { count: 'exact', head: true }),
  ]);

  return NextResponse.json({
    users: usersRes.data || [],
    totalChannels: channelsRes.count || 0,
  });
}
