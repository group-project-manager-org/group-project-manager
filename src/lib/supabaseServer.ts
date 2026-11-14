import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

/**
 * Server-side Supabase client that acts as the signed-in caller (sends their Clerk token),
 * so RLS applies exactly as it does in the browser. Use only in route handlers / server code.
 */
export async function createServerSupabase() {
  const { getToken } = await auth();
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    accessToken: async () => getToken(),
  });
}
