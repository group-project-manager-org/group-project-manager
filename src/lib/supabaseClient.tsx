import { createClient } from "@supabase/supabase-js";
import { useAuth  } from "@clerk/nextjs";

export function useSupabase() {
  const {getToken} = useAuth();

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
   {
      accessToken: async () => {
        return await getToken();
      },
    }
  )
}