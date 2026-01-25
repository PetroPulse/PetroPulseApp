// lib/org.ts
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/**
 * Resolve the current org ID for the logged-in user.
 *
 * Order:
 * 1. Cookie "pp_org_id"
 * 2. user.app_metadata.org_id
 * 3. first org from members table
 * 4. Fallback to Bellman Oil (dev/default org)
 */
export async function getOrgId(): Promise<string | null> {
  const cookieStore = cookies();
  const cookieOrg = cookieStore.get("pp_org_id")?.value;
  if (cookieOrg) return cookieOrg;

  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user ?? null;

  if (user) {
    // 2. org in app_metadata
    const metaOrg =
      (user.app_metadata as Record<string, any> | undefined)?.org_id ?? null;
    if (metaOrg) return metaOrg;

    // 3. Lookup membership in "members"
    try {
      const { data: memberships } = await supabase
        .from("members")
        .select("org_id")
        .eq("user_id", user.id)
        .limit(1);

      if (memberships && memberships.length > 0 && memberships[0].org_id) {
        return memberships[0].org_id as string;
      }
    } catch (err) {
      console.error("members lookup failed", err);
    }
  }

  // 4. Final fallback – Bellman Oil org (so dev always has data)
  return "5bf35fd2-a36c-4619-9d85-66f64540b322";
}
