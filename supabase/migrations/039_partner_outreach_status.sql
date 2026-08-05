-- Admin CRM for partner outreach (claim invite tracking)

create table if not exists public.partner_outreach_status (
  slug text primary key,
  status text not null default 'pending',
  notes text,
  contacted_at timestamptz,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,
  constraint partner_outreach_status_check
    check (status in ('pending', 'sent', 'replied', 'claimed', 'declined', 'skipped'))
);

create index if not exists partner_outreach_status_status_idx
  on public.partner_outreach_status (status);

alter table public.partner_outreach_status enable row level security;

drop policy if exists "partner_outreach_status_admin_all" on public.partner_outreach_status;
create policy "partner_outreach_status_admin_all"
on public.partner_outreach_status
for all
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');
