// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withOrg } from "@/lib/db";

/**
 * Orders list for the active org, aggregated by invoice.
 *
 * Query params:
 *  - org: org id (also accepted via x-org-id header)
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const orgFromHeader = req.headers.get("x-org-id");
  const orgFromQuery = url.searchParams.get("org");
  const orgId =
    orgFromHeader ?? orgFromQuery ?? "5bf35fd2-a36c-4619-9d85-66f64540b322";

  const payload = await withOrg(orgId, async (client) => {
    const { rows } = await client.query(
      `
      with line_level as (
        select
          invoice_no,
          invoice_date::date as date,
          coalesce(customer_name, ship_to_name, bill_to_name, 'Unknown Customer') as customer,
          product,
          (quantity::numeric) * (sell_price::numeric)                 as line_revenue,
          (quantity::numeric) * (sell_price::numeric - cost::numeric) as line_profit
        from public.invoices
        where org_id = $1
      ),
      aggregated as (
        select
          date,
          invoice_no,
          customer,
          array_agg(distinct product order by product) as products,
          sum(line_revenue)                            as revenue,
          sum(line_profit)                             as gross_profit
        from line_level
        group by date, invoice_no, customer
      )
      select
        date,
        invoice_no,
        customer,
        case
          when array_length(products, 1) = 1 then products[1]
          when array_length(products, 1) > 1 then 'Multiple products'
          else 'Unspecified'
        end as product,
        round(revenue::numeric, 2)::float8       as revenue,
        round(gross_profit::numeric, 2)::float8  as gross_profit,
        case
          when revenue > 0
            then round((gross_profit / revenue) * 100::numeric, 2)::float8
          else 0
        end                                     as margin_pct,
        'Ticketed'                              as status
      from aggregated
      order by date desc, invoice_no desc
      limit 500;
      `,
      [orgId]
    );

    return rows;
  });

  return NextResponse.json(payload);
}
