import type { SupabaseClient } from '@supabase/supabase-js';
import type { Actor, ID, Project, ProjectSummary } from '../types';
import { notImplemented } from './errors';

/** Projects the current user is a member of, sorted by due_date ascending. */
export async function listMyProjects(sb: SupabaseClient): Promise<ProjectSummary[]> {
  return notImplemented('listMyProjects');
}

export async function getProject(sb: SupabaseClient, id: ID): Promise<ProjectSummary | null> {
  return notImplemented('getProject');
}

export async function createProject(
  sb: SupabaseClient,
  input: { project_name: string; description?: string; due_date: string },
  actor: Actor,
): Promise<Project> {
  return notImplemented('createProject');
}

export async function updateProject(
  sb: SupabaseClient,
  id: ID,
  patch: Partial<Pick<Project, 'project_name' | 'description' | 'due_date'>>,
): Promise<Project> {
  return notImplemented('updateProject');
}

/** Owner only (RLS). Cascades to members, tasks, notes, polls, files. */
export async function deleteProject(sb: SupabaseClient, id: ID): Promise<void> {
  return notImplemented('deleteProject');
}
