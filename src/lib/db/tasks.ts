import type { SupabaseClient } from '@supabase/supabase-js';
import type { Actor, ID, Subtask, Task, TaskPriority } from '../types';
import { notImplemented } from './errors';

/** Ordered by position, then created_at. Includes subtasks and comment_count. */
export async function listTasks(sb: SupabaseClient, projectId: ID): Promise<Task[]> {
  return notImplemented('listTasks');
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
  return notImplemented('createTask');
}

export async function updateTask(
  sb: SupabaseClient,
  taskId: ID,
  patch: Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'due_date' | 'assignee_id' | 'position'>>,
): Promise<Task> {
  return notImplemented('updateTask');
}

export async function deleteTask(sb: SupabaseClient, taskId: ID): Promise<void> {
  return notImplemented('deleteTask');
}

export async function addSubtask(sb: SupabaseClient, taskId: ID, title: string): Promise<Subtask> {
  return notImplemented('addSubtask');
}

export async function toggleSubtask(sb: SupabaseClient, subtaskId: ID, done: boolean): Promise<Subtask> {
  return notImplemented('toggleSubtask');
}

export async function deleteSubtask(sb: SupabaseClient, subtaskId: ID): Promise<void> {
  return notImplemented('deleteSubtask');
}
