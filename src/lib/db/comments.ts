import type { SupabaseClient } from '@supabase/supabase-js';
import type { Actor, Comment, ID } from '../types';
import { DbError, toDbError } from './errors';

/** Oldest first. */
export async function listComments(sb: SupabaseClient, taskId: ID): Promise<Comment[]> {
  const { data, error } = await sb
    .from('comments')
    .select('id, task_id, user_id, user_name, content, created_at')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true });
  if (error) throw toDbError(error);
  return data as Comment[];
}

export async function addComment(sb: SupabaseClient, taskId: ID, content: string, actor: Actor): Promise<Comment> {
  const { data, error } = await sb
    .from('comments')
    .insert({ task_id: taskId, content: content.trim(), user_name: actor.display_name })
    .select('id, task_id, user_id, user_name, content, created_at')
    .single();
  if (error) throw toDbError(error);
  return data as Comment;
}

/** Author only (RLS). */
export async function deleteComment(sb: SupabaseClient, commentId: ID): Promise<void> {
  const { data, error } = await sb.from('comments').delete().eq('id', commentId).select('id');
  if (error) throw toDbError(error);
  if (!data || data.length === 0) throw new DbError('Comment not found, or only its author can delete it', 'NOT_FOUND');
}
