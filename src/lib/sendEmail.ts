import { supabase } from '../supabase';

export async function sendEmail(
  to: string,
  template_name: string,
  variables: Record<string, string> = {},
): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ to, template_name, variables }),
    });
  } catch {
    // Email is non-critical — never throw
  }
}
