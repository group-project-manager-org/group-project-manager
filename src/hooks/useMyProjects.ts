'use client';

import { deleteProject, listMyProjects } from '@/lib/db/projects';
import { useSupabase } from '@/lib/supabaseClient';
import type { ID } from '@/lib/types';
import { useActor } from './useActor';
import { useAsync } from './useAsync';
import { USE_MOCKS, mockDeleteProject, mockListMyProjects } from './mocks';

/** The current user's projects (sorted by due date) plus a delete action. */
export function useMyProjects() {
  // Not a dependency on purpose: useSupabase() returns a new client every render.
  const sb = useSupabase();
  const actor = useActor();

  const state = useAsync(
    () => (USE_MOCKS ? mockListMyProjects(actor) : listMyProjects(sb)),
    [actor?.user_id],
    actor !== null,
  );

  /** Deletes on the server, then removes it from the list (no reload). Throws on failure. */
  async function remove(id: ID) {
    await (USE_MOCKS ? mockDeleteProject(id) : deleteProject(sb, id));
    state.setData((prev) => prev?.filter((p) => p.id !== id) ?? prev);
  }

  // Still "loading" while Clerk resolves the user, so the page doesn't flash the empty state.
  return { ...state, loading: state.loading || actor === null, remove };
}
