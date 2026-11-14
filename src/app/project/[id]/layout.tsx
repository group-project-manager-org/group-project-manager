'use client';

import { use, useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { Card, ErrorBanner, LoadingBlock } from '@/components/ui';
import { ProjectProvider, type ProjectContextValue } from '@/components/project/ProjectContext';
import ProjectHeader from '@/components/project/ProjectHeader';
import ProjectTabs from '@/components/project/ProjectTabs';
import { USE_MOCKS } from '@/hooks/mocks';
import { useProject } from '@/hooks/useProject';
import { DbError } from '@/lib/db/errors';
import { subscribeToProject, type RealtimeTable } from '@/lib/db/realtime';
import { useSupabase } from '@/lib/supabaseClient';
import type { ID } from '@/lib/types';

function parseId(raw: string): ID | null {
  const n = Number(raw);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

export default function ProjectLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = use(params);
  const id = parseId(rawId);
  const { data: project, loading, error, reload } = useProject(id);
  const subscribe = useProjectRealtime(id, project !== null);

  const ctx = useMemo<ProjectContextValue | null>(
    () => (project ? { project, members: project.members, myRole: project.my_role, reload, subscribe } : null),
    [project, reload, subscribe],
  );

  let body: ReactNode;
  if (id === null) {
    body = <NotFound />;
  } else if (error) {
    body = (
      <div className="mx-auto max-w-xl px-6 py-16">
        <ErrorBanner error={error} onRetry={reload} />
      </div>
    );
  } else if (loading && !project) {
    body = <LoadingBlock label="Loading project" />;
  } else if (!ctx) {
    body = <NotFound />;
  } else {
    body = (
      <ProjectProvider value={ctx}>
        <ProjectHeader />
        <ProjectTabs projectId={ctx.project.id} />
        <div className="px-4 py-6 sm:px-6">{children}</div>
      </ProjectProvider>
    );
  }

  return <main className="min-h-screen bg-nyx-bg text-slate-100">{body}</main>;
}

/**
 * One realtime channel per project (F10). Pages register the tables they show
 * through `subscribe`; changes are coalesced for 300 ms per table so a burst of
 * events triggers a single reload. Skipped in mock mode, and silently skipped
 * while subscribeToProject isn't implemented yet (B10).
 */
function useProjectRealtime(id: ID | null, ready: boolean) {
  const sb = useSupabase();
  const listeners = useRef(new Map<RealtimeTable, Set<() => void>>());

  const subscribe = useCallback((tables: RealtimeTable[], onChange: () => void) => {
    for (const t of tables) {
      if (!listeners.current.has(t)) listeners.current.set(t, new Set());
      listeners.current.get(t)!.add(onChange);
    }
    return () => {
      for (const t of tables) listeners.current.get(t)?.delete(onChange);
    };
  }, []);

  useEffect(() => {
    if (USE_MOCKS || id === null || !ready) return;
    const timers = new Map<RealtimeTable, ReturnType<typeof setTimeout>>();
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = subscribeToProject(sb, id, (table) => {
        clearTimeout(timers.get(table));
        timers.set(
          table,
          setTimeout(() => listeners.current.get(table)?.forEach((cb) => cb()), 300),
        );
      });
    } catch (e) {
      if (!(e instanceof DbError && e.code === 'NOT_IMPLEMENTED')) console.error('Live updates unavailable:', e);
    }
    return () => {
      unsubscribe?.();
      timers.forEach(clearTimeout);
    };
  }, [sb, id, ready]);

  return subscribe;
}

function NotFound() {
  return (
    <div className="mx-auto max-w-md px-6 py-20">
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <h1 className="text-xl font-semibold">Project not found</h1>
        <p className="text-sm text-slate-400">
          It may have been deleted, or you aren&apos;t a member of this project.
        </p>
        <Link
          href="/"
          className="mt-2 inline-flex h-10 items-center rounded-xl bg-gradient-to-br from-nyx-violet to-nyx-violet-dark px-4 font-geist-mono text-sm font-semibold text-white shadow-lg shadow-nyx-violet/30 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nyx-violet"
        >
          Back to home
        </Link>
      </Card>
    </div>
  );
}
