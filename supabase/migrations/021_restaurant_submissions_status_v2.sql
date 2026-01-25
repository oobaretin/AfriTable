-- Update restaurant_submissions.status lifecycle
-- New statuses:
-- submitted -> under_review -> owner_invited -> verified -> approved/rejected

-- 1) Backfill old statuses to new ones (safe even if already migrated)
update public.restaurant_submissions
set status =
  case status
    when 'pending' then 'submitted'
    when 'converted' then 'under_review'
    when 'approved' then 'approved'
    when 'rejected' then 'rejected'
    else status
  end
where status in ('pending', 'converted', 'approved', 'rejected');

-- 2) Update default
alter table public.restaurant_submissions
  alter column status set default 'submitted';

-- 3) Replace status check constraint
alter table public.restaurant_submissions
  drop constraint if exists restaurant_submissions_status_check;

alter table public.restaurant_submissions
  add constraint restaurant_submissions_status_check
  check (status in ('submitted', 'under_review', 'owner_invited', 'verified', 'approved', 'rejected'));

-- 4) Update insert policy to require initial status = submitted (email optional)
drop policy if exists "restaurant_submissions_insert" on public.restaurant_submissions;
create policy "restaurant_submissions_insert"
on public.restaurant_submissions
for insert
with check (
  status = 'submitted'
);

