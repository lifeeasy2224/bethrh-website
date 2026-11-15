/*
  # Revoke TRUNCATE and TRIGGER on every public relation from client roles

  TRUNCATE is not gated by RLS, so any role holding it can empty a table.
  TRIGGER lets a role create triggers on the table. The app needs neither: the
  browser talks to PostgREST, which never issues TRUNCATE or CREATE TRIGGER.
  SELECT / INSERT / UPDATE / DELETE / REFERENCES / MAINTAIN are untouched.

  Supabase's default privileges grant these on every new public table, so the
  default ACL is changed too, for the roles that create tables:
    - postgres        (owns all current public tables; migrations run as it)
    - supabase_admin  (best effort: postgres is not a member of it, so this may
                       be refused; a NOTICE says so instead of failing the file)

  Rollback (all relations; default ACL):
    DO $$ DECLARE c oid; BEGIN
      FOR c IN SELECT oid FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind IN ('r','p','v','m') LOOP
        EXECUTE format('GRANT TRUNCATE, TRIGGER ON TABLE %s TO anon, authenticated', c::regclass);
      END LOOP; END $$;
    ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT TRUNCATE, TRIGGER ON TABLES TO anon, authenticated;
*/

DO $$
DECLARE
  c oid;
BEGIN
  FOR c IN
    SELECT oid FROM pg_class
     WHERE relnamespace = 'public'::regnamespace AND relkind IN ('r', 'p', 'v', 'm')
  LOOP
    EXECUTE format('REVOKE TRUNCATE, TRIGGER ON TABLE %s FROM anon, authenticated', c::regclass);
  END LOOP;
END $$;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE TRUNCATE, TRIGGER ON TABLES FROM anon, authenticated;

DO $$
BEGIN
  ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
    REVOKE TRUNCATE, TRIGGER ON TABLES FROM anon, authenticated;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'supabase_admin default privileges not changed: %', SQLERRM;
END $$;
