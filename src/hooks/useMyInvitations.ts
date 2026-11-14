'use client';

import { useEffect } from 'react';
import { acceptInvitation, deleteInvitation, listMyInvitations } from '@/lib/db/invitations';
import { useSupabase } from '@/lib/supabaseClient';
import type { ID, Invitation } from '@/lib/types';
import { useActor } from './useActor';
import { useAsync } from './useAsync';
import { USE_MOCKS } from './mocks';

const POLL_MS = 60_000;
/** Window event that makes every mounted useMyInvitations reload (e.g. after clicking an invite notification). */
export const INVITATIONS_CHANGED = 'nyx:invitations-changed';

/** Invitations waiting for the current user, with accept / decline. Refreshes every 60 s, on tab focus, and on INVITATIONS_CHANGED. */
export function useMyInvitations() {
  const sb = useSupabase();
  const actor = useActor();
  const state = useAsync<Invitation[]>(
    () => (USE_MOCKS ? Promise.resolve([]) : listMyInvitations(sb)),
    [sb, actor?.user_id],
    actor !== null,
  );
  const { reload, setData } = state;
  const userId = actor?.user_id;

  useEffect(() => {
    if (!userId) return;
    const refresh = () => document.visibilityState === 'visible' && void reload();
    const timer = setInterval(refresh, POLL_MS);
    const onChanged = () => void reload();
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener(INVITATIONS_CHANGED, onChanged);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener(INVITATIONS_CHANGED, onChanged);
    };
  }, [userId, reload]);

  const drop = (id: ID) => setData((prev) => prev?.filter((i) => i.id !== id) ?? prev);

  return {
    ...state,
    /** Joins the project. Throws on failure. */
    accept: async (id: ID) => {
      await acceptInvitation(sb, id);
      drop(id);
    },
    /** Declines. Throws on failure. */
    decline: async (id: ID) => {
      await deleteInvitation(sb, id);
      drop(id);
    },
  };
}
