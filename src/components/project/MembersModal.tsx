'use client';

import { Avatar, Badge, Modal } from '@/components/ui';
import type { Member } from '@/lib/types';

export interface MembersModalProps {
  open: boolean;
  onClose: () => void;
  members: Member[];
}

/**
 * Read-only member list for now. F3 adds remove / leave and the
 * owner's add-by-email search.
 */
export default function MembersModal({ open, onClose, members }: MembersModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Members">
      <ul className="flex flex-col gap-2">
        {members.map((m) => (
          <li key={m.user_id} className="flex items-center gap-3 rounded-xl bg-nyx-bg px-3 py-2.5">
            <Avatar name={m.display_name} imageUrl={m.image_url} seed={m.user_id} size="md" />
            <span className="flex-1 truncate text-sm">{m.display_name}</span>
            <Badge tone={m.role === 'owner' ? 'gold' : 'muted'}>{m.role}</Badge>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
