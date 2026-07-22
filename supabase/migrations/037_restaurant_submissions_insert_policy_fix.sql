-- Repair restaurant_submissions public insert policy for status = 'submitted'.
-- App inserts use status 'submitted' (migration 021); older DBs may still require 'pending'.

update public.restaurant_submissions
set status = 'submitted'
where status = 'pending';

alter table public.restaurant_submissions
  alter column status set default 'submitted';

alter table public.restaurant_submissions
  drop constraint if exists restaurant_submissions_status_check;

alter table public.restaurant_submissions
  add constraint restaurant_submissions_status_check
  check (status in ('submitted', 'under_review', 'owner_invited', 'verified', 'approved', 'rejected'));

drop policy if exists "restaurant_submissions_insert" on public.restaurant_submissions;
create policy "restaurant_submissions_insert"
on public.restaurant_submissions
for insert
to anon, authenticated
with check (status = 'submitted');
