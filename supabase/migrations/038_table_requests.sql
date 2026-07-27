-- Catalog table requests: guests ask for a table; AfriTable stores + notifies (no fake slots).

do $$
begin
  if not exists (select 1 from pg_type where typname = 'table_request_status') then
    create type public.table_request_status as enum ('pending', 'forwarded', 'cancelled');
  end if;
end
$$;

create table if not exists public.table_requests (
  id uuid primary key default gen_random_uuid(),
  restaurant_slug text not null,
  restaurant_name text not null,
  restaurant_id uuid references public.restaurants (id) on delete set null,
  preferred_date date,
  time_preference text not null check (time_preference in ('morning', 'afternoon', 'evening', 'flexible')),
  party_size int not null check (party_size >= 1 and party_size <= 20),
  guest_name text not null,
  guest_email text not null,
  guest_phone text not null,
  special_requests text,
  notify_when_live boolean not null default false,
  status public.table_request_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists table_requests_restaurant_slug_idx on public.table_requests (restaurant_slug);
create index if not exists table_requests_created_at_idx on public.table_requests (created_at desc);
create index if not exists table_requests_status_idx on public.table_requests (status);

alter table public.table_requests enable row level security;

-- No public policies: inserts/reads go through service role in API routes only.
-- Admins can read via service role or future admin dashboard.
