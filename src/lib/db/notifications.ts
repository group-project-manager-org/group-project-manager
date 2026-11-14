import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppNotification, ID } from '../types';
import { notImplemented } from './errors';

export async function listNotifications(
  sb: SupabaseClient,
  opts?: { unreadOnly?: boolean },
): Promise<AppNotification[]> {
  return notImplemented('listNotifications');
}

export async function markRead(sb: SupabaseClient, ids: ID[]): Promise<void> {
  return notImplemented('markRead');
}

export async function markAllRead(sb: SupabaseClient): Promise<void> {
  return notImplemented('markAllRead');
}
