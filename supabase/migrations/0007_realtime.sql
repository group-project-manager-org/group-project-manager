-- 0007_realtime.sql (B10): publish project tables to Supabase Realtime. Idempotent. Run after 0006.
-- Realtime applies each subscriber's RLS to INSERT/UPDATE events, so members only receive their projects' rows.
-- DELETE events carry only the primary key (default replica identity), so they reveal no content.

do $$
declare t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  foreach t in array array['tasks', 'subtasks', 'comments', 'notes', 'polls', 'votes', 'files'] loop
    if not exists (
      select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
