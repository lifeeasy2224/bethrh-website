-- Sectors table: a managed list of idea sectors, so the admin idea-creation
-- form picks from a real list (editable in Admin -> Ideas Library -> Sectors)
-- instead of a hardcoded array.
--
-- Reads are public (dropdowns + the public library filter can use them).
-- Writes go through the admin-db Edge Function (service role, bypasses RLS),
-- so no client INSERT/UPDATE/DELETE policy is needed. Idempotent.

CREATE TABLE IF NOT EXISTS public.sectors (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  emoji      text DEFAULT '💡',
  sort_order integer DEFAULT 0,
  is_active  boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;

-- Public read (sector pickers / library filters). Writes are service-role only.
DROP POLICY IF EXISTS "Anyone can read sectors" ON public.sectors;
CREATE POLICY "Anyone can read sectors"
  ON public.sectors FOR SELECT
  USING (true);

-- Seed the sectors currently hardcoded in the app, in display order.
INSERT INTO public.sectors (name, emoji, sort_order)
SELECT v.name, v.emoji, v.sort_order
FROM (VALUES
  ('Food & Agriculture', '🌾', 1),
  ('B2B SaaS',           '💼', 2),
  ('E-commerce',         '🛒', 3),
  ('Fintech',            '💰', 4),
  ('EdTech',             '📚', 5),
  ('HealthTech',         '🏥', 6),
  ('Logistics',          '🚚', 7),
  ('Services',           '🔧', 8)
) AS v(name, emoji, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.sectors s WHERE s.name = v.name
);
