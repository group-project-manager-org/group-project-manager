import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { displayName } from '@/lib/clerkUser';
import type { UserSearchResult } from '@/lib/api';

/** GET /api/users/search?q= -> up to 5 users whose email starts with q (q.length >= 3). */
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'You must be signed in' }, { status: 401 });

  const q = (new URL(req.url).searchParams.get('q') ?? '').trim().toLowerCase();
  if (q.length < 3) {
    return NextResponse.json({ error: 'Type at least 3 characters' }, { status: 400 });
  }

  // Clerk's `query` also matches names and usernames, so keep only email-prefix matches.
  const clerk = await clerkClient();
  const { data: users } = await clerk.users.getUserList({ query: q, limit: 20 });

  const results: UserSearchResult[] = [];
  for (const user of users) {
    const email = user.emailAddresses.find((e) => e.emailAddress.toLowerCase().startsWith(q))?.emailAddress;
    if (!email) continue;
    results.push({ user_id: user.id, display_name: displayName(user), image_url: user.imageUrl || null, email });
    if (results.length === 5) break;
  }
  return NextResponse.json(results);
}
