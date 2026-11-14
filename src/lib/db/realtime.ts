import type { SupabaseClient } from '@supabase/supabase-js';
import type { ID } from '../types';

export type RealtimeTable = 'tasks' | 'comments' | 'notes' | 'votes' | 'files';

/**
 * One channel per project; calls onChange with the tab-level table to reload. Returns an unsubscribe function.
 * Realtime can't filter DELETE events, and comments/subtasks/votes have no project_id, so those
 * subscriptions are unfiltered: RLS keeps them to the caller's own projects, which can cause an extra reload.
 */
export function subscribeToProject(
  sb: SupabaseClient,
  projectId: ID,
  onChange: (table: RealtimeTable) => void,
): () => void {
  const channel = sb.channel(`project-${projectId}`);
  const byProject = `project_id=eq.${projectId}`;

  // Tables with project_id: filter inserts/updates to this project; deletes can't be filtered.
  const scoped: [string, RealtimeTable][] = [['tasks', 'tasks'], ['notes', 'notes'], ['files', 'files'], ['polls', 'votes']];
  for (const [table, tab] of scoped) {
    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table, filter: byProject }, () => onChange(tab))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table, filter: byProject }, () => onChange(tab))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table }, () => onChange(tab));
  }
  // Child tables: no project_id to filter on.
  const children: [string, RealtimeTable][] = [['subtasks', 'tasks'], ['comments', 'comments'], ['votes', 'votes']];
  for (const [table, tab] of children) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => onChange(tab));
  }

  channel.subscribe();
  return () => {
    void sb.removeChannel(channel);
  };
}
