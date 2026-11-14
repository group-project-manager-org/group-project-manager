import type { SupabaseClient } from '@supabase/supabase-js';
import type { ID } from '../types';
import { notImplemented } from './errors';

export type RealtimeTable = 'tasks' | 'comments' | 'notes' | 'votes' | 'files';

/** Phase 3. Returns an unsubscribe function. */
export function subscribeToProject(
  sb: SupabaseClient,
  projectId: ID,
  onChange: (table: RealtimeTable) => void,
): () => void {
  return notImplemented('subscribeToProject');
}
