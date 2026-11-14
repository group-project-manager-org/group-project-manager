'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { listNotifications, markAllRead, markRead } from '@/lib/db/notifications';
import { useSupabase } from '@/lib/supabaseClient';
import type { AppNotification, ID } from '@/lib/types';
import { USE_MOCKS } from './mocks';
import * as m from './mockNotifications';

const POLL_MS = 60_000;

/**
 * The current user's notifications. Re-fetches every 60 s while the browser
 * tab is visible, and straight away when the tab becomes visible again.
 */
export function useNotifications(enabled: boolean) {
  const sb = useSupabase();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [loaded, setLoaded] = useState(false);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      setItems(await (USE_MOCKS ? m.mockListNotifications() : listNotifications(sb)));
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      inFlight.current = false;
      setLoaded(true);
    }
  }, [sb]);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, POLL_MS);
    const onVisible = () => document.visibilityState === 'visible' && void refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled, refresh]);

  const markOneRead = useCallback(
    async (id: ID) => {
      const now = new Date().toISOString();
      setItems((prev) => prev.map((n) => (n.id === id && !n.read_at ? { ...n, read_at: now } : n))); // optimistic
      try {
        await (USE_MOCKS ? m.mockMarkRead([id]) : markRead(sb, [id]));
      } catch (e) {
        setError(e);
        void refresh();
      }
    },
    [sb, refresh],
  );

  const markEverythingRead = useCallback(async () => {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })));
    try {
      await (USE_MOCKS ? m.mockMarkAllRead() : markAllRead(sb));
    } catch (e) {
      setError(e);
      void refresh();
    }
  }, [sb, refresh]);

  const unread = items.filter((n) => n.read_at === null).length;

  return { items, unread, error, loaded, refresh, markOneRead, markEverythingRead };
}
