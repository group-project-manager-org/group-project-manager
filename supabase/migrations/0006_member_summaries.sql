-- 0006_member_summaries.sql (B9): 1-hour cache for AI member summaries. Idempotent. Run after 0005.
-- Written only by POST /api/projects/[id]/summary with the service key; members can read their project's row.

create table if not exists public.member_summaries (
  project_id   bigint primary key references public.projects (id) on delete cascade,
  generated_at timestamptz not null default now(),
  payload      jsonb not null
);

revoke insert, update, delete on public.member_summaries from anon, authenticated;

alter table public.member_summaries enable row level security;

drop policy if exists member_summaries_select on public.member_summaries;
create policy member_summaries_select on public.member_summaries for select
  using (public.is_project_member(project_id));
