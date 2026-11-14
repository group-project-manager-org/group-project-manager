/**
 * Frontend-only mock data, used while backend functions still throw
 * NOT_IMPLEMENTED. Enabled with NEXT_PUBLIC_USE_MOCKS=1 in .env.local.
 * Delete each mock once the matching src/lib/db function is implemented.
 *
 * Data lives in memory, so changes (e.g. deleting a project) last until a
 * full page refresh.
 */
import { ApiError, type UserSearchResult } from '@/lib/api';
import type { Actor, ID, Member, Project, ProjectSummary } from '@/lib/types';

export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === '1';

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));
const DAY = 86_400_000;

function ymdFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const OTHERS = [
  { user_id: 'mock_maya', display_name: 'Maya Chen' },
  { user_id: 'mock_jordan', display_name: 'Jordan Lee' },
  { user_id: 'mock_alex', display_name: 'Alex Rivera' },
  { user_id: 'mock_sam', display_name: 'Sam Patel' },
];

function me(actor: Actor | null) {
  return {
    user_id: actor?.user_id ?? 'mock_me',
    display_name: actor?.display_name ?? 'You',
    image_url: actor?.image_url ?? null,
  };
}

interface Seed {
  name: string;
  dueInDays: number;
  othersCount: number;
  iAmOwner: boolean;
  tasks: [done: number, total: number];
}

const SEEDS: Seed[] = [
  { name: 'Cybersecurity Assignment 1', dueInDays: 1, othersCount: 4, iAmOwner: true, tasks: [5, 8] },
  { name: 'Marketing Strategy Report', dueInDays: 6, othersCount: 2, iAmOwner: false, tasks: [2, 10] },
  { name: 'Database Design Project', dueInDays: 20, othersCount: 1, iAmOwner: true, tasks: [0, 0] },
  { name: 'Ethics Case Study', dueInDays: -3, othersCount: 3, iAmOwner: true, tasks: [6, 7] },
];

function buildProject(id: ID, seed: Seed, actor: Actor | null): ProjectSummary {
  const joined = new Date(Date.now() - 7 * DAY).toISOString();
  const self = me(actor);
  const others = OTHERS.slice(0, seed.othersCount);
  const owner = seed.iAmOwner ? self : { ...others[0], image_url: null };
  const members: Member[] = [
    { project_id: id, ...owner, role: 'owner', joined_at: joined },
    ...[self, ...others.map((o) => ({ ...o, image_url: null }))]
      .filter((p) => p.user_id !== owner.user_id)
      .map((p) => ({ project_id: id, ...p, role: 'member' as const, joined_at: joined })),
  ];
  const [done, total] = seed.tasks;
  return {
    id,
    user_id: owner.user_id,
    project_name: seed.name,
    description: null,
    due_date: ymdFromToday(seed.dueInDays),
    created_at: joined,
    members,
    task_total: total,
    task_done: done,
    progress: total === 0 ? 0 : Math.round((done / total) * 100),
    my_role: seed.iAmOwner ? 'owner' : 'member',
  };
}

let store: ProjectSummary[] | null = null;
function projects(actor: Actor | null): ProjectSummary[] {
  if (!store) store = SEEDS.map((s, i) => buildProject(i + 1, s, actor));
  return store;
}

/** Mock for listMyProjects: sorted by due_date ascending. */
export async function mockListMyProjects(actor: Actor | null): Promise<ProjectSummary[]> {
  await delay();
  // Copies, so React sees new objects after a mock mutation.
  return projects(actor)
    .map((p) => ({ ...p }))
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
}

/**
 * Mock for getProject. Ids 1–4 match the home page; any other id gets a
 * generic project, except 404 which returns null (to test "not found").
 */
export async function mockGetProject(id: ID, actor: Actor | null): Promise<ProjectSummary | null> {
  await delay();
  if (id === 404) return null;
  const found = projects(actor).find((p) => p.id === id);
  if (found) return { ...found };
  return buildProject(id, { name: `Mock project #${id}`, dueInDays: 5, othersCount: 4, iAmOwner: true, tasks: [3, 8] }, actor);
}

/** Mock for createProject. Adds the caller as owner, like the create_project RPC. */
export async function mockCreateProject(
  input: { project_name: string; description?: string; due_date: string },
  actor: Actor,
): Promise<Project> {
  await delay();
  const list = projects(actor);
  const id = Math.max(0, ...list.map((p) => p.id)) + 1;
  const now = new Date().toISOString();
  const project: ProjectSummary = {
    id,
    user_id: actor.user_id,
    project_name: input.project_name,
    description: input.description ?? null,
    due_date: input.due_date,
    created_at: now,
    members: [{ project_id: id, ...me(actor), role: 'owner', joined_at: now }],
    task_total: 0,
    task_done: 0,
    progress: 0,
    my_role: 'owner',
  };
  list.push(project);
  return { ...project };
}

/** Mock for updateProject. Owner-only, like the real RLS. */
export async function mockUpdateProject(
  id: ID,
  patch: Partial<Pick<Project, 'project_name' | 'description' | 'due_date'>>,
): Promise<Project> {
  await delay();
  const p = store?.find((x) => x.id === id);
  if (!p) throw new Error('Project not found.');
  if (p.my_role !== 'owner') throw new Error('Only the project owner can edit it.');
  Object.assign(p, patch);
  return { ...p };
}

/** Fake NYX accounts that the member search can find. */
const DIRECTORY: UserSearchResult[] = [
  ...OTHERS.map((o) => ({
    ...o,
    image_url: null,
    email: `${o.display_name.split(' ')[0].toLowerCase()}@example.com`,
  })),
  { user_id: 'mock_priya', display_name: 'Priya Singh', image_url: null, email: 'priya@example.com' },
  { user_id: 'mock_noah', display_name: 'Noah Kim', image_url: null, email: 'noah@example.com' },
];

/** Mock for searchUsers: email prefix match, up to 5. */
export async function mockSearchUsers(q: string): Promise<UserSearchResult[]> {
  await delay(200);
  const needle = q.trim().toLowerCase();
  if (needle.length < 3) throw new ApiError('Type at least 3 characters', 400);
  return DIRECTORY.filter((u) => u.email.startsWith(needle)).slice(0, 5);
}

/** Mock for addMemberByEmail: same errors as the real route. */
export async function mockAddMemberByEmail(projectId: ID, email: string): Promise<Member> {
  await delay();
  const p = store?.find((x) => x.id === projectId);
  if (!p) throw new ApiError('Project not found', 404);
  if (p.my_role !== 'owner') throw new ApiError('Only the project owner can add members', 403);
  const user = DIRECTORY.find((u) => u.email === email.trim().toLowerCase());
  if (!user) throw new ApiError('No NYX account with that email', 404);
  if (p.members.some((m) => m.user_id === user.user_id)) throw new ApiError('Already a member of this project', 409);
  const member: Member = {
    project_id: projectId,
    user_id: user.user_id,
    display_name: user.display_name,
    image_url: user.image_url,
    role: 'member',
    joined_at: new Date().toISOString(),
  };
  p.members = [...p.members, member];
  return member;
}

/** Mock for removeMember: owner removes others, a member removes themself (leave). */
export async function mockRemoveMember(projectId: ID, userId: string, actor: Actor | null): Promise<void> {
  await delay();
  const p = store?.find((x) => x.id === projectId);
  if (!p) throw new Error('Project not found.');
  const target = p.members.find((m) => m.user_id === userId);
  if (!target) return;
  const isSelf = userId === me(actor).user_id;
  if (target.role === 'owner') throw new Error("The owner can't be removed.");
  if (!isSelf && p.my_role !== 'owner') throw new Error('Only the project owner can remove members.');
  p.members = p.members.filter((m) => m.user_id !== userId);
  if (isSelf) store = (store ?? []).filter((x) => x.id !== projectId);
}

/** Mock for deleteProject. Owner-only, like the real RLS. */
export async function mockDeleteProject(id: ID): Promise<void> {
  await delay();
  const p = store?.find((x) => x.id === id);
  if (p && p.my_role !== 'owner') throw new Error('Only the project owner can delete it.');
  store = (store ?? []).filter((x) => x.id !== id);
}
