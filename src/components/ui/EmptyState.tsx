import type { ReactNode } from 'react';
import { cx } from './cx';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  /** Usually a Button or AddButton. */
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cx(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-nyx-border px-6 py-14 text-center',
        className,
      )}
    >
      {icon && <div className="text-3xl text-nyx-violet">{icon}</div>}
      <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
      {description && <p className="max-w-sm text-sm text-slate-400">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
