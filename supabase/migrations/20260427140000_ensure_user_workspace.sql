-- If auth.users was created but the new-user trigger did not run, create the same rows here.
-- Does not read auth.users (avoids "permission denied for schema auth" in some projects).
-- Safe to run multiple times.
create or replace function public.ensure_user_workspace()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  wid uuid;
  slug text;
  uid uuid;
begin
  uid := auth.uid();
  if uid is null then
    return null;
  end if;

  if exists (select 1 from public.profiles p where p.id = uid) then
    select p.default_workspace_id into wid
    from public.profiles p
    where p.id = uid;
    return wid;
  end if;

  slug := 'ws-' || substr(replace(uid::text, '-', ''), 1, 12);
  insert into public.workspaces (name, slug)
  values ('My workspace', slug)
  returning id into wid;

  insert into public.profiles (id, full_name, avatar_url, default_workspace_id)
  values (uid, null, null, wid);

  insert into public.workspace_members (workspace_id, user_id, role)
  values (wid, uid, 'owner');

  insert into public.user_settings (user_id) values (uid) on conflict do nothing;
  return wid;
end;
$$;

grant execute on function public.ensure_user_workspace() to authenticated;

comment on function public.ensure_user_workspace is
  'Creates workspace, profile, and membership for auth.uid() if missing.';
