/**
 * Frontend-only mock data, used while backend functions still throw
 * NOT_IMPLEMENTED. Enabled with NEXT_PUBLIC_USE_MOCKS=1 in .env.local.
 * Delete each mock once the matching src/lib/db function is implemented.
 */
import type { Actor, ID, Member, ProjectSummary } from '@/lib/types';

export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === '1';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function ymdFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function mockMembers(projectId: ID, actor: Actor | null): Member[] {
  const joined = new Date(Date.now() - 7 * 86_400_000).toISOString();
  return [
    {
      project_id: projectId,
      user_id: actor?.user_id ?? 'mock_owner',
      display_name: actor?.display_name ?? 'You',
      image_url: actor?.image_url ?? null,
      role: 'owner',
      joined_at: joined,
    },
    { project_id: projectId, user_id: 'mock_maya', display_name: 'Maya Chen', image_url: null, role: 'member', joined_at: joined },
    { project_id: projectId, user_id: 'mock_jordan', display_name: 'Jordan Lee', image_url: null, role: 'member', joined_at: joined },
    { project_id: projectId, user_id: 'mock_alex', display_name: 'Alex Rivera', image_url: null, role: 'member', joined_at: joined },
    { project_id: projectId, user_id: 'mock_sam', display_name: 'Sam Patel', image_url: null, role: 'member', joined_at: joined },
  ];
}

/** Mock for getProject. Project id 404 returns null, to test the "not found" state. */
export async function mockGetProject(id: ID, actor: Actor | null): Promise<ProjectSummary | null> {
  await delay(300);
  if (id === 404) return null;
  return {
    id,
    user_id: actor?.user_id ?? 'mock_owner',
    project_name: `Mock project #${id}`,
    description: 'Sample project from src/hooks/mocks.ts',
    due_date: ymdFromToday(5),
    created_at: new Date(Date.now() - 7 * 86_400_000).toISOString(),
    members: mockMembers(id, actor),
    task_total: 8,
    task_done: 3,
    progress: 38,
    my_role: 'owner',
  };
}
