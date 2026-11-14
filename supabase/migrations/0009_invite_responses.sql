-- 0009_invite_responses.sql: tell the inviter when their invitation is accepted or declined.
-- Idempotent. Run after 0008_invitations.sql.

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (
  type in ('task_due_soon', 'task_overdue', 'project_due_soon', 'task_assigned', 'comment_added',
           'project_invite', 'invite_accepted', 'invite_declined')
);

-- An invitation row is deleted on accept (inside accept_invitation), decline, owner cancel, or project delete.
-- Only the invitee's own deletes notify; being a member afterwards means it was an accept.
create or replace function public.notify_invite_response() returns trigger
language plpgsql security definer set search_path = public as $$
declare accepted boolean;
begin
  if old.invitee_id is distinct from public.requesting_user_id() then
    return old;  -- cancelled by the owner, or removed with the project
  end if;
  accepted := exists (
    select 1 from public.project_members where project_id = old.project_id and user_id = old.invitee_id
  );
  insert into public.notifications (user_id, project_id, type, message)
  values (
    old.invited_by, old.project_id,
    case when accepted then 'invite_accepted' else 'invite_declined' end,
    old.invitee_name || case when accepted then ' accepted' else ' declined' end
      || ' your invitation to "' || old.project_name || '"'
  );
  return old;
end $$;

drop trigger if exists project_invitations_notify_response on public.project_invitations;
create trigger project_invitations_notify_response after delete on public.project_invitations
for each row execute function public.notify_invite_response();
