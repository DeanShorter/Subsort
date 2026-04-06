import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { activateChannelsForFreeTier } from '../../../lib/free-tier';

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
    const { data: { user }, error } = await supabase.auth.getUser(authHeader.slice(7));
    if (error || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const result = await activateChannelsForFreeTier(supabase, user.id);
    return NextResponse.json(result);
  } catch (e) {
    console.error('[ApplyCap] Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
