import { RiStarFill } from 'react-icons/ri';
import { cx } from '@/components/ui';

export interface ConstellationMeterProps {
  /** 0–100 */
  progress: number;
  done?: number;
  total?: number;
  stars?: number;
  className?: string;
}

/** Row of small stars, filled in mint for the share of tasks done. */
export default function ConstellationMeter({ progress, done, total, stars = 10, className }: ConstellationMeterProps) {
  const pct = Math.max(0, Math.min(100, Math.round(progress)));
  const filled = Math.round((pct / 100) * stars);
  const label =
    total !== undefined && done !== undefined
      ? `${pct}% done, ${done} of ${total} task${total === 1 ? '' : 's'}`
      : `${pct}% done`;

  return (
    <div className={cx('flex items-center gap-2', className)} role="img" aria-label={label} title={label}>
      <div className="flex gap-0.5" aria-hidden>
        {Array.from({ length: stars }, (_, i) => (
          <RiStarFill
            key={i}
            size={12}
            className={cx(
              'transition-colors',
              i < filled ? 'text-nyx-mint drop-shadow-[0_0_3px_rgba(110,231,183,0.6)]' : 'text-nyx-border',
            )}
          />
        ))}
      </div>
      <span aria-hidden className="font-geist-mono text-xs text-nyx-mint">
        {pct}%
      </span>
    </div>
  );
}
