import type { SupabaseClient } from '@supabase/supabase-js';
import type { Actor, ID, Subtask, Task, TaskPriority } from '../types';
import { DbError, toDbError } from './errors';

const TASK_SELECT = '*, subtasks(*), comments(count)';

type TaskRow = Omit<Task, 'subtasks' | 'comment_count'> & {
  subtasks: Subtask[];
  comments: { count: number }[];
};

function toTask({ comments, subtasks, ...row }: TaskRow): Task {
  return {
    ...row,
    subtasks: [...subtasks].sort((a, b) => a.position - b.position || a.id - b.id),
    comment_count: comments[0]?.count ?? 0,
  };
}

/** Ordered by position, then created_at. Includes subtasks and comment_count. */
export async function listTasks(sb: SupabaseClient, projectId: ID): Promise<Task[]> {
  const { data, error } = await sb
    .from('tasks')
    .select(TASK_SELECT)
    .eq('project_id', projectId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw toDbError(error);
  return (data as TaskRow[]).map(toTask);
}

export async function createTask(
  sb: SupabaseClient,
  projectId: ID,
  input: {
    title: string;
    description?: string;
    priority?: TaskPriority;
    due_date?: string | null;
    assignee_id?: string | null;
  },
  actor: Actor,
): Promise<Task> {
  const { data, error } = await sb
    .from('tasks')
    .insert({ ...input, title: input.title.trim(), project_id: projectId, created_by_name: actor.display_name })
    .select(TASK_SELECT)
    .single();
  if (error) throw toDbError(error);
  return toTask(data as TaskRow);
}

export async function updateTask(
  sb: SupabaseClient,
  taskId: ID,
  patch: Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'due_date' | 'assignee_id' | 'position'>>,
): Promise<Task> {
  const { data, error } = await sb.from('tasks').update(patch).eq('id', taskId).select(TASK_SELECT).maybeSingle();
  if (error) throw toDbError(error);
  if (!data) throw new DbError('Task not found', 'NOT_FOUND');
  return toTask(data as TaskRow);
}

/** Creator or project owner (RLS). */
export async function deleteTask(sb: SupabaseClient, taskId: ID): Promise<void> {
  const { data, error } = await sb.from('tasks').delete().eq('id', taskId).select('id');
  if (error) throw toDbError(error);
  if (!data || data.length === 0) throw new DbError('Task not found, or only its creator or the owner can delete it', 'NOT_FOUND');
}

/** Appends to the end of the task's checklist. */
export async function addSubtask(sb: SupabaseClient, taskId: ID, title: string): Promise<Subtask> {
  const { data: last, error: lastErr } = await sb
    .from('subtasks')
    .select('position')
    .eq('task_id', taskId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastErr) throw toDbError(lastErr);
  const { data, error } = await sb
    .from('subtasks')
    .insert({ task_id: taskId, title: title.trim(), position: (last?.position ?? -1) + 1 })
    .select()
    .single();
  if (error) throw toDbError(error);
  return data as Subtask;
}

export async function toggleSubtask(sb: SupabaseClient, subtaskId: ID, done: boolean): Promise<Subtask> {
  const { data, error } = await sb.from('subtasks').update({ done }).eq('id', subtaskId).select().maybeSingle();
  if (error) throw toDbError(error);
  if (!data) throw new DbError('Subtask not found', 'NOT_FOUND');
  return data as Subtask;
}

export async function deleteSubtask(sb: SupabaseClient, subtaskId: ID): Promise<void> {
  const { data, error } = await sb.from('subtasks').delete().eq('id', subtaskId).select('id');
  if (error) throw toDbError(error);
  if (!data || data.length === 0) throw new DbError('Subtask not found', 'NOT_FOUND');
}
