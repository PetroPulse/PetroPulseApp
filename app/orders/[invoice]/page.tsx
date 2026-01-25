// app/orders/[invoice]/page.tsx
import Link from "next/link";
import { pool } from "@/lib/db";
import { money, pct } from "@/lib/format";

const ORG_ID = "5bf35fd2-a36c-4619-9d85-66f64540b322";

type InvoiceLine = {
  invoice_no: string;
  invoice_date: string;
  customer: string;
  product: string;
  quantity: number;
  sell_price: number;
  cost: number;
  revenue: number;
  gross_profit: number;
  margin_ratio: number; // 0–1 ratio
};

// Safe date formatter
function formatInvoiceDate(raw: string | null | undefined): string {
  if (!raw) return "Unknown date";
  const str = String(raw);

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(str);
  const date = isDateOnly ? new Date(str + "T00:00:00") : new Date(str);

  if (isNaN(date.getTime())) return str;

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function InvoiceDetail({
  params,
}: {
  params: { invoice: string };
}) {
  const invoiceBase = decodeURIComponent(params.invoice);

  const client = await pool.connect();
  let lines: InvoiceLine[] = [];

  try {
    const { rows } = await client.query(
      `
      SELECT
        invoice_no,
        invoice_date,
        COALESCE(customer, 'Unknown customer') AS customer,
        COALESCE(product, 'Unspecified') AS product,
        quantity::numeric AS quantity,
        sell_price::numeric AS sell_price,
        cost::numeric AS cost,
        (quantity::numeric * sell_price::numeric) AS revenue,
        (quantity::numeric * (sell_price::numeric - cost::numeric)) AS gross_profit
      FROM public.invoices
      WHERE org_id = $1
        AND (
          invoice_no::text = $2
          OR invoice_no::text LIKE $2 || '-%'
        )
      ORDER BY invoice_no::text, product;
      `,
      [ORG_ID, invoiceBase]
    );

    lines = rows.map((r: any) => {
      const revenue = Number(r.revenue ?? 0);
      const gp = Number(r.gross_profit ?? 0);

      return {
        invoice_no: String(r.invoice_no ?? ""),
        invoice_date: String(r.invoice_date ?? ""),
        customer: String(r.customer ?? ""),
        product: String(r.product ?? ""),
        quantity: Number(r.quantity ?? 0),
        sell_price: Number(r.sell_price ?? 0),
        cost: Number(r.cost ?? 0),
        revenue,
        gross_profit: gp,
        margin_ratio: revenue > 0 ? gp / revenue : 0, // *** FIXED ***
      };
    });
  } finally {
    client.release();
  }

  // No results → show empty page
  if (lines.length === 0) {
    return (
      <div className="p-6 space-y-4">
        <Link
          href="/orders"
          className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
        >
          ← Back to orders
        </Link>

        <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No invoice found for <strong>{invoiceBase}</strong>.
        </div>
      </div>
    );
  }

  const header = lines[0];
  const displayDate = formatInvoiceDate(header.invoice_date);

  // --- Ticket summary math (correct now) ---
  const totalRevenue = lines.reduce((s, l) => s + l.revenue, 0);
  const totalGp = lines.reduce((s, l) => s + l.gross_profit, 0);
  const totalMarginRatio = totalRevenue > 0 ? totalGp / totalRevenue : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Ticket detail
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Ticket #{invoiceBase}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {displayDate} · {header.customer}
          </p>
        </div>

        <Link
          href="/orders"
          className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
        >
          ← Back to orders
        </Link>
      </div>

      {/* Summary Cards */}
      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Revenue
          </div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {money(totalRevenue)}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-4 shadow-sm">
          <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-700">
            Gross profit
          </div>
          <div className="mt-1 text-lg font-semibold text-emerald-700">
            {money(totalGp)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
            Margin
          </div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {pct(totalMarginRatio)}
          </div>
        </div>
      </section>

      {/* Line Items */}
      <section className="rounded-3xl border border-slate-200/70 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Sell</th>
                <th className="px-4 py-3 text-right">Cost</th>
                <th className="px-4 py-3 text-right">Revenue</th>
                <th className="px-4 py-3 text-right">Profit</th>
                <th className="px-4 py-3 text-right">Margin %</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr
                  key={`${line.invoice_no}-${line.product}-${idx}`}
                  className="border-b border-slate-100 last:border-none"
                >
                  <td className="px-4 py-3 text-left text-[12px] text-slate-800">
                    {line.product}
                  </td>
                  <td className="px-4 py-3 text-right text-[12px] text-slate-800">
                    {line.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-[12px] text-slate-800">
                    {money(line.sell_price)}
                  </td>
                  <td className="px-4 py-3 text-right text-[12px] text-slate-800">
                    {money(line.cost)}
                  </td>
                  <td className="px-4 py-3 text-right text-[12px] text-slate-800">
                    {money(line.revenue)}
                  </td>
                  <td className="px-4 py-3 text-right text-[12px] text-slate-800">
                    {money(line.gross_profit)}
                  </td>
                  <td className="px-4 py-3 text-right text-[12px] text-slate-800">
                    {pct(line.margin_ratio)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
