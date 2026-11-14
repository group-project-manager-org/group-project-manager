import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";

/**
 * Supabase client that sends the current Clerk session token, so RLS sees the Clerk user id.
 * The client is created once per component instance (stable identity, safe as an effect dependency).
 */
export function useSupabase() {
  const { getToken } = useAuth();

  // The client is built once, so it reads the latest getToken through a ref.
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const [client] = useState(() =>
    createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        // Clerk can't issue tokens during server prerender; send no token there.
        accessToken: async () => (typeof window === "undefined" ? null : await getTokenRef.current()),
      },
    ),
  );

  return client;
}
