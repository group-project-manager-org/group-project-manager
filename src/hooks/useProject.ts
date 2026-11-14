'use client';

import { getProject } from '@/lib/db/projects';
import { useSupabase } from '@/lib/supabaseClient';
import type { ID } from '@/lib/types';
import { useActor } from './useActor';
import { useAsync } from './useAsync';
import { USE_MOCKS, mockGetProject } from './mocks';

/**
 * Loads one project (with members, progress and my_role).
 * `data` is null both while loading and when the project isn't found /
 * you aren't a member, so check `loading` first.
 */
export function useProject(id: ID | null) {
  const sb = useSupabase(); // stable identity since B2
  const actor = useActor();
  const ready = id !== null && (!USE_MOCKS || actor !== null);

  const state = useAsync(
    () => (USE_MOCKS ? mockGetProject(id as ID, actor) : getProject(sb, id as ID)),
    [sb, id, actor?.user_id],
    ready,
  );
  // Waiting on the user (mock mode) counts as loading, so the layout doesn't flash "not found".
  return { ...state, loading: state.loading || (id !== null && !ready) };
}
