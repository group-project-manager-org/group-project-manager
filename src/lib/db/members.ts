import type { SupabaseClient } from '@supabase/supabase-js';
import type { ID, Member } from '../types';
import { DbError, toDbError } from './errors';

/** Owner first, then by join date. */
export async function listMembers(sb: SupabaseClient, projectId: ID): Promise<Member[]> {
  const { data, error } = await sb
    .from('project_members')
    .select('*')
    .eq('project_id', projectId)
    .order('role', { ascending: false }) // 'owner' > 'member'
    .order('joined_at', { ascending: true });
  if (error) throw toDbError(error);
  return data as Member[];
}

/** Owner removes anyone except self; a member can remove self (leave). Adding goes through addMemberByEmail in src/lib/api.ts. */
export async function removeMember(sb: SupabaseClient, projectId: ID, userId: string): Promise<void> {
  const { data, error } = await sb
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .select('user_id');
  if (error) throw toDbError(error);
  if (!data || data.length === 0) {
    throw new DbError('Member not found, or you are not allowed to remove them', 'NOT_FOUND');
  }
}
