'use client';

import Link from 'next/link';
import GroupAssignment from '@/components/GroupAssignment';
import AppNav from '@/components/AppNav';
import { EmptyState, ErrorBanner, LoadingBlock } from '@/components/ui';
import { useMyProjects } from '@/hooks/useMyProjects';
import { daysUntil } from '@/lib/utils/dates';
import type { ProjectSummary } from '@/lib/types';

const ADD_LINK_CLASS =
  'flex h-14 w-80 max-w-full items-center justify-center rounded-xl bg-gradient-to-br from-nyx-violet to-nyx-violet-dark text-lg font-semibold font-geist-mono text-white shadow-lg shadow-nyx-violet/30 transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nyx-violet focus-visible:ring-offset-2 focus-visible:ring-offset-nyx-bg';

export default function Home() {
  const { data: projects, loading, error, reload, remove } = useMyProjects();

  // listMyProjects is already sorted by due date; overdue ones move to the bottom.
  const upcoming: ProjectSummary[] = [];
  const pastDue: ProjectSummary[] = [];
  for (const p of projects ?? []) (daysUntil(p.due_date) < 0 ? pastDue : upcoming).push(p);

  let list;
  if (error) {
    list = (
      <div className="mx-auto max-w-3xl">
        <ErrorBanner error={error} onRetry={reload} />
      </div>
    );
  } else if (loading && !projects) {
    list = <LoadingBlock label="Loading projects" />;
  } else if (!projects || projects.length === 0) {
    list = (
      <EmptyState
        className="mx-auto max-w-3xl"
        title="No group assignments yet"
        description="Create one, then add your group members to start sharing tasks, notes, polls and files."
        action={
          <Link href="/add-group-assignment" className={ADD_LINK_CLASS}>
            Add New Group Assignment
          </Link>
        }
      />
    );
  } else {
    list = (
      <>
        {upcoming.map((p) => (
          <GroupAssignment key={p.id} project={p} onDelete={remove} onMembersChanged={reload} />
        ))}
        {pastDue.length > 0 && (
          <>
            <h2 className="mx-auto mb-3 mt-8 w-full max-w-3xl font-geist-mono text-sm uppercase tracking-wider text-nyx-coral">
              Past due
            </h2>
            {pastDue.map((p) => (
              <GroupAssignment key={p.id} project={p} onDelete={remove} onMembersChanged={reload} />
            ))}
          </>
        )}
      </>
    );
  }

  const hasProjects = !!projects && projects.length > 0;

  return (
    <main className="min-h-screen bg-nyx-bg text-slate-100">
      <AppNav />

      <section className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-20">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Plan projects, assign work, and ship with confidence.
        </h1>
      </section>

      {/* The empty state has its own add button. */}
      {(hasProjects || loading || !!error) && (
        <div className="flex justify-center px-6 pb-10">
          <Link href="/add-group-assignment" className={ADD_LINK_CLASS}>
            Add New Group Assignment
          </Link>
        </div>
      )}

      <div className="px-6 pb-16">{list}</div>
    </main>
  );
}
