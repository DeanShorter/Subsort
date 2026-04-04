import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.redirect('https://getsubsnub.com');
  }

  const supabase = getSupabaseAdmin();

  await supabase
    .from('profiles')
    .update({ newsletter_opt_in: false })
    .eq('email', email);

  return NextResponse.redirect('https://getsubsnub.com/unsubscribed');
}
