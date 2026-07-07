import Stripe from 'npm:stripe@14';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-06-20',
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing stripe-signature header' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    let event: Stripe.Event;

    if (webhookSecret) {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const plan = session.metadata?.plan;
        const billingCycle = session.metadata?.billing_cycle;

        if (!userId || !plan) break;

        const sub = await stripe.subscriptions.retrieve(session.subscription as string);

        await supabase
          .from('profiles')
          .update({ plan, stripe_customer_id: session.customer as string })
          .eq('user_id', userId);

        await supabase
          .from('subscriptions')
          .upsert(
            {
              user_id: userId,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              plan,
              billing_cycle: billingCycle ?? 'monthly',
              status: sub.status,
              current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
              cancel_at_period_end: sub.cancel_at_period_end,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' },
          );
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        if (!userId) break;

        const plan = sub.metadata?.plan;

        await supabase
          .from('subscriptions')
          .update({
            status: sub.status,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (plan) {
          await supabase.from('profiles').update({ plan }).eq('user_id', userId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        if (!userId) break;

        const plan = sub.metadata?.plan ?? sub.items.data[0]?.price?.metadata?.plan;
        const amount = (sub.items.data[0]?.price?.unit_amount ?? 0) / 100;

        await supabase.from('profiles').update({ plan: 'free' }).eq('user_id', userId);
        await supabase
          .from('subscriptions')
          .update({ status: 'canceled', cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('user_id', userId);

        // Log churn event for revenue dashboard
        await supabase.from('revenue_events').insert({
          user_id: userId,
          event_type: 'subscription_cancelled',
          plan,
          amount,
          stripe_event_id: event.id,
          stripe_subscription_id: sub.id,
        });
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;
        const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const userId = sub.metadata?.user_id;
        if (!userId) break;
        const amount = invoice.amount_paid / 100;
        await supabase.rpc('increment_total_revenue', { target_user_id: userId, inc_amount: amount });
        await supabase.from('revenue_events').insert({
          user_id: userId,
          event_type: 'payment_received',
          plan: sub.metadata?.plan,
          amount,
          currency: invoice.currency,
          stripe_event_id: event.id,
          stripe_subscription_id: sub.id,
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;
        const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const userId = sub.metadata?.user_id;
        if (!userId) break;
        await supabase.from('revenue_events').insert({
          user_id: userId,
          event_type: 'payment_failed',
          plan: sub.metadata?.plan,
          amount: invoice.amount_due / 100,
          currency: invoice.currency,
          stripe_event_id: event.id,
          stripe_subscription_id: sub.id,
        });
        break;
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
