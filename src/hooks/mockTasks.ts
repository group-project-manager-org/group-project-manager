/**
 * Mocks for src/lib/db/tasks.ts and comments.ts (NEXT_PUBLIC_USE_MOCKS=1).
 * Seed task ids are projectId * 100 + n, so mock notifications can link to them.
 */
import type { Actor, Comment, ID, Member, Subtask, Task, TaskPriority, TaskStatus } from '@/lib/types';
import { delay, me, ymdFromToday } from './mocks';

const tasksByProject = new Map<ID, Task[]>();
const commentsByTask = new Map<ID, Comment[]>();
let nextId = 100_000;
const newId = () => ++nextId;
const iso = (hoursAgo: number) => new Date(Date.now() - hoursAgo * 3_600_000).toISOString();

interface Seed {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due?: number;
  assignee?: number; // index into members
  creator: number; // index into members
  subtasks?: [string, boolean][];
  comments?: [number, string, number][]; // [member index, text, hours ago]
}

const SEEDS: Seed[] = [
  {
    title: 'Competitor research deck',
    description: 'Summarise the 3 main competitors: pricing, features, market share.',
    status: 'review',
    priority: 'high',
    due: 1,
    assignee: 1,
    creator: 0,
    subtasks: [['Collect pricing pages', true], ['Build comparison table', true], ['Write summary slide', false]],
    comments: [
      [2, 'Check slide 4 stats against the latest report before Friday', 3],
      [1, 'On it, pulling the Q3 numbers now.', 1],
    ],
  },
  { title: 'Draft introduction', status: 'in_progress', priority: 'medium', due: 4, assignee: 0, creator: 0, subtasks: [['Outline', true], ['First draft', false]] },
  { title: 'Find 5 academic sources', status: 'not_started', priority: 'medium', due: 6, assignee: 2, creator: 1 },
  { title: 'Book a group meeting room', status: 'done', priority: 'low', creator: 2, assignee: 2 },
  { title: 'Reference list (APA 7)', status: 'not_started', priority: 'low', due: 10, creator: 0 },
  { title: 'Proofread final report', description: 'Everyone reads one section.', status: 'not_started', priority: 'high', due: 12, creator: 1 },
];

function seed(projectId: ID, members: Member[], actor: Actor | null): Task[] {
  const people = members.length > 0 ? members : [{ ...me(actor), project_id: projectId, role: 'owner' as const, joined_at: iso(200) }];
  const pick = (i: number | undefined) => (i === undefined ? undefined : people[i % people.length]);

  return SEEDS.map((s, n) => {
    const id = projectId * 100 + n + 1;
    const creator = pick(s.creator)!;
    const comments: Comment[] = (s.comments ?? []).map(([who, content, hoursAgo]) => {
      const m = pick(who)!;
      return { id: newId(), task_id: id, user_id: m.user_id, user_name: m.display_name, content, created_at: iso(hoursAgo) };
    });
    commentsByTask.set(id, comments);
    return {
      id,
      project_id: projectId,
      title: s.title,
      description: s.description ?? null,
      status: s.status,
      priority: s.priority,
      due_date: s.due === undefined ? null : ymdFromToday(s.due),
      assignee_id: pick(s.assignee)?.user_id ?? null,
      created_by: creator.user_id,
      created_by_name: creator.display_name,
      position: n,
      created_at: iso(100 - n * 10),
      updated_at: iso(5),
      subtasks: (s.subtasks ?? []).map(([title, done], i) => ({ id: newId(), task_id: id, title, done, position: i })),
      comment_count: comments.length,
    };
  });
}

function tasks(projectId: ID, members: Member[], actor: Actor | null): Task[] {
  let list = tasksByProject.get(projectId);
  if (!list) {
    list = seed(projectId, members, actor);
    tasksByProject.set(projectId, list);
  }
  return list;
}

function findTask(taskId: ID): Task {
  for (const list of tasksByProject.values()) {
    const t = list.find((x) => x.id === taskId);
    if (t) return t;
  }
  throw new Error('Task not found.');
}

const copy = (t: Task): Task => ({ ...t, subtasks: t.subtasks.map((s) => ({ ...s })) });

export async function mockListTasks(projectId: ID, members: Member[], actor: Actor | null): Promise<Task[]> {
  await delay();
  return tasks(projectId, members, actor).map(copy);
}

export async function mockCreateTask(
  projectId: ID,
  input: { title: string; description?: string; priority?: TaskPriority; due_date?: string | null; assignee_id?: string | null },
  actor: Actor,
  members: Member[],
): Promise<Task> {
  await delay();
  if (input.assignee_id && !members.some((m) => m.user_id === input.assignee_id)) {
    throw new Error('assignee must be a project member');
  }
  const list = tasks(projectId, members, actor);
  const now = new Date().toISOString();
  const task: Task = {
    id: newId(),
    project_id: projectId,
    title: input.title,
    description: input.description ?? null,
    status: 'not_started',
    priority: input.priority ?? 'medium',
    due_date: input.due_date ?? null,
    assignee_id: input.assignee_id ?? null,
    created_by: actor.user_id,
    created_by_name: actor.display_name,
    position: list.length,
    created_at: now,
    updated_at: now,
    subtasks: [],
    comment_count: 0,
  };
  list.push(task);
  commentsByTask.set(task.id, []);
  return copy(task);
}

export async function mockUpdateTask(
  taskId: ID,
  patch: Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'due_date' | 'assignee_id' | 'position'>>,
): Promise<Task> {
  await delay(250);
  const t = findTask(taskId);
  Object.assign(t, patch, { updated_at: new Date().toISOString() });
  return copy(t);
}

export async function mockDeleteTask(taskId: ID): Promise<void> {
  await delay();
  for (const [pid, list] of tasksByProject) tasksByProject.set(pid, list.filter((t) => t.id !== taskId));
  commentsByTask.delete(taskId);
}

export async function mockAddSubtask(taskId: ID, title: string): Promise<Subtask> {
  await delay(200);
  const t = findTask(taskId);
  const s: Subtask = { id: newId(), task_id: taskId, title, done: false, position: t.subtasks.length };
  t.subtasks.push(s);
  return { ...s };
}

export async function mockToggleSubtask(subtaskId: ID, done: boolean): Promise<Subtask> {
  await delay(200);
  for (const list of tasksByProject.values())
    for (const t of list) {
      const s = t.subtasks.find((x) => x.id === subtaskId);
      if (s) {
        s.done = done;
        return { ...s };
      }
    }
  throw new Error('Subtask not found.');
}

export async function mockDeleteSubtask(subtaskId: ID): Promise<void> {
  await delay(200);
  for (const list of tasksByProject.values()) for (const t of list) t.subtasks = t.subtasks.filter((s) => s.id !== subtaskId);
}

export async function mockListComments(taskId: ID): Promise<Comment[]> {
  await delay();
  return (commentsByTask.get(taskId) ?? []).map((c) => ({ ...c }));
}

export async function mockAddComment(taskId: ID, content: string, actor: Actor): Promise<Comment> {
  await delay(200);
  const c: Comment = {
    id: newId(),
    task_id: taskId,
    user_id: actor.user_id,
    user_name: actor.display_name,
    content,
    created_at: new Date().toISOString(),
  };
  commentsByTask.set(taskId, [...(commentsByTask.get(taskId) ?? []), c]);
  const t = findTask(taskId);
  t.comment_count += 1;
  return { ...c };
}

export async function mockDeleteComment(commentId: ID, actor: Actor | null): Promise<void> {
  await delay(200);
  for (const [taskId, list] of commentsByTask) {
    const c = list.find((x) => x.id === commentId);
    if (!c) continue;
    if (c.user_id !== me(actor).user_id) throw new Error('You can only delete your own comments.');
    commentsByTask.set(taskId, list.filter((x) => x.id !== commentId));
    findTask(taskId).comment_count -= 1;
    return;
  }
}
