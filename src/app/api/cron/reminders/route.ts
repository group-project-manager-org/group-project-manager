import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/** GET /api/cron/reminders: daily due-date reminders. Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}`. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) return NextResponse.json({ error: 'SUPABASE_SECRET_KEY is not set' }, { status: 500 });

  // Secret key = service role: bypasses RLS. Server only; it calls one function that only inserts reminders.
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false } });
  const { data, error } = await admin.rpc('create_due_reminders');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ created: data as number });
}
