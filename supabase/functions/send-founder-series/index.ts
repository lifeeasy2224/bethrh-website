import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders, resolveBody, getServiceClient, jsonResp } from '../_shared/email-helper.ts';
import { checkCronAuth } from '../_shared/cron-auth.ts';
import {
  FOUNDER_SERIES_BODIES, FOUNDER_SERIES_SUBJECTS, founderSeriesShell, renderTemplate, escapeHtml,
} from '../_shared/founder-series-email.ts';

// Founder welcome series (marketing, opt-in only): steps at day 1, 3 and 6 after email
// confirmation. Called hourly by pg_cron with the Vault bearer (checkCronAuth), like the
// other cron functions; deployed with verify_jwt = false. The cron job is created
// INACTIVE by the migration.
//
// All eligibility lives in the database (founder_series_due): opted-in founder, confirmed
// email, active enrolment, not on the suppression list, step due and not stale. This
// function never decides who gets mail; it only renders and sends what the database says
// is due, claiming each step first so it can never be sent twice.
//
// Body (all optional):  { "dry_run": true, "limit": 50 }
//   dry_run  report what WOULD be sent (masked addresses); claims nothing, sends nothing,
//            and does not even run the housekeeping sweep.
//
// A failure sending one email is recorded (and retried on a later run, up to 3 attempts)
// and never stops the others. Signup does not depend on any of this.
//
// Transactional mail never passes through here and never reads the suppression list.
const ORIGIN = 'https://bethra.co';
const FROM = 'بذرة <info@bethra.co>';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  return `${(local ?? '').slice(0, 1)}***@${domain ?? ''}`;
}

interface DueRow {
  user_id: string;
  step: number;
  email: string;
  full_name: string | null;
  unsubscribe_token: string | null;
  due_at: string;
  attempts: number;
}

// Own Resend call (not email-helper's sendViaResend) so List-Unsubscribe headers and tags
// can be set without touching the shared helper that every other email function imports.
async function sendSeriesEmail(
  to: string, subject: string, html: string, headers: Record<string, string>, step: number,
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY not set' };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM, to: [to], subject, html, headers,
        // Lets handle-email-webhook suppress the address on a bounce or spam complaint.
        tags: [{ name: 'series', value: 'founder_welcome' }, { name: 'step', value: String(step) }],
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error('Resend error:', body);
      return { ok: false, error: `resend ${res.status}: ${body}`.slice(0, 400) };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  const denied = checkCronAuth(req);
  if (denied) return denied;

  try {
    const body = await req.json().catch(() => ({})) as { dry_run?: unknown; limit?: unknown };
    const dryRun = body.dry_run === true;
    const limit = Math.min(Math.max(Number(body.limit) || 50, 1), 200);
    const db = getServiceClient();

    if (!dryRun) await db.rpc('founder_series_sweep');

    const { data, error } = await db.rpc('founder_series_due', { p_limit: limit });
    if (error) return jsonResp({ error: error.message }, 500);
    const due = (data ?? []) as DueRow[];

    if (dryRun) {
      return jsonResp({
        dry_run: true,
        would_send: due.length,
        items: due.map((d) => ({
          to: maskEmail(d.email),
          step: d.step,
          subject: FOUNDER_SERIES_SUBJECTS[d.step],
          due_at: d.due_at,
          prior_attempts: d.attempts,
        })),
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const d of due) {
      // Claim first. false = no longer eligible (unsubscribed, suppressed, already claimed...).
      const { data: claimed, error: claimErr } = await db.rpc('founder_series_claim', { p_user: d.user_id, p_step: d.step });
      if (claimErr || !claimed) { skipped++; continue; }

      let ok = false;
      let errMsg: string | null = null;
      try {
        const token = d.unsubscribe_token ?? '';
        // Never send marketing without a working unsubscribe link.
        if (token.length < 16) throw new Error('no unsubscribe token');
        const unsubscribeUrl = `${ORIGIN}/unsubscribe?token=${token}`;
        const inner = renderTemplate(
          await resolveBody(db, `founder-series-${d.step}`, FOUNDER_SERIES_BODIES[d.step]),
          {
            first_name: escapeHtml((d.full_name ?? '').trim().split(/\s+/)[0] || 'صديقنا'),
            validate_url: `${ORIGIN}/validate`,
            tracker_url: `${ORIGIN}/journey/validation`,
            journey_url: `${ORIGIN}/journey/90-day`,
          },
        );
        const res = await sendSeriesEmail(
          d.email,
          FOUNDER_SERIES_SUBJECTS[d.step],
          founderSeriesShell(inner, unsubscribeUrl),
          {
            'List-Unsubscribe': `<${supabaseUrl}/functions/v1/unsubscribe-one-click?p=${token}>, <${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
          d.step,
        );
        ok = res.ok;
        if (!ok) errMsg = res.error ?? 'resend rejected the send';
      } catch (e) {
        errMsg = (e as Error).message;
      }

      await db.rpc('founder_series_finish', { p_user: d.user_id, p_step: d.step, p_ok: ok, p_error: errMsg });
      if (ok) sent++; else failed++;
    }

    return jsonResp({ ok: true, due: due.length, sent, failed, skipped });
  } catch (err) {
    console.error(err);
    return jsonResp({ error: (err as Error).message }, 500);
  }
});
