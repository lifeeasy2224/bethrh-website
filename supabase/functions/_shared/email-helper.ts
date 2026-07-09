import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

export function render(html: string, vars: Record<string, string>): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');
}

/**
 * Returns the admin-editable email body for `name` from the marketing_templates
 * table, falling back to the hardcoded `fallback` template if the DB row is
 * missing or blank. Lets the admin Templates page control transactional email
 * bodies without ever breaking a send if a template is empty/absent.
 */
export async function resolveBody(
  db: SupabaseClient,
  name: string,
  fallback: string,
): Promise<string> {
  try {
    const { data } = await db
      .from('marketing_templates')
      .select('body_html')
      .eq('name', name)
      .maybeSingle();
    const html = ((data?.body_html as string | null) ?? '').trim();
    return html.length > 0 ? html : fallback;
  } catch {
    return fallback;
  }
}

export async function sendViaResend(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) { console.error('RESEND_API_KEY not set'); return false; }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'بذرة <info@bethra.co>', to: [to], subject, html }),
    });
    if (!res.ok) console.error('Resend error:', await res.text());
    return res.ok;
  } catch (e) {
    console.error('sendViaResend failed:', e);
    return false;
  }
}

export function getServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

export function jsonResp(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
