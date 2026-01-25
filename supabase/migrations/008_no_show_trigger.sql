-- Increment diner no-show count when a reservation is marked no_show.
-- This is best-effort and assumes reservations.user_id references profiles when present.

create or replace function public.increment_no_show_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'no_show' and old.status is distinct from 'no_show' and new.user_id is not null then
    update public.profiles
    set no_show_count = no_show_count + 1
    where id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists reservations_no_show_count on public.reservations;
create trigger reservations_no_show_count
after update of status on public.reservations
for each row
execute function public.increment_no_show_count();

