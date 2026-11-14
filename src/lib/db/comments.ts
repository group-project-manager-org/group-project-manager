import type { SupabaseClient } from '@supabase/supabase-js';
import type { Actor, Comment, ID } from '../types';
import { notImplemented } from './errors';

/** Oldest first. */
export async function listComments(sb: SupabaseClient, taskId: ID): Promise<Comment[]> {
  return notImplemented('listComments');
}

export async function addComment(sb: SupabaseClient, taskId: ID, content: string, actor: Actor): Promise<Comment> {
  return notImplemented('addComment');
}

/** Author only (RLS). */
export async function deleteComment(sb: SupabaseClient, commentId: ID): Promise<void> {
  return notImplemented('deleteComment');
}
