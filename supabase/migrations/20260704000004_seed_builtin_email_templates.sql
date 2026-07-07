-- Make Admin -> Marketing -> Templates fully work, then seed the 8 transactional
-- templates as editable rows.
--
-- Drift note: the live marketing_templates table only had
-- id/name/subject/body_html/preview_text/created_at/updated_at, but the admin
-- Templates UI reads & writes `category` and `is_builtin`. So adding OR editing a
-- template in the admin was already failing on live (42703). Add the two columns
-- the code expects, then seed.
--
-- Templates are read by the send-* Edge Functions via resolveBody('<name>'),
-- which uses body_html only if non-empty and otherwise falls back to the built-in
-- default HTML. Seeding body_html = '' means the rows appear and are editable,
-- while every email keeps sending its built-in default until an admin writes
-- custom HTML here. Idempotent.

ALTER TABLE public.marketing_templates ADD COLUMN IF NOT EXISTS category   text    DEFAULT 'general';
ALTER TABLE public.marketing_templates ADD COLUMN IF NOT EXISTS is_builtin boolean DEFAULT false;

INSERT INTO public.marketing_templates (name, subject, preview_text, body_html, category, is_builtin)
SELECT v.name, v.subject, '', '', 'transactional', true
FROM (VALUES
  ('welcome-email',        'Welcome to Bethra 🎉'),
  ('weekly-digest',        'Your weekly Bethra digest'),
  ('validation-complete',  'Your validation results are ready'),
  ('new-message',          'You have a new message on Bethra'),
  ('investor-match',       'You have a new investor match'),
  ('investor-interested',  'An investor is interested in your idea'),
  ('inspiration-upgrade',  'Unlock more inspiration on Bethra'),
  ('weekly-inspiration',   'Your weekly startup inspiration')
) AS v(name, subject)
WHERE NOT EXISTS (
  SELECT 1 FROM public.marketing_templates m WHERE m.name = v.name
);
