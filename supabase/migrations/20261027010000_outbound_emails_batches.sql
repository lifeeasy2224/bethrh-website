-- Group emails prepared together (one personalised email per recipient) so an
-- admin can review one sample and approve the whole batch with one tap.
alter table public.outbound_emails
  add column if not exists batch_id uuid,
  add column if not exists batch_label text;
create index if not exists outbound_emails_batch_idx on public.outbound_emails (batch_id) where batch_id is not null;
