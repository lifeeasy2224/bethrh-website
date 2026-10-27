-- Admin Outbox: one-off emails from info@bethra.co, sent only after admin approval.
create table if not exists public.outbound_emails (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text not null default 'claude',
  purpose text,
  status text not null default 'pending_approval'
    check (status in ('pending_approval','sending','sent','failed','rejected')),
  from_name text not null default 'بذرة',
  from_email text not null default 'info@bethra.co',
  reply_to text,
  to_emails text[] not null check (cardinality(to_emails) between 1 and 50),
  cc_emails text[] not null default '{}',
  bcc_emails text[] not null default '{}',
  subject text not null,
  body_html text not null,
  body_text text,
  attachments jsonb not null default '[]'::jsonb,
  crm_contact_id uuid references public.crm_contacts(id) on delete set null,
  crm_stage_after text,
  approved_by text,
  approved_at timestamptz,
  sent_at timestamptz,
  resend_id text,
  last_event text,
  last_event_at timestamptz,
  error text
);
create index if not exists outbound_emails_status_idx on public.outbound_emails(status, created_at desc);
alter table public.outbound_emails enable row level security;

create or replace function public.outbound_emails_touch() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists outbound_emails_touch on public.outbound_emails;
create trigger outbound_emails_touch before update on public.outbound_emails
  for each row execute function public.outbound_emails_touch();

insert into storage.buckets (id, name, public, file_size_limit)
values ('email-assets', 'email-assets', false, 15728640)
on conflict (id) do nothing;
