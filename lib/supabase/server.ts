import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { supabaseKey, supabaseUrl } from "./env";

/**
 * For Server Components, Server Actions and Route Handlers that act as the signed-in
 * user. Create a new one for each request. Row Level Security applies to everything
 * it does, so this code never needs the secret key.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot set cookies. proxy.ts refreshes the session for
          // /admin requests, so nothing is lost by ignoring this during a render.
        }
      },
    },
  });
}
