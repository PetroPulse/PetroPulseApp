// lib/supabase/admin.ts
import { createClient } from "@supabase/supabase-js";

// ⚠️ Use the SERVICE ROLE key here (keep it server-only)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default supabaseAdmin;
