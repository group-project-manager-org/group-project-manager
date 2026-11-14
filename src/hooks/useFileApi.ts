'use client';

import { useMemo } from 'react';
import { useProjectContext } from '@/components/project/ProjectContext';
import { deleteFile, getDownloadUrl, listFiles, uploadFile } from '@/lib/db/files';
import { useSupabase } from '@/lib/supabaseClient';
import type { Actor, ProjectFile } from '@/lib/types';
import { USE_MOCKS } from './mocks';
import * as m from './mockFiles';

/** File calls for the current project (mocked when NEXT_PUBLIC_USE_MOCKS=1). */
export function useFileApi() {
  const sb = useSupabase();
  const { project, members } = useProjectContext();

  return useMemo(
    () => ({
      listFiles: () => (USE_MOCKS ? m.mockListFiles(project.id, members) : listFiles(sb, project.id)),
      uploadFile: (file: File, a: Actor) =>
        USE_MOCKS ? m.mockUploadFile(project.id, file, a, members) : uploadFile(sb, project.id, file, a),
      getDownloadUrl: (file: ProjectFile) => (USE_MOCKS ? m.mockGetDownloadUrl(file) : getDownloadUrl(sb, file)),
      deleteFile: (file: ProjectFile) => (USE_MOCKS ? m.mockDeleteFile(file) : deleteFile(sb, file)),
    }),
    [sb, project.id, members],
  );
}
