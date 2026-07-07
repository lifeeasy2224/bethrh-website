-- Admin panel uses a custom session token and never logs into Supabase Auth,
-- so the client is always anon role. Add anon-role write policies for all
-- marketing/CRM tables so admin operations succeed.

-- marketing_segments
CREATE POLICY "anon_select_segments" ON marketing_segments FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_segments" ON marketing_segments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_segments" ON marketing_segments FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_segments" ON marketing_segments FOR DELETE TO anon USING (true);

-- segment_members
CREATE POLICY "anon_select_segment_members" ON segment_members FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_segment_members" ON segment_members FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_delete_segment_members" ON segment_members FOR DELETE TO anon USING (true);

-- marketing_uploads
CREATE POLICY "anon_select_uploads" ON marketing_uploads FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_uploads" ON marketing_uploads FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_uploads" ON marketing_uploads FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- marketing_campaigns
CREATE POLICY "anon_select_campaigns" ON marketing_campaigns FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_campaigns" ON marketing_campaigns FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_campaigns" ON marketing_campaigns FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_campaigns" ON marketing_campaigns FOR DELETE TO anon USING (true);

-- crm_contacts
CREATE POLICY "anon_select_crm_contacts" ON crm_contacts FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_crm_contacts" ON crm_contacts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_crm_contacts" ON crm_contacts FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_crm_contacts" ON crm_contacts FOR DELETE TO anon USING (true);

-- admin_crm_tags (write access for admin to create/delete tags)
CREATE POLICY "anon_insert_crm_tags" ON admin_crm_tags FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_crm_tags" ON admin_crm_tags FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_crm_tags" ON admin_crm_tags FOR DELETE TO anon USING (true);
CREATE POLICY "anon_select_crm_tags" ON admin_crm_tags FOR SELECT TO anon USING (true);

-- admin_user_tags
CREATE POLICY "anon_insert_user_tags" ON admin_user_tags FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_delete_user_tags" ON admin_user_tags FOR DELETE TO anon USING (true);
CREATE POLICY "anon_select_user_tags" ON admin_user_tags FOR SELECT TO anon USING (true);

-- admin_crm_notes
CREATE POLICY "anon_select_crm_notes" ON admin_crm_notes FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_crm_notes" ON admin_crm_notes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_crm_notes" ON admin_crm_notes FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_crm_notes" ON admin_crm_notes FOR DELETE TO anon USING (true);

-- user_activity_log (admin reads activity)
CREATE POLICY "anon_select_activity_log" ON user_activity_log FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_activity_log" ON user_activity_log FOR INSERT TO anon WITH CHECK (true);
