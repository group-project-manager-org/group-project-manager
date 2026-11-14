'use client';

import { useState, type FormEvent } from 'react';
import { RiCloseLine } from 'react-icons/ri';
import { ErrorBanner, cx } from '@/components/ui';
import { useTaskApi } from '@/hooks/useTaskApi';
import type { Subtask, Task } from '@/lib/types';

export interface SubtaskListProps {
  task: Task;
  /** Whether the current user may delete subtasks (creator / assignee / owner). */
  canDelete: boolean;
  onChange: (subtasks: Subtask[]) => void;
}

/** Checklist with a done/total bar, inline add, toggle and delete. */
export default function SubtaskList({ task, canDelete, onChange }: SubtaskListProps) {
  const api = useTaskApi();
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const subtasks = [...task.subtasks].sort((a, b) => a.position - b.position);
  const done = subtasks.filter((s) => s.done).length;
  const pct = subtasks.length === 0 ? 0 : Math.round((done / subtasks.length) * 100);

  async function toggle(s: Subtask) {
    const prev = task.subtasks;
    onChange(prev.map((x) => (x.id === s.id ? { ...x, done: !s.done } : x))); // optimistic
    try {
      await api.toggleSubtask(s.id, !s.done);
    } catch (e) {
      onChange(prev);
      setError(e);
    }
  }

  async function remove(s: Subtask) {
    const prev = task.subtasks;
    onChange(prev.filter((x) => x.id !== s.id));
    try {
      await api.deleteSubtask(s.id);
    } catch (e) {
      onChange(prev);
      setError(e);
    }
  }

  async function add(e: FormEvent) {
    e.preventDefault();
    const title = draft.trim();
    if (!title) return;
    setAdding(true);
    setError(null);
    try {
      const s = await api.addSubtask(task.id, title);
      onChange([...task.subtasks, s]);
      setDraft('');
    } catch (err) {
      setError(err);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {subtasks.length > 0 && (
        <div className="flex items-center gap-2">
          <div
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-nyx-border"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Subtasks done"
          >
            <div className="h-full rounded-full bg-nyx-mint transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="font-geist-mono text-[11px] text-nyx-muted">
            {done}/{subtasks.length}
          </span>
        </div>
      )}

      {subtasks.length > 0 && (
        <ul className="flex flex-col gap-1">
          {subtasks.map((s) => (
            <li key={s.id} className="group flex items-center gap-2 rounded-lg px-1 py-0.5 hover:bg-nyx-bg">
              <input
                type="checkbox"
                checked={s.done}
                onChange={() => void toggle(s)}
                aria-label={`Mark "${s.title}" as ${s.done ? 'not done' : 'done'}`}
                className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-nyx-mint"
              />
              <span className={cx('flex-1 break-words text-[12.5px]', s.done ? 'text-nyx-muted line-through' : 'text-slate-200')}>
                {s.title}
              </span>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => void remove(s)}
                  aria-label={`Delete subtask "${s.title}"`}
                  className="rounded p-0.5 text-nyx-muted can-hover:opacity-0 transition-opacity hover:text-nyx-coral can-hover:focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nyx-violet can-hover:group-hover:opacity-100"
                >
                  <RiCloseLine size={14} aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {showInput ? (
        <form onSubmit={add} className="flex gap-1.5">
          <input
            autoFocus
            value={draft}
            maxLength={200}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && (setShowInput(false), setDraft(''))}
            placeholder="New subtask…"
            aria-label="New subtask title"
            className="min-w-0 flex-1 rounded-lg border border-nyx-border bg-nyx-bg px-2.5 py-1.5 text-[12px] text-slate-100 placeholder:text-slate-500 outline-none focus:border-nyx-violet"
          />
          <button
            type="submit"
            disabled={adding || !draft.trim()}
            className="rounded-lg bg-nyx-violet px-2.5 text-[11.5px] font-semibold text-white disabled:opacity-40"
          >
            Add
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowInput(true)}
          className="self-start rounded font-geist-mono text-[11px] text-nyx-muted transition-colors hover:text-nyx-violet focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nyx-violet"
        >
          + Add subtask
        </button>
      )}
      <ErrorBanner error={error} onDismiss={() => setError(null)} />
    </div>
  );
}
