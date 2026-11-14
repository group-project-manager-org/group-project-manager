import Badge, { type BadgeTone } from './Badge';
import type { TaskPriority } from '@/lib/types';

export const PRIORITIES: { key: TaskPriority; label: string; tone: BadgeTone }[] = [
  { key: 'low', label: 'Low', tone: 'mint' },
  { key: 'medium', label: 'Medium', tone: 'gold' },
  { key: 'high', label: 'High', tone: 'coral' },
];

export default function PriorityTag({ priority, className }: { priority: TaskPriority; className?: string }) {
  const meta = PRIORITIES.find((p) => p.key === priority) ?? PRIORITIES[1];
  return (
    <Badge tone={meta.tone} className={className} aria-label={`Priority: ${meta.label}`}>
      {meta.label}
    </Badge>
  );
}
