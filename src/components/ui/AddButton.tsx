'use client';

import type { ButtonHTMLAttributes } from 'react';
import { cx } from './cx';

export interface AddButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
}

/** Dashed-border "+ Add" button. */
export default function AddButton({ label = 'Add', className, type = 'button', ...rest }: AddButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex items-center gap-2 rounded-xl border border-dashed border-nyx-border px-5 py-2.5',
        'font-geist-mono text-sm text-slate-400 transition-colors whitespace-nowrap',
        'hover:border-nyx-violet hover:text-nyx-violet',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nyx-violet',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...rest}
    >
      <span aria-hidden>+</span>
      {label}
    </button>
  );
}
