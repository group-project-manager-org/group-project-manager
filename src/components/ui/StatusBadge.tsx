'use client';

import { useCallback, useRef, useState } from 'react';
import { useDismiss } from '@/hooks/useDismiss';
import { TONES, type BadgeTone } from './Badge';
import type { TaskStatus } from '@/lib/types';
import { cx } from './cx';

export const STATUSES: { key: TaskStatus; label: string; icon: string; tone: BadgeTone }[] = [
  { key: 'not_started', label: 'Not started', icon: '○', tone: 'muted' },
  { key: 'in_progress', label: 'Working on it', icon: '◐', tone: 'violet' },
  { key: 'review', label: 'Will review', icon: '◑', tone: 'gold' },
  { key: 'done', label: 'Done', icon: '●', tone: 'mint' },
];

export function statusMeta(status: TaskStatus) {
  return STATUSES.find((s) => s.key === status) ?? STATUSES[0];
}

export interface StatusBadgeProps {
  status: TaskStatus;
  /** When provided, the badge becomes a dropdown for changing the status. */
  onChange?: (status: TaskStatus) => void;
  disabled?: boolean;
  className?: string;
}

const PILL = 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 font-geist-mono text-[11px]';

export default function StatusBadge({ status, onChange, disabled, className }: StatusBadgeProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(rootRef, open, close);
  const meta = statusMeta(status);

  if (!onChange) {
    return (
      <span className={cx(PILL, TONES[meta.tone], className)}>
        <span aria-hidden>{meta.icon}</span>
        {meta.label}
      </span>
    );
  }

  return (
    <div
      ref={rootRef}
      className={cx('relative inline-block', className)}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Status: ${meta.label}. Change status`}
        onClick={() => setOpen((v) => !v)}
        className={cx(
          PILL,
          TONES[meta.tone],
          'transition-colors hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nyx-violet disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        <span aria-hidden>{meta.icon}</span>
        {meta.label}
        <span aria-hidden className="text-[9px] opacity-70">▾</span>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Task status"
          className="absolute left-0 top-full z-30 mt-1 min-w-[10rem] rounded-xl border border-nyx-border bg-nyx-menu p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
        >
          {STATUSES.map((s) => {
            const active = s.key === status;
            return (
              <li key={s.key} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    if (!active) onChange(s.key);
                  }}
                  className={cx(
                    'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left font-geist-mono text-[11.5px] transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nyx-violet',
                    active ? TONES[s.tone] : 'text-nyx-muted hover:bg-nyx-border',
                  )}
                >
                  <span aria-hidden>{s.icon}</span>
                  {s.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
