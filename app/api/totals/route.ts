// app/api/totals/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

const FALLBACK_ORG_ID = "5bf35fd2-a36c-4619-9d85-66f64540b322"; // Bellman

function normalizeOrgId(raw: string | null): string {
  if (!raw) return FALLBACK_ORG_ID;

  // Simple UUID pattern check – if it fails, fall back to Bellman
  const uuidPattern =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

  return uuidPattern.test(raw) ? raw : FALLBACK_ORG_ID;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const orgId = normalizeOrgId(url.searchParams.get("org"));

  const client = await pool.connect();
  try {
    // ---- ALL-TIME TOTALS ----
    const totalsAll = await client.query(
      `
      select
        round(sum(line_revenue_2)::numeric, 2)                       as revenue_all,
        round(sum(line_revenue_2 - line_cost_2)::numeric, 2)         as gross_profit_all,
        case
          when sum(line_revenue_2) = 0 then 0
          else round(
            sum(line_revenue_2 - line_cost_2)
            / sum(line_revenue_2) * 100::numeric,
            2
          )
        end                                                        as margin_pct_all
      from invoice_lines_clean
      where org_id = $1;
      `,
      [orgId]
    );

    // ---- LAST 30 DAYS ----
    const totals30 = await client.query(
      `
      select
        round(sum(line_revenue_2)::numeric, 2)                       as revenue_30d,
        round(sum(line_revenue_2 - line_cost_2)::numeric, 2)         as gross_profit_30d,
        case
          when sum(line_revenue_2) = 0 then 0
          else round(
            sum(line_revenue_2 - line_cost_2)
            / sum(line_revenue_2) * 100::numeric,
            2
          )
        end                                                        as margin_pct_30d
      from invoice_lines_clean
      where org_id = $1
        and invoice_date >= current_date - interval '30 days';
      `,
      [orgId]
    );

    // ---- LAST 7 DAYS ----
    const totals7 = await client.query(
      `
      select
        round(sum(line_revenue_2)::numeric, 2)                       as revenue_7d,
        round(sum(line_revenue_2 - line_cost_2)::numeric, 2)         as gross_profit_7d,
        case
          when sum(line_revenue_2) = 0 then 0
          else round(
            sum(line_revenue_2 - line_cost_2)
            / sum(line_revenue_2) * 100::numeric,
            2
          )
        end                                                        as margin_pct_7d
      from invoice_lines_clean
      where org_id = $1
        and invoice_date >= current_date - interval '7 days';
      `,
      [orgId]
    );

    // ---- DAILY SERIES FOR AREA CHART (last 30 days) ----
    const daily = await client.query(
      `
      select
        invoice_date::date                                          as day,
        round(sum(line_revenue_2)::numeric, 2)                       as revenue,
        round(sum(line_revenue_2 - line_cost_2)::numeric, 2)         as gross_profit
      from invoice_lines_clean
      where org_id = $1
        and invoice_date >= current_date - interval '30 days'
      group by day
      order by day;
      `,
      [orgId]
    );

    // ---- TOP PRODUCTS FOR BAR CHART ----
    const products = await client.query(
      `
      select
        product,
        round(sum(line_revenue_2)::numeric, 2)                       as revenue,
        round(sum(line_revenue_2 - line_cost_2)::numeric, 2)         as gross_profit
      from invoice_lines_clean
      where org_id = $1
      group by product
      order by revenue desc
      limit 10;
      `,
      [orgId]
    );

    client.release();

    const all = totalsAll.rows[0] ?? {};
    const d30 = totals30.rows[0] ?? {};
    const d7 = totals7.rows[0] ?? {};

    return NextResponse.json({
      verified: { status: "Pending Verification" as const },

      // Shape for the top cards
      totals: {
        revenue_all: Number(all.revenue_all ?? 0),
        gross_profit_all: Number(all.gross_profit_all ?? 0),
        margin_pct_all: Number(all.margin_pct_all ?? 0),

        revenue_30d: Number(d30.revenue_30d ?? 0),
        gross_profit_30d: Number(d30.gross_profit_30d ?? 0),
        margin_pct_30d: Number(d30.margin_pct_30d ?? 0),

        revenue_7d: Number(d7.revenue_7d ?? 0),
        gross_profit_7d: Number(d7.gross_profit_7d ?? 0),
        margin_pct_7d: Number(d7.margin_pct_7d ?? 0),
      },

      // For AreaRevenue chart
      daily: daily.rows.map((r) => ({
        day: r.day.toISOString().slice(0, 10),
        revenue: Number(r.revenue ?? 0),
        gross_profit: Number(r.gross_profit ?? 0),
      })),

      // For BarProduct chart
      products: products.rows.map((r) => ({
        product: r.product ?? "Unknown",
        revenue: Number(r.revenue ?? 0),
        gross_profit: Number(r.gross_profit ?? 0),
      })),
    });
  } catch (err) {
    console.error("Error in /api/totals", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
