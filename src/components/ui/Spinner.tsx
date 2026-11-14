import { cx } from './cx';

const SIZES = { sm: 'h-4 w-4 border-2', md: 'h-6 w-6 border-2', lg: 'h-10 w-10 border-[3px]' } as const;

export interface SpinnerProps {
  size?: keyof typeof SIZES;
  className?: string;
  /** Accessible label; announced to screen readers. */
  label?: string;
}

export default function Spinner({ size = 'md', className, label = 'Loading' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cx(
        'inline-block animate-spin rounded-full border-current border-t-transparent text-nyx-violet',
        SIZES[size],
        className,
      )}
    />
  );
}

/** Centered spinner for a whole section / page while loading. */
export function LoadingBlock({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
      <Spinner size="lg" label={label} />
      <span className="font-geist-mono text-xs">{label}…</span>
    </div>
  );
}
