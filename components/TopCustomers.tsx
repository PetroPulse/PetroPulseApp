// components/TopCustomers.tsx
"use client";

import { useMemo, useState } from "react";
import { money, pct } from "@/lib/format";

type Customer = {
  customer_name: string;
  revenue: number;
  gross_profit: number;
  margin_pct: number;
  ticket_count: number;
};

type Props = {
  customers: Customer[];
};

type Metric = "gp" | "revenue";

export default function TopCustomers({ customers }: Props) {
  const [metric, setMetric] = useState<Metric>("gp");

  const { top10, maxValue, totalGp, totalRevenue } = useMemo(() => {
    const sorted = [...customers].sort((a, b) =>
      metric === "gp"
        ? b.gross_profit - a.gross_profit
        : b.revenue - a.revenue
    );

    const slice = sorted.slice(0, 10);

    const max =
      metric === "gp"
        ? Math.max(...slice.map((c) => c.gross_profit || 0), 1)
        : Math.max(...slice.map((c) => c.revenue || 0), 1);

    const totalGp = slice.reduce((sum, c) => sum + (c.gross_profit || 0), 0);
    const totalRevenue = slice.reduce(
      (sum, c) => sum + (c.revenue || 0),
      0
    );

    return { top10: slice, maxValue: max, totalGp, totalRevenue };
  }, [customers, metric]);

  if (!customers || customers.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white px-4 py-6 text-sm text-slate-500 shadow-sm">
        No customer data yet. Import invoices to see which accounts are
        actually carrying the book.
      </div>
    );
  }

  const anchor = top10[0];

  return (
    <div className="rounded-3xl border border-slate-100 bg-white px-5 py-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Customers
          </div>
          <h2 className="mt-1 text-sm font-semibold text-slate-900">
            Top accounts · Last 30 days
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Ranked by {metric === "gp" ? "gross profit" : "revenue"} so you
            can see who’s really driving Bellman&apos;s book.
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 text-right">
          <div className="inline-flex items-center rounded-full bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600">
            <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Anchor account:
            <span className="ml-1 truncate max-w-[140px] text-slate-900">
              {anchor?.customer_name ?? "—"}
            </span>
          </div>

          <div className="text-[11px] text-slate-500">
            Top 10 GP{" "}
            <span className="font-semibold text-emerald-700">
              {money(totalGp)}
            </span>{" "}
            · Top 10 revenue{" "}
            <span className="font-semibold text-slate-900">
              {money(totalRevenue)}
            </span>
          </div>

          {/* Metric toggle */}
          <div className="mt-1 inline-flex items-center rounded-full bg-slate-100 p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setMetric("gp")}
              className={`rounded-full px-2 py-0.5 transition ${
                metric === "gp"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600"
              }`}
            >
              GP focus
            </button>
            <button
              type="button"
              onClick={() => setMetric("revenue")}
              className={`rounded-full px-2 py-0.5 transition ${
                metric === "revenue"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600"
              }`}
            >
              Revenue focus
            </button>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="space-y-2">
        {top10.map((c, index) => {
          const value = metric === "gp" ? c.gross_profit : c.revenue;
          const pctOfTop = Math.max(4, Math.round((value / maxValue) * 100));

          const rank =
            index === 0 ? "bg-amber-500" : index === 1 ? "bg-slate-300" : index === 2 ? "bg-amber-300" : "bg-slate-100";

          return (
            <div
              key={c.customer_name}
              className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 transition hover:border-emerald-200 hover:bg-white hover:shadow-[0_12px_30px_rgba(16,185,129,0.15)]"
            >
              <div className="flex items-center justify-between gap-3">
                {/* Left: rank + name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-slate-900 ${rank}`}
                  >
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-slate-900">
                      {c.customer_name}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
                      <span>{c.ticket_count} ticket{c.ticket_count !== 1 ? "s" : ""}</span>
                      <span className="h-0.5 w-0.5 rounded-full bg-slate-300" />
                      <span>{pct(c.margin_pct)} margin</span>
                    </div>
                  </div>
                </div>

                {/* Right: value */}
                <div className="text-right text-[11px]">
                  <div className="font-semibold text-slate-900">
                    {metric === "gp" ? money(c.gross_profit) : money(c.revenue)}
                    <span className="ml-1 text-[10px] font-normal text-slate-400">
                      {metric === "gp" ? "GP" : "rev"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bar */}
              <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                <div
                  className={`h-1.5 rounded-full transition-all group-hover:h-2 ${
                    metric === "gp" ? "bg-emerald-500" : "bg-slate-900"
                  }`}
                  style={{ width: `${pctOfTop}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer link */}
      <div className="mt-3 flex justify-end">
        <a
          href="/customers"
          className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50/70 px-3 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-white"
        >
          View full customer list →
        </a>
      </div>
    </div>
  );
}
