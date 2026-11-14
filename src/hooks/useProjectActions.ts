'use client';

import { useMemo } from 'react';
import { addMemberByEmail, searchUsers } from '@/lib/api';
import { removeMember } from '@/lib/db/members';
import { createProject, updateProject } from '@/lib/db/projects';
import { useSupabase } from '@/lib/supabaseClient';
import type { Actor, ID, Project } from '@/lib/types';
import { useActor } from './useActor';
import {
  USE_MOCKS,
  mockAddMemberByEmail,
  mockCreateProject,
  mockRemoveMember,
  mockSearchUsers,
  mockUpdateProject,
} from './mocks';

type ProjectInput = { project_name: string; description?: string; due_date: string };
type ProjectPatch = Partial<Pick<Project, 'project_name' | 'description' | 'due_date'>>;

/**
 * Project and member mutations, switching to mocks when NEXT_PUBLIC_USE_MOCKS=1.
 * Every function throws on failure (DbError / ApiError, both with a readable message).
 */
export function useProjectActions() {
  const sb = useSupabase();
  const actor = useActor();

  return useMemo(
    () => ({
      createProject: (input: ProjectInput, a: Actor) =>
        USE_MOCKS ? mockCreateProject(input, a) : createProject(sb, input, a),
      updateProject: (id: ID, patch: ProjectPatch) =>
        USE_MOCKS ? mockUpdateProject(id, patch) : updateProject(sb, id, patch),
      removeMember: (projectId: ID, userId: string) =>
        USE_MOCKS ? mockRemoveMember(projectId, userId, actor) : removeMember(sb, projectId, userId),
      addMemberByEmail: (projectId: ID, email: string) =>
        USE_MOCKS ? mockAddMemberByEmail(projectId, email) : addMemberByEmail(projectId, email),
      searchUsers: (q: string) => (USE_MOCKS ? mockSearchUsers(q) : searchUsers(q)),
    }),
    [sb, actor],
  );
}
