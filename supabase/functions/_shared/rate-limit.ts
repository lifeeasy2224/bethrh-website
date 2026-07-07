// Shared per-caller AI rate limiter, backed by the public.ai_usage table.
// Authenticated features are limited per user; the public validate tool is
// limited per IP. Limits are deliberately generous for real use and only bite
// on runaway loops / abuse. Tune the constants below.

import { createClient } from 'npm:@supabase/supabase-js@2';

type Cors = Record<string, string>;

// Authenticated AI features (ai-coach, swot-analysis).
const USER_HOURLY = 30;
const USER_DAILY = 150;
// Public, anonymous validate tool (idea-stress-test), keyed by IP.
const IP_HOURLY = 15;
const IP_DAILY = 50;

function service() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

function json(body: unknown, status: number, cors: Cors): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

// Counts recent requests for `subject` and either rejects (returning a 429
// Response) or logs the request and returns null (allowed).
async function enforce(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  subject: string,
  fn: string,
  hourly: number,
  daily: number,
  cors: Cors,
): Promise<Response | null> {
  const now = Date.now();
  const hourAgo = new Date(now - 3_600_000).toISOString();
  const dayAgo = new Date(now - 86_400_000).toISOString();

  const [h, d] = await Promise.all([
    supabase.from('ai_usage').select('id', { count: 'exact', head: true }).eq('subject', subject).gte('created_at', hourAgo),
    supabase.from('ai_usage').select('id', { count: 'exact', head: true }).eq('subject', subject).gte('created_at', dayAgo),
  ]);

  if ((h.count ?? 0) >= hourly) {
    return json({ error: 'لقد بلغت حد استخدام الذكاء الاصطناعي لهذه الساعة. حاول مرة أخرى بعد قليل.' }, 429, cors);
  }
  if ((d.count ?? 0) >= daily) {
    return json({ error: 'لقد بلغت حد استخدام الذكاء الاصطناعي لليوم. حاول مرة أخرى غداً.' }, 429, cors);
  }

  await supabase.from('ai_usage').insert({ subject, fn });
  return null;
}

// For authenticated functions: verify the JWT, then enforce per-user limits.
// Returns { userId } on success, or { response } to return immediately.
export async function guardUser(
  req: Request,
  fn: string,
  cors: Cors,
): Promise<{ userId: string; response?: undefined } | { userId?: undefined; response: Response }> {
  const supabase = service();
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return { response: json({ error: 'Unauthorized' }, 401, cors) };

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return { response: json({ error: 'Unauthorized' }, 401, cors) };

  const limited = await enforce(supabase, user.id, fn, USER_HOURLY, USER_DAILY, cors);
  if (limited) return { response: limited };
  return { userId: user.id };
}

// For public functions: rate-limit by client IP, no auth required.
// Returns a 429 Response when over the limit, or null when allowed.
export async function guardIp(req: Request, fn: string, cors: Cors): Promise<Response | null> {
  const supabase = service();
  const ip = (req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? 'unknown').trim();
  return enforce(supabase, `ip:${ip}`, fn, IP_HOURLY, IP_DAILY, cors);
}
