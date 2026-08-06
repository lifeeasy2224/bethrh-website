-- §10 multi-category: contacts can belong to multiple segments via a junction.
-- crm_contacts.segment_id is retained as the "origin" segment (upsert key); the
-- junction is the source of truth for segment membership going forward.
CREATE TABLE IF NOT EXISTS public.contact_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES public.marketing_segments(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.admin_users(id),
  UNIQUE (contact_id, segment_id)
);

CREATE INDEX IF NOT EXISTS idx_contact_segments_contact_id ON public.contact_segments(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_segments_segment_id ON public.contact_segments(segment_id);

-- RLS: no direct client access. Reached only by admin-db + send-campaign, both
-- service_role (which bypasses RLS but is granted explicitly below).
ALTER TABLE public.contact_segments ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE, UPDATE ON public.contact_segments TO service_role;
CREATE POLICY "no_direct_access" ON public.contact_segments
  AS PERMISSIVE FOR ALL TO authenticated USING (false) WITH CHECK (false);

-- Auto-maintain the origin-segment membership: every crm_contacts insert mirrors
-- its segment_id into the junction, from ANY path (CSV upload, future admin CRUD)
-- — more robust than doing it in the frontend upload handler.
CREATE OR REPLACE FUNCTION public._sync_contact_origin_segment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.segment_id IS NOT NULL THEN
    INSERT INTO public.contact_segments (contact_id, segment_id)
    VALUES (NEW.id, NEW.segment_id)
    ON CONFLICT (contact_id, segment_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_crm_contact_insert_sync_segment ON public.crm_contacts;
CREATE TRIGGER on_crm_contact_insert_sync_segment
  AFTER INSERT ON public.crm_contacts
  FOR EACH ROW EXECUTE FUNCTION public._sync_contact_origin_segment();

-- Backfill existing contacts (0 today, but idempotent).
INSERT INTO public.contact_segments (contact_id, segment_id)
SELECT id, segment_id FROM public.crm_contacts WHERE segment_id IS NOT NULL
ON CONFLICT (contact_id, segment_id) DO NOTHING;
