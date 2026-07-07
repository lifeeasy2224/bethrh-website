ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Back-fill from subscriptions table where possible
UPDATE profiles p
SET stripe_customer_id = s.stripe_customer_id
FROM subscriptions s
WHERE s.user_id = p.user_id
  AND s.stripe_customer_id IS NOT NULL
  AND p.stripe_customer_id IS NULL;
