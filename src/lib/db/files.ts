import type { SupabaseClient } from '@supabase/supabase-js';
import type { Actor, ID, ProjectFile } from '../types';
import { notImplemented } from './errors';

export const MAX_FILE_BYTES = 25 * 1024 * 1024;

/** Newest first. */
export async function listFiles(sb: SupabaseClient, projectId: ID): Promise<ProjectFile[]> {
  return notImplemented('listFiles');
}

/** Max 25 MB; throws DbError code 'FILE_TOO_LARGE'. */
export async function uploadFile(sb: SupabaseClient, projectId: ID, file: File, actor: Actor): Promise<ProjectFile> {
  return notImplemented('uploadFile');
}

/** Signed URL valid for 60 s. */
export async function getDownloadUrl(sb: SupabaseClient, file: ProjectFile): Promise<string> {
  return notImplemented('getDownloadUrl');
}

/** Uploader or owner (RLS). Removes the storage object and the row. */
export async function deleteFile(sb: SupabaseClient, file: ProjectFile): Promise<void> {
  return notImplemented('deleteFile');
}
