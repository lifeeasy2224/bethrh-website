import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { checkCronAuth } from '../_shared/cron-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const BUCKET = 'idea-documents';
const STALE_DAYS = 7;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  // Cron/DB-trigger auth only — this function is never called by a founder's
  // browser session, so it uses the shared bearer-token gate, not guardUser.
  const denied = checkCronAuth(req);
  if (denied) return denied;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const errors: string[] = [];
  let deletedCount = 0;

  try {
    const staleThreshold = new Date(Date.now() - STALE_DAYS * 86_400_000).toISOString();

    // Failed extractions, or uploads stuck in 'uploaded' for more than 7 days
    // (never made it to extraction). Note: `.or()` combines both conditions in
    // one query — Postgres can't parameterize the interval inside `.or()`, so
    // the threshold is computed here and passed as a literal ISO timestamp.
    const { data: staleDocs, error: fetchErr } = await supabase
      .from('idea_documents')
      .select('id, file_path')
      .or(`status.eq.failed,and(status.eq.uploaded,uploaded_at.lt.${staleThreshold})`);

    if (fetchErr) {
      console.error('cleanup-expired-documents: idea_documents fetch failed', fetchErr.message);
      errors.push(`fetch failed: ${fetchErr.message}`);
    }

    for (const doc of (staleDocs as Array<{ id: string; file_path: string | null }> | null) ?? []) {
      if (doc.file_path) {
        const { error: storageErr } = await supabase.storage.from(BUCKET).remove([doc.file_path]);
        if (storageErr) {
          console.error(`cleanup-expired-documents: storage remove failed for ${doc.file_path}`, storageErr.message);
          errors.push(`storage remove failed for ${doc.file_path}: ${storageErr.message}`);
          continue; // don't delete the row if the storage object might still be there
        }
      }

      const { error: deleteErr } = await supabase.from('idea_documents').delete().eq('id', doc.id);
      if (deleteErr) {
        console.error(`cleanup-expired-documents: row delete failed for ${doc.id}`, deleteErr.message);
        errors.push(`row delete failed for ${doc.id}: ${deleteErr.message}`);
        continue;
      }

      deletedCount++;
    }

    // Orphaned storage objects (files in the bucket with no idea_documents row)
    // are intentionally NOT cleaned up here — cross-referencing every user
    // folder against idea_documents.file_path is a separate, more expensive
    // pass and orphans are rare. The failed/stuck-upload cleanup above covers
    // the common case.

    return json({ deleted_count: deletedCount, errors }, 200);
  } catch (err) {
    console.error('cleanup-expired-documents: unhandled error', (err as Error).message);
    errors.push((err as Error).message);
    return json({ deleted_count: deletedCount, errors }, 200);
  }
});
