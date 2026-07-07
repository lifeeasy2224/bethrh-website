-- marketing_automations — only had service_role, add anon for admin panel
CREATE POLICY "anon_select_automations" ON marketing_automations FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_automations" ON marketing_automations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_automations" ON marketing_automations FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_automations" ON marketing_automations FOR DELETE TO anon USING (true);

-- marketing_templates — same pattern
CREATE POLICY "anon_select_templates" ON marketing_templates FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_templates" ON marketing_templates FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_templates" ON marketing_templates FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_templates" ON marketing_templates FOR DELETE TO anon USING (true);
