-- RLS policies on the live database before 0001_core.sql (exported 2026-11-14).
-- Record only: do NOT run this file. 0001 replaces these policies.
-- RLS was enabled on: comments, poll_options, polls, projects, votes.
-- Note: no policies existed for `comments` (so it was fully locked) or for votes update/delete.

create policy "users can create poll options" on public.poll_options as PERMISSIVE for INSERT to public with check ((user_id = (auth.jwt() ->> 'sub'::text)));
create policy "users can read options" on public.poll_options as PERMISSIVE for SELECT to public using ((user_id = (auth.jwt() ->> 'sub'::text)));
create policy "users can create polls" on public.polls as PERMISSIVE for INSERT to public with check ((user_id = (auth.jwt() ->> 'sub'::text)));
create policy "users can read polls" on public.polls as PERMISSIVE for SELECT to public using ((user_id = (auth.jwt() ->> 'sub'::text)));
create policy "users can create projects" on public.projects as PERMISSIVE for INSERT to public with check ((user_id = (auth.jwt() ->> 'sub'::text)));
create policy "users can delete projects" on public.projects as PERMISSIVE for DELETE to public using ((user_id = (auth.jwt() ->> 'sub'::text)));
create policy "users can edit group assignments" on public.projects as PERMISSIVE for UPDATE to public using ((user_id = (auth.jwt() ->> 'sub'::text))) with check ((user_id = (auth.jwt() ->> 'sub'::text)));
create policy "users can view their projects" on public.projects as PERMISSIVE for SELECT to public using ((user_id = (auth.jwt() ->> 'sub'::text)));
create policy "users can add votes" on public.votes as PERMISSIVE for INSERT to public with check ((user_id = (auth.jwt() ->> 'sub'::text)));
create policy "users can read votes" on public.votes as PERMISSIVE for SELECT to public using ((user_id = (auth.jwt() ->> 'sub'::text)));
