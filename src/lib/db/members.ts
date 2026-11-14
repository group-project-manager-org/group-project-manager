import type { SupabaseClient } from '@supabase/supabase-js';
import type { ID, Member } from '../types';
import { notImplemented } from './errors';

export async function listMembers(sb: SupabaseClient, projectId: ID): Promise<Member[]> {
  return notImplemented('listMembers');
}

/** Owner removes anyone except self; a member can remove self (leave). Adding goes through addMemberByEmail in src/lib/api.ts. */
export async function removeMember(sb: SupabaseClient, projectId: ID, userId: string): Promise<void> {
  return notImplemented('removeMember');
}
