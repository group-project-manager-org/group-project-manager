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
  // useSupabase() returns a new client every render, so it must NOT be a
  // dependency; useAsync always calls the latest closure anyway.
  const sb = useSupabase();
  const actor = useActor();
  const ready = id !== null && (!USE_MOCKS || actor !== null);

  return useAsync(
    () => (USE_MOCKS ? mockGetProject(id as ID, actor) : getProject(sb, id as ID)),
    [id, actor?.user_id],
    ready,
  );
}
