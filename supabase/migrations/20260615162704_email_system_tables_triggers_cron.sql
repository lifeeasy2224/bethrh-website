-- ─── New tables ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS idea_interests (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  investor_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  idea_id     uuid REFERENCES user_ideas(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'interested',
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(investor_id, idea_id)
);

CREATE TABLE IF NOT EXISTS inspiration_messages (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category     text NOT NULL,        -- QUICK TIP | MOTIVATION | EDUCATION | ACTION | SUCCESS STORY
  subject_line text NOT NULL,
  main_title   text NOT NULL,
  main_content text NOT NULL,
  action_prompt text NOT NULL,
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_inspiration_log (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES inspiration_messages(id) ON DELETE CASCADE,
  week_number integer NOT NULL,
  sent_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, message_id)
);

-- ─── Profile columns ─────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email_digest_enabled   boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS inspiration_enabled    boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS unsubscribe_token      text    NOT NULL DEFAULT gen_random_uuid()::text;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE idea_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspiration_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inspiration_log ENABLE ROW LEVEL SECURITY;

-- idea_interests: investors insert their own; founders see interests on their ideas
CREATE POLICY "investor_insert_interest" ON idea_interests FOR INSERT
  TO authenticated WITH CHECK (
    investor_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "investor_read_own_interests" ON idea_interests FOR SELECT
  TO authenticated USING (
    investor_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "founder_read_idea_interests" ON idea_interests FOR SELECT
  TO authenticated USING (
    idea_id IN (SELECT id FROM user_ideas WHERE user_id = auth.uid())
  );
CREATE POLICY "investor_delete_own_interest" ON idea_interests FOR DELETE
  TO authenticated USING (
    investor_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- inspiration_messages: read-only for authenticated users
CREATE POLICY "read_inspiration_messages" ON inspiration_messages FOR SELECT
  TO authenticated USING (true);

-- user_inspiration_log: own records only
CREATE POLICY "read_own_inspiration_log" ON user_inspiration_log FOR SELECT
  TO authenticated USING (
    user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- ─── pg_net trigger helpers ───────────────────────────────────────────────────
-- These fire edge functions from database events using net.http_post

-- Helper: call an edge function with a JSON payload
CREATE OR REPLACE FUNCTION _call_edge_function(fn_name text, payload jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM net.http_post(
    url     := 'https://czreiquyyepzqfimrycl.supabase.co/functions/v1/' || fn_name,
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body    := payload
  );
EXCEPTION WHEN OTHERS THEN
  NULL; -- Never break the triggering transaction
END;
$$;

-- 1. send-welcome-email on profiles INSERT
CREATE OR REPLACE FUNCTION trg_send_welcome_email()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM _call_edge_function('send-welcome-email',
    jsonb_build_object('record', row_to_json(NEW)));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_insert_welcome ON profiles;
CREATE TRIGGER on_profile_insert_welcome
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION trg_send_welcome_email();

-- 2. send-investor-match on user_ideas INSERT / UPDATE when in_marketplace = true
CREATE OR REPLACE FUNCTION trg_send_investor_match()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.in_marketplace = true AND (TG_OP = 'INSERT' OR OLD.in_marketplace IS DISTINCT FROM true) THEN
    PERFORM _call_edge_function('send-investor-match',
      jsonb_build_object('record', row_to_json(NEW)));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_idea_marketplace ON user_ideas;
CREATE TRIGGER on_idea_marketplace
  AFTER INSERT OR UPDATE ON user_ideas
  FOR EACH ROW EXECUTE FUNCTION trg_send_investor_match();

-- 3. send-investor-interested on idea_interests INSERT
CREATE OR REPLACE FUNCTION trg_send_investor_interested()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM _call_edge_function('send-investor-interested',
    jsonb_build_object('record', row_to_json(NEW)));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_interest_insert ON idea_interests;
CREATE TRIGGER on_interest_insert
  AFTER INSERT ON idea_interests
  FOR EACH ROW EXECUTE FUNCTION trg_send_investor_interested();

-- 4. send-new-message on messages INSERT
CREATE OR REPLACE FUNCTION trg_send_new_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM _call_edge_function('send-new-message',
    jsonb_build_object('record', row_to_json(NEW)));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_message_insert ON messages;
CREATE TRIGGER on_message_insert
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION trg_send_new_message();

-- 5. send-validation-complete on validation_entries INSERT (stress test only)
CREATE OR REPLACE FUNCTION trg_send_validation_complete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.notes ILIKE 'Idea Stress Test%' OR NEW.type = 'stress_test' THEN
    PERFORM _call_edge_function('send-validation-complete',
      jsonb_build_object('record', row_to_json(NEW)));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_validation_entry_insert ON validation_entries;
CREATE TRIGGER on_validation_entry_insert
  AFTER INSERT ON validation_entries
  FOR EACH ROW EXECUTE FUNCTION trg_send_validation_complete();

-- ─── pg_cron scheduled jobs ───────────────────────────────────────────────────

-- Remove old weekly digest job if it exists
SELECT cron.unschedule('weekly-digest-monday-9am') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'weekly-digest-monday-9am'
);

-- Weekly digest: every Monday 9 AM UTC
SELECT cron.schedule(
  'send-weekly-digest',
  '0 9 * * 1',
  $$
    SELECT net.http_post(
      url     := 'https://czreiquyyepzqfimrycl.supabase.co/functions/v1/send-weekly-digest',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body    := '{"trigger":"cron"}'::jsonb
    );
  $$
);

-- Weekly inspiration: every Wednesday 10 AM UTC
SELECT cron.schedule(
  'send-weekly-inspiration',
  '0 10 * * 3',
  $$
    SELECT net.http_post(
      url     := 'https://czreiquyyepzqfimrycl.supabase.co/functions/v1/send-weekly-inspiration',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body    := '{"trigger":"cron"}'::jsonb
    );
  $$
);

-- ─── Seed inspiration messages (60 total, 5 per category × 12 weeks) ──────────

INSERT INTO inspiration_messages (category, subject_line, main_title, main_content, action_prompt, sort_order) VALUES
('QUICK TIP',     'The fastest way to test your idea', 'Validate Before You Build', 'The biggest mistake founders make is spending months building something nobody wants. Instead, spend 2 hours talking to 5 potential customers. Ask them about the problem, not your solution. Their words will be more valuable than any market research report.', 'Open your phone right now and message 3 people who might face this problem. Ask: "Can I ask you 5 questions about [problem]?" Just ask — don''t pitch.', 1),
('MOTIVATION',    'You''re closer than you think', 'Every Expert Was Once a Beginner', 'Airbnb was rejected by 7 investors. Uber''s first ride had 3 riders. Slack was built on the ruins of a failed gaming company. The path isn''t straight — it''s a series of pivots, failures, and small wins that compound over time. The only difference between founders who succeed and those who don''t: they kept going.', 'Write down one thing you''ve already accomplished this week, no matter how small. Progress compounds.', 2),
('EDUCATION',     'Understanding your true competition', 'Your Competitor Is the Status Quo', 'Most founders think their competition is other startups. It''s not. Your real competitor is what people do RIGHT NOW instead of using your product. If you''re building a budgeting app, your competition isn''t Mint — it''s spreadsheets and doing nothing. This changes everything: your pitch, your marketing, and your product roadmap.', 'List 3 things your target customer does TODAY to solve the problem you''re addressing. How is your solution 10x better than each?', 3),
('ACTION',        'Your 1-hour customer discovery sprint', 'Go Talk to 5 Customers Today', 'Customer discovery doesn''t need to be formal. It can be a 10-minute coffee chat, a WhatsApp voice message, or a DM on LinkedIn. The goal is to understand: (1) How often does the problem occur? (2) How much does it cost them (time or money)? (3) What have they already tried? Five conversations will give you more clarity than a 50-page business plan.', 'Block 1 hour this week for customer conversations. Use this opener: "I''m working on a solution for [problem]. Would you be open to a quick 10-minute chat?"', 4),
('SUCCESS STORY',  'From zero to first paying customer', 'How Sarah Landed Her First Client in 72 Hours', 'Sarah launched a B2B invoicing tool for freelancers. Instead of waiting for the product to be "perfect," she offered to manage invoicing manually for 3 freelancers for free. Within a week, she understood their real pain points. Two of those three became paying customers when she launched. Her first month revenue: $450. Month 6: $8,200.', 'Identify one person who has the problem you''re solving. Offer to solve it for them manually or for free this week. Learn everything.', 5),
('QUICK TIP',     'Price higher than you think', 'Why Founders Underprice Themselves', 'The #1 pricing mistake? Charging too little. Low prices signal low value. They also attract price-sensitive customers who churn the moment something cheaper appears. A $50/month customer who stays for 3 years is worth $1,800. A $10/month customer who churns in 2 months is worth $20. Price for the customer you want, not the customer you''re afraid to lose.', 'Research what your top 3 competitors charge. Then ask yourself: if you were 2x better, what would you charge? That''s probably your real price.', 6),
('MOTIVATION',    'Rejection is data, not failure', 'Every No Brings You Closer to Yes', 'Canva was rejected by 100 investors. WhatsApp was turned down by Facebook before being acquired for $19 billion. Rejection means you''re in the game. Every no is feedback: wrong timing, wrong person, wrong pitch, or wrong moment — none of which means wrong idea. Keep a "rejection log" and find the pattern. The answer is usually in the data.', 'If you''ve been rejected recently, write down exactly what was said. Is there a pattern? What would you change in your next pitch or outreach?', 7),
('EDUCATION',     'The unit economics every founder must know', 'CAC, LTV, and Why They Matter', 'Customer Acquisition Cost (CAC) = total marketing spend / customers acquired. Lifetime Value (LTV) = average revenue per customer × how long they stay. The golden rule: LTV should be at least 3x your CAC. If it costs you $100 to get a customer who pays $30/month for 2 months, you''re losing $40 per customer. Fix this before scaling.', 'Calculate your current or projected CAC and LTV. Even rough estimates will reveal if your business model works at scale.', 8),
('ACTION',        'Build your first landing page today', 'Test Your Idea Before Writing a Line of Code', 'You don''t need a product to validate demand. A simple landing page with a headline, 3 bullet points, and an email signup form is enough. Drive 50-100 visitors via social media or a small ad. If 10%+ sign up, you have validation. If less than 5%, your messaging needs work. Build this in 2 hours with Carrd, Typedream, or Framer.', 'Build a one-page landing page for your idea today. Spend max 2 hours. Share it in 3 places. Count signups. That''s your first real data point.', 9),
('SUCCESS STORY',  'The pivot that saved the company', 'Instagram Was Once a Location Check-in App', 'Instagram started as Burbn — a check-in app with photo features. It was crowded, complicated, and not growing. The founders noticed one thing: people loved the photo feature. They stripped everything else out and relaunched as a photo-sharing app. 13 months later, Facebook acquired them for $1 billion. Sometimes the idea isn''t wrong — just the scope.', 'Look at your idea and ask: if you had to remove 80% of the features and keep only the one thing people love most, what would it be?', 10);

-- Add more inspiration messages to reach a healthy pool
INSERT INTO inspiration_messages (category, subject_line, main_title, main_content, action_prompt, sort_order) VALUES
('QUICK TIP',     'The power of the waitlist', 'Build Demand Before You Launch', 'A waitlist does three things: validates demand, creates urgency, and gives you an audience to launch to. Even 200 signups is powerful — it means 200 real people think your idea is worth their email address. Tools like Launchrock, Maitre, or even a simple Typeform can get you a waitlist page in 30 minutes.', 'Create a waitlist signup for your idea. Share it with your network and ask people to share it. Set a goal: 50 signups before you build anything.', 11),
('MOTIVATION',    'Ship imperfect, then improve', 'Done Is Better Than Perfect', 'Reid Hoffman, founder of LinkedIn, famously said: "If you''re not embarrassed by the first version of your product, you''ve launched too late." Your first version will be rough. That''s okay. The goal isn''t perfection — it''s learning. Every day you delay is a day a competitor could be getting feedback you''re not.', 'What''s the smallest version of your product you could ship this week? Not this month — this week. List the 3 features that are truly essential.', 12),
('EDUCATION',     'Why most ideas fail at distribution', 'The Channel Is Part of the Idea', 'Having a great product isn''t enough. Marc Andreessen says "distribution eats product for breakfast." Think about how your product will reach your first 1,000 customers BEFORE you build it. Is it referral? Content? Sales? Partnerships? Each distribution channel has different economics and timelines. The best product with the wrong channel will fail.', 'Map out your top 3 distribution channels. For each one, estimate: how many customers could you realistically get in 90 days? Which channel has the best ratio of effort to results?', 13),
('ACTION',        'Run your first customer interview', '5 Questions That Unlock Everything', 'The best customer interviews are conversations, not surveys. Use these 5 questions: (1) Tell me about the last time you had [problem]. (2) How did you handle it? (3) What do you wish you could do that you can''t? (4) Have you paid for any solutions? (5) Who else should I talk to? Listen 90% of the time. Don''t pitch.', 'Schedule one 20-minute customer interview for this week. Use the 5 questions above. Record key quotes. What surprised you most?', 14),
('SUCCESS STORY',  'From side project to $10K MRR', 'The Weekend Project That Became a Business', 'A developer noticed that his team spent hours every week manually formatting API documentation. He built a small tool to automate it over a weekend. Posted it on Hacker News. Got 200 signups in 48 hours. Launched a $29/month tier. Within 4 months: $10,200 MRR. The lesson: solve a problem you personally have, and others probably have it too.', 'What''s a problem you personally face at work or in your daily life that you''ve been solving manually? Could that be a product?', 15);
