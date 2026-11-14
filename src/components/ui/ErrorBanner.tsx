'use client';

import { RiErrorWarningLine } from 'react-icons/ri';
import { cx } from './cx';

export interface ErrorBannerProps {
  /** An Error, a message string, or null/undefined to render nothing. */
  error: unknown;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function errorMessage(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  return 'Something went wrong.';
}

export default function ErrorBanner({ error, onRetry, onDismiss, className }: ErrorBannerProps) {
  if (!error) return null;
  return (
    <div
      role="alert"
      className={cx(
        'flex items-start gap-3 rounded-xl border border-nyx-coral/40 bg-nyx-coral/10 px-4 py-3 text-sm text-nyx-coral',
        className,
      )}
    >
      <RiErrorWarningLine className="mt-0.5 shrink-0" size={18} aria-hidden />
      <p className="flex-1 break-words">{errorMessage(error)}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 font-geist-mono text-xs underline underline-offset-2 hover:text-white"
        >
          Retry
        </button>
      )}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="shrink-0 font-geist-mono text-xs hover:text-white"
        >
          ✕
        </button>
      )}
    </div>
  );
}
