/** Mocks for src/lib/db/files.ts (NEXT_PUBLIC_USE_MOCKS=1). Uploaded files stay in browser memory. */
import { DbError } from '@/lib/db/errors';
import { MAX_FILE_BYTES } from '@/lib/db/files';
import type { Actor, ID, Member, ProjectFile } from '@/lib/types';
import { delay } from './mocks';

const filesByProject = new Map<ID, ProjectFile[]>();
const blobs = new Map<ID, Blob>();
let nextId = 900_000;

function seed(projectId: ID, members: Member[]): ProjectFile[] {
  const who = (i: number) => members[i % Math.max(1, members.length)];
  const mk = (i: number, file_name: string, size_bytes: number, mime_type: string, hoursAgo: number): ProjectFile => {
    const id = ++nextId;
    blobs.set(id, new Blob([`Mock contents of ${file_name}`], { type: 'text/plain' }));
    return {
      id,
      project_id: projectId,
      user_id: who(i)?.user_id ?? 'mock_me',
      user_name: who(i)?.display_name ?? 'You',
      file_name,
      storage_path: `${projectId}/mock-${id}-${file_name}`,
      size_bytes,
      mime_type,
      created_at: new Date(Date.now() - hoursAgo * 3_600_000).toISOString(),
    };
  };
  return [
    mk(1, 'Assignment brief.pdf', 482_133, 'application/pdf', 2),
    mk(0, 'Research notes.docx', 38_912, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 30),
    mk(2, 'Survey results.xlsx', 120_400, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 52),
    mk(3, 'Team photo.png', 2_310_554, 'image/png', 90),
  ];
}

function files(projectId: ID, members: Member[]): ProjectFile[] {
  let list = filesByProject.get(projectId);
  if (!list) {
    list = seed(projectId, members);
    filesByProject.set(projectId, list);
  }
  return list;
}

export async function mockListFiles(projectId: ID, members: Member[]): Promise<ProjectFile[]> {
  await delay();
  return files(projectId, members)
    .map((f) => ({ ...f }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function mockUploadFile(projectId: ID, file: File, actor: Actor, members: Member[]): Promise<ProjectFile> {
  if (file.size > MAX_FILE_BYTES) throw new DbError('Files can be up to 25 MB.', 'FILE_TOO_LARGE');
  await delay(600 + Math.min(1500, file.size / 5000));
  const id = ++nextId;
  blobs.set(id, file);
  const row: ProjectFile = {
    id,
    project_id: projectId,
    user_id: actor.user_id,
    user_name: actor.display_name,
    file_name: file.name,
    storage_path: `${projectId}/mock-${id}-${file.name}`,
    size_bytes: file.size,
    mime_type: file.type || null,
    created_at: new Date().toISOString(),
  };
  files(projectId, members).push(row);
  return { ...row };
}

export async function mockGetDownloadUrl(file: ProjectFile): Promise<string> {
  await delay(150);
  const blob = blobs.get(file.id);
  if (!blob) throw new Error('File not found.');
  return URL.createObjectURL(blob);
}

export async function mockDeleteFile(file: ProjectFile): Promise<void> {
  await delay(250);
  blobs.delete(file.id);
  for (const [pid, list] of filesByProject) filesByProject.set(pid, list.filter((f) => f.id !== file.id));
}
