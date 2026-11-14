import type { SupabaseClient } from '@supabase/supabase-js';
import type { Actor, ID, ProjectFile } from '../types';
import { DbError, toDbError } from './errors';

export const MAX_FILE_BYTES = 25 * 1024 * 1024;
const BUCKET = 'project-files';

/** Safe object-key segment: keeps letters, digits, dot, dash, underscore. */
function safeName(name: string): string {
  return name.replace(/[^A-Za-z0-9._-]+/g, '_').slice(-100) || 'file';
}

/** Newest first. */
export async function listFiles(sb: SupabaseClient, projectId: ID): Promise<ProjectFile[]> {
  const { data, error } = await sb
    .from('files')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw toDbError(error);
  return data as ProjectFile[];
}

/** Max 25 MB; throws DbError code 'FILE_TOO_LARGE'. */
export async function uploadFile(sb: SupabaseClient, projectId: ID, file: File, actor: Actor): Promise<ProjectFile> {
  if (file.size > MAX_FILE_BYTES) throw new DbError('Files must be 25 MB or smaller', 'FILE_TOO_LARGE');

  const path = `${projectId}/${crypto.randomUUID()}-${safeName(file.name)}`;
  const { error: uploadError } = await sb.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (uploadError) throw new DbError(uploadError.message, 'UPLOAD_FAILED');

  const { data, error } = await sb
    .from('files')
    .insert({
      project_id: projectId,
      user_name: actor.display_name,
      file_name: file.name.slice(0, 255) || 'file',
      storage_path: path,
      size_bytes: file.size,
      mime_type: file.type || null,
    })
    .select()
    .single();
  if (error) {
    await sb.storage.from(BUCKET).remove([path]); // don't leave an object with no row
    throw toDbError(error);
  }
  return data as ProjectFile;
}

/** Signed URL valid for 60 s; the browser downloads it under the original file name. */
export async function getDownloadUrl(sb: SupabaseClient, file: ProjectFile): Promise<string> {
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(file.storage_path, 60, { download: file.file_name });
  if (error || !data) throw new DbError(error?.message ?? 'Could not create a download link', 'NOT_FOUND');
  return data.signedUrl;
}

/** Uploader or owner (RLS). Removes the storage object and the row. */
export async function deleteFile(sb: SupabaseClient, file: ProjectFile): Promise<void> {
  // Object first: its delete policy doesn't depend on the row. If the object is already gone, still drop the row.
  const { error: removeError } = await sb.storage.from(BUCKET).remove([file.storage_path]);
  if (removeError) throw new DbError(removeError.message, 'DELETE_FAILED');

  const { data, error } = await sb.from('files').delete().eq('id', file.id).select('id');
  if (error) throw toDbError(error);
  if (!data || data.length === 0) throw new DbError('File not found, or only its uploader or the owner can delete it', 'NOT_FOUND');
}
