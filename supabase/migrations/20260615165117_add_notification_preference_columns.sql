ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS investor_match_alerts boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS message_notifications boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS validation_notifications boolean DEFAULT true;
