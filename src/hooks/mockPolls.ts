/** Mocks for src/lib/db/polls.ts (NEXT_PUBLIC_USE_MOCKS=1). */
import type { Actor, ID, Member, Poll } from '@/lib/types';
import { delay, me } from './mocks';

interface StoredPoll {
  id: ID;
  project_id: ID;
  question: string;
  user_id: string;
  created_at: string;
  options: { id: ID; option_name: string }[];
  votes: Map<string, ID>; // user_id -> option id
}

const pollsByProject = new Map<ID, StoredPoll[]>();
let nextId = 500_000;
const newId = () => ++nextId;

function seed(projectId: ID, members: Member[], actor: Actor | null): StoredPoll[] {
  const ids = members.map((m) => m.user_id);
  const author = ids[1] ?? me(actor).user_id;
  const mk = (question: string, opts: string[], votes: number[], hoursAgo: number): StoredPoll => {
    const options = opts.map((option_name) => ({ id: newId(), option_name }));
    const v = new Map<string, ID>();
    // Others vote; the current user (members[0] in mocks = owner) hasn't voted yet.
    votes.forEach((optIdx, i) => {
      const voter = ids[i + 1];
      if (voter) v.set(voter, options[optIdx].id);
    });
    return {
      id: newId(),
      project_id: projectId,
      question,
      user_id: author,
      created_at: new Date(Date.now() - hoursAgo * 3_600_000).toISOString(),
      options,
      votes: v,
    };
  };
  return [
    mk('When should we meet this week?', ['Tuesday 4pm', 'Wednesday lunch', 'Thursday 6pm (online)'], [0, 2, 2], 20),
    mk('Which topic should we pick for the case study?', ['Data privacy', 'AI in hiring', 'Gig economy'], [1, 1, 0, 2], 50),
  ];
}

function polls(projectId: ID, members: Member[], actor: Actor | null) {
  let list = pollsByProject.get(projectId);
  if (!list) {
    list = seed(projectId, members, actor);
    pollsByProject.set(projectId, list);
  }
  return list;
}

function toPoll(p: StoredPoll, userId: string): Poll {
  const counts = new Map<ID, number>();
  for (const opt of p.votes.values()) counts.set(opt, (counts.get(opt) ?? 0) + 1);
  return {
    id: p.id,
    project_id: p.project_id,
    question: p.question,
    user_id: p.user_id,
    created_at: p.created_at,
    options: p.options.map((o) => ({ id: o.id, poll_id: p.id, option_name: o.option_name, vote_count: counts.get(o.id) ?? 0 })),
    my_vote_option_id: p.votes.get(userId) ?? null,
    total_votes: p.votes.size,
  };
}

function findPoll(pollId: ID): StoredPoll {
  for (const list of pollsByProject.values()) {
    const p = list.find((x) => x.id === pollId);
    if (p) return p;
  }
  throw new Error('Poll not found.');
}

export async function mockListPolls(projectId: ID, members: Member[], actor: Actor | null): Promise<Poll[]> {
  await delay();
  const userId = me(actor).user_id;
  return polls(projectId, members, actor)
    .map((p) => toPoll(p, userId))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function mockCreatePoll(
  projectId: ID,
  question: string,
  options: string[],
  members: Member[],
  actor: Actor | null,
): Promise<Poll> {
  await delay();
  const p: StoredPoll = {
    id: newId(),
    project_id: projectId,
    question,
    user_id: me(actor).user_id,
    created_at: new Date().toISOString(),
    options: options.map((option_name) => ({ id: newId(), option_name })),
    votes: new Map(),
  };
  polls(projectId, members, actor).push(p);
  return toPoll(p, me(actor).user_id);
}

export async function mockVote(pollId: ID, optionId: ID, actor: Actor | null): Promise<void> {
  await delay(200);
  const p = findPoll(pollId);
  if (!p.options.some((o) => o.id === optionId)) throw new Error('That option no longer exists.');
  p.votes.set(me(actor).user_id, optionId); // upsert
}

export async function mockDeletePoll(pollId: ID): Promise<void> {
  await delay();
  for (const [pid, list] of pollsByProject) pollsByProject.set(pid, list.filter((p) => p.id !== pollId));
}
