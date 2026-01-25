-- Restaurant claiming fields (for owners to claim pre-seeded/imported restaurants)

alter table public.restaurants
  add column if not exists is_claimed boolean not null default false,
  add column if not exists claimed_by uuid,
  add column if not exists claimed_at timestamptz;

-- Link claimed_by to profiles for referential integrity
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'restaurants_claimed_by_fkey'
  ) then
    alter table public.restaurants
      add constraint restaurants_claimed_by_fkey
      foreign key (claimed_by) references public.profiles (id) on delete set null;
  end if;
end
$$;

create index if not exists restaurants_is_claimed_idx on public.restaurants (is_claimed);
create index if not exists restaurants_claimed_by_idx on public.restaurants (claimed_by);

