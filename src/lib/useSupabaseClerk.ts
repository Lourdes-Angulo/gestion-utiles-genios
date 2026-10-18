
import { useMemo } from "react";
import { useAuth } from "@clerk/react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Faltan las variables de entorno de Supabase.");
}

export function useSupabaseClerk() {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();

  const cliente = useMemo(
    () =>
      createClient(supabaseUrl, supabaseKey, {
        accessToken: async () => {
          return await getToken();
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }),
    [getToken]
  );

  return {
    cliente,
    isLoaded,
    isSignedIn,
    clerkUserId: userId,
  };
}
