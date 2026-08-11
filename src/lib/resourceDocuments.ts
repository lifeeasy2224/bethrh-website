import { supabase } from '../supabase';

// Founder-facing access to the admin-curated "Founder Resources" library.
// Reads are RLS-gated to published rows; the actual file bytes are fetched via a
// short-lived signed URL minted by the JWT-verified get-resource-url function.

export interface ResourceDocument {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_name: string;
  size_bytes: number | null;
  mime_type: string | null;
  created_at: string;
}

// Columns a founder is allowed to see — deliberately excludes file_path and the
// internal publish/sort/uploader fields.
const FOUNDER_COLUMNS =
  'id, title, description, category, file_name, size_bytes, mime_type, created_at';

export async function listPublishedResources(): Promise<ResourceDocument[]> {
  const { data } = await supabase
    .from('resource_documents')
    .select(FOUNDER_COLUMNS)
    .eq('is_published', true) // RLS enforces this too; explicit for clarity
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  return (data as ResourceDocument[] | null) ?? [];
}

// Group published resources by category, preserving the ordered arrival above.
export function groupByCategory(docs: ResourceDocument[]): Array<{ category: string; docs: ResourceDocument[] }> {
  const groups: Array<{ category: string; docs: ResourceDocument[] }> = [];
  const index = new Map<string, number>();
  for (const doc of docs) {
    const cat = doc.category || 'General';
    if (!index.has(cat)) {
      index.set(cat, groups.length);
      groups.push({ category: cat, docs: [] });
    }
    groups[index.get(cat)!].docs.push(doc);
  }
  return groups;
}

export type DownloadResult = { ok: true; url: string; fileName: string } | { ok: false; error: string };

// Ask the server for a signed download URL. The function re-checks is_published
// and rejects unauthenticated callers, so this only succeeds for a signed-in
// founder requesting a published resource.
export async function getResourceDownloadUrl(id: string): Promise<DownloadResult> {
  const { data, error } = await supabase.functions.invoke('get-resource-url', { body: { id } });
  if (error) {
    let msg = 'This resource is unavailable right now.';
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === 'function') {
      const b = await ctx.json().catch(() => null);
      if (b?.error) msg = b.error;
    }
    return { ok: false, error: msg };
  }
  const url = (data as { url?: string })?.url;
  if (!url) return { ok: false, error: 'This resource is unavailable right now.' };
  return { ok: true, url, fileName: (data as { file_name?: string }).file_name ?? 'download' };
}
