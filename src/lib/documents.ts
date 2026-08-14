import { supabase } from '../supabase';

// Limits — shown to the founder up front and enforced here + server-side.
// MAX_PAGES is UI copy only; the page-count check itself runs server-side in
// the extract-document edge function (pdf-lib, authoritative).
export const BUCKET = 'idea-documents';
export const MAX_FILE_BYTES = 10485760; // 10 MB
export const MAX_FILES_PER_IDEA = 20;
export const MAX_PAGES = 5;

// Matches the JSON shape returned (and persisted onto idea_documents.extraction)
// by supabase/functions/extract-document/index.ts exactly — bare values, not
// IdeaIQ's {value, found}-wrapped ExtractedField shape. All sections optional/partial.
export interface DocExtraction {
  idea?: {
    title?: string;
    sector?: string;
    problem?: string;
    solution?: string;
    target_customer?: string;
    differentiator?: string;
    advantage?: string;
  };
  canvas?: {
    key_partners?: string;
    key_activities?: string;
    value_proposition?: string;
    customer_relationships?: string;
    customer_segments?: string;
    key_resources?: string;
    channels?: string;
    cost_structure?: string;
    revenue_streams?: string;
  };
  financials?: {
    monthly_revenue?: number;
    monthly_costs?: number;
    break_even_month?: number;
  };
  swot?: {
    strengths?: string[];
    weaknesses?: string[];
    opportunities?: string[];
    threats?: string[];
  };
  validation?: Array<{ type?: string; notes?: string; amount?: number; sentiment?: string }>;
}

export type DocStatus = 'uploaded' | 'processing' | 'extracted' | 'failed';

// Mirrors the idea_documents table columns exactly.
export interface IdeaDocument {
  id: string;
  user_id: string;
  user_idea_id: string;
  file_path: string;
  file_name: string;
  size_bytes: number | null;
  page_count: number | null;
  status: DocStatus;
  extraction: DocExtraction | null;
  error: string | null;
  uploaded_at: string;
  extracted_at: string | null;
}

export type UploadResult = { document: IdeaDocument };

export async function listDocuments(ideaId: string): Promise<IdeaDocument[]> {
  // RLS already scopes rows to the caller's own — no user_id filter needed.
  const { data } = await supabase
    .from('idea_documents')
    .select('*')
    .eq('user_idea_id', ideaId)
    .order('uploaded_at', { ascending: false });
  return (data as IdeaDocument[] | null) ?? [];
}

export async function deleteDocument(doc: IdeaDocument): Promise<void> {
  await supabase.storage.from(BUCKET).remove([doc.file_path]);
  await supabase.from('idea_documents').delete().eq('id', doc.id);
}

// Validate → upload to the private bucket → create the row → run AI extraction
// synchronously. On any failure, nothing lingers: the storage object and the
// row are both rolled back, mirroring IdeaIQ's cleanup-on-failure — a founder
// never sees a stuck 'failed' document from this flow, just an error message.
export async function uploadAndExtract(userId: string, ideaId: string, file: File): Promise<UploadResult> {
  if (file.type !== 'application/pdf') {
    throw new Error('يُقبل ملف PDF فقط.');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('حجم الملف يتجاوز الحد الأقصى وهو 10 ميغابايت.');
  }
  const existing = await listDocuments(ideaId);
  if (existing.length >= MAX_FILES_PER_IDEA) {
    throw new Error(`لا يمكن رفع أكثر من ${MAX_FILES_PER_IDEA} ملفاً لكل فكرة.`);
  }

  const path = `${userId}/${ideaId}/${crypto.randomUUID()}.pdf`;
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: 'application/pdf', upsert: false });
  if (upErr) throw new Error(upErr.message);

  const { data: row, error: rowErr } = await supabase.from('idea_documents').insert({
    user_id: userId,
    user_idea_id: ideaId,
    file_path: path,
    file_name: file.name,
    size_bytes: file.size,
    status: 'uploaded',
  }).select().single();
  if (rowErr || !row) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw new Error(rowErr?.message ?? 'تعذّر حفظ الملف.');
  }

  const doc = row as IdeaDocument;
  const rollback = async () => {
    await supabase.storage.from(BUCKET).remove([path]);
    await supabase.from('idea_documents').delete().eq('id', doc.id);
  };

  const { error: fnErr } = await supabase.functions.invoke('extract-document', { body: { document_id: doc.id } });
  if (fnErr) {
    let msg = 'تعذّر تحليل المستند. حاول بملف آخر.';
    const ctx = (fnErr as { context?: Response }).context;
    if (ctx && typeof ctx.json === 'function') {
      const body = await ctx.json().catch(() => null);
      if (body?.error) msg = body.error;
    }
    await rollback();
    throw new Error(msg);
  }

  const fresh = (await listDocuments(ideaId)).find(d => d.id === doc.id);
  return { document: fresh ?? doc };
}
