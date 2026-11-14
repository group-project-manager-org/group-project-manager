import type { SupabaseClient } from '@supabase/supabase-js';
import type { Actor, ID, Member, MemberRole, Project, ProjectSummary } from '../types';
import { DbError, toDbError } from './errors';

type ProjectRow = Project & { members: Member[] };

const SUMMARY_SELECT = '*, members:project_members(*)';

/** The Clerk user id Supabase sees for this client's token. */
export async function currentUserId(sb: SupabaseClient): Promise<string> {
  const { data, error } = await sb.rpc('requesting_user_id');
  if (error) throw toDbError(error);
  if (!data) throw new DbError('You must be signed in', 'NOT_AUTHENTICATED');
  return data as string;
}

type Progress = { project_id: ID; task_total: number; task_done: number; progress: number };

/** project_progress is a view, which PostgREST can't embed, so it's a second query. */
async function progressFor(sb: SupabaseClient, ids: ID[]): Promise<Map<ID, Progress>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await sb.from('project_progress').select('*').in('project_id', ids);
  if (error) throw toDbError(error);
  return new Map((data as Progress[]).map((p) => [p.project_id, p]));
}

function toSummary(row: ProjectRow, userId: string, progress?: Progress): ProjectSummary {
  const { members, ...project } = row;
  const sorted = [...members].sort(
    (a, b) => (a.role === b.role ? a.joined_at.localeCompare(b.joined_at) : a.role === 'owner' ? -1 : 1),
  );
  const myRole: MemberRole = members.find((m) => m.user_id === userId)?.role ?? 'member';
  return {
    ...project,
    members: sorted,
    task_total: progress?.task_total ?? 0,
    task_done: progress?.task_done ?? 0,
    progress: progress?.progress ?? 0,
    my_role: myRole,
  };
}

/** Projects the current user is a member of, sorted by due_date ascending. */
export async function listMyProjects(sb: SupabaseClient): Promise<ProjectSummary[]> {
  const me = await currentUserId(sb);
  // `mine` is an inner join on the caller's own membership: an explicit filter on top of RLS.
  const { data, error } = await sb
    .from('projects')
    .select(`${SUMMARY_SELECT}, mine:project_members!inner(user_id)`)
    .eq('mine.user_id', me)
    .order('due_date', { ascending: true });
  if (error) throw toDbError(error);
  const rows = (data as (ProjectRow & { mine: unknown })[]).map(({ mine: _mine, ...row }) => row);
  const progress = await progressFor(sb, rows.map((r) => r.id));
  return rows.map((row) => toSummary(row, me, progress.get(row.id)));
}

/** null when the project doesn't exist or the caller isn't a member. */
export async function getProject(sb: SupabaseClient, id: ID): Promise<ProjectSummary | null> {
  const me = await currentUserId(sb);
  const { data, error } = await sb.from('projects').select(SUMMARY_SELECT).eq('id', id).maybeSingle();
  if (error) throw toDbError(error);
  if (!data) return null;
  const progress = await progressFor(sb, [id]);
  return toSummary(data as ProjectRow, me, progress.get(id));
}

export async function createProject(
  sb: SupabaseClient,
  input: { project_name: string; description?: string; due_date: string },
  actor: Actor,
): Promise<Project> {
  const { data, error } = await sb.rpc('create_project', {
    p_name: input.project_name,
    p_description: input.description ?? null,
    p_due_date: input.due_date,
    p_display_name: actor.display_name,
    p_image_url: actor.image_url,
  });
  if (error) throw toDbError(error);
  return data as Project;
}

export async function updateProject(
  sb: SupabaseClient,
  id: ID,
  patch: Partial<Pick<Project, 'project_name' | 'description' | 'due_date'>>,
): Promise<Project> {
  const { data, error } = await sb.from('projects').update(patch).eq('id', id).select().maybeSingle();
  if (error) throw toDbError(error);
  if (!data) throw new DbError('Project not found, or only the owner can edit it', 'NOT_FOUND');
  return data as Project;
}

/** Owner only (RLS). Cascades to members, tasks, notes, polls, files. */
export async function deleteProject(sb: SupabaseClient, id: ID): Promise<void> {
  const { data, error } = await sb.from('projects').delete().eq('id', id).select('id');
  if (error) throw toDbError(error);
  if (!data || data.length === 0) throw new DbError('Project not found, or only the owner can delete it', 'NOT_FOUND');
}
