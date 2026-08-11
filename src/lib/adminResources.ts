// Admin-facing client for the "Founder Resources" library. Every call routes
// through the admin-resources Edge Function, which verifies the admin session
// server-side (service role) before touching the DB or storage bucket.

import { supabase } from '../supabase';
import { ADMIN_API } from '../contexts/AdminAuthContext';

const ADMIN_RESOURCES_API = ADMIN_API.replace(/\/admin-auth$/, '/admin-resources');
const BUCKET = 'resource-documents';

export interface AdminResourceDocument {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_path: string;
  file_name: string;
  size_bytes: number | null;
  mime_type: string | null;
  is_published: boolean;
  sort_order: number;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export const MAX_FILE_BYTES = 26214400; // 25 MB — matches bucket + edge function
export const ALLOWED_MIME = new Set<string>([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'image/png',
  'image/jpeg',
]);

interface ApiResult { error?: string; [k: string]: unknown; }

async function call<T extends ApiResult>(sessionToken: string, action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(ADMIN_RESOURCES_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ session_token: sessionToken, action, ...payload }),
  });
  return res.json() as Promise<T>;
}

export async function listResources(sessionToken: string): Promise<AdminResourceDocument[]> {
  const data = await call<{ documents?: AdminResourceDocument[] }>(sessionToken, 'list');
  return data.documents ?? [];
}

export type UploadResult =
  | { ok: true; document: AdminResourceDocument }
  | { ok: false; error: string };

// Full upload flow: validate → get a signed upload URL → upload the bytes with
// that token (no storage RLS needed) → record the metadata row.
export async function uploadResource(
  sessionToken: string,
  file: File,
  meta: { title: string; description?: string; category?: string },
): Promise<UploadResult> {
  if (!ALLOWED_MIME.has(file.type)) {
    return { ok: false, error: `Unsupported file type${file.type ? `: ${file.type}` : ''}. Allowed: PDF, Word, PowerPoint, Excel, CSV, PNG, JPG.` };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. Max ${(MAX_FILE_BYTES / 1024 / 1024).toFixed(0)} MB.` };
  }
  if (!meta.title.trim()) return { ok: false, error: 'A title is required.' };

  const signed = await call<{ path?: string; token?: string; error?: string }>(
    sessionToken, 'create-upload-url',
    { file_name: file.name, mime_type: file.type, size_bytes: file.size },
  );
  if (signed.error || !signed.path || !signed.token) {
    return { ok: false, error: signed.error ?? 'Could not start the upload.' };
  }

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .uploadToSignedUrl(signed.path, signed.token, file, { contentType: file.type });
  if (upErr) return { ok: false, error: `Upload failed: ${upErr.message}` };

  const done = await call<{ document?: AdminResourceDocument; error?: string }>(
    sessionToken, 'finalize',
    {
      path: signed.path,
      title: meta.title.trim(),
      description: meta.description?.trim() ?? '',
      category: meta.category?.trim() || 'General',
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
    },
  );
  if (done.error || !done.document) return { ok: false, error: done.error ?? 'Could not save the resource.' };
  return { ok: true, document: done.document };
}

export async function updateResource(
  sessionToken: string,
  id: string,
  patch: Partial<Pick<AdminResourceDocument, 'title' | 'description' | 'category' | 'is_published' | 'sort_order'>>,
): Promise<{ ok: true; document: AdminResourceDocument } | { ok: false; error: string }> {
  const data = await call<{ document?: AdminResourceDocument; error?: string }>(sessionToken, 'update', { id, patch });
  if (data.error || !data.document) return { ok: false, error: data.error ?? 'Update failed.' };
  return { ok: true, document: data.document };
}

export async function deleteResource(sessionToken: string, id: string): Promise<{ ok: boolean; error?: string }> {
  const data = await call<{ success?: boolean; error?: string }>(sessionToken, 'delete', { id });
  if (data.error || !data.success) return { ok: false, error: data.error ?? 'Delete failed.' };
  return { ok: true };
}
