-- Migration 035: Make current_user_role() SECURITY DEFINER to prevent RLS recursion.
--
-- Background
--   The current_user_role() helper from migration 001 is defined as
--   `language sql stable` without SECURITY DEFINER, so it runs with the
--   caller's privileges and is subject to RLS on public.profiles.
--
--   After migration 034 replaced `profiles_read_all USING (true)` with
--   `profiles_read_self` + `profiles_read_admin`, any caller whose
--   auth.uid() doesn't match a row in profiles (i.e. the anonymous role)
--   triggers infinite recursion: the profiles_read_admin policy invokes
--   current_user_role(), which does `select role from profiles`, which
--   re-evaluates the same policy, which invokes the function again ...
--
-- Runtime evidence (this debug session, immediately after 034 applied)
--   anon SELECT all profiles  → rows=0  err=54001
--     msg="stack depth limit exceeded"
--   anon SELECT by id         → rows=0  err=54001
--   anon SELECT phone, role   → rows=0  err=54001
--
--   The PII leak is technically closed (anon gets 0 rows) but the error
--   surface is messy and could break clients that expect a clean empty
--   array. Authenticated callers are NOT affected because their own row
--   matches profiles_read_self non-recursively.
--
-- Fix
--   Recreate current_user_role() with SECURITY DEFINER so the inner
--   `select from profiles` bypasses RLS. The function still scopes its
--   read by `id = auth.uid()`, so each caller can only ever see THEIR
--   OWN role — no privilege escalation surface introduced.
--
--   This is the idiomatic Supabase pattern for "lookup my role" helpers
--   used inside RLS policies.
--
-- Hardening notes
--   - search_path is pinned to "public" via `set search_path = public`
--     so a malicious caller can't hijack the function by creating a
--     shadow `profiles` table in a temp schema.
--   - The function remains STABLE (no side effects) and returns only
--     the caller's own role; safe to expose to anon/authenticated/etc.

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;
