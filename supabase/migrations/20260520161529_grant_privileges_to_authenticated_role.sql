/*
  # Grant table privileges to authenticated and anon roles

  The authenticated role was missing SELECT/INSERT/UPDATE/DELETE privileges
  on all application tables. RLS policies exist but are irrelevant without
  the base table grants — Postgres checks privileges before RLS.

  This grants the minimum necessary privileges so RLS policies can take effect.
*/

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ideas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.users TO authenticated;

-- Grant on other tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'validation_logs' AND table_schema = 'public') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.validation_logs TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_chats' AND table_schema = 'public') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_chats TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pods' AND table_schema = 'public') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pods TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pod_members' AND table_schema = 'public') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pod_members TO authenticated';
  END IF;
END $$;
