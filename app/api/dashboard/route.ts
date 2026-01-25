// app/api/dashboard/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

const ORG_ID = "5bf35fd2-a36c-4619-9d85-66f64540b322";

export async function GET() {
  const client = await pool.connect();

  try {
    // KPI totals
    const { rows: totalRows } = await client.query(
      `
      select
        revenue_all,
        gross_profit_all,
        revenue_30d,
        gross_profit_30d,
        revenue_7d,
        gross_profit_7d
      from dashboard_totals
      where org_id = $1
      `,
      [ORG_ID]
    );

    const totals =
      totalRows[0] ?? {
        revenue_all: 0,
        gross_profit_all: 0,
        revenue_30d: 0,
        gross_profit_30d: 0,
        revenue_7d: 0,
        gross_profit_7d: 0,
      };

    // Daily series for chart
    const { rows: daily } = await client.query(
      `
      select day, revenue, gross_profit
      from dashboard_daily
      where org_id = $1
      order by day
      `,
      [ORG_ID]
    );

    return NextResponse.json({
      totals,
      daily,
      verified: { status: "Pending Verification" },
    });
  } finally {
    client.release();
  }
}
