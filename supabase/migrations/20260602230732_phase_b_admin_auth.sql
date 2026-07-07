/*
  # Phase B: Admin Authentication System

  Separate admin authentication system independent of regular Supabase auth.

  1. New Tables
    - `admin_users` — Admin accounts with bcrypt-hashed passwords
      - id, email, password_hash, full_name, role (super_admin/admin/moderator)
      - totp_secret, totp_enabled, totp_backup_codes
      - is_active, last_login, invited_by, created_at
    - `admin_sessions` — Active sessions with 30-min rolling expiry
      - id, admin_user_id, token (unique), expires_at, last_active
      - ip_address, user_agent, is_pending_2fa
    - `admin_login_attempts` — Rate limiting: 5 failures in 15 min = lockout
      - id, email, attempted_at, success, ip_address
    - `admin_invites` — Invite tokens sent by super admins
      - id, email, role, token (unique), created_by, expires_at, used_at

  2. Security
    - RLS enabled on all tables, no public access
    - All access is through edge functions using the service role key
    - Passwords hashed with bcrypt via edge function

  3. Notes
    - Session timeout: 30 minutes of inactivity
    - Lockout: 5 failed attempts within 15 minutes → 15-minute lockout
    - Invite links expire after 48 hours
    - Password requirements: 12+ chars, uppercase, number, special char
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Admin users
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL DEFAULT '',
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'moderator'
    CHECK (role IN ('super_admin', 'admin', 'moderator')),
  totp_secret text,
  totp_enabled boolean NOT NULL DEFAULT false,
  totp_backup_codes text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login timestamptz,
  invited_by uuid
);

-- Admin sessions (rolling 30-min expiry)
CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_active timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  is_pending_2fa boolean NOT NULL DEFAULT false
);

-- Login attempts for rate limiting
CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  success boolean NOT NULL DEFAULT false,
  ip_address text
);

-- Admin invites
CREATE TABLE IF NOT EXISTS admin_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text NOT NULL DEFAULT 'admin'
    CHECK (role IN ('admin', 'moderator')),
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_by uuid REFERENCES admin_users(id),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all admin tables (no public access)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_invites ENABLE ROW LEVEL SECURITY;

-- All access is via edge functions using the service role key (bypasses RLS)
-- No RLS policies needed — service role has full access

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_email_time
  ON admin_login_attempts(email, attempted_at);
CREATE INDEX IF NOT EXISTS idx_admin_invites_token ON admin_invites(token);

-- Auto-clean expired sessions (optional helper function)
CREATE OR REPLACE FUNCTION cleanup_expired_admin_sessions()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM admin_sessions WHERE expires_at < now();
END;
$$;
