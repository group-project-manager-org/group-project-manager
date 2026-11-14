/**
 * Frontend-only mock data, used while backend functions still throw
 * NOT_IMPLEMENTED. Enabled with NEXT_PUBLIC_USE_MOCKS=1 in .env.local.
 * Delete each mock once the matching src/lib/db function is implemented.
 *
 * Data lives in memory, so changes (e.g. deleting a project) last until a
 * full page refresh.
 */
import type { Actor, ID, Member, ProjectSummary } from '@/lib/types';

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
  return [...projects(actor)].sort((a, b) => a.due_date.localeCompare(b.due_date));
}

/**
 * Mock for getProject. Ids 1–4 match the home page; any other id gets a
 * generic project, except 404 which returns null (to test "not found").
 */
export async function mockGetProject(id: ID, actor: Actor | null): Promise<ProjectSummary | null> {
  await delay();
  if (id === 404) return null;
  const found = projects(actor).find((p) => p.id === id);
  if (found) return found;
  return buildProject(id, { name: `Mock project #${id}`, dueInDays: 5, othersCount: 4, iAmOwner: true, tasks: [3, 8] }, actor);
}

/** Mock for deleteProject. Owner-only, like the real RLS. */
export async function mockDeleteProject(id: ID): Promise<void> {
  await delay();
  const p = store?.find((x) => x.id === id);
  if (p && p.my_role !== 'owner') throw new Error('Only the project owner can delete it.');
  store = (store ?? []).filter((x) => x.id !== id);
}
