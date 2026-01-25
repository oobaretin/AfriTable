-- Reviews enhancements for MVP:
-- - extra fields for review form
-- - allow users to update their own reviews within 30 days

alter table public.reviews
  add column if not exists recommended_dishes text,
  add column if not exists would_recommend boolean;

-- Allow review updates by author within 30 days
drop policy if exists "reviews_update_own_within_30_days" on public.reviews;
create policy "reviews_update_own_within_30_days"
on public.reviews
for update
using (
  user_id = auth.uid()
  and created_at >= now() - interval '30 days'
)
with check (
  user_id = auth.uid()
  and created_at >= now() - interval '30 days'
);

