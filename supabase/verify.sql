-- verify.sql: run in the Supabase SQL editor after each migration. Returns one table; every row should be PASS.
-- Changes nothing: the behaviour tests run inside a block that rolls itself back.
-- Covers migrations up to 0004 (B7). Later migrations add their own checks here.

create temp table if not exists _verify (n serial, check_name text, ok boolean, detail text);
truncate _verify;

-- Tables exist and have RLS on
insert into _verify (check_name, ok)
select 'rls on: ' || t, coalesce((select c.relrowsecurity from pg_class c where c.oid = to_regclass('public.' || t)), false)
from unnest(array['projects', 'project_members', 'polls', 'poll_options', 'votes', 'comments', 'tasks', 'subtasks', 'notes', 'files']) t;

-- Functions exist
insert into _verify (check_name, ok)
select 'function: ' || f, to_regprocedure(f) is not null
from unnest(array[
  'public.requesting_user_id()',
  'public.is_project_member(bigint)',
  'public.is_project_owner(bigint)',
  'public.create_project(text,text,date,text,text)'
]) f;

-- Expected policies are present
insert into _verify (check_name, ok)
select 'policy: ' || e.tbl || '.' || e.pol,
       exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = e.tbl and p.policyname = e.pol)
from (values
  ('projects', 'projects_select'), ('projects', 'projects_insert'), ('projects', 'projects_update'), ('projects', 'projects_delete'),
  ('project_members', 'project_members_select'), ('project_members', 'project_members_insert'),
  ('project_members', 'project_members_update'), ('project_members', 'project_members_delete'),
  ('polls', 'polls_select'), ('polls', 'polls_insert'), ('polls', 'polls_delete'),
  ('poll_options', 'poll_options_select'), ('poll_options', 'poll_options_insert'),
  ('votes', 'votes_select'), ('votes', 'votes_insert'), ('votes', 'votes_update'), ('votes', 'votes_delete'),
  ('tasks', 'tasks_select'), ('tasks', 'tasks_insert'), ('tasks', 'tasks_update'), ('tasks', 'tasks_delete'),
  ('subtasks', 'subtasks_all'),
  ('comments', 'comments_select'), ('comments', 'comments_insert'), ('comments', 'comments_delete'),
  ('notes', 'notes_select'), ('notes', 'notes_insert'), ('notes', 'notes_update'), ('notes', 'notes_delete'),
  ('files', 'files_select'), ('files', 'files_insert'), ('files', 'files_delete')
) as e (tbl, pol);

-- The old "own rows only" policies are gone
insert into _verify (check_name, ok, detail)
select 'old policies removed', count(*) = 0, string_agg(tablename || '.' || policyname, ', ')
from pg_policies
where schemaname = 'public' and tablename in ('projects', 'polls', 'poll_options', 'votes')
  and policyname like 'users can %';

-- Constraints and data invariants
insert into _verify (check_name, ok)
values
  ('constraint: polls_project_id_fkey', exists (select 1 from pg_constraint where conname = 'polls_project_id_fkey')),
  ('constraint: votes_one_per_user',    exists (select 1 from pg_constraint where conname = 'votes_one_per_user')),
  ('trigger: projects_add_owner',       exists (select 1 from pg_trigger where tgname = 'projects_add_owner')),
  ('trigger: tasks_check_assignee',     exists (select 1 from pg_trigger where tgname = 'tasks_check_assignee')),
  ('constraint: comments_task_id_fkey', exists (select 1 from pg_constraint where conname = 'comments_task_id_fkey')),
  ('trigger: notes_check_update',      exists (select 1 from pg_trigger where tgname = 'notes_check_update')),
  ('bucket: project-files is private',  exists (select 1 from storage.buckets where id = 'project-files' and not public)),
  ('storage policies: project-files',
     (select count(*) = 3 from pg_policies where schemaname = 'storage' and tablename = 'objects'
        and policyname in ('project_files_select', 'project_files_insert', 'project_files_delete'))),
  ('view: project_progress',            to_regclass('public.project_progress') is not null),
  ('every project has an owner row',
     not exists (select 1 from public.projects p
                 where not exists (select 1 from public.project_members m
                                   where m.project_id = p.id and m.role = 'owner' and m.user_id = p.user_id))),
  ('no duplicate votes',
     not exists (select 1 from public.votes group by poll_id, user_id having count(*) > 1));

-- Behaviour: a fake owner, member and stranger act on a throwaway project; everything is rolled back.
do $$
declare
  v_pid bigint; v_poll bigint; v_opt bigint; v_rpc public.projects;
  member_sees_project int; member_sees_poll int; member_deleted int; member_vote_ok boolean := false;
  second_vote_blocked boolean := false; role_escalation_blocked boolean := false;
  stranger_rows int; stranger_insert_blocked boolean := false;
  rpc_owner_ok boolean; err text;
begin
  begin
    -- Setup as the SQL editor's admin role (bypasses RLS)
    insert into public.projects (user_id, project_name, due_date)
      values ('verify_owner', 'verify', current_date) returning id into v_pid;
    insert into public.project_members (project_id, user_id, display_name, role)
      values (v_pid, 'verify_member', 'Verify Member', 'member');
    insert into public.polls (project_id, question, user_id)
      values (v_pid, 'verify?', 'verify_owner') returning id into v_poll;
    insert into public.poll_options (poll_id, option_name, user_id)
      values (v_poll, 'yes', 'verify_owner') returning id into v_opt;

    -- As the member
    perform set_config('request.jwt.claims', '{"sub":"verify_member","role":"authenticated"}', true);
    execute 'set local role authenticated';
    select count(*) into member_sees_project from public.projects where id = v_pid;
    select count(*) into member_sees_poll from public.polls where id = v_poll;
    delete from public.projects where id = v_pid;
    get diagnostics member_deleted = row_count;
    insert into public.votes (poll_id, poll_option_id) values (v_poll, v_opt);
    member_vote_ok := true;
    begin
      insert into public.votes (poll_id, poll_option_id) values (v_poll, v_opt);
    exception when unique_violation then second_vote_blocked := true;
    end;
    begin
      update public.project_members set role = 'owner' where project_id = v_pid and user_id = 'verify_member';
    exception when insufficient_privilege then role_escalation_blocked := true;
    end;
    -- create_project RPC makes the caller the owner
    v_rpc := public.create_project('verify rpc', null, current_date, 'Verify Member', null);
    select exists (select 1 from public.project_members
                   where project_id = v_rpc.id and user_id = 'verify_member' and role = 'owner'
                     and display_name = 'Verify Member')
      into rpc_owner_ok;
    execute 'reset role';

    -- As a stranger (member of nothing): sees no rows anywhere, cannot write into the project
    perform set_config('request.jwt.claims', '{"sub":"verify_stranger","role":"authenticated"}', true);
    execute 'set local role authenticated';
    select (select count(*) from public.projects) + (select count(*) from public.project_members)
         + (select count(*) from public.polls) + (select count(*) from public.poll_options)
         + (select count(*) from public.votes) + (select count(*) from public.tasks)
         + (select count(*) from public.comments) + (select count(*) from public.notes)
         + (select count(*) from public.files)
      into stranger_rows;
    begin
      insert into public.polls (project_id, question) values (v_pid, 'hijack');
    exception when insufficient_privilege then stranger_insert_blocked := true;
    end;
    execute 'reset role';

    raise exception using errcode = 'VR001', message = 'rollback verify data';
  exception
    when sqlstate 'VR001' then null;  -- expected: undoes all test data
    when others then err := sqlerrm;
  end;

  insert into _verify (check_name, ok, detail) values
    ('behaviour test ran without errors',     err is null, err),
    ('member can read the project',           member_sees_project = 1, null),
    ('member can read its polls',             member_sees_poll = 1, null),
    ('member cannot delete the project',      member_deleted = 0, null),
    ('member can vote',                       member_vote_ok, null),
    ('second vote in same poll is rejected',  second_vote_blocked, null),
    ('member cannot make themselves owner',   role_escalation_blocked, null),
    ('create_project makes caller the owner', coalesce(rpc_owner_ok, false), null),
    ('stranger sees 0 rows in every table',   stranger_rows = 0, 'rows seen: ' || stranger_rows),
    ('stranger cannot add a poll',            stranger_insert_blocked, null);
end $$;

select case when ok then 'PASS' else 'FAIL' end as result, check_name, detail
from _verify order by ok, n;
