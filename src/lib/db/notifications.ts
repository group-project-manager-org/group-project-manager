import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppNotification, ID } from '../types';
import { toDbError } from './errors';

/** The caller's notifications, newest first (latest 50). */
export async function listNotifications(
  sb: SupabaseClient,
  opts?: { unreadOnly?: boolean },
): Promise<AppNotification[]> {
  let query = sb
    .from('notifications')
    .select('id, user_id, project_id, task_id, type, message, read_at, created_at')
    .order('created_at', { ascending: false })
    .limit(50);
  if (opts?.unreadOnly) query = query.is('read_at', null);
  const { data, error } = await query;
  if (error) throw toDbError(error);
  return data as AppNotification[];
}

export async function markRead(sb: SupabaseClient, ids: ID[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await sb
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .in('id', ids)
    .is('read_at', null);
  if (error) throw toDbError(error);
}

export async function markAllRead(sb: SupabaseClient): Promise<void> {
  // RLS limits this to the caller's own rows.
  const { error } = await sb.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null);
  if (error) throw toDbError(error);
}
