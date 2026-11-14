'use client';

import { useCallback, useRef, useState, type ReactNode } from 'react';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { useDismiss } from '@/hooks/useDismiss';
import { cx } from './cx';

export interface MenuItem {
  label: string;
  onSelect: () => void;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

export interface MenuProps {
  items: MenuItem[];
  /** aria-label for the trigger, e.g. "Task options". */
  label?: string;
  align?: 'left' | 'right';
  className?: string;
}

/**
 * Three-dot dropdown. Closes on Esc, outside click, or selecting an item.
 * Stops click propagation so it is safe inside clickable cards / links.
 */
export default function Menu({ items, label = 'More options', align = 'right', className }: MenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(rootRef, open, close);

  function focusItem(delta: 1 | -1) {
    const els = Array.from(
      rootRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])') ?? [],
    );
    if (els.length === 0) return;
    const idx = els.indexOf(document.activeElement as HTMLButtonElement);
    els[(idx + delta + els.length) % els.length].focus();
  }

  return (
    <div
      ref={rootRef}
      className={cx('relative inline-block', className)}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      onKeyDown={(e) => {
        if (!open) return;
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          focusItem(1);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          focusItem(-1);
        } else if (e.key === 'Escape') {
          triggerRef.current?.focus();
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-nyx-menu hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nyx-violet"
      >
        <BsThreeDotsVertical size={16} aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className={cx(
            'absolute top-full z-30 mt-1 min-w-[10rem] rounded-xl border border-nyx-border bg-nyx-menu p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.55)]',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={cx(
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                'focus-visible:outline-none focus-visible:bg-nyx-border',
                'disabled:cursor-not-allowed disabled:opacity-40',
                item.danger
                  ? 'text-nyx-coral hover:bg-nyx-coral/15'
                  : 'text-slate-200 hover:bg-nyx-border',
              )}
            >
              {item.icon && <span aria-hidden>{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
