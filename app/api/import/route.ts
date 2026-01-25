// app/api/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withOrg } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { orgId, invoices } = await req.json(); // invoices = array of invoice objects

  await withOrg(orgId, async (client) => {
    const insertQuery = `
      insert into public.invoices
        (org_id, invoice_no, invoice_date, quantity, sell_price, cost, product, status)
      values
        ${invoices.map((_, i) =>
          `($1, $${i*7+2}, $${i*7+3}, $${i*7+4}, $${i*7+5}, $${i*7+6}, $${i*7+7}, $${i*7+8})`
        ).join(',')}
    `;
    const params = [
      orgId,
      ...invoices.flatMap(l => [
        l.invoice_no, l.invoice_date, l.quantity,
        l.sell_price, l.cost, l.product ?? null, l.status ?? null,
      ]),
    ];
    await client.query(insertQuery, params);
  });

  return NextResponse.json({ success: true });
}
