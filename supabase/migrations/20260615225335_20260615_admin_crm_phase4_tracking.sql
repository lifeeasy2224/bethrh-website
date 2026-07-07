-- Add missing tracking columns to campaign_recipients
ALTER TABLE campaign_recipients
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS bounced_at timestamptz,
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz,
  ADD COLUMN IF NOT EXISTS unsubscribe_token text;

-- Update status constraint to include new values
ALTER TABLE campaign_recipients DROP CONSTRAINT IF EXISTS campaign_recipients_status_check;
ALTER TABLE campaign_recipients ADD CONSTRAINT campaign_recipients_status_check
  CHECK (status IN ('pending','sent','delivered','opened','clicked','bounced','failed','unsubscribed'));

-- Add deliver_count to marketing_campaigns
ALTER TABLE marketing_campaigns
  ADD COLUMN IF NOT EXISTS deliver_count integer NOT NULL DEFAULT 0;

-- Index for webhook lookups by email + campaign
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_email ON campaign_recipients(campaign_id, email);

-- Add source column to email_suppression_list for tracking which campaign triggered it
ALTER TABLE email_suppression_list
  ADD COLUMN IF NOT EXISTS source text;
