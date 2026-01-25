-- Add "pending_owner" role for claim-created accounts
do $$
begin
  alter type public.user_role add value if not exists 'pending_owner';
exception
  when duplicate_object then null;
end
$$;

