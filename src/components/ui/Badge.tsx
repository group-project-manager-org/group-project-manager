import type { HTMLAttributes } from 'react';
import { cx } from './cx';

export type BadgeTone = 'violet' | 'gold' | 'mint' | 'coral' | 'muted';

export const TONES: Record<BadgeTone, string> = {
  violet: 'bg-nyx-violet/15 text-nyx-violet border-nyx-violet/40',
  gold: 'bg-nyx-gold/15 text-nyx-gold border-nyx-gold/40',
  mint: 'bg-nyx-mint/15 text-nyx-mint border-nyx-mint/40',
  coral: 'bg-nyx-coral/15 text-nyx-coral border-nyx-coral/40',
  muted: 'bg-transparent text-nyx-muted border-nyx-border',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

/** Small mono pill. */
export default function Badge({ tone = 'muted', className, ...rest }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 font-geist-mono text-[11px]',
        TONES[tone],
        className,
      )}
      {...rest}
    />
  );
}
