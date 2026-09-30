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

// Arabic only: mixing Latin text into these names made the Stripe checkout
// page render them in a jumbled bidi order.
const PLAN_NAMES: Record<string, string> = {
  pro:    'برو',
  growth: 'نمو',
};

function jsonRes(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

type PromoRow = { id: string; code: string; discount_pct: number };

const PROMO_INVALID = 'رمز الخصم غير صالح أو غير متاح';

// Guessing codes one attempt at a time: cap promo checks per user.
const PROMO_HOURLY = 10;
// deno-lint-ignore no-explicit-any
async function promoLimited(supabase: any, userId: string): Promise<boolean> {
  const subject = `promo:${userId}`;
  const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await supabase.from('ai_usage').select('id', { count: 'exact', head: true })
    .eq('subject', subject).gte('created_at', hourAgo);
  if ((count ?? 0) >= PROMO_HOURLY) return true;
  await supabase.from('ai_usage').insert({ subject, fn: 'promo' });
  return false;
}

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
  if (!code || code.length > 64) return { ok: false, error: PROMO_INVALID };

  const { data: row } = await supabase
    .from('promo_codes')
    .select('id, code, discount_pct, max_uses, uses_count, expires_at, is_active')
    .eq('code', code)
    .maybeSingle();

  // One message for every failure (unknown, inactive, expired, used up) so the
  // endpoint can't be used to learn which codes exist.
  const expired = row?.expires_at && new Date(row.expires_at) < new Date();
  const usedUp = row?.max_uses !== null && row?.max_uses !== undefined && row.uses_count >= row.max_uses;
  if (!row || !row.is_active || expired || usedUp) return { ok: false, error: PROMO_INVALID };
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
    if (!authHeader) return jsonRes({ error: 'غير مصرّح — سجّل الدخول ثم حاول مجدداً' }, 401);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return jsonRes({ error: 'غير مصرّح — سجّل الدخول ثم حاول مجدداً' }, 401);

    const { plan, billing, origin, promo_code, action } = await req.json();

    // ── Promo preview (no checkout) ─────────────────────────────────────────────
    // The checkout page calls this when the founder presses "طبّق" instead of
    // reading promo_codes itself (that client read is what exposed every code).
    if (action === 'validate_promo') {
      if (await promoLimited(supabase, user.id)) {
        return jsonRes({ valid: false, error: 'محاولات كثيرة — حاول بعد ساعة' });
      }
      const result = await lookupPromo(supabase, promo_code);
      if (!result.ok) return jsonRes({ valid: false, error: result.error });
      return jsonRes({ valid: true, code: result.row.code, discount_pct: result.row.discount_pct });
    }

    if (!PLAN_PRICES[plan]) return jsonRes({ error: 'خطة غير صالحة' }, 400);
    if (!['monthly', 'annual'].includes(billing)) return jsonRes({ error: 'دورة فوترة غير صالحة' }, 400);

    // ── Validate promo code if provided ─────────────────────────────────────────
    // Logged unconditionally (including "(none)") so a promo that validated
    // client-side but arrived falsy here — the diagnosed silent-fallthrough
    // failure mode — is visible in function logs instead of indistinguishable
    // from a normal no-promo checkout.
    console.log('stripe-checkout: promo_code received =', promo_code || '(none)', 'for user', user.id);

    let discountPct = 0;
    let promoCodeId: string | null = null;

    if (promo_code) {
      if (await promoLimited(supabase, user.id)) {
        return jsonRes({ error: 'محاولات كثيرة — حاول بعد ساعة' }, 429);
      }
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

      // Claim a use atomically first; if two requests race for the last use,
      // only one wins and the other gets the invalid-code message.
      const { data: claimed, error: claimErr } = await supabase.rpc('increment_promo_uses', { code_id: promoCodeId });
      if (claimErr || claimed !== true) return jsonRes({ error: PROMO_INVALID }, 400);

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

      return jsonRes({ free: true, redirect: `${siteOrigin}/checkout/success` });
    }

    // ── Apply discount to price ──────────────────────────────────────────────────
    const priceAmount = discountPct > 0
      ? Math.round(basePriceAmount * (1 - discountPct / 100))
      : basePriceAmount;

    // Paid checkout with a partial discount: claim the use atomically too.
    if (promoCodeId) {
      const { data: claimed, error: claimErr } = await supabase.rpc('increment_promo_uses', { code_id: promoCodeId });
      if (claimErr || claimed !== true) return jsonRes({ error: PROMO_INVALID }, 400);
    }

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
      ? `بذرة — خطة ${planName} (خصم ${discountPct}٪)`
      : `بذرة — خطة ${planName}`;

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
                ? 'تُدفع سنوياً — وفّر 20٪'
                : 'تُدفع شهرياً — يمكنك الإلغاء في أي وقت',
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

    return jsonRes({ url: session.url });
  } catch (error) {
    return jsonRes({ error: (error as Error).message }, 500);
  }
});
