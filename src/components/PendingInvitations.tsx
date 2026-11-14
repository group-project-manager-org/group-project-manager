'use client';

import { useState } from 'react';
import { RiMailLine } from 'react-icons/ri';
import { Button, Card, ErrorBanner, timeAgo } from '@/components/ui';
import type { ID, Invitation } from '@/lib/types';

export interface PendingInvitationsProps {
  invitations: Invitation[];
  onAccept: (id: ID) => Promise<void>;
  onDecline: (id: ID) => Promise<void>;
}

/** Invitations waiting for the current user, shown above their projects on the home page. */
export default function PendingInvitations({ invitations, onAccept, onDecline }: PendingInvitationsProps) {
  if (invitations.length === 0) return null;
  return (
    <section aria-labelledby="invitations-heading" className="mx-auto mb-8 w-full max-w-3xl">
      <h2 id="invitations-heading" className="mb-3 font-geist-mono text-sm uppercase tracking-wider text-nyx-violet">
        Invitations · {invitations.length}
      </h2>
      <ul className="flex flex-col gap-3">
        {invitations.map((inv) => (
          <InvitationRow key={inv.id} invitation={inv} onAccept={onAccept} onDecline={onDecline} />
        ))}
      </ul>
    </section>
  );
}

function InvitationRow({
  invitation,
  onAccept,
  onDecline,
}: {
  invitation: Invitation;
  onAccept: (id: ID) => Promise<void>;
  onDecline: (id: ID) => Promise<void>;
}) {
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null);
  const [error, setError] = useState<unknown>(null);

  async function run(kind: 'accept' | 'decline') {
    setBusy(kind);
    setError(null);
    try {
      await (kind === 'accept' ? onAccept : onDecline)(invitation.id);
    } catch (e) {
      setError(e);
      setBusy(null);
    }
  }

  return (
    <li>
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <RiMailLine size={22} aria-hidden className="hidden shrink-0 text-nyx-violet sm:block" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-100">
            <span className="font-semibold">{invitation.inviter_name}</span> invited you to join{' '}
            <span className="font-semibold">{invitation.project_name}</span>
          </p>
          <time dateTime={invitation.created_at} className="font-geist-mono text-[11px] text-nyx-muted">
            {timeAgo(invitation.created_at)}
          </time>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => run('decline')} loading={busy === 'decline'} disabled={busy !== null}>
            Decline
          </Button>
          <Button size="sm" onClick={() => run('accept')} loading={busy === 'accept'} disabled={busy !== null}>
            Accept
          </Button>
        </div>
      </Card>
      <ErrorBanner error={error} className="mt-2" />
    </li>
  );
}
