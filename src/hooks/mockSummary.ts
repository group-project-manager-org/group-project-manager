/** Mock for getMemberSummaries in src/lib/api.ts (NEXT_PUBLIC_USE_MOCKS=1). */
import type { MemberSummariesResponse } from '@/lib/api';
import type { Member } from '@/lib/types';
import { delay } from './mocks';

const SENTENCES = [
  'Worked on the competitor research deck and moved it into review. Added three comments clarifying the data sources.',
  'Drafted the introduction and completed its outline subtask. Created two new tasks for the referencing work.',
  'Collected academic sources and shared the library workshop note. Voted in both group polls.',
  'Booked the meeting room and marked it done. Commented on the presentation structure.',
  'Uploaded the survey results spreadsheet and pinned the marking rubric note.',
];

let cache: { at: string; projectKey: string } | null = null;

export async function mockGetMemberSummaries(members: Member[]): Promise<MemberSummariesResponse> {
  const projectKey = members.map((m) => m.user_id).join(',');
  // Like the real route: a second call within an hour returns the cached result quickly.
  const cached = cache && cache.projectKey === projectKey && Date.now() - new Date(cache.at).getTime() < 3_600_000;
  await delay(cached ? 300 : 1800);
  if (!cached) cache = { at: new Date().toISOString(), projectKey };
  return {
    generated_at: cache!.at,
    members: members.map((m, i) => ({
      user_id: m.user_id,
      display_name: m.display_name,
      summary: SENTENCES[i % SENTENCES.length],
      tasks_done: (i * 2 + 1) % 5,
      tasks_open: (i + 2) % 4,
    })),
  };
}
