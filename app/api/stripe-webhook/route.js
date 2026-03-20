import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object;
        const customer = await stripe.customers.retrieve(session.customer);
        const uid = customer.metadata?.supabase_uid;
        if (!uid) break;

        await supabase.from('profiles').update({
          tier: 'premium',
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          subscription_status: 'active',
          updated_at: new Date().toISOString(),
        }).eq('id', uid);
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const customer = await stripe.customers.retrieve(sub.customer);
        const uid = customer.metadata?.supabase_uid;
        if (!uid) break;

        const isActive = sub.status === 'active' || sub.status === 'trialing';
        await supabase.from('profiles').update({
          tier: isActive ? 'premium' : 'free',
          subscription_status: sub.status,
          stripe_subscription_id: sub.id,
          updated_at: new Date().toISOString(),
        }).eq('id', uid);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const customer = await stripe.customers.retrieve(sub.customer);
        const uid = customer.metadata?.supabase_uid;
        if (!uid) break;

        await supabase.from('profiles').update({
          tier: 'free',
          subscription_status: 'canceled',
          stripe_subscription_id: null,
          updated_at: new Date().toISOString(),
        }).eq('id', uid);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customer = await stripe.customers.retrieve(invoice.customer);
        const uid = customer.metadata?.supabase_uid;
        if (!uid) break;

        await supabase.from('profiles').update({
          subscription_status: 'past_due',
          updated_at: new Date().toISOString(),
        }).eq('id', uid);
        break;
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return new Response('Handler error', { status: 500 });
  }

  return Response.json({ received: true });
}
