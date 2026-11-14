'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Avatar, Badge, Button, ErrorBanner, Modal, Spinner, cx } from '@/components/ui';
import { useActor } from '@/hooks/useActor';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useProjectActions } from '@/hooks/useProjectActions';
import type { UserSearchResult } from '@/lib/api';
import type { ID, Invitation, Member, ProjectSummary } from '@/lib/types';

export interface MembersModalProps {
  open: boolean;
  onClose: () => void;
  project: ProjectSummary;
  /** Called after a member is removed, so the parent can reload. */
  onChanged: () => void | Promise<void>;
  /** Called after the current user leaves the project. */
  onLeft: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function MembersModal({ open, onClose, project, onChanged, onLeft }: MembersModalProps) {
  const actor = useActor();
  const isOwner = project.my_role === 'owner';

  // Owner first, then by join date.
  const members = [...project.members].sort(
    (a, b) => Number(b.role === 'owner') - Number(a.role === 'owner') || a.joined_at.localeCompare(b.joined_at),
  );

  return (
    <Modal open={open} onClose={onClose} title={`Members · ${project.members.length}`}>
      {isOwner && open && <OwnerInvites project={project} />}

      <ul className={cx('flex flex-col gap-2', isOwner && 'mt-5')}>
        {members.map((m) => (
          <MemberRow
            key={m.user_id}
            member={m}
            project={project}
            isMe={m.user_id === actor?.user_id}
            onRemoved={async (wasMe) => {
              if (wasMe) onLeft();
              else await onChanged();
            }}
          />
        ))}
      </ul>
    </Modal>
  );
}

function MemberRow({
  member,
  project,
  isMe,
  onRemoved,
}: {
  member: Member;
  project: ProjectSummary;
  isMe: boolean;
  onRemoved: (wasMe: boolean) => Promise<void>;
}) {
  const { removeMember } = useProjectActions();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const isOwnerRow = member.role === 'owner';
  const canRemove = project.my_role === 'owner' && !isOwnerRow && !isMe;
  const canLeave = isMe && !isOwnerRow;
  const action = canRemove ? 'Remove' : canLeave ? 'Leave project' : null;

  async function run() {
    setBusy(true);
    setError(null);
    try {
      await removeMember(project.id, member.user_id);
      await onRemoved(isMe);
    } catch (e) {
      setError(e);
      setBusy(false);
    }
  }

  return (
    <li className="rounded-xl bg-nyx-bg px-3 py-2.5">
      <div className="flex items-center gap-3">
        <Avatar name={member.display_name} imageUrl={member.image_url} seed={member.user_id} size="md" />
        <span className="min-w-0 flex-1 truncate text-sm">
          {member.display_name}
          {isMe && <span className="ml-1.5 text-nyx-muted">(you)</span>}
        </span>
        <Badge tone={isOwnerRow ? 'gold' : 'muted'}>{member.role}</Badge>

        {action && !confirming && (
          <Button variant={canLeave ? 'danger' : 'ghost'} size="sm" onClick={() => setConfirming(true)}>
            {action}
          </Button>
        )}
      </div>

      {confirming && (
        <div className="mt-2.5 flex flex-wrap items-center justify-end gap-2 border-t border-nyx-border pt-2.5">
          <span className="mr-auto text-xs text-slate-300">
            {canLeave
              ? "Leave this project? You'll lose access until the owner invites you again."
              : `Remove ${member.display_name} from this project?`}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={run} loading={busy}>
            {canLeave ? 'Leave' : 'Remove'}
          </Button>
        </div>
      )}
      <ErrorBanner error={error} className="mt-2" />
    </li>
  );
}

/** Invite form plus the list of invitations still waiting for an answer. Owner only. */
function OwnerInvites({ project }: { project: ProjectSummary }) {
  const { listProjectInvitations, cancelInvitation } = useProjectActions();
  const [pending, setPending] = useState<Invitation[]>([]);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let stale = false;
    listProjectInvitations(project.id)
      .then((list) => !stale && setPending(list))
      .catch((e) => !stale && setError(e));
    return () => {
      stale = true;
    };
  }, [project.id, listProjectInvitations]);

  async function cancel(id: ID) {
    setError(null);
    try {
      await cancelInvitation(id);
      setPending((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      setError(e);
    }
  }

  return (
    <>
      <InviteForm
        project={project}
        pendingIds={new Set(pending.map((i) => i.invitee_id))}
        onInvited={(inv) => setPending((prev) => [...prev, inv])}
      />
      {pending.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 font-geist-mono text-xs uppercase tracking-wider text-nyx-muted">
            Waiting to accept · {pending.length}
          </h3>
          <ul className="flex flex-col gap-2">
            {pending.map((inv) => (
              <li key={inv.id} className="flex items-center gap-3 rounded-xl bg-nyx-bg px-3 py-2.5">
                <Avatar name={inv.invitee_name} imageUrl={inv.invitee_image_url} seed={inv.invitee_id} size="md" />
                <span className="min-w-0 flex-1 truncate text-sm">{inv.invitee_name}</span>
                <Badge tone="muted">invited</Badge>
                <Button variant="ghost" size="sm" onClick={() => void cancel(inv.id)}>
                  Cancel
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <ErrorBanner error={error} className="mt-2" />
    </>
  );
}

function InviteForm({
  project,
  pendingIds,
  onInvited,
}: {
  project: ProjectSummary;
  pendingIds: Set<string>;
  onInvited: (inv: Invitation) => void;
}) {
  const { inviteByEmail, searchUsers } = useProjectActions();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [invited, setInvited] = useState<string | null>(null);

  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const query = useDebouncedValue(email.trim().toLowerCase(), 300);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }
    let stale = false;
    setSearching(true);
    searchUsers(query)
      .then((r) => !stale && setResults(r))
      // Search is only a convenience; typing the full email and pressing Invite still works.
      .catch(() => !stale && setResults([]))
      .finally(() => !stale && setSearching(false));
    return () => {
      stale = true;
    };
  }, [query, searchUsers]);

  const memberIds = new Set(project.members.map((m) => m.user_id));
  const suggestions = results.filter((r) => !memberIds.has(r.user_id) && !pendingIds.has(r.user_id));

  async function invite(target: string) {
    const value = target.trim().toLowerCase();
    if (!EMAIL_RE.test(value)) {
      setError('Enter a full email address, e.g. alex@uni.edu');
      return;
    }
    setSending(true);
    setError(null);
    setInvited(null);
    try {
      const inv = await inviteByEmail(project.id, value);
      setEmail('');
      setResults([]);
      setInvited(inv.invitee_name);
      onInvited(inv);
    } catch (e) {
      setError(e);
    } finally {
      setSending(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void invite(email);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <label htmlFor="member-email" className="text-sm font-medium text-slate-300">
        Invite a member by email
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            id="member-email"
            type="email"
            autoComplete="off"
            placeholder="classmate@uni.edu"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
              setInvited(null);
            }}
            className="w-full rounded-lg border border-nyx-border bg-nyx-bg px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-colors focus:border-nyx-violet"
          />
          {searching && <Spinner size="sm" className="absolute right-3 top-3" label="Searching" />}
        </div>
        <Button type="submit" loading={sending} disabled={!email.trim()}>
          Invite
        </Button>
      </div>

      {suggestions.length > 0 && (
        <ul aria-label="Matching accounts" className="flex flex-col gap-1 rounded-xl border border-nyx-border p-1.5">
          {suggestions.map((u) => (
            <li key={u.user_id}>
              <button
                type="button"
                disabled={sending}
                onClick={() => void invite(u.email)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-nyx-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nyx-violet disabled:opacity-50"
              >
                <Avatar name={u.display_name} imageUrl={u.image_url} seed={u.user_id} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{u.display_name}</span>
                  <span className="block truncate font-geist-mono text-[11px] text-nyx-muted">{u.email}</span>
                </span>
                <span className="font-geist-mono text-xs text-nyx-violet">+ Invite</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <ErrorBanner error={error} />
      {invited && (
        <p role="status" className="font-geist-mono text-xs text-nyx-mint">
          {invited} has been invited. They&apos;ll join once they accept.
        </p>
      )}
    </form>
  );
}
