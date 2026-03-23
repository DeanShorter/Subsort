import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    let { data: profile } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single();
    if (profile?.tier !== 'admin' && profile?.tier !== 'pro') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { subject, previewText, htmlContent, to } = await request.json();
    if (!to) {
      return NextResponse.json({ error: 'No recipient' }, { status: 400 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const unsubscribeUrl = `https://usefreedly.com/unsubscribe?email=${encodeURIComponent(to)}`;
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscrub</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F8F7F4; color: #1A1A18; }
    .wrapper { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
    .header { margin-bottom: 24px; }
    .logo-text { font-size: 22px; font-weight: 700; color: #1A1A18; text-decoration: none; }
    .logo-mint { color: #2EB88A; }
    .content { background: #FFFFFF; border-radius: 12px; padding: 32px; border: 1px solid rgba(0,0,0,0.07); }
    .content h2 { font-size: 20px; font-weight: 700; margin: 0 0 12px; }
    .content p { font-size: 15px; line-height: 1.7; color: #4A4A45; margin: 0 0 14px; }
    .content strong { color: #1A1A18; }
    .content a { color: #2EB88A; }
    .footer { margin-top: 24px; text-align: center; font-size: 12px; color: #A3A29B; }
    .footer a { color: #A3A29B; text-decoration: underline; }
  </style>
</head>
<body>
  <span style="display:none;max-height:0;overflow:hidden;">${previewText || ''}</span>
  <div class="wrapper">
    <div class="header">
      <a href="https://usefreedly.com" class="logo-text"><span class="logo-mint">sub</span>scrub</a>
    </div>
    <div class="content">
      ${htmlContent || ''}
    </div>
    <div class="footer">
      <p>You're receiving this because you signed up for Subscrub.</p>
      <p><a href="${unsubscribeUrl}">Unsubscribe</a> · <a href="https://usefreedly.com">Visit Subscrub</a></p>
    </div>
  </div>
</body>
</html>`;

    await resend.emails.send({
      from: 'Subscrub <hello@usefreedly.com>',
      replyTo: 'deanage95@gmail.com',
      to,
      subject: `[TEST] ${subject || 'No subject'}`,
      html,
      headers: {
        'List-Unsubscribe': `<https://usefreedly.com/unsubscribe?email=${encodeURIComponent(to)}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    return NextResponse.json({ sent: 1, to });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
