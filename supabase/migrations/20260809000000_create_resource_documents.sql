-- Founder Resources: admin-curated document library (guides, templates, tools).
-- Private bucket + signed URLs — see supabase/functions/get-resource-url. This
-- table has NO write policies; all writes go through the service-role
-- admin-resources Edge Function behind the resolveSession admin guard.
CREATE TABLE public.resource_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  size_bytes BIGINT,
  mime_type TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.resource_documents ENABLE ROW LEVEL SECURITY;

-- Single policy: authenticated founders read published only. NO write policies
-- (all writes via service-role admin-resources function).
CREATE POLICY "read_published_resources"
  ON public.resource_documents
  FOR SELECT
  TO authenticated
  USING (is_published = true);

GRANT SELECT ON public.resource_documents TO authenticated;
GRANT ALL ON public.resource_documents TO service_role;
