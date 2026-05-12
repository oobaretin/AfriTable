-- Migration 034: Tighten profiles SELECT to prevent PII leak.
--
-- Background
--   Migration 001 created `profiles_read_all` with USING (true), making the
--   profiles table fully readable by every Supabase client — including the
--   anonymous role used by unauthenticated site visitors.
--
--   Runtime probe confirmed the impact: an anon client could SELECT every
--   row from public.profiles and read full_name, phone, and role for all
--   users, including the 3 admin accounts and 100+ restaurant_owner phone
--   numbers. This is a PII / privacy leak (GDPR / CCPA exposure) and an
--   admin-enumeration attack surface.
--
-- Fix
--   Replace `profiles_read_all` with two narrower SELECT policies:
--     - profiles_read_self   → every authenticated user can read their OWN row
--     - profiles_read_admin  → users with role='admin' can read every row
--
--   The existing INSERT/UPDATE policies (`profiles_insert_own`,
--   `profiles_update_own`, `profiles_update_admin`) are not changed.
--
--   `public.current_user_role()` reads the caller's own row via
--   `auth.uid() = id`, which is still allowed under `profiles_read_self`,
--   so there is no circular dependency in `profiles_read_admin`.
--
-- Application changes shipped alongside this migration
--   - src/app/api/leaderboard/route.ts and src/app/api/dashboard/reviews/route.ts
--     now use createSupabaseAdminClient() (service role) for profile lookups
--     of OTHER users, and return only whitelisted fields (id, full_name,
--     city, avatar_url). All other `from("profiles")` queries already scope
--     by `id = auth.uid()` and continue to work under the new SELECT policy.
--
-- Rollback
--   To revert, drop the two new policies and recreate `profiles_read_all`:
--     drop policy if exists "profiles_read_self"  on public.profiles;
--     drop policy if exists "profiles_read_admin" on public.profiles;
--     create policy "profiles_read_all" on public.profiles for select using (true);

drop policy if exists "profiles_read_all" on public.profiles;

drop policy if exists "profiles_read_self" on public.profiles;
create policy "profiles_read_self"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "profiles_read_admin" on public.profiles;
create policy "profiles_read_admin"
on public.profiles
for select
using (public.current_user_role() = 'admin');
