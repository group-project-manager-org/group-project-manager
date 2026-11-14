'use client';

import { useEffect, useRef } from 'react';
import { useProjectContext } from '@/components/project/ProjectContext';
import type { RealtimeTable } from '@/lib/db/realtime';

/**
 * Calls `onChange` (usually a page's `reload`) when any of `tables` changes
 * in the current project. Bursts are coalesced by the layout.
 */
export function useRealtime(tables: RealtimeTable[], onChange: () => void): void {
  const { subscribe } = useProjectContext();
  const cb = useRef(onChange);
  cb.current = onChange;
  const key = tables.join(',');

  useEffect(
    () => subscribe(key.split(',') as RealtimeTable[], () => cb.current()),
    [subscribe, key],
  );
}
