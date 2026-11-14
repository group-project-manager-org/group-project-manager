'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RiDeleteBinLine, RiPencilLine } from 'react-icons/ri';
import { AvatarStack, ConfirmDialog, DueBadge, Menu } from '@/components/ui';
import MembersModal from '@/components/project/MembersModal';
import type { ID, ProjectSummary } from '@/lib/types';
import ConstellationMeter from './ConstellationMeter';

export interface GroupAssignmentProps {
  project: ProjectSummary;
  /** Deletes the project. May throw; the confirm dialog shows the error. */
  onDelete: (id: ID) => Promise<void>;
}

/** Project card on the home page. Clicking it opens the project. */
export default function GroupAssignment({ project, onDelete }: GroupAssignmentProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const isOwner = project.my_role === 'owner';
  const href = `/project/${project.id}`;

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`Open ${project.project_name}`}
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && e.key === 'Enter') router.push(href);
      }}
      className="mx-auto mb-4 flex w-full max-w-3xl cursor-pointer flex-wrap items-center gap-4 rounded-2xl border border-nyx-border bg-nyx-card p-4 transition-colors hover:border-nyx-violet/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nyx-violet sm:flex-nowrap"
    >
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-lg font-semibold text-slate-100">{project.project_name}</h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          <DueBadge date={project.due_date} />
          <ConstellationMeter progress={project.progress} done={project.task_done} total={project.task_total} />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <AvatarStack people={project.members} max={4} />
        {isOwner && (
          <button
            type="button"
            aria-label="Add member"
            onClick={(e) => {
              e.stopPropagation();
              setMembersOpen(true);
            }}
            className="ml-1 flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-slate-500 text-slate-400 hover:border-nyx-violet hover:text-nyx-violet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nyx-violet"
          >
            +
          </button>
        )}
      </div>

      {isOwner && (
        <Menu
          label={`Options for ${project.project_name}`}
          items={[
            {
              label: 'Edit',
              icon: <RiPencilLine />,
              onSelect: () => router.push(`/edit-group-assignment/${project.id}`),
            },
            { label: 'Delete', icon: <RiDeleteBinLine />, danger: true, onSelect: () => setConfirmOpen(true) },
          ]}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete project?"
        message={`"${project.project_name}" and all its tasks, notes, polls and files will be deleted for every member. This can't be undone.`}
        confirmLabel="Delete project"
        onConfirm={() => onDelete(project.id)}
        onCancel={() => setConfirmOpen(false)}
      />
      <MembersModal open={membersOpen} onClose={() => setMembersOpen(false)} members={project.members} />
    </div>
  );
}
