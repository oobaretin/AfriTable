-- Update profile creation trigger to include phone + safe role from auth metadata
-- and prevent self-escalation by locking down role updates.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  final_role public.user_role;
begin
  requested_role := coalesce(new.raw_user_meta_data->>'role', 'diner');

  -- Only allow diner/restaurant_owner from user-supplied metadata. Never allow admin here.
  if requested_role = 'restaurant_owner' then
    final_role := 'restaurant_owner';
  else
    final_role := 'diner';
  end if;

  insert into public.profiles (id, full_name, phone, role, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'phone',
    final_role,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    phone = coalesce(excluded.phone, public.profiles.phone),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);

  return new;
end;
$$;

-- Lock down profile role updates:
-- users can update their own profile fields, but cannot change `role` (only admins can).
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (
  auth.uid() = id
  and role = (select p.role from public.profiles p where p.id = auth.uid())
);

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
on public.profiles
for update
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

