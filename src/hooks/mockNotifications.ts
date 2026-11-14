/**
 * Mocks for src/lib/db/notifications.ts (NEXT_PUBLIC_USE_MOCKS=1).
 * Task ids match the mock tasks for project 1 (101–106), so clicking one
 * opens the Tasks tab with ?task=ID and highlights that task.
 */
import type { AppNotification, ID } from '@/lib/types';
import { delay } from './mocks';

const iso = (minsAgo: number) => new Date(Date.now() - minsAgo * 60_000).toISOString();

let store: AppNotification[] = [
  { id: 1, user_id: 'me', project_id: 1, task_id: 102, type: 'task_assigned', message: 'Maya assigned you "Draft introduction"', read_at: null, created_at: iso(12) },
  { id: 2, user_id: 'me', project_id: 1, task_id: 101, type: 'comment_added', message: 'Jordan commented on "Competitor research deck"', read_at: null, created_at: iso(65) },
  { id: 3, user_id: 'me', project_id: 1, task_id: 101, type: 'task_due_soon', message: '"Competitor research deck" is due tomorrow', read_at: null, created_at: iso(60 * 8) },
  { id: 4, user_id: 'me', project_id: 1, task_id: null, type: 'project_due_soon', message: 'Cybersecurity Assignment 1 is due in 2 days', read_at: iso(60 * 20), created_at: iso(60 * 26) },
  { id: 5, user_id: 'me', project_id: 4, task_id: null, type: 'task_overdue', message: 'Ethics Case Study has an overdue task', read_at: iso(60 * 40), created_at: iso(60 * 48) },
];

export async function mockListNotifications(opts?: { unreadOnly?: boolean }): Promise<AppNotification[]> {
  await delay(250);
  return store
    .filter((n) => !opts?.unreadOnly || n.read_at === null)
    .map((n) => ({ ...n }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function mockMarkRead(ids: ID[]): Promise<void> {
  await delay(150);
  const now = new Date().toISOString();
  store = store.map((n) => (ids.includes(n.id) && !n.read_at ? { ...n, read_at: now } : n));
}

export async function mockMarkAllRead(): Promise<void> {
  await delay(150);
  const now = new Date().toISOString();
  store = store.map((n) => (n.read_at ? n : { ...n, read_at: now }));
}
