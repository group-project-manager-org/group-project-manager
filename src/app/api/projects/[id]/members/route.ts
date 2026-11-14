import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createServerSupabase } from '@/lib/supabaseServer';
import { displayName } from '@/lib/clerkUser';
import type { Member } from '@/lib/types';

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

/** POST /api/projects/[id]/members  { email } -> 201 Member. Owner only. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return fail('You must be signed in', 401);

  const projectId = Number((await params).id);
  if (!Number.isSafeInteger(projectId) || projectId <= 0) return fail('Invalid project id', 400);

  const body: unknown = await req.json().catch(() => null);
  const email =
    body && typeof body === 'object' && 'email' in body && typeof body.email === 'string'
      ? body.email.trim().toLowerCase()
      : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Enter a valid email address', 400);

  // Runs as the caller, so RLS also enforces owner-only on the insert below.
  const sb = await createServerSupabase();
  const { data: isOwner, error: ownerErr } = await sb.rpc('is_project_owner', { p_project_id: projectId });
  if (ownerErr) return fail(ownerErr.message, 500);
  if (!isOwner) return fail('Only the project owner can add members', 403);

  const clerk = await clerkClient();
  const { data: users } = await clerk.users.getUserList({ emailAddress: [email], limit: 1 });
  const user = users[0];
  if (!user) return fail('No NYX account with that email', 404);

  const { data, error } = await sb
    .from('project_members')
    .insert({
      project_id: projectId,
      user_id: user.id,
      display_name: displayName(user),
      image_url: user.imageUrl || null,
      role: 'member',
    })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') return fail('That person is already a member', 409);
    return fail(error.message, 500);
  }
  return NextResponse.json(data as Member, { status: 201 });
}
