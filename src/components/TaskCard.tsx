'use client';

import { useState } from 'react';
import { RiDeleteBinLine, RiPencilLine } from 'react-icons/ri';
import { Avatar, Card, DueBadge, Menu, PriorityTag, StatusBadge, cx } from '@/components/ui';
import CommentsSection from '@/components/tasks/CommentsSection';
import SubtaskList from '@/components/tasks/SubtaskList';
import type { Member, MemberRole, Task, TaskStatus } from '@/lib/types';

export interface TaskCardProps {
  task: Task;
  membersById: Map<string, Member>;
  myUserId: string | null;
  myRole: MemberRole;
  /** Briefly highlight the card (e.g. opened from a notification). */
  highlighted?: boolean;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  /** Local changes (subtasks, comment count) to merge into the list. */
  onTaskChange: (task: Task) => void;
}

export default function TaskCard({
  task,
  membersById,
  myUserId,
  myRole,
  highlighted,
  onStatusChange,
  onEdit,
  onDelete,
  onTaskChange,
}: TaskCardProps) {
  const [showComments, setShowComments] = useState(false);

  const assignee = task.assignee_id ? membersById.get(task.assignee_id) : undefined;
  const creator = membersById.get(task.created_by);
  const canManage =
    myRole === 'owner' || (myUserId !== null && (task.created_by === myUserId || task.assignee_id === myUserId));
  const isDone = task.status === 'done';

  return (
    <Card
      id={`task-${task.id}`}
      className={cx(
        'flex scroll-mt-24 flex-col gap-3 p-4 transition-shadow',
        highlighted && 'ring-2 ring-nyx-gold ring-offset-2 ring-offset-nyx-bg',
      )}
    >
      <div className="flex items-start gap-2">
        <h3 className={cx('flex-1 break-words text-[15px] font-semibold leading-snug', isDone && 'text-nyx-muted line-through')}>
          {task.title}
        </h3>
        {canManage && (
          <Menu
            label={`Options for task "${task.title}"`}
            items={[
              { label: 'Edit', icon: <RiPencilLine />, onSelect: () => onEdit(task) },
              { label: 'Delete', icon: <RiDeleteBinLine />, danger: true, onSelect: () => onDelete(task) },
            ]}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge status={task.status} onChange={(s) => onStatusChange(task, s)} />
        <PriorityTag priority={task.priority} />
        {task.due_date && <DueBadge date={task.due_date} calmTone="muted" />}
      </div>

      {task.description && (
        <p className="line-clamp-3 whitespace-pre-wrap break-words text-[12.5px] leading-snug text-slate-400">{task.description}</p>
      )}

      <div className="flex items-center gap-2 text-[12px]">
        <span className="font-geist-mono text-[10.5px] uppercase tracking-wide text-nyx-muted">Assigned to</span>
        {task.assignee_id ? (
          <span className="flex min-w-0 items-center gap-1.5">
            <Avatar
              name={assignee?.display_name ?? 'Former member'}
              imageUrl={assignee?.image_url}
              seed={task.assignee_id}
              size="xs"
            />
            <span className="truncate text-slate-200">
              {assignee?.display_name ?? 'Former member'}
              {task.assignee_id === myUserId && <span className="text-nyx-muted"> (you)</span>}
            </span>
          </span>
        ) : (
          <span className="text-nyx-muted">Unassigned</span>
        )}
      </div>

      <SubtaskList task={task} canDelete={canManage} onChange={(subtasks) => onTaskChange({ ...task, subtasks })} />

      <div className="flex items-center justify-between gap-2 border-t border-nyx-border pt-3">
        <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-nyx-muted" title={`Created by ${task.created_by_name}`}>
          <Avatar name={task.created_by_name} imageUrl={creator?.image_url} seed={task.created_by} size="xs" />
          <span className="truncate">{task.created_by_name}</span>
        </span>
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          aria-expanded={showComments}
          aria-controls={`task-${task.id}-comments`}
          className={cx(
            'shrink-0 rounded-lg px-2.5 py-1 font-geist-mono text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nyx-violet',
            showComments ? 'bg-nyx-violet/20 text-nyx-violet' : 'bg-nyx-menu text-nyx-text hover:bg-nyx-border',
          )}
        >
          <span aria-hidden>💬</span> {task.comment_count}
          <span className="sr-only"> comments</span>
        </button>
      </div>

      {showComments && (
        <div id={`task-${task.id}-comments`}>
          <CommentsSection
            task={task}
            membersById={membersById}
            onCountChange={(comment_count) => onTaskChange({ ...task, comment_count })}
          />
        </div>
      )}
    </Card>
  );
}
