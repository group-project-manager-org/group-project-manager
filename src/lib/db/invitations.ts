import type { SupabaseClient } from '@supabase/supabase-js';
import type { ID, Invitation, Member } from '../types';
import { DbError, toDbError } from './errors';
import { currentUserId } from './projects';

/** Invitations waiting for the current user, newest first. Sending one goes through inviteByEmail in src/lib/api.ts. */
export async function listMyInvitations(sb: SupabaseClient): Promise<Invitation[]> {
  const me = await currentUserId(sb);
  const { data, error } = await sb
    .from('project_invitations')
    .select('*')
    .eq('invitee_id', me)
    .order('created_at', { ascending: false });
  if (error) throw toDbError(error);
  return data as Invitation[];
}

/** Pending invitations for a project (owner only; others get []). Oldest first. */
export async function listProjectInvitations(sb: SupabaseClient, projectId: ID): Promise<Invitation[]> {
  const { data, error } = await sb
    .from('project_invitations')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  if (error) throw toDbError(error);
  return data as Invitation[];
}

/** The invitee joins the project; returns their new membership. */
export async function acceptInvitation(sb: SupabaseClient, invitationId: ID): Promise<Member> {
  const { data, error } = await sb.rpc('accept_invitation', { p_invitation_id: invitationId });
  if (error) throw toDbError(error);
  return data as Member;
}

/** Decline (invitee) or cancel (owner). */
export async function deleteInvitation(sb: SupabaseClient, invitationId: ID): Promise<void> {
  const { data, error } = await sb.from('project_invitations').delete().eq('id', invitationId).select('id');
  if (error) throw toDbError(error);
  if (!data || data.length === 0) throw new DbError('Invitation not found', 'NOT_FOUND');
}
