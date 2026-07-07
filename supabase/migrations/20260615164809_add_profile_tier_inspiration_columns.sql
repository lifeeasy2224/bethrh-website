ALTER TABLE profiles ADD COLUMN IF NOT EXISTS inspiration_week_number integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tier text DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'growth', 'accelerator'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active timestamptz;
