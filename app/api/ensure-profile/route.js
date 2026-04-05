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
    const body = await req.json();
    if (!body.user_id) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });

    const supabase = getServiceClient();

    // Check if profile already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', body.user_id)
      .maybeSingle();

    if (existing) return NextResponse.json({ ok: true, existed: true });

    // Create profile using service role (bypasses RLS)
    const { error } = await supabase.from('profiles').insert({
      id: body.user_id,
      email: body.email || '',
      display_name: body.display_name || '',
      avatar_url: body.avatar_url || '',
    });

    if (error) {
      console.error('[EnsureProfile] Failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, created: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
