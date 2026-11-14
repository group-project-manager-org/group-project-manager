const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Parses 'YYYY-MM-DD' as local midnight. `new Date('YYYY-MM-DD')` would parse it as UTC. */
function parseYmd(dateYmd: string): Date {
  const [y, m, d] = dateYmd.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Calendar days from today to the date, in local time. Negative if past. */
export function daysUntil(dateYmd: string, now: Date = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // round, not floor: a DST shift makes one day 23 or 25 hours long
  return Math.round((parseYmd(dateYmd).getTime() - today.getTime()) / DAY_MS);
}

/** Due within 2 days, or overdue. */
export function isUrgent(dateYmd: string): boolean {
  return daysUntil(dateYmd) <= 2;
}

/** "Due today" | "Due tomorrow" | "Due in 5 days" | "Overdue by 2 days" | "Due 12 Dec" (more than 14 days away). */
export function formatDue(dateYmd: string): string {
  const days = daysUntil(dateYmd);
  if (days < 0) return `Overdue by ${-days} day${days === -1 ? '' : 's'}`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days <= 14) return `Due in ${days} days`;
  const d = parseYmd(dateYmd);
  return `Due ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** Local 'YYYY-MM-DD', e.g. for <input type="date" min>. */
export function todayYmd(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
