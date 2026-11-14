'use client';

import { useMemo } from 'react';
import { useProjectContext } from '@/components/project/ProjectContext';
import { createNote, deleteNote, listNotes, updateNote } from '@/lib/db/notes';
import { useSupabase } from '@/lib/supabaseClient';
import type { Actor, ID, Note, NoteColor } from '@/lib/types';
import { useActor } from './useActor';
import { USE_MOCKS } from './mocks';
import * as m from './mockNotes';

type NotePatch = Partial<Pick<Note, 'content' | 'color' | 'pinned'>>;

/** Note calls for the current project (mocked when NEXT_PUBLIC_USE_MOCKS=1). */
export function useNoteApi() {
  const sb = useSupabase();
  const actor = useActor();
  const { project, members } = useProjectContext();

  return useMemo(
    () => ({
      listNotes: () => (USE_MOCKS ? m.mockListNotes(project.id, members, actor) : listNotes(sb, project.id)),
      createNote: (input: { content: string; color?: NoteColor }, a: Actor) =>
        USE_MOCKS ? m.mockCreateNote(project.id, input, a, members) : createNote(sb, project.id, input, a),
      updateNote: (id: ID, patch: NotePatch) => (USE_MOCKS ? m.mockUpdateNote(id, patch, actor) : updateNote(sb, id, patch)),
      deleteNote: (id: ID) => (USE_MOCKS ? m.mockDeleteNote(id) : deleteNote(sb, id)),
    }),
    [sb, actor, project.id, members],
  );
}
