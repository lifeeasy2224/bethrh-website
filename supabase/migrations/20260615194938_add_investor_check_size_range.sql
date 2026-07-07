ALTER TABLE investor_profiles
  ADD COLUMN IF NOT EXISTS check_size_min numeric(14,2),
  ADD COLUMN IF NOT EXISTS check_size_max numeric(14,2);
