'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RiArrowLeftLine, RiTeamLine } from 'react-icons/ri';
import { AvatarStack, Button, DueBadge } from '@/components/ui';
import UserNav from '@/components/UseNav';
import MembersModal from './MembersModal';
import { useProjectContext } from './ProjectContext';

export default function ProjectHeader() {
  const { project, reload } = useProjectContext();
  const router = useRouter();
  const [membersOpen, setMembersOpen] = useState(false);

  return (
    <header className="border-b border-nyx-border px-4 py-5 sm:px-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg font-geist-mono text-sm text-slate-400 transition-colors hover:text-nyx-violet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nyx-violet"
        >
          <RiArrowLeftLine aria-hidden />
          All projects
        </Link>
        <UserNav />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1 font-geist-mono text-sm text-nyx-violet">Project</p>
          <h1 className="truncate text-3xl font-semibold tracking-tight">{project.project_name}</h1>
          {project.description && <p className="mt-1 max-w-2xl text-sm text-slate-400">{project.description}</p>}
          <DueBadge date={project.due_date} className="mt-2" />
        </div>

        <div className="flex items-center gap-3">
          <AvatarStack people={project.members} max={4} />
          <Button variant="ghost" size="sm" onClick={() => setMembersOpen(true)} aria-label="Manage members">
            <RiTeamLine aria-hidden />
            Members
          </Button>
        </div>
      </div>

      <MembersModal
        open={membersOpen}
        onClose={() => setMembersOpen(false)}
        project={project}
        onChanged={reload}
        onLeft={() => router.push('/')}
      />
    </header>
  );
}
