-- 0001_core.sql (B2): project membership, helper functions, create_project RPC, and RLS for projects + polls.
-- Idempotent: safe to run more than once. Back up the old policies first (supabase/existing_policies.sql).
-- Policies target `public` (every role), like the old ones; identity always comes from requesting_user_id(),
-- which is null for a request without a Clerk token, so anonymous requests match nothing.

------------------------------------------------------------------------------------------------------------
-- Helper: current Clerk user id
------------------------------------------------------------------------------------------------------------
create or replace function public.requesting_user_id() returns text
language sql stable as $$ select nullif(auth.jwt() ->> 'sub', '') $$;

------------------------------------------------------------------------------------------------------------
-- projects
------------------------------------------------------------------------------------------------------------
-- Stop if any project has no real owner, rather than silently deleting user data.
-- (The old column default was the literal text 'auth.jwt() ->> ''sub''', not a function call.)
do $$
declare n int;
begin
  select count(*) into n from public.projects
  where user_id is null or user_id = '' or user_id = 'auth.jwt() ->> ''sub''';
  if n > 0 then
    raise exception '% project(s) have no valid owner (user_id). Inspect them with: select * from projects where user_id is null or user_id = '''' or user_id like ''auth.jwt()%%''; then delete them or set user_id to a Clerk user id, and re-run this file.', n;
  end if;
end $$;

alter table public.projects add column if not exists description text;
alter table public.projects add column if not exists created_at timestamptz not null default now();
alter table public.projects alter column user_id set default public.requesting_user_id();
alter table public.projects alter column user_id set not null;

------------------------------------------------------------------------------------------------------------
-- project_members
------------------------------------------------------------------------------------------------------------
create table if not exists public.project_members (
  project_id   bigint not null references public.projects (id) on delete cascade,
  user_id      text not null,
  display_name text not null,
  image_url    text,
  role         text not null default 'member' check (role in ('owner', 'member')),
  joined_at    timestamptz not null default now(),
  primary key (project_id, user_id)
);
create index if not exists project_members_user_id_idx on public.project_members (user_id);

-- Membership checks. security definer so policies on project_members can call them without recursing into RLS.
create or replace function public.is_project_member(p_project_id bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.project_members
    where project_id = p_project_id and user_id = public.requesting_user_id()
  )
$$;

create or replace function public.is_project_owner(p_project_id bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.project_members
    where project_id = p_project_id and user_id = public.requesting_user_id() and role = 'owner'
  )
$$;

-- Every project gets its owner's membership row, however it is inserted. This keeps the old add page
-- (direct insert into projects) working until the frontend switches to createProject().
create or replace function public.add_project_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.project_members (project_id, user_id, display_name, role)
  values (new.id, new.user_id, 'Owner', 'owner')
  on conflict (project_id, user_id) do update set role = 'owner';
  return new;
end $$;

drop trigger if exists projects_add_owner on public.projects;
create trigger projects_add_owner after insert on public.projects
for each row execute function public.add_project_owner();

-- Backfill owner rows for existing projects.
insert into public.project_members (project_id, user_id, display_name, role)
select id, user_id, 'Owner', 'owner' from public.projects
on conflict (project_id, user_id) do update set role = 'owner';

-- Creates a project and the caller's owner membership (with their real name) in one transaction.
-- security definer: the caller has no membership yet, so they could not insert it under RLS.
create or replace function public.create_project(
  p_name text, p_description text, p_due_date date, p_display_name text, p_image_url text
) returns public.projects
language plpgsql security definer set search_path = public as $$
declare
  v_uid text := public.requesting_user_id();
  v_project public.projects;
begin
  if v_uid is null then
    raise exception 'You must be signed in' using errcode = '28000';
  end if;
  if coalesce(trim(p_name), '') = '' or length(trim(p_name)) > 200 then
    raise exception 'Project name must be 1-200 characters' using errcode = '22023';
  end if;
  if p_due_date is null then
    raise exception 'Due date is required' using errcode = '22023';
  end if;

  insert into public.projects (user_id, project_name, description, due_date)
  values (v_uid, trim(p_name), nullif(trim(p_description), ''), p_due_date)
  returning * into v_project;

  -- The trigger already added the owner row as 'Owner'; store the real name.
  update public.project_members
  set display_name = coalesce(nullif(trim(p_display_name), ''), 'Member'), image_url = p_image_url
  where project_id = v_project.id and user_id = v_uid;

  return v_project;
end $$;

------------------------------------------------------------------------------------------------------------
-- polls / poll_options / votes: constraints and defaults
------------------------------------------------------------------------------------------------------------
-- polls.project_id had no FK, so deleted projects left polls behind. Those are unreachable; remove them
-- (their options and votes cascade) before adding the FK.
delete from public.polls p
where p.project_id is null or not exists (select 1 from public.projects pr where pr.id = p.project_id);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'polls_project_id_fkey') then
    alter table public.polls add constraint polls_project_id_fkey
      foreign key (project_id) references public.projects (id) on update cascade on delete cascade;
  end if;
end $$;
alter table public.polls alter column project_id set not null;
create index if not exists polls_project_id_idx on public.polls (project_id);

-- createPoll()/vote() don't send user_id; the database fills it from the token.
alter table public.polls        alter column user_id set default public.requesting_user_id();
alter table public.poll_options alter column user_id set default public.requesting_user_id();
alter table public.votes        alter column user_id set default public.requesting_user_id();

-- One vote per user per poll: keep each user's newest vote, then add the constraint.
delete from public.votes v
using public.votes newer
where v.poll_id = newer.poll_id and v.user_id = newer.user_id
  and (v.created_at, v.id) < (newer.created_at, newer.id);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'votes_one_per_user') then
    alter table public.votes add constraint votes_one_per_user unique (poll_id, user_id);
  end if;
end $$;

------------------------------------------------------------------------------------------------------------
-- Column privileges: a member may only change their own name/avatar, never their role
-- (RLS decides which rows can be updated; this decides which columns).
------------------------------------------------------------------------------------------------------------
revoke update on public.project_members from anon, authenticated;
grant update (display_name, image_url) on public.project_members to anon, authenticated;

------------------------------------------------------------------------------------------------------------
-- RLS policies
------------------------------------------------------------------------------------------------------------
alter table public.projects        enable row level security;
alter table public.project_members enable row level security;
alter table public.polls           enable row level security;
alter table public.poll_options    enable row level security;
alter table public.votes           enable row level security;

-- Remove the old "own rows only" policies (recorded in supabase/existing_policies.sql).
drop policy if exists "users can create poll options"    on public.poll_options;
drop policy if exists "users can read options"           on public.poll_options;
drop policy if exists "users can create polls"           on public.polls;
drop policy if exists "users can read polls"             on public.polls;
drop policy if exists "users can create projects"        on public.projects;
drop policy if exists "users can delete projects"        on public.projects;
drop policy if exists "users can edit group assignments" on public.projects;
drop policy if exists "users can view their projects"    on public.projects;
drop policy if exists "users can add votes"              on public.votes;
drop policy if exists "users can read votes"             on public.votes;

-- projects
drop policy if exists projects_select on public.projects;
create policy projects_select on public.projects for select
  using (public.is_project_member(id));

drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects for insert
  with check (user_id = public.requesting_user_id());

drop policy if exists projects_update on public.projects;
create policy projects_update on public.projects for update
  -- user_id must stay the owner's own id, so ownership can't be handed to someone else by an update.
  using (public.is_project_owner(id))
  with check (public.is_project_owner(id) and user_id = public.requesting_user_id());

drop policy if exists projects_delete on public.projects;
create policy projects_delete on public.projects for delete
  using (public.is_project_owner(id));

-- project_members
drop policy if exists project_members_select on public.project_members;
create policy project_members_select on public.project_members for select
  using (public.is_project_member(project_id));

-- Owners add members (the API route runs as the owner). New rows are always plain members.
drop policy if exists project_members_insert on public.project_members;
create policy project_members_insert on public.project_members for insert
  with check (public.is_project_owner(project_id) and role = 'member');

-- Owner removes any non-owner; a member removes themselves (leave). The owner row only goes with the project.
drop policy if exists project_members_delete on public.project_members;
create policy project_members_delete on public.project_members for delete
  using (
    role = 'member'
    and (public.is_project_owner(project_id) or user_id = public.requesting_user_id())
  );

drop policy if exists project_members_update on public.project_members;
create policy project_members_update on public.project_members for update
  using (user_id = public.requesting_user_id()) with check (user_id = public.requesting_user_id());

-- polls
drop policy if exists polls_select on public.polls;
create policy polls_select on public.polls for select
  using (public.is_project_member(project_id));

drop policy if exists polls_insert on public.polls;
create policy polls_insert on public.polls for insert
  with check (public.is_project_member(project_id) and user_id = public.requesting_user_id());

drop policy if exists polls_delete on public.polls;
create policy polls_delete on public.polls for delete
  using (user_id = public.requesting_user_id() or public.is_project_owner(project_id));

-- poll_options: visible to project members; only the poll's author adds options. Deleted with the poll.
drop policy if exists poll_options_select on public.poll_options;
create policy poll_options_select on public.poll_options for select
  using (exists (
    select 1 from public.polls p where p.id = poll_id and public.is_project_member(p.project_id)
  ));

drop policy if exists poll_options_insert on public.poll_options;
create policy poll_options_insert on public.poll_options for insert
  with check (
    user_id = public.requesting_user_id()
    and exists (
      select 1 from public.polls p
      where p.id = poll_id and p.user_id = public.requesting_user_id() and public.is_project_member(p.project_id)
    )
  );

-- votes: everyone in the project sees all votes (needed for counts); you write only your own,
-- and only for an option that belongs to that poll.
drop policy if exists votes_select on public.votes;
create policy votes_select on public.votes for select
  using (exists (
    select 1 from public.polls p where p.id = poll_id and public.is_project_member(p.project_id)
  ));

drop policy if exists votes_insert on public.votes;
create policy votes_insert on public.votes for insert
  with check (
    user_id = public.requesting_user_id()
    and exists (
      select 1 from public.poll_options o join public.polls p on p.id = o.poll_id
      where o.id = poll_option_id and o.poll_id = votes.poll_id and public.is_project_member(p.project_id)
    )
  );

drop policy if exists votes_update on public.votes;
create policy votes_update on public.votes for update
  using (user_id = public.requesting_user_id())
  with check (
    user_id = public.requesting_user_id()
    and exists (
      select 1 from public.poll_options o join public.polls p on p.id = o.poll_id
      where o.id = poll_option_id and o.poll_id = votes.poll_id and public.is_project_member(p.project_id)
    )
  );

drop policy if exists votes_delete on public.votes;
create policy votes_delete on public.votes for delete
  using (user_id = public.requesting_user_id());
