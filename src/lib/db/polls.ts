import type { SupabaseClient } from '@supabase/supabase-js';
import type { ID, Poll } from '../types';
import { notImplemented } from './errors';

export async function listPolls(sb: SupabaseClient, projectId: ID, currentUserId: string): Promise<Poll[]> {
  return notImplemented('listPolls');
}

export async function createPoll(sb: SupabaseClient, projectId: ID, question: string, options: string[]): Promise<Poll> {
  return notImplemented('createPoll');
}

/** Upsert: changes the vote if one exists. */
export async function vote(sb: SupabaseClient, pollId: ID, optionId: ID): Promise<void> {
  return notImplemented('vote');
}

export async function deletePoll(sb: SupabaseClient, pollId: ID): Promise<void> {
  return notImplemented('deletePoll');
}
