// One-off: replace the placeholder name 'Owner' (set by the 0001 backfill and the owner trigger) with each
// user's real Clerk name and avatar in project_members.
// Needs CLERK_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local.
// Run from the repo root:  node --env-file=.env.local scripts/backfill-member-names.mjs
import { createClient } from '@supabase/supabase-js';

const { CLERK_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!CLERK_SECRET_KEY || !NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('Missing CLERK_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local');
  process.exit(1);
}

// Secret key bypasses RLS: this script only updates name/avatar on rows still named 'Owner'.
const db = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

const { data: rows, error } = await db.from('project_members').select('user_id').eq('display_name', 'Owner');
if (error) throw error;
const userIds = [...new Set(rows.map((r) => r.user_id))];
console.log(`${rows.length} row(s) named 'Owner' across ${userIds.length} user(s)`);

let fixed = 0;
for (const userId of userIds) {
  const res = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` },
  });
  if (!res.ok) {
    console.warn(`  ${userId}: Clerk lookup failed (${res.status}), skipped`);
    continue;
  }
  const u = await res.json();
  // Same fallback order as the app's Actor: full name, first name, username.
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || 'Member';
  const { error: upErr, count } = await db
    .from('project_members')
    .update({ display_name: name, image_url: u.image_url || null }, { count: 'exact' })
    .eq('user_id', userId)
    .eq('display_name', 'Owner');
  if (upErr) throw upErr;
  fixed += count ?? 0;
  console.log(`  ${userId}: "${name}" (${count} row(s))`);
}
console.log(`Done: ${fixed} row(s) updated.`);
