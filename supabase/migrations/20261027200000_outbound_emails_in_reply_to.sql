-- Message-ID of the email being answered, so replies sent from the Outbox thread
-- under the recipient's original message (In-Reply-To / References headers).
alter table public.outbound_emails add column if not exists in_reply_to text;
