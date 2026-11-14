import type { SupabaseClient } from '@supabase/supabase-js';
import type { ID, Poll } from '../types';
import { DbError, toDbError } from './errors';

const POLL_SELECT =
  'id, project_id, question, user_id, created_at, poll_options(id, poll_id, option_name), votes(poll_option_id, user_id)';

type PollRow = Omit<Poll, 'options' | 'my_vote_option_id' | 'total_votes'> & {
  poll_options: { id: ID; poll_id: ID; option_name: string }[];
  votes: { poll_option_id: ID; user_id: string }[];
};

function toPoll({ poll_options, votes, ...poll }: PollRow, currentUserId: string): Poll {
  return {
    ...poll,
    options: [...poll_options]
      .sort((a, b) => a.id - b.id)
      .map((o) => ({ ...o, vote_count: votes.filter((v) => v.poll_option_id === o.id).length })),
    my_vote_option_id: votes.find((v) => v.user_id === currentUserId)?.poll_option_id ?? null,
    total_votes: votes.length,
  };
}

/** Oldest first, one query: polls with their options and votes. */
export async function listPolls(sb: SupabaseClient, projectId: ID, currentUserId: string): Promise<Poll[]> {
  const { data, error } = await sb
    .from('polls')
    .select(POLL_SELECT)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  if (error) throw toDbError(error);
  return (data as PollRow[]).map((p) => toPoll(p, currentUserId));
}

/** Question required; 2-6 non-empty options. */
export async function createPoll(sb: SupabaseClient, projectId: ID, question: string, options: string[]): Promise<Poll> {
  const q = question.trim();
  const opts = options.map((o) => o.trim()).filter(Boolean);
  if (!q) throw new DbError('Poll question is required', 'INVALID_INPUT');
  if (opts.length < 2 || opts.length > 6) throw new DbError('A poll needs 2 to 6 options', 'INVALID_INPUT');

  const { data: poll, error } = await sb
    .from('polls')
    .insert({ project_id: projectId, question: q })
    .select('id, project_id, question, user_id, created_at')
    .single();
  if (error) throw toDbError(error);

  const { data: rows, error: optError } = await sb
    .from('poll_options')
    .insert(opts.map((option_name) => ({ poll_id: poll.id, option_name })))
    .select('id, poll_id, option_name');
  if (optError) {
    await sb.from('polls').delete().eq('id', poll.id); // don't leave a poll with no options
    throw toDbError(optError);
  }
  return toPoll({ ...(poll as PollRow), poll_options: rows as PollRow['poll_options'], votes: [] }, poll.user_id);
}

/** Upsert: changes the vote if one exists. */
export async function vote(sb: SupabaseClient, pollId: ID, optionId: ID): Promise<void> {
  const { error } = await sb
    .from('votes')
    .upsert({ poll_id: pollId, poll_option_id: optionId }, { onConflict: 'poll_id,user_id' });
  if (error) throw toDbError(error);
}

/** Author or project owner (RLS). Options and votes cascade. */
export async function deletePoll(sb: SupabaseClient, pollId: ID): Promise<void> {
  const { data, error } = await sb.from('polls').delete().eq('id', pollId).select('id');
  if (error) throw toDbError(error);
  if (!data || data.length === 0) throw new DbError('Poll not found, or only its author or the owner can delete it', 'NOT_FOUND');
}
