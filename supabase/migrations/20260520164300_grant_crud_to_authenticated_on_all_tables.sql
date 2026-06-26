/*
  # Grant CRUD privileges to authenticated role on all public tables

  The authenticated role was missing SELECT/INSERT/UPDATE/DELETE on all
  application tables. This caused "permission denied" errors even though
  RLS policies were correctly defined. Postgres checks privileges before
  evaluating RLS, so without these grants all writes were blocked.
*/

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;

-- Ensure future tables also get these grants automatically
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
