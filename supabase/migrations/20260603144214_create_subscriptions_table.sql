/*
  # Create subscriptions table

  ## Summary
  Adds a subscriptions table to track Stripe billing for each user.

  ## New Tables
  - `subscriptions`
    - `id` (uuid, primary key)
    - `user_id` (uuid, FK to auth.users, unique — one active subscription per user)
    - `stripe_customer_id` (text) — Stripe customer object ID
    - `stripe_subscription_id` (text) — Stripe subscription object ID
    - `plan` (text) — matches profile plan values: builder, launch, family
    - `billing_cycle` (text) — monthly or annual
    - `status` (text) — Stripe subscription status: active, canceled, past_due, etc.
    - `current_period_end` (timestamptz) — when the current billing period ends
    - `cancel_at_period_end` (boolean) — whether user has scheduled cancellation
    - `created_at` / `updated_at` (timestamptz)

  ## Security
  - RLS enabled; users can read their own subscription record only
  - Only the service role (used by edge functions/webhooks) can insert/update
*/

CREATE TABLE IF NOT EXISTS subscriptions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  plan                    text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'builder', 'launch', 'family')),
  billing_cycle           text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  status                  text NOT NULL DEFAULT 'active',
  current_period_end      timestamptz,
  cancel_at_period_end    boolean DEFAULT false,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now(),
  CONSTRAINT subscriptions_user_id_key UNIQUE (user_id)
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx ON subscriptions(stripe_customer_id);
