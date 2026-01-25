// app/customers/[customer]/page.tsx
import { pool } from "@/lib/db";
import { money, pct } from "@/lib/format";

const ORG_ID = "5bf35fd2-a36c-4619-9d85-66f64540b322";

type InvoiceRow = {
  invoice_no: string;
  invoice_date: string | null;
  product: string | null;
  quantity: number | null;
  sell_price: string;
  cost: string;
};

function safeNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? n : 0;
}

export default async function CustomerDetailPage({
  params,
}: {
  params: { customer: string };
}) {
  const customerName = decodeURIComponent(params.customer);

  const { rows } = await pool.query<InvoiceRow>(
    `
      select
        invoice_no,
        invoice_date,
        product,
        quantity,
        sell_price,
        cost
      from invoices
      where org_id = $1
        and customer = $2
      order by invoice_date desc, invoice_no desc
    `,
    [ORG_ID, customerName]
  );

  // Normalize invoice lines with CORRECTED margin ratio
  const invoices = rows.map((r) => {
    const qty = r.quantity ?? 0;
    const sellUnit = safeNumber(r.sell_price);
    const costUnit = safeNumber(r.cost);

    const revenue = qty * sellUnit;
    const costTotal = qty * costUnit;
    const grossProfit = revenue - costTotal;

    // 🚨 FIXED: return a ratio, NOT a percent
    const marginPct =
      revenue === 0 ? 0 : grossProfit / revenue; // ratio 0–1

    return {
      ...r,
      quantity: qty,
      sell_unit: sellUnit,
      cost_unit: costUnit,
      revenue,
      cost_total: costTotal,
      gross_profit: grossProfit,
      margin_pct: marginPct,
    };
  });

  // Summary metrics (FIXED margin)
  const summary = invoices.reduce(
    (acc, r) => {
      acc.revenue += r.revenue;
      acc.gross_profit += r.gross_profit;
      acc.tickets.add(r.invoice_no);
      return acc;
    },
    {
      revenue: 0,
      gross_profit: 0,
      tickets: new Set<string>(),
    }
  );

  const ticketsInWindow = summary.tickets.size;

  // 🚨 FIXED: ratio only
  const marginPctOverall =
    summary.revenue === 0 ? 0 : summary.gross_profit / summary.revenue;

  // Top products
  const productMap = new Map<
    string,
    { revenue: number; gross_profit: number }
  >();

  for (const r of invoices) {
    const key = r.product ?? "Unknown product";
    const existing = productMap.get(key) ?? { revenue: 0, gross_profit: 0 };
    existing.revenue += r.revenue;
    existing.gross_profit += r.gross_profit;
    productMap.set(key, existing);
  }

  const topProducts = Array.from(productMap.entries())
    .map(([name, v]) => ({
      name,
      revenue: v.revenue,
      gross_profit: v.gross_profit,
    }))
    .sort((a, b) => b.gross_profit - a.gross_profit);

  const totalProductGP = topProducts.reduce(
    (sum, p) => sum + p.gross_profit,
    0
  );

  const topSkuShare =
    totalProductGP === 0 || topProducts.length === 0
      ? 0
      : topProducts[0].gross_profit / totalProductGP; // FIXED ratio

  // Margin trend (still fine — now uses ratio)
  const recentInvoices = [...invoices]
    .slice()
    .sort((a, b) => {
      const da = a.invoice_date ? new Date(a.invoice_date).getTime() : 0;
      const db = b.invoice_date ? new Date(b.invoice_date).getTime() : 0;
      return da - db;
    })
    .slice(-5);

  const marginTrendPoints = recentInvoices.map((r) => r.margin_pct);

  return (
    <main className="px-10 py-8">
      {/* HEADER */}
      <header className="mb-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
          Customer overview
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
          {customerName}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Detailed performance, gross profit, and margin visibility for this
          account.
        </p>
      </header>

      {/* TOP KPIs */}
      <section className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Revenue
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums text-slate-900">
            {money(summary.revenue)}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 px-5 py-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-600">
            Gross profit
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums text-emerald-700">
            {money(summary.gross_profit)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Margin %
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums text-slate-900">
            {pct(marginPctOverall)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Tickets
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums text-slate-900">
            {ticketsInWindow.toLocaleString()}
          </p>
        </div>
      </section>

      {/* REST OF FILE UNCHANGED — UI ONLY */}
      {/* (omitted for brevity — but yours includes the trend, products, table, insights) */}

    </main>
  );
}
