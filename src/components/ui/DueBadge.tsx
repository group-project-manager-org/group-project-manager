import Badge from './Badge';
import { formatDue, isUrgent } from '@/lib/utils/dates';

export interface DueBadgeProps {
  /** 'YYYY-MM-DD' */
  date: string;
  /** Tone when not urgent. Defaults to violet. */
  calmTone?: 'violet' | 'muted';
  className?: string;
}

/** "Due in 5 days" etc. Turns coral when due within 2 days or overdue. */
export default function DueBadge({ date, calmTone = 'violet', className }: DueBadgeProps) {
  return (
    <Badge tone={isUrgent(date) ? 'coral' : calmTone} className={className}>
      <time dateTime={date}>{formatDue(date)}</time>
    </Badge>
  );
}
