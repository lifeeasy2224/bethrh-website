import Stripe from 'npm:stripe@14';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const PLAN_PRICES: Record<string, { monthly: number; annual: number }> = {
  pro:    { monthly: 900,  annual: 8600 },
  growth: { monthly: 1900, annual: 18200 },
};

const PLAN_NAMES: Record<string, string> = {
  pro:    'برو (Pro)',
  growth: 'نمو (Growth)',
};

function jsonRes(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

type PromoRow = { id: string; code: string; discount_pct: number };

// Single source of truth for promo validation — used by both the checkout
// page's "طبّق" preview (action: 'validate_promo') and the real checkout, so
// the two can never disagree. Runs with the service role: clients have no
// SELECT access to promo_codes, and only an exact code match is ever answered.
async function lookupPromo(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  rawCode: unknown,
): Promise<{ ok: true; row: PromoRow } | { ok: false; error: string }> {
  const code = String(rawCode ?? '').toUpperCase().trim();
  if (!code) return { ok: false, error: 'رمز خصم غير صالح' };

  const { data: row } = await supabase
    .from('promo_codes')
    .select('id, code, discount_pct, max_uses, uses_count, expires_at, is_active')
    .eq('code', code)
    .maybeSingle();

  // Unknown and inactive codes get the same answer so this endpoint can't be
  // used to learn which codes exist.
  if (!row || !row.is_active) return { ok: false, error: 'رمز خصم غير صالح' };
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return { ok: false, error: 'انتهت صلاحية رمز الخصم' };
  }
  if (row.max_uses !== null && row.uses_count >= row.max_uses) {
    return { ok: false, error: 'بلغ رمز الخصم حد استخدامه' };
  }
  return { ok: true, row };
}

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
    if (!authHeader) return jsonRes({ error: 'Unauthorized' }, 401);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return jsonRes({ error: 'Unauthorized' }, 401);

    const { plan, billing, origin, promo_code, action } = await req.json();

    // ── Promo preview (no checkout) ─────────────────────────────────────────────
    // The checkout page calls this when the founder presses "طبّق" instead of
    // reading promo_codes itself (that client read is what exposed every code).
    if (action === 'validate_promo') {
      const result = await lookupPromo(supabase, promo_code);
      if (!result.ok) return jsonRes({ valid: false, error: result.error });
      return jsonRes({ valid: true, code: result.row.code, discount_pct: result.row.discount_pct });
    }

    if (!PLAN_PRICES[plan]) return jsonRes({ error: 'Invalid plan' }, 400);
    if (!['monthly', 'annual'].includes(billing)) return jsonRes({ error: 'Invalid billing cycle' }, 400);

    // ── Validate promo code if provided ─────────────────────────────────────────
    // Logged unconditionally (including "(none)") so a promo that validated
    // client-side but arrived falsy here — the diagnosed silent-fallthrough
    // failure mode — is visible in function logs instead of indistinguishable
    // from a normal no-promo checkout.
    console.log('stripe-checkout: promo_code received =', promo_code || '(none)', 'for user', user.id);

    let discountPct = 0;
    let promoCodeId: string | null = null;

    if (promo_code) {
      const result = await lookupPromo(supabase, promo_code);
      if (!result.ok) return jsonRes({ error: result.error }, 400);

      discountPct = result.row.discount_pct;
      promoCodeId = result.row.id;
    }

    const basePriceAmount = PLAN_PRICES[plan][billing as 'monthly' | 'annual'];
    const interval = billing === 'annual' ? 'year' : 'month';
    const planName = PLAN_NAMES[plan];
    // origin comes from the request body, so only trust our own domains —
    // otherwise Stripe's success/cancel redirect could point anywhere.
    const siteOrigin = ['https://bethra.co', 'https://www.bethra.co'].includes(origin) ? origin : 'https://bethra.co';

    // ── 100% discount — free plan, no Stripe needed ──────────────────────────────
    if (discountPct === 100) {
      const planKey = plan as string;

      const { error: upsertErr } = await supabase.from('subscriptions').upsert({
        user_id: user.id,
        plan: planKey,
        billing_cycle: billing,
        status: 'active',
        current_period_end: billing === 'annual'
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (upsertErr) return jsonRes({ error: upsertErr.message }, 500);

      await supabase.from('profiles').update({ plan: planKey }).eq('user_id', user.id);

      if (promoCodeId) {
        await supabase.rpc('increment_promo_uses', { code_id: promoCodeId });
      }

      return jsonRes({ free: true, redirect: `${siteOrigin}/checkout/success` });
    }

    // ── Apply discount to price ──────────────────────────────────────────────────
    const priceAmount = discountPct > 0
      ? Math.round(basePriceAmount * (1 - discountPct / 100))
      : basePriceAmount;

    // Paid checkout from here on — Stripe key only needed past the free path.
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-06-20',
    });

    // Find/create Stripe customer
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let customerId = existingSub?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    }

    const productName = discountPct > 0
      ? `Bethra ${planName} Plan (${discountPct}% off)`
      : `Bethra ${planName} Plan`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              description: billing === 'annual'
                ? 'Billed annually — save 20%'
                : 'Billed monthly, cancel anytime',
            },
            unit_amount: priceAmount,
            recurring: { interval },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${siteOrigin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteOrigin}/pricing`,
      metadata: {
        user_id: user.id,
        plan,
        billing_cycle: billing,
        promo_code: promo_code ?? '',
        promo_code_id: promoCodeId ?? '',
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan,
          billing_cycle: billing,
          promo_code: promo_code ?? '',
          promo_code_id: promoCodeId ?? '',
        },
      },
    });

    // Increment promo uses_count now (webhook will also fire but idempotent via upsert)
    if (promoCodeId) {
      await supabase.rpc('increment_promo_uses', { code_id: promoCodeId });
    }

    return jsonRes({ url: session.url });
  } catch (error) {
    return jsonRes({ error: (error as Error).message }, 500);
  }
});
