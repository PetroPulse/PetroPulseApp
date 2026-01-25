// lib/data/dashboard.ts
import { getOrgId } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";

type Row = {
  qty: number | null;
  sell: number | null;
  cost: number | null;
  Date?: string | null; // original column is "Date"
  org_id?: string;
};

type Summary = {
  hasOrg: boolean;
  revenue30d: number;
  profit30d: number;
  margin30d: number; // %
  revenue7d: number;
};

// Accept optional orgId (API can pass ?org=...)
export async function loadDashboardSummary(passedOrgId?: string): Promise<Summary> {
  const orgId = passedOrgId ?? (await getOrgId());
  if (!orgId) return { hasOrg: false, revenue30d: 0, profit30d: 0, margin30d: 0, revenue7d: 0 };

  const supabase = createClient();

  // time windows
  const since30 = new Date(); since30.setDate(since30.getDate() - 30);
  const since7  = new Date(); since7.setDate(since7.getDate() - 7);

  // Pull only what we need with aliases for JS-friendly keys
  // Quotes keep your original column names with spaces/$
  const selectFields =
    `qty:Quantity, sell:"Sell Price ($)", cost:"Cost ($)", Date, org_id`;

  const { data: last30 } = await supabase
    .from("invoices")
    .select(selectFields)
    .eq("org_id", orgId)
    .gte("Date", since30.toISOString()); // filter using "Date"

  const { data: last7 } = await supabase
    .from("invoices")
    .select(selectFields)
    .eq("org_id", orgId)
    .gte("Date", since7.toISOString());

  const r30 = (last30 as Row[] | null) ?? [];
  const r7  = (last7  as Row[] | null) ?? [];

  // Compute revenue & cost per line from qty * price
  const revenue30d = r30.reduce((sum, r) => sum + (Number(r.qty ?? 0) * Number(r.sell ?? 0)), 0);
  const cost30d    = r30.reduce((sum, r) => sum + (Number(r.qty ?? 0) * Number(r.cost ?? 0)), 0);
  const profit30d  = revenue30d - cost30d;
  const margin30d  = revenue30d ? (profit30d / revenue30d) * 100 : 0;

  const revenue7d  = r7.reduce((sum, r) => sum + (Number(r.qty ?? 0) * Number(r.sell ?? 0)), 0);

  return { hasOrg: true, revenue30d, profit30d, margin30d, revenue7d };
}
