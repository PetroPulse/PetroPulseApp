import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Nicely format dollars for the UI
function formatUSD(n: number | null | undefined) {
  if (n == null) return null;
  return Number(n).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const batchId = params.id;

  // Server-side Supabase client (service role key must be server-only)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1) Fetch audit row from the view
  const { data: auditRow, error: auditErr } = await supabase
    .from("vw_batch_audit")
    .select("*")
    .eq("batch_id", batchId)
    .single();

  if (auditErr || !auditRow) {
    return NextResponse.json(
      { ok: false, error: "BATCH_NOT_FOUND", detail: auditErr?.message },
      { status: 404 }
    );
  }

  // 2) Compute totals via RPC (RETURNS TABLE -> comes back as an array)
  const { data: computedRaw, error: compErr } = await supabase.rpc(
    "get_batch_computed_totals",
    { p_batch_id: batchId }
  );

  if (compErr || !computedRaw) {
    return NextResponse.json(
      { ok: false, error: "COMPUTE_FAILED", detail: compErr?.message },
      { status: 500 }
    );
  }

  const row = Array.isArray(computedRaw) ? computedRaw[0] : computedRaw;
  const compRevenue = Number(row?.computed_revenue ?? 0);
  const compProfit  = Number(row?.computed_profit ?? 0);

  // 3) Source + adjustments from the audit view
  const srcRevenue  = Number(auditRow.source_total_revenue ?? 0);
  const srcProfit   = Number(auditRow.source_total_profit ?? 0);
  const revAdjCents = Number(auditRow.revenue_adjust_cents ?? 0);
  const prfAdjCents = Number(auditRow.profit_adjust_cents ?? 0);

  // Apply adjustments in cents to computed to produce final
  const finalRevenue = Math.round(compRevenue * 100 + revAdjCents) / 100;
  const finalProfit  = Math.round(compProfit  * 100 + prfAdjCents) / 100;

  const verified =
    Math.abs(finalRevenue - srcRevenue) <= 0.01 &&
    Math.abs(finalProfit  - srcProfit)  <= 0.01;

  return NextResponse.json({
    ok: true,
    batchId,
    totals: {
      computed: {
        revenue: compRevenue,
        profit: compProfit,
        revenueFormatted: formatUSD(compRevenue),
        profitFormatted: formatUSD(compProfit),
      },
      source: {
        revenue: srcRevenue,
        profit: srcProfit,
        revenueFormatted: formatUSD(srcRevenue),
        profitFormatted: formatUSD(srcProfit),
      },
      final: {
        revenue: finalRevenue,
        profit: finalProfit,
        revenueFormatted: formatUSD(finalRevenue),
        profitFormatted: formatUSD(finalProfit),
      },
    },
    status: verified ? "Verified to Source" : "Pending Verification",
  });
}
