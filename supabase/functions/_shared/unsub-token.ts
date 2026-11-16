// Signed campaign-unsubscribe links. The link carries sig = HMAC-SHA256(secret,
// "<lowercased email>|<campaign id>"), so only links we generated are honoured.
//
// Secret: UNSUBSCRIBE_SIGNING_SECRET if set, otherwise CRON_BEARER_TOKEN (already an
// edge-function secret). Set a dedicated one when convenient; rotating it invalidates
// links in emails already sent.
const enc = new TextEncoder();

function secret(): string | null {
  return Deno.env.get('UNSUBSCRIBE_SIGNING_SECRET') ?? Deno.env.get('CRON_BEARER_TOKEN') ?? null;
}

async function hmacHex(message: string): Promise<string | null> {
  const key = secret();
  if (!key) return null;
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(message)));
  return Array.from(sig, (b) => b.toString(16).padStart(2, '0')).join('');
}

const payload = (email: string, campaign: string) => `${email.trim().toLowerCase()}|${campaign}`;

export function signUnsub(email: string, campaign: string): Promise<string | null> {
  return hmacHex(payload(email, campaign));
}

export async function verifyUnsub(email: string, campaign: string, sig: string): Promise<boolean> {
  const expected = await hmacHex(payload(email, campaign));
  if (!expected || sig.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}
