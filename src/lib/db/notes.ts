import type { SupabaseClient } from '@supabase/supabase-js';
import type { Actor, ID, Note, NoteColor } from '../types';
import { DbError, toDbError } from './errors';

/** Pinned first, then newest. */
export async function listNotes(sb: SupabaseClient, projectId: ID): Promise<Note[]> {
  const { data, error } = await sb
    .from('notes')
    .select('*')
    .eq('project_id', projectId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw toDbError(error);
  return data as Note[];
}

export async function createNote(
  sb: SupabaseClient,
  projectId: ID,
  input: { content: string; color?: NoteColor },
  actor: Actor,
): Promise<Note> {
  const { data, error } = await sb
    .from('notes')
    .insert({ project_id: projectId, content: input.content.trim(), color: input.color, user_name: actor.display_name })
    .select()
    .single();
  if (error) throw toDbError(error);
  return data as Note;
}

/** Author edits content/color; any member toggles pinned (enforced in the DB). */
export async function updateNote(
  sb: SupabaseClient,
  noteId: ID,
  patch: Partial<Pick<Note, 'content' | 'color' | 'pinned'>>,
): Promise<Note> {
  const body = patch.content === undefined ? patch : { ...patch, content: patch.content.trim() };
  const { data, error } = await sb.from('notes').update(body).eq('id', noteId).select().maybeSingle();
  if (error) throw toDbError(error);
  if (!data) throw new DbError('Note not found', 'NOT_FOUND');
  return data as Note;
}

/** Author or project owner (RLS). */
export async function deleteNote(sb: SupabaseClient, noteId: ID): Promise<void> {
  const { data, error } = await sb.from('notes').delete().eq('id', noteId).select('id');
  if (error) throw toDbError(error);
  if (!data || data.length === 0) throw new DbError('Note not found, or only its author or the owner can delete it', 'NOT_FOUND');
}
