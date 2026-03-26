import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const { userId, email } = await req.json();

  if (!userId || !email) {
    return Response.json({ error: 'Missing userId or email' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get existing Stripe customer ID if one exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, tier')
    .eq('id', userId)
    .single();

  // Already premium — don't create a second subscription
  if (profile?.tier === 'premium') {
    return Response.json({ error: 'Already premium' }, { status: 400 });
  }

  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email,
      metadata: { supabase_uid: userId },
    });
    customerId = customer.id;

    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/home?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/home`,
    allow_promotion_codes: true,
  });

  return Response.json({ url: session.url });
}
