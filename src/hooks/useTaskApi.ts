'use client';

import { useMemo } from 'react';
import { useProjectContext } from '@/components/project/ProjectContext';
import { addComment, deleteComment, listComments } from '@/lib/db/comments';
import {
  addSubtask,
  createTask,
  deleteSubtask,
  deleteTask,
  listTasks,
  toggleSubtask,
  updateTask,
} from '@/lib/db/tasks';
import { useSupabase } from '@/lib/supabaseClient';
import type { Actor, ID, Task, TaskPriority } from '@/lib/types';
import { useActor } from './useActor';
import { USE_MOCKS } from './mocks';
import * as m from './mockTasks';

export type TaskInput = {
  title: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string | null;
  assignee_id?: string | null;
};
export type TaskPatch = Partial<
  Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'due_date' | 'assignee_id' | 'position'>
>;

/** Task, subtask and comment calls for the current project (mocked when NEXT_PUBLIC_USE_MOCKS=1). */
export function useTaskApi() {
  const sb = useSupabase();
  const actor = useActor();
  const { project, members } = useProjectContext();

  return useMemo(
    () => ({
      listTasks: () => (USE_MOCKS ? m.mockListTasks(project.id, members, actor) : listTasks(sb, project.id)),
      createTask: (input: TaskInput, a: Actor) =>
        USE_MOCKS ? m.mockCreateTask(project.id, input, a, members) : createTask(sb, project.id, input, a),
      updateTask: (id: ID, patch: TaskPatch) => (USE_MOCKS ? m.mockUpdateTask(id, patch) : updateTask(sb, id, patch)),
      deleteTask: (id: ID) => (USE_MOCKS ? m.mockDeleteTask(id) : deleteTask(sb, id)),
      addSubtask: (taskId: ID, title: string) => (USE_MOCKS ? m.mockAddSubtask(taskId, title) : addSubtask(sb, taskId, title)),
      toggleSubtask: (id: ID, done: boolean) => (USE_MOCKS ? m.mockToggleSubtask(id, done) : toggleSubtask(sb, id, done)),
      deleteSubtask: (id: ID) => (USE_MOCKS ? m.mockDeleteSubtask(id) : deleteSubtask(sb, id)),
      listComments: (taskId: ID) => (USE_MOCKS ? m.mockListComments(taskId) : listComments(sb, taskId)),
      addComment: (taskId: ID, content: string, a: Actor) =>
        USE_MOCKS ? m.mockAddComment(taskId, content, a) : addComment(sb, taskId, content, a),
      deleteComment: (id: ID) => (USE_MOCKS ? m.mockDeleteComment(id, actor) : deleteComment(sb, id)),
    }),
    [sb, actor, project.id, members],
  );
}
