'use client';

import { use, useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import { Card, ErrorBanner, LoadingBlock } from '@/components/ui';
import { ProjectProvider, type ProjectContextValue } from '@/components/project/ProjectContext';
import ProjectHeader from '@/components/project/ProjectHeader';
import ProjectTabs from '@/components/project/ProjectTabs';
import { useProject } from '@/hooks/useProject';
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

  const ctx = useMemo<ProjectContextValue | null>(
    () => (project ? { project, members: project.members, myRole: project.my_role, reload } : null),
    [project, reload],
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
        <ProjectHeader project={ctx.project} />
        <ProjectTabs projectId={ctx.project.id} />
        <div className="px-6 py-6">{children}</div>
      </ProjectProvider>
    );
  }

  return <main className="min-h-screen bg-nyx-bg text-slate-100">{body}</main>;
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
