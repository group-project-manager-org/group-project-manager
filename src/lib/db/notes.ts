import type { SupabaseClient } from '@supabase/supabase-js';
import type { Actor, ID, Note, NoteColor } from '../types';
import { notImplemented } from './errors';

/** Pinned first, then newest. */
export async function listNotes(sb: SupabaseClient, projectId: ID): Promise<Note[]> {
  return notImplemented('listNotes');
}

export async function createNote(
  sb: SupabaseClient,
  projectId: ID,
  input: { content: string; color?: NoteColor },
  actor: Actor,
): Promise<Note> {
  return notImplemented('createNote');
}

export async function updateNote(
  sb: SupabaseClient,
  noteId: ID,
  patch: Partial<Pick<Note, 'content' | 'color' | 'pinned'>>,
): Promise<Note> {
  return notImplemented('updateNote');
}

export async function deleteNote(sb: SupabaseClient, noteId: ID): Promise<void> {
  return notImplemented('deleteNote');
}
