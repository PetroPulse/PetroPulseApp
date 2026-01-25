// app/customers/page.tsx
import { pool } from "@/lib/db";
import { money, pct, pctColor, moneyColor } from "@/lib/format";

const ORG_ID = "5bf35fd2-a36c-4619-9d85-66f64540b322";

type CustomerTotalsRow = {
  customer_name: string;
  revenue: string | null;
  gross_profit: string | null;
  margin_pct: string | null; // stored 0–100
  ticket_count: number | string | null;
};

export default async function CustomersPage() {
  const { rows } = await pool.query<CustomerTotalsRow>(
    `
      select
        customer_name,
        revenue,
        gross_profit,
        margin_pct,
        ticket_count
      from customer_totals
      where org_id = $1
      order by revenue desc
    `,
    [ORG_ID]
  );

  const customers = rows.map((r) => {
    const rev = Number(r.revenue ?? 0);
    const gp = Number(r.gross_profit ?? 0);
    const margin_pct_raw = Number(r.margin_pct ?? 0);
    const margin_ratio = margin_pct_raw / 100;
    const tickets = Number(r.ticket_count ?? 0);

    const margin_per_ticket = tickets === 0 ? 0 : gp / tickets;

    const trend =
      margin_ratio > 0.30 ? "up" :
      margin_ratio < 0.10 ? "down" :
      "flat";

    return {
      customer_name: r.customer_name,
      revenue: rev,
      gross_profit: gp,
      margin_ratio,
      margin_pct_raw,
      tickets,
      margin_per_ticket,
      trend,
    };
  });

  const totalRevenue = customers.reduce((s, c) => s + c.revenue, 0);
  const totalGrossProfit = customers.reduce((s, c) => s + c.gross_profit, 0);
  const totalTickets = customers.reduce((s, c) => s + c.tickets, 0);

  return (
    <main className="px-10 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="text-sm text-slate-500 mt-1">
          Your book of business, ranked by performance over the current reporting window.
        </p>
      </header>

      {/* KPI STRIP */}
      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Total Revenue</p>
          <p className="mt-2 text-xl font-semibold tabular-nums text-slate-900">
            {money(totalRevenue)}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 px-5 py-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-emerald-600">Total Gross Profit</p>
          <p className="mt-2 text-xl font-semibold tabular-nums text-emerald-700">
            {money(totalGrossProfit)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Active Customers</p>
          <p className="mt-2 text-xl font-semibold tabular-nums text-slate-900">
            {customers.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Tickets in Window</p>
          <p className="mt-2 text-xl font-semibold tabular-nums text-slate-900">
            {totalTickets}
          </p>
        </div>
      </section>

      {/* CUSTOMER LIST */}
      <section className="space-y-3">
        {customers.map((c, i) => {
          const trendIcon =
            c.trend === "up" ? "▲" :
            c.trend === "down" ? "▼" :
            "–";

          const trendColor =
            c.trend === "up" ? "text-emerald-600" :
            c.trend === "down" ? "text-rose-600" :
            "text-slate-400";

          const topGP = customers[0].gross_profit;
          const gpShare = topGP === 0 ? 0 : (c.gross_profit / topGP) * 100;

          return (
            <a
              key={c.customer_name}
              href={`/customers/${encodeURIComponent(c.customer_name)}`}
              className="block rounded-3xl border border-slate-100 bg-white px-6 py-4 shadow-sm hover:shadow-md hover:border-slate-200 transition"
            >
              <div className="flex items-start justify-between gap-4">

                {/* LEFT SECTION WITH RANK + NAME */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-1 rounded-full bg-slate-900 text-white w-7 h-7 flex items-center justify-center text-xs font-semibold">
                    {i + 1}
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {c.customer_name}
                    </p>

                    {/* RELATIVE GP BAR */}
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Relative gross profit</span>
                        <span className="tabular-nums">{money(c.gross_profit)} GP</span>
                      </div>

                      <div className="h-1.5 rounded-full bg-slate-100">
                        <div
                          className="h-1.5 rounded-full bg-slate-900"
                          style={{ width: `${Math.max(6, gpShare)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT METRIC COLUMNS */}
                <div className="grid grid-cols-5 gap-6 text-right text-[11px] text-slate-400">

                  <div>
                    <div className="uppercase tracking-wide">Revenue</div>
                    <div className="mt-1 text-sm font-semibold tabular-nums text-slate-900">
                      {money(c.revenue)}
                    </div>
                  </div>

                  <div>
                    <div className="uppercase tracking-wide">Gross Profit</div>
                    <div className={`mt-1 text-sm font-semibold tabular-nums ${moneyColor(c.gross_profit)}`}>
                      {money(c.gross_profit)}
                    </div>
                  </div>

                  <div>
                    <div className="uppercase tracking-wide">Margin</div>
                    <div className={`mt-1 text-sm font-semibold tabular-nums ${pctColor(c.margin_ratio)}`}>
                      {pct(c.margin_ratio)}
                    </div>
                  </div>

                  <div>
                    <div className="uppercase tracking-wide">Per Ticket</div>
                    <div className="mt-1 text-sm font-semibold tabular-nums text-slate-900">
                      {money(c.margin_per_ticket)}
                    </div>
                  </div>

                  <div>
                    <div className="uppercase tracking-wide">Trend</div>
                    <div className={`mt-1 text-sm font-semibold ${trendColor}`}>
                      {trendIcon}
                    </div>
                  </div>

                </div>

              </div>
            </a>
          );
        })}
      </section>
    </main>
  );
}
