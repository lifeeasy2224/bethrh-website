import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { encodeBase64 } from 'jsr:@std/encoding@1/base64';

// outbound-email — approval queue for one-off emails sent from info@bethra.co.
//
// Drafts are inserted into public.outbound_emails (status 'pending_approval') by
// Claude or an admin. Nothing is sent until an admin approves it in
// /admin/outbox. Attachments live in the private 'email-assets' bucket and are
// referenced by path, so a file is uploaded once and reused across emails.
//
// Callers:
//   admin  — { session_token, action: list | approve | reject | approve_batch | reject_batch |
//              upload_url | set_attachments | attachment_url }
//   system — Authorization: Bearer <CRON_BEARER_TOKEN>, action: upload_url
//            (used from SQL via pg_net to mint a signed upload URL for a file)
//
// Batches: emails prepared together (e.g. one personalised email per user) share a
// batch_id. approve_batch sends every pending email in the batch one by one with the
// same checks as a single approve; reject_batch rejects them all.

const BUCKET = 'email-assets';
const MAX_ATTACH_BYTES = 30 * 1024 * 1024;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

interface Attachment { path: string; filename: string }
interface OutboundRow {
  id: string; status: string; from_name: string; from_email: string; reply_to: string | null;
  to_emails: string[]; cc_emails: string[]; bcc_emails: string[];
  subject: string; body_html: string; body_text: string | null; attachments: Attachment[];
  crm_contact_id: string | null; crm_stage_after: string | null;
  in_reply_to: string | null;
}

async function resolveAdmin(db: SupabaseClient, token: string) {
  if (!token) return null;
  const { data } = await db.from('admin_sessions')
    .select('*, admin_users(*)')
    .eq('token', token).eq('is_pending_2fa', false)
    .gt('expires_at', new Date().toISOString()).maybeSingle();
  if (!data) return null;
  await db.from('admin_sessions').update({
    last_active: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  }).eq('id', data.id);
  return data.admin_users as { id: string; email: string; is_active: boolean };
}

function safeName(name: string) {
  const base = name.normalize('NFKD').replace(/[^\w.\-]+/g, '_').replace(/_+/g, '_').slice(-120);
  return base || 'file';
}

async function uploadUrl(db: SupabaseClient, filename: string) {
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID().slice(0, 8)}-${safeName(filename)}`;
  const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) return json({ error: error?.message ?? 'could not create upload url' }, 500);
  return json({ path, signedUrl: data.signedUrl, token: data.token });
}

type SendResult = { ok: true; id: string; resend_id: string | null } | { ok: false; error: string; status: number };

async function send(db: SupabaseClient, id: string, approver: string) {
  const r = await sendOne(db, id, approver);
  return r.ok ? json(r) : json({ error: r.error }, r.status);
}

async function sendOne(db: SupabaseClient, id: string, approver: string): Promise<SendResult> {
  // Claim the row atomically so a double tap can never send twice.
  const { data: claimed, error: claimErr } = await db.from('outbound_emails')
    .update({ status: 'sending', approved_by: approver, approved_at: new Date().toISOString(), error: null })
    .eq('id', id).eq('status', 'pending_approval').select('*').maybeSingle();
  if (claimErr) return { ok: false, error: claimErr.message, status: 500 };
  if (!claimed) return { ok: false, error: 'This email is not waiting for approval (already sent, rejected, or being sent).', status: 409 };
  const row = claimed as OutboundRow;

  const fail = async (msg: string, status = 502): Promise<SendResult> => {
    await db.from('outbound_emails').update({ status: 'failed', error: msg }).eq('id', id);
    return { ok: false, error: msg, status };
  };

  // Never mail an address that bounced, complained or unsubscribed.
  const visible = [...row.to_emails, ...row.cc_emails].map((e) => e.trim().toLowerCase());
  const { data: suppressed } = await db.from('email_suppression_list').select('email').in('email', visible);
  if (suppressed && suppressed.length) {
    return fail(`Suppressed address(es): ${suppressed.map((s: { email: string }) => s.email).join(', ')}`, 422);
  }

  const files: { filename: string; content: string }[] = [];
  let total = 0;
  for (const a of row.attachments ?? []) {
    const { data: blob, error } = await db.storage.from(BUCKET).download(a.path);
    if (error || !blob) return fail(`Attachment missing: ${a.filename} (${a.path})`, 422);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    total += bytes.length;
    if (total > MAX_ATTACH_BYTES) return fail('Attachments exceed 30 MB', 422);
    files.push({ filename: a.filename, content: encodeBase64(bytes) });
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `outbound-${row.id}`,
    },
    body: JSON.stringify({
      from: `${row.from_name} <${row.from_email}>`,
      to: row.to_emails,
      cc: row.cc_emails.length ? row.cc_emails : undefined,
      bcc: row.bcc_emails.length ? row.bcc_emails : undefined,
      reply_to: row.reply_to ?? row.from_email,
      subject: row.subject,
      html: row.body_html,
      text: row.body_text ?? undefined,
      attachments: files.length ? files : undefined,
      // Thread replies under the recipient's original message in their mail client.
      headers: row.in_reply_to ? { 'In-Reply-To': row.in_reply_to, References: row.in_reply_to } : undefined,
      tags: [{ name: 'outbound_id', value: row.id }],
    }),
  });
  const out = await res.json().catch(() => ({}));
  if (!res.ok) return fail(`Resend ${res.status}: ${JSON.stringify(out).slice(0, 500)}`);

  const now = new Date().toISOString();
  await db.from('outbound_emails').update({ status: 'sent', sent_at: now, resend_id: out.id ?? null, last_event: 'sent', last_event_at: now }).eq('id', id);

  if (row.crm_contact_id) {
    const { data: c } = await db.from('crm_contacts').select('notes').eq('id', row.crm_contact_id).maybeSingle();
    const line = `${now.slice(0, 10)} — Sent «${row.subject}» (approved by ${approver})`;
    const patch: Record<string, unknown> = {
      last_contacted: now,
      notes: c?.notes ? `${c.notes}\n${line}` : line,
      updated_at: now,
    };
    if (row.crm_stage_after) patch.stage = row.crm_stage_after;
    await db.from('crm_contacts').update(patch).eq('id', row.crm_contact_id);
  }
  return { ok: true, id: row.id, resend_id: out.id ?? null };
}

async function approveBatch(db: SupabaseClient, batchId: string, approver: string) {
  if (!batchId) return json({ error: 'batch_id required' }, 400);
  const { data: rows, error } = await db.from('outbound_emails')
    .select('id, to_emails').eq('batch_id', batchId).eq('status', 'pending_approval')
    .order('created_at', { ascending: true });
  if (error) return json({ error: error.message }, 500);
  if (!rows?.length) return json({ error: 'No emails in this batch are waiting for approval' }, 409);
  let sent = 0;
  const failures: { to: string; error: string }[] = [];
  for (const r of rows as { id: string; to_emails: string[] }[]) {
    const res = await sendOne(db, r.id, approver);
    if (res.ok) sent++;
    else failures.push({ to: r.to_emails.join(', '), error: res.error });
    await new Promise((ok) => setTimeout(ok, 250)); // stay well under Resend's rate limit
  }
  return json({ ok: failures.length === 0, total: rows.length, sent, failed: failures.length, failures });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const action = String(body.action ?? '');

  // System caller (pg_net with the vault cron token): may only mint upload URLs.
  const bearer = (req.headers.get('Authorization') ?? '').replace('Bearer ', '').trim();
  const cron = Deno.env.get('CRON_BEARER_TOKEN');
  if (cron && bearer === cron) {
    if (action === 'upload_url') return uploadUrl(db, String(body.filename ?? 'file'));
    return json({ error: 'action not allowed for system caller' }, 403);
  }

  const admin = await resolveAdmin(db, String(body.session_token ?? ''));
  if (!admin || admin.is_active === false) return json({ error: 'Unauthorized' }, 401);

  switch (action) {
    case 'list': {
      const status = body.status ? String(body.status) : null;
      let q = db.from('outbound_emails').select('*').order('created_at', { ascending: false }).limit(500);
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (error) return json({ error: error.message }, 500);
      return json({ data });
    }
    case 'approve':
      return send(db, String(body.id ?? ''), admin.email);
    case 'approve_batch':
      return approveBatch(db, String(body.batch_id ?? ''), admin.email);
    case 'reject_batch': {
      const { data, error } = await db.from('outbound_emails')
        .update({ status: 'rejected', approved_by: admin.email, error: body.reason ? String(body.reason) : null })
        .eq('batch_id', String(body.batch_id ?? '')).eq('status', 'pending_approval').select('id');
      if (error) return json({ error: error.message }, 500);
      if (!data?.length) return json({ error: 'Not waiting for approval' }, 409);
      return json({ ok: true, rejected: data.length });
    }
    case 'reject': {
      const { data, error } = await db.from('outbound_emails')
        .update({ status: 'rejected', approved_by: admin.email, error: body.reason ? String(body.reason) : null })
        .eq('id', String(body.id ?? '')).eq('status', 'pending_approval').select('id').maybeSingle();
      if (error) return json({ error: error.message }, 500);
      if (!data) return json({ error: 'Not waiting for approval' }, 409);
      return json({ ok: true });
    }
    case 'upload_url':
      return uploadUrl(db, String(body.filename ?? 'file'));
    case 'set_attachments': {
      // Replace the attachment list of a pending email (after an upload from the page).
      const list = Array.isArray(body.attachments) ? body.attachments as Attachment[] : null;
      if (!list || list.some((a) => !a?.path || !a?.filename || !String(a.path).match(/^[\w\-./]+$/))) {
        return json({ error: 'attachments must be [{ path, filename }]' }, 400);
      }
      const { data, error } = await db.from('outbound_emails')
        .update({ attachments: list })
        .eq('id', String(body.id ?? '')).eq('status', 'pending_approval').select('id, attachments').maybeSingle();
      if (error) return json({ error: error.message }, 500);
      if (!data) return json({ error: 'Not waiting for approval' }, 409);
      return json({ ok: true, attachments: data.attachments });
    }
    case 'attachment_url': {
      const { data, error } = await db.storage.from(BUCKET).createSignedUrl(String(body.path ?? ''), 600);
      if (error || !data) return json({ error: error?.message ?? 'not found' }, 404);
      return json({ url: data.signedUrl });
    }
    default:
      return json({ error: `Unknown action: ${action}` }, 400);
  }
});
