-- Make submitted_by_email optional for restaurant submissions

drop policy if exists "restaurant_submissions_insert" on public.restaurant_submissions;
create policy "restaurant_submissions_insert"
on public.restaurant_submissions
for insert
with check (
  status = 'pending'
  and (
    submitted_by_email is null
    or length(trim(submitted_by_email)) = 0
    or length(trim(submitted_by_email)) > 3
  )
);

