import Stripe from 'npm:stripe@14';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function jsonRes(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Creates a Stripe Customer Portal session so a paying user can manage their
// subscription themselves — cancel, update card, view invoices — on Stripe's
// hosted page. Returns the URL for the client to redirect to.
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonRes({ error: 'غير مصرّح — سجّل الدخول ثم حاول مجدداً' }, 401);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return jsonRes({ error: 'غير مصرّح — سجّل الدخول ثم حاول مجدداً' }, 401);

    const { origin } = await req.json().catch(() => ({ origin: null }));
    // origin from the client is untrusted — only ever return to our own domain.
    const siteOrigin = ['https://bethra.co', 'https://www.bethra.co'].includes(origin) ? origin : 'https://bethra.co';

    // Find the user's Stripe customer id. Prefer the subscriptions table; fall
    // back to profiles if present.
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let customerId = sub?.stripe_customer_id as string | undefined;

    if (!customerId) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .maybeSingle();
      customerId = prof?.stripe_customer_id as string | undefined;
    }

    if (!customerId) {
      return jsonRes({ error: 'لا يوجد اشتراك مدفوع لإدارته.' }, 400);
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-06-20',
    });

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteOrigin}/settings`,
    });

    return jsonRes({ url: session.url });
  } catch (error) {
    return jsonRes({ error: (error as Error).message }, 500);
  }
});
