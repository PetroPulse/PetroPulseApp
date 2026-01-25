// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

/**
 * Supabase server client for Next.js App Router
 * - Uses the ANON key (safe for RLS)
 * - Reads cookies/headers for auth + org context
 */
export function createClient() {
  const cookieStore = cookies();
  const headerStore = headers();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // We don't set/remove cookies from server components
        set() {},
        remove() {},
      },
      headers: {
        get(name: string) {
          return headerStore.get(name) ?? undefined;
        },
      },
    }
  );
}

// Some files might import default
export default createClient;

// Admin client (service_role) for backend jobs only
export { supabaseAdmin } from "./admin";
