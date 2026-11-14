'use client';

import { useCallback, useEffect, useRef, useState, type DependencyList, type Dispatch, type SetStateAction } from 'react';

export interface AsyncState<T> {
  data: T | null;
  error: unknown;
  /** True during the first load and any `reload()`. */
  loading: boolean;
  /** Re-run the loader. Resolves once the new data (or error) is in state. */
  reload: () => Promise<void>;
  /** Replace data locally, e.g. for optimistic updates. */
  setData: Dispatch<SetStateAction<T | null>>;
}

/**
 * Small loader hook. Runs `fn` on mount and whenever `deps` change.
 * Responses from stale calls are ignored. Pass `enabled: false` to wait
 * (e.g. until the Supabase client / user is ready).
 *
 *   const { data: tasks, loading, error, reload } =
 *     useAsync(() => listTasks(sb, projectId), [sb, projectId]);
 */
export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList, enabled = true): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(enabled);

  // Always call the latest fn without making it a dependency.
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const callId = useRef(0);

  const run = useCallback(async () => {
    const id = ++callId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fnRef.current();
      if (id === callId.current) setData(result);
    } catch (e) {
      if (id === callId.current) setError(e);
    } finally {
      if (id === callId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void run();
    return () => {
      // Invalidate in-flight calls when deps change or on unmount.
      callId.current++;
    };
    // Callers own the dependency list, like useEffect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, run, ...deps]);

  return { data, error, loading, reload: run, setData };
}
