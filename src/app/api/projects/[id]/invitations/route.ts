import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createServerSupabase } from '@/lib/supabaseServer';
import { displayName } from '@/lib/clerkUser';
import type { Invitation } from '@/lib/types';

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

/** POST /api/projects/[id]/invitations  { email } -> 201 Invitation. Owner only; the invitee must accept to join. */
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
  if (!isOwner) return fail('Only the project owner can invite members', 403);

  const clerk = await clerkClient();
  const { data: users } = await clerk.users.getUserList({ emailAddress: [email], limit: 1 });
  const invitee = users[0];
  if (!invitee) return fail('No NYX account with that email', 404);
  if (invitee.id === userId) return fail("You're already in this project", 409);

  const [{ data: project }, { data: existing }, inviter] = await Promise.all([
    sb.from('projects').select('project_name').eq('id', projectId).single(),
    sb.from('project_members').select('user_id').eq('project_id', projectId).eq('user_id', invitee.id).maybeSingle(),
    clerk.users.getUser(userId),
  ]);
  if (existing) return fail('That person is already a member', 409);

  const { data, error } = await sb
    .from('project_invitations')
    .insert({
      project_id: projectId,
      project_name: project?.project_name ?? 'a project',
      invitee_id: invitee.id,
      invitee_name: displayName(invitee),
      invitee_image_url: invitee.imageUrl || null,
      inviter_name: displayName(inviter),
    })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') return fail('That person has already been invited', 409);
    return fail(error.message, 500);
  }
  return NextResponse.json(data as Invitation, { status: 201 });
}
