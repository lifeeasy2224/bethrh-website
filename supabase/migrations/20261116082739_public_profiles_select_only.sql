-- public_profiles is read-only. New objects in public get broad default privileges for
-- anon/authenticated; only SELECT for authenticated is intended. (Already applied live
-- by hand; recorded here, idempotent.)
revoke insert, update, delete, truncate, trigger, references on public.public_profiles from anon, authenticated;
