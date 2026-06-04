-- Partner applications from /join-as-restaurant (admin review + owner onboarding invite)

create table if not exists public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  cuisine_type text not null,
  contact_name text not null,
  email text not null,
  phone text not null,
  status text not null default 'submitted',
  admin_notes text,
  owner_invite_token_hash text,
  owner_invite_token_expires_at timestamptz,
  owner_invite_token_used_at timestamptz,
  invited_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.partner_applications
  drop constraint if exists partner_applications_status_check;

alter table public.partner_applications
  add constraint partner_applications_status_check
  check (status in ('submitted', 'under_review', 'invited', 'approved', 'rejected'));

create index if not exists partner_applications_status_created_at_idx
  on public.partner_applications (status, created_at desc);

create unique index if not exists partner_applications_owner_invite_token_hash_uniq
  on public.partner_applications (owner_invite_token_hash)
  where owner_invite_token_hash is not null;

alter table public.partner_applications enable row level security;

drop policy if exists "partner_applications_admin_read" on public.partner_applications;
create policy "partner_applications_admin_read"
on public.partner_applications
for select
using (public.current_user_role() = 'admin');

drop policy if exists "partner_applications_admin_update" on public.partner_applications;
create policy "partner_applications_admin_update"
on public.partner_applications
for update
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');
