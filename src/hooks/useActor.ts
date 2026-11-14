'use client';

import { useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import type { Actor } from '@/lib/types';

/**
 * The signed-in user as an `Actor` (spec §4.5), or null while Clerk is
 * loading / when signed out. Use `useUser().isLoaded` to tell those apart.
 */
export function useActor(): Actor | null {
  const { user } = useUser();

  return useMemo<Actor | null>(() => {
    if (!user) return null;
    return {
      user_id: user.id,
      display_name: user.fullName ?? user.firstName ?? user.username ?? 'Member',
      image_url: user.imageUrl ?? null,
    };
  }, [user]);
}
