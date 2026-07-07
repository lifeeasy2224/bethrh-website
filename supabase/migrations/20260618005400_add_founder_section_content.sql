
-- Create content-assets storage bucket for photo uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('content-assets', 'content-assets', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Allow public read on content-assets
CREATE POLICY "Public can read content assets"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'content-assets');

-- Seed founder section content keys
INSERT INTO public.site_content (key, value, label, category, type, sort_order) VALUES
  ('home.founder.visible',   'true',                                                                                                                                          'Show Section',             'Homepage — Founder', 'text',     1),
  ('home.founder.photo_url', '',                                                                                                                                               'Founder Photo URL',        'Homepage — Founder', 'text',     2),
  ('home.founder.quote',     'Someone once told me my idea wasn''t ready. I started anyway. That decision changed my life.',                                                   'Quote Text',               'Homepage — Founder', 'textarea', 3),
  ('home.founder.body',      'This platform exists because I believe your idea — right now, in its raw and imperfect form — is enough to start. 15+ years of building, failing, learning, and succeeding went into creating the framework you''ll use today. Not so you can avoid mistakes — but so you can make the right ones, faster.', 'Body Text', 'Homepage — Founder', 'textarea', 4),
  ('home.founder.highlight', 'No one should be locked out of entrepreneurship because they weren''t handed a playbook. Your first dollar is closer than you think. Let''s go get it.', 'Highlighted Line (gold)', 'Homepage — Founder', 'textarea', 5),
  ('home.founder.name',      'Moha Reda',                                                                                                                                     'Founder Name',             'Homepage — Founder', 'text',     6),
  ('home.founder.title',     'CEO / Founder',                                                                                                                                  'Founder Title',            'Homepage — Founder', 'text',     7)
ON CONFLICT (key) DO NOTHING;
