'use client';

import { useMemo } from 'react';
import { useProjectContext } from '@/components/project/ProjectContext';
import { createPoll, deletePoll, listPolls, vote } from '@/lib/db/polls';
import { useSupabase } from '@/lib/supabaseClient';
import type { ID } from '@/lib/types';
import { useActor } from './useActor';
import { USE_MOCKS } from './mocks';
import * as m from './mockPolls';

/** Poll calls for the current project (mocked when NEXT_PUBLIC_USE_MOCKS=1). */
export function usePollApi() {
  const sb = useSupabase();
  const actor = useActor();
  const { project, members } = useProjectContext();

  return useMemo(
    () => ({
      listPolls: () =>
        USE_MOCKS ? m.mockListPolls(project.id, members, actor) : listPolls(sb, project.id, actor?.user_id ?? ''),
      createPoll: (question: string, options: string[]) =>
        USE_MOCKS ? m.mockCreatePoll(project.id, question, options, members, actor) : createPoll(sb, project.id, question, options),
      vote: (pollId: ID, optionId: ID) => (USE_MOCKS ? m.mockVote(pollId, optionId, actor) : vote(sb, pollId, optionId)),
      deletePoll: (pollId: ID) => (USE_MOCKS ? m.mockDeletePoll(pollId) : deletePoll(sb, pollId)),
    }),
    [sb, actor, project.id, members],
  );
}
