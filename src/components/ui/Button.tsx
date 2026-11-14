'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cx } from './cx';
import Spinner from './Spinner';

type Variant = 'primary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-gradient-to-br from-nyx-violet to-nyx-violet-dark text-white shadow-lg shadow-nyx-violet/30 hover:brightness-110',
  ghost:
    'border border-nyx-border bg-transparent text-slate-300 hover:border-nyx-violet hover:text-nyx-violet',
  danger: 'bg-nyx-coral/15 text-nyx-coral border border-nyx-coral/40 hover:bg-nyx-coral/25',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-14 px-6 text-lg rounded-xl gap-2',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex items-center justify-center font-semibold font-geist-mono transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nyx-violet focus-visible:ring-offset-2 focus-visible:ring-offset-nyx-bg',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
});

export default Button;
