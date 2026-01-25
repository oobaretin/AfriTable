-- Claim requests: allow restaurant owners to submit proof of ownership for admin review

do $$
begin
  if not exists (select 1 from pg_type where typname = 'claim_request_status') then
    create type public.claim_request_status as enum ('pending', 'approved', 'rejected');
  end if;
end
$$;

create table if not exists public.restaurant_claim_requests (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text not null,
  proof text,
  status public.claim_request_status not null default 'pending',
  decision_note text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists restaurant_claim_requests_restaurant_id_idx on public.restaurant_claim_requests (restaurant_id);
create index if not exists restaurant_claim_requests_user_id_idx on public.restaurant_claim_requests (user_id);
create index if not exists restaurant_claim_requests_status_idx on public.restaurant_claim_requests (status);

-- Prevent duplicate pending requests for the same user+restaurant
create unique index if not exists restaurant_claim_requests_unique_pending
on public.restaurant_claim_requests (restaurant_id, user_id)
where status = 'pending';

alter table public.restaurant_claim_requests enable row level security;

-- Users can create their own claim requests
drop policy if exists "claim_requests_insert_own" on public.restaurant_claim_requests;
create policy "claim_requests_insert_own"
on public.restaurant_claim_requests
for insert
with check (user_id = auth.uid());

-- Users can view their own claim requests; admins can view all
drop policy if exists "claim_requests_read_own_or_admin" on public.restaurant_claim_requests;
create policy "claim_requests_read_own_or_admin"
on public.restaurant_claim_requests
for select
using (user_id = auth.uid() or public.current_user_role() = 'admin');

-- Admins can update (approve/reject) any request
drop policy if exists "claim_requests_admin_update" on public.restaurant_claim_requests;
create policy "claim_requests_admin_update"
on public.restaurant_claim_requests
for update
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

