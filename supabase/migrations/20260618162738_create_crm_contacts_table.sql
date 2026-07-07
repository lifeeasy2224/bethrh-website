-- External CRM contacts (uploaded via CSV/Excel, not necessarily auth users)
CREATE TABLE IF NOT EXISTS crm_contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  first_name text,
  last_name text,
  full_name text,
  phone text,
  company text,
  role text,
  segment_id uuid REFERENCES marketing_segments(id) ON DELETE SET NULL,
  upload_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_contacts_email_segment
  ON crm_contacts(email, segment_id);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_segment ON crm_contacts(segment_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON crm_contacts(email);

ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_crm_contacts" ON crm_contacts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_select_crm_contacts" ON crm_contacts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_insert_crm_contacts" ON crm_contacts
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated_update_crm_contacts" ON crm_contacts
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_delete_crm_contacts" ON crm_contacts
  FOR DELETE TO authenticated USING (true);
