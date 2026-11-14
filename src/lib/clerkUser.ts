import type { User } from '@clerk/nextjs/server';

/** Same fallback order as the client-side Actor (spec 4.5). */
export function displayName(user: User): string {
  return user.fullName ?? user.firstName ?? user.username ?? 'Member';
}
