-- Lecture workspaces pour membres dont public.users.id ne coincide pas avec auth.uid()
-- (ex. insert sans id explicite -> gen_random_uuid), alors que l'email JWT correspond bien
-- a une ligne users du workspace. Sans cela, getWorkspace(.single()) echoue (0 ligne),
-- et le parcours reste fige sur snapshot / « Bientot ».

drop policy if exists workspaces_select_member_jwt_email_match on public.workspaces;

create policy workspaces_select_member_jwt_email_match
  on public.workspaces
  for select
  to authenticated
  using (
    coalesce(archived, false) = false
    and exists (
      select 1
      from public.users u
      where u.workspace_id = workspaces.id
        and u.email is not null
        and lower(trim(u.email)) = lower(trim(coalesce((select auth.jwt())->>'email', '')))
    )
  );

comment on policy workspaces_select_member_jwt_email_match on public.workspaces is
  'SELECT workspace si une ligne users du meme workspace a le meme email que le JWT (deblocage profils id <> auth.uid()).';
