'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { IconType } from 'react-icons';
import {
  RiAlarmLine,
  RiCalendarEventLine,
  RiChat3Line,
  RiErrorWarningLine,
  RiMailLine,
  RiNotification3Line,
  RiUserAddLine,
} from 'react-icons/ri';
import { ErrorBanner, Spinner, cx, timeAgo } from '@/components/ui';
import { useDismiss } from '@/hooks/useDismiss';
import { INVITATIONS_CHANGED } from '@/hooks/useMyInvitations';
import { useNotifications } from '@/hooks/useNotifications';
import type { AppNotification, NotificationType } from '@/lib/types';

const TYPE_META: Record<NotificationType, { icon: IconType; color: string }> = {
  task_due_soon: { icon: RiAlarmLine, color: 'text-nyx-gold' },
  task_overdue: { icon: RiErrorWarningLine, color: 'text-nyx-coral' },
  project_due_soon: { icon: RiCalendarEventLine, color: 'text-nyx-gold' },
  task_assigned: { icon: RiUserAddLine, color: 'text-nyx-violet' },
  comment_added: { icon: RiChat3Line, color: 'text-nyx-mint' },
  project_invite: { icon: RiMailLine, color: 'text-nyx-violet' },
};

const SHOW_MAX = 20;

/** Bell with unread count; the dropdown lists notifications and links to the project / task. */
export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(rootRef, open, close);

  const { items, unread, error, loaded, refresh, markOneRead, markEverythingRead } = useNotifications(true);

  function openItem(n: AppNotification) {
    if (!n.read_at) void markOneRead(n.id);
    setOpen(false);
    // The invitee can't open the project until they accept; invitations are listed on the home page.
    if (n.type === 'project_invite') {
      window.dispatchEvent(new Event(INVITATIONS_CHANGED)); // refresh the list if home is already open
      router.push('/#invitations-heading');
    } else if (n.project_id !== null) {
      router.push(`/project/${n.project_id}${n.task_id !== null ? `?task=${n.task_id}` : ''}`);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) void refresh();
        }}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        className="relative rounded-full p-2 text-slate-300 transition-colors hover:bg-nyx-menu hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nyx-violet"
      >
        <RiNotification3Line size={20} aria-hidden />
        {unread > 0 && (
          <span
            aria-hidden
            className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-nyx-coral px-1 font-geist-mono text-[10px] font-bold text-nyx-bg"
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-nyx-border bg-nyx-menu shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
        >
          <div className="flex items-center justify-between border-b border-nyx-border px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-100">Notifications</h2>
            <button
              type="button"
              onClick={() => void markEverythingRead()}
              disabled={unread === 0}
              className="rounded font-geist-mono text-[11px] text-nyx-violet hover:underline disabled:text-nyx-muted disabled:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nyx-violet"
            >
              Mark all read
            </button>
          </div>

          {error ? (
            <div className="p-3">
              <ErrorBanner error={error} onRetry={() => void refresh()} />
            </div>
          ) : !loaded ? (
            <div className="flex justify-center py-8">
              <Spinner label="Loading notifications" />
            </div>
          ) : items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-nyx-muted">You&apos;re all caught up.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {items.slice(0, SHOW_MAX).map((n) => {
                const meta = TYPE_META[n.type];
                const Icon = meta.icon;
                const isUnread = n.read_at === null;
                return (
                  <li key={n.id} className="border-b border-nyx-border/60 last:border-0">
                    <button
                      type="button"
                      onClick={() => openItem(n)}
                      className={cx(
                        'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-nyx-border/50 focus-visible:bg-nyx-border/50 focus-visible:outline-none',
                        isUnread && 'bg-nyx-violet/5',
                      )}
                    >
                      <Icon size={18} aria-hidden className={cx('mt-0.5 shrink-0', meta.color)} />
                      <span className="min-w-0 flex-1">
                        <span className={cx('block break-words text-[13px] leading-snug', isUnread ? 'text-slate-100' : 'text-slate-400')}>
                          {n.message}
                        </span>
                        <time dateTime={n.created_at} className="mt-0.5 block font-geist-mono text-[10.5px] text-nyx-muted">
                          {timeAgo(n.created_at)}
                        </time>
                      </span>
                      {isUnread && <span aria-label="Unread" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-nyx-violet" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
