// app/dashboard/page.tsx

import Link from "next/link";
import { money } from "@/lib/format";
import { pool } from "@/lib/db";
import AreaRevenue from "@/components/charts/AreaRevenue";
import BarProduct from "@/components/charts/BarProduct";

// TEMP: hard-wire Bellman org so dashboard is stable
const ORG_ID = "5bf35fd2-a36c-4619-9d85-66f64540b322";

/* ---------------- Time range (server-safe) ---------------- */

type TimeRange = "7D" | "30D" | "90D" | "QTD" | "YTD" | "YEAR";

const RANGES: TimeRange[] = ["7D", "30D", "90D", "QTD", "YTD", "YEAR"];

const RANGE_LABEL: Record<TimeRange, string> = {
  "7D": "Last 7 days",
  "30D": "Last 30 days",
  "90D": "Last 90 days",
  "QTD": "Quarter to date",
  "YTD": "Year to date",
  "YEAR": "Last year",
};

function isTimeRange(v: any): v is TimeRange {
  return typeof v === "string" && (RANGES as string[]).includes(v);
}

function startOfQuarter(d: Date) {
  const q = Math.floor(d.getMonth() / 3);
  return new Date(d.getFullYear(), q * 3, 1);
}

function startOfYear(d: Date) {
  return new Date(d.getFullYear(), 0, 1);
}

// Returns a DATE string "YYYY-MM-DD" to feed into SQL safely as ::date
function getPeriodStartDate(range: TimeRange): string {
  const now = new Date();
  let start: Date;

  switch (range) {
    case "7D":
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      break;
    case "30D":
      start = new Date(now);
      start.setDate(start.getDate() - 30);
      break;
    case "90D":
      start = new Date(now);
      start.setDate(start.getDate() - 90);
      break;
    case "QTD":
      start = startOfQuarter(now);
      break;
    case "YTD":
      start = startOfYear(now);
      break;
    case "YEAR":
      start = new Date(now);
      start.setFullYear(start.getFullYear() - 1);
      break;
  }

  // Format as YYYY-MM-DD in local time (good enough for current_date comparisons)
  const yyyy = start.getFullYear();
  const mm = String(start.getMonth() + 1).padStart(2, "0");
  const dd = String(start.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function daysBetweenInclusive(startYYYYMMDD: string): number {
  const [y, m, d] = startYYYYMMDD.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(); // now
  const ms = end.getTime() - start.getTime();
  const days = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  return days;
}

function PeriodSelector({ active }: { active: TimeRange }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 p-1 text-[11px] text-slate-700">
      {RANGES.map((r) => (
        <Link
          key={r}
          href={`/dashboard?range=${r}`}
          className={`rounded-full px-2 py-0.5 transition ${
            r === active
              ? "bg-slate-900 text-white"
              : "hover:bg-white/70 text-slate-700"
          }`}
          prefetch={false}
        >
          {r}
        </Link>
      ))}
    </span>
  );
}

/* ---------------- Types ---------------- */

type TotalsRow = {
  revenue_all: string;
  gross_profit_all: string;
  margin_all: number;

  // selected period (based on range param)
  revenue_period: string;
  gross_profit_period: string;
  margin_period: number;

  // still keep 7d snapshot stable in sidebar
  revenue_7d: string;
  gross_profit_7d: string;
  margin_7d: number;
};

type DailyRow = {
  day: string; // "YYYY-MM-DD"
  revenue: number;
  gross_profit: number;
};

type ProductRow = {
  product: string;
  revenue: number;
  gross_profit: number;
};

type CustomerRow = {
  customer_name: string;
  revenue: number;
  gross_profit: number;
  margin_pct: number;
  ticket_count: number;
};

type Highlights = {
  topCustomer?: CustomerRow;
  topProduct?: ProductRow;
  bestDay?: DailyRow;
};

function buildHighlights({
  products,
  customers,
  daily,
}: {
  products: ProductRow[];
  customers: CustomerRow[];
  daily: DailyRow[];
}): Highlights {
  const topCustomer = customers[0];
  const topProduct = products[0];

  let bestDay: DailyRow | undefined;
  for (const d of daily) {
    if (!bestDay || d.revenue > bestDay.revenue) {
      bestDay = d;
    }
  }
  return { topCustomer, topProduct, bestDay };
}

/* ---------- Small building blocks ---------- */

function InsightPill({
  label,
  metric,
  value,
}: {
  label: string;
  metric: string;
  value?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-slate-100 bg-white/90 px-3 py-2.5 text-[11px] shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
      <div className="font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>
      <div className="text-[13px] font-semibold text-slate-900 line-clamp-2">
        {metric}
      </div>
      {value && (
        <span className="mt-1 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
          {value}
        </span>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  emphasis = false,
}: {
  label: string;
  value: string;
  sub?: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`group flex h-full flex-col justify-between rounded-3xl bg-white px-5 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)] ring-1 transition-all duration-150 hover:-translate-y-[1px] hover:shadow-[0_20px_55px_rgba(15,23,42,0.10)] ${
        emphasis ? "ring-emerald-100" : "ring-slate-100"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold tracking-[0.18em] text-slate-400 uppercase">
          {label}
        </div>
        <span
          className={`inline-flex h-1.5 w-1.5 rounded-full transition ${
            emphasis
              ? "bg-emerald-500 group-hover:bg-emerald-400"
              : "bg-slate-300 group-hover:bg-slate-400"
          }`}
        />
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
        {value}
      </div>
      {sub && (
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{sub}</p>
      )}
    </div>
  );
}

function QuickView() {
  const items: { label: string; href: string }[] = [
    { label: "Overview", href: "#overview" },
    { label: "Trends", href: "#trends" },
    { label: "Products", href: "#products" },
    { label: "Customers", href: "#customers" },
  ];

  return (
    <section className="rounded-3xl bg-white px-4 py-3 text-[12px] shadow-[0_18px_45px_rgba(15,23,42,0.10)] ring-1 ring-slate-100">
      <header className="mb-2 flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Quick view
        </div>
        <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-medium text-white shadow-sm">
          Live book
        </span>
      </header>
      <nav className="space-y-1">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex items-center justify-between rounded-2xl px-2.5 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            <span>{item.label}</span>
            <span className="text-[11px] text-slate-400">↘</span>
          </a>
        ))}
      </nav>
    </section>
  );
}

/* ---------- Customers section ---------- */

function CustomersSection({ customers }: { customers: CustomerRow[] }) {
  const top10 = customers.slice(0, 10);
  const totalGpTop10 = top10.reduce((acc, c) => acc + c.gross_profit, 0);

  const anchor = top10[0];
  const highGrowth = top10[1];
  const steady = top10[2];

  return (
    <section
      id="customers"
      className="rounded-3xl bg-white px-5 py-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] ring-1 ring-slate-100"
    >
      <header className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Customers
          </div>
          <h2 className="mt-1 text-sm font-semibold text-slate-900">
            Customer profit board · last 30 days
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Who&apos;s actually carrying Bellman&apos;s book right now.
          </p>
        </div>
        <div className="flex items-end gap-4 text-[11px] text-slate-500">
          <div className="text-right">
            <div className="font-medium text-slate-900 tabular-nums">
              {money(totalGpTop10)} GP
            </div>
            <div>Top 10 customers</div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span>Sort by</span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
              Gross profit
            </span>
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        {/* Leaderboard list */}
        <div className="space-y-1.5">
          {top10.map((c, idx) => {
            const share = totalGpTop10 > 0 ? c.gross_profit / totalGpTop10 : 0;
            const isTop3 = idx < 3;

            return (
              <Link
                key={c.customer_name}
                href={`/orders?customer=${encodeURIComponent(
                  c.customer_name
                )}`}
                className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-xs shadow-sm ring-1 transition-all duration-150 hover:-translate-y-[1px] hover:shadow-md ${
                  isTop3
                    ? "bg-slate-50 ring-emerald-100"
                    : "bg-white ring-slate-100"
                }`}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold shadow-sm ring-1 transition ${
                    isTop3
                      ? "bg-slate-900 text-white ring-slate-900"
                      : "bg-slate-50 text-slate-700 ring-slate-200 group-hover:bg-slate-100"
                  }`}
                >
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="truncate text-[13px] font-medium text-slate-900 group-hover:text-slate-900">
                      {c.customer_name}
                    </div>
                    <div className="text-[12px] font-semibold text-emerald-600 tabular-nums">
                      {money(c.gross_profit)} GP
                    </div>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>{c.ticket_count} tickets</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span>{c.margin_pct.toFixed(2)}% margin</span>
                    </div>
                    <div className="flex-1">
                      <div className="h-1.5 rounded-full bg-slate-200/80">
                        <div
                          className="h-1.5 rounded-full bg-emerald-500"
                          style={{
                            width: `${Math.max(6, share * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Snapshot tiles */}
        <div className="space-y-3 text-[11px]">
          {anchor && (
            <Link
              href={`/orders?customer=${encodeURIComponent(
                anchor.customer_name
              )}`}
              className="block rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 px-3 py-3 text-emerald-50 shadow-[0_18px_40px_rgba(16,185,129,0.55)] transition hover:brightness-105"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="rounded-full bg-emerald-900/40 px-2 py-[2px] text-[10px] font-semibold uppercase tracking-[0.18em]">
                  #1 · Anchor account
                </span>
                <span className="text-[11px] font-medium tabular-nums">
                  {money(anchor.revenue)} revenue
                </span>
              </div>
              <div className="text-[13px] font-semibold">
                {anchor.customer_name}
              </div>
              <p className="mt-1 text-emerald-100/90">
                Largest single driver of gross profit this period.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-emerald-900/40 px-2 py-[2px] text-[11px] font-medium">
                  {money(anchor.gross_profit)} GP
                </span>
                <span className="rounded-full bg-emerald-900/30 px-2 py-[2px] text-[11px] font-medium">
                  {anchor.margin_pct.toFixed(2)}% margin
                </span>
                <span className="rounded-full bg-emerald-900/20 px-2 py-[2px] text-[11px] font-medium">
                  {anchor.ticket_count} tickets
                </span>
              </div>
            </Link>
          )}

          {highGrowth && (
            <Link
              href={`/orders?customer=${encodeURIComponent(
                highGrowth.customer_name
              )}`}
              className="block rounded-2xl border border-sky-100 bg-sky-50/80 px-3 py-3 text-slate-900 shadow-sm transition hover:border-sky-200 hover:bg-sky-50"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="rounded-full bg-sky-500/90 px-2 py-[2px] text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                  #2 · High-growth
                </span>
                <span className="text-[11px] font-medium text-sky-700">
                  {highGrowth.margin_pct.toFixed(1)}% margin
                </span>
              </div>
              <div className="text-[13px] font-semibold">
                {highGrowth.customer_name}
              </div>
              <p className="mt-1 text-[11px] text-slate-600">
                Strong profile – worth leaning into.
              </p>
            </Link>
          )}

          {steady && (
            <Link
              href={`/orders?customer=${encodeURIComponent(steady.customer_name)}`}
              className="block rounded-2xl border border-amber-100 bg-amber-50/80 px-3 py-3 text-slate-900 shadow-sm transition hover:border-amber-200 hover:bg-amber-50"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="rounded-full bg-amber-500 px-2 py-[2px] text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-50">
                  #3 · Steady earner
                </span>
                <span className="text-[11px] font-medium text-amber-800">
                  {steady.ticket_count} tickets
                </span>
              </div>
              <div className="text-[13px] font-semibold">
                {steady.customer_name}
              </div>
              <p className="mt-1 text-[11px] text-slate-600">
                Reliable contributor with room for premium mix.
              </p>
            </Link>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <a
          href="/customers"
          className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-700 transition hover:bg-white"
        >
          View all customers →
        </a>
      </div>
    </section>
  );
}

/* ---------- Page component ---------- */

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const client = await pool.connect();

  // range from URL, default stays 30D so your current dashboard stays identical
  const raw = searchParams?.range;
  const range = isTimeRange(Array.isArray(raw) ? raw[0] : raw) ? (Array.isArray(raw) ? raw[0] : raw) : "30D";
  const periodStart = getPeriodStartDate(range);
  const periodLabel = RANGE_LABEL[range];
  const periodDays = daysBetweenInclusive(periodStart);

  try {
    // 1) Totals for KPI header (all-time, selected period, 7d)
    const {
      rows: [totalsRaw],
    } = await client.query<TotalsRow>(
      `
      with daily as (
        select day, revenue, gross_profit, margin_pct
        from vw_daily_org_sales
        where org_id = $1
      ),
      all_time as (
        select 
          total_revenue_final        as revenue_all,
          total_gross_profit_final   as gross_profit_all,
          avg_margin_pct_final       as margin_all
        from v_totals_reconciled_per_org
        where org_id = $1
      ),
      period as (
        select
          coalesce(sum(revenue), 0)::numeric(14,2)      as revenue_period,
          coalesce(sum(gross_profit), 0)::numeric(14,2) as gross_profit_period,
          coalesce(avg(margin_pct), 0)::numeric(6,2)    as margin_period
        from daily
        where day >= $2::date
      ),
      d7 as (
        select
          coalesce(sum(revenue), 0)::numeric(14,2)      as revenue_7d,
          coalesce(sum(gross_profit), 0)::numeric(14,2) as gross_profit_7d,
          coalesce(avg(margin_pct), 0)::numeric(6,2)    as margin_7d
        from daily
        where day >= current_date - interval '7 days'
      )
      select
        at.revenue_all::text,
        at.gross_profit_all::text,
        at.margin_all,
        period.revenue_period::text,
        period.gross_profit_period::text,
        period.margin_period,
        d7.revenue_7d::text,
        d7.gross_profit_7d::text,
        d7.margin_7d
      from all_time at, period, d7;
      `,
      [ORG_ID, periodStart]
    );

    const totals: TotalsRow =
      totalsRaw ??
      ({
        revenue_all: "0",
        gross_profit_all: "0",
        margin_all: 0,
        revenue_period: "0",
        gross_profit_period: "0",
        margin_period: 0,
        revenue_7d: "0",
        gross_profit_7d: "0",
        margin_7d: 0,
      } as TotalsRow);

    const marginPeriod = Number((totals as any).margin_period ?? 0);

    // 2) Daily revenue & gross profit – selected period
    const { rows: dailyRaw } = await client.query<DailyRow>(
      `
      select
        day::date                                as day,
        coalesce(revenue, 0)::numeric(14,2)      as revenue,
        coalesce(gross_profit, 0)::numeric(14,2) as gross_profit
      from vw_daily_org_sales
      where org_id = $1
        and day >= $2::date
      order by day;
      `,
      [ORG_ID, periodStart]
    );

    const daily: DailyRow[] = dailyRaw.map((r: any) => ({
      day: String(r.day),
      revenue: Number(r.revenue),
      gross_profit: Number(r.gross_profit),
    }));

    // 3) Top products by revenue – selected period
    const { rows: productRaw } = await client.query<ProductRow>(
      `
      select
        product,
        sum(revenue)::numeric(14,2)       as revenue,
        sum(gross_profit)::numeric(14,2)  as gross_profit
      from vw_product_daily
      where org_id = $1
        and day >= $2::date
      group by product
      order by sum(revenue) desc
      limit 10;
      `,
      [ORG_ID, periodStart]
    );

    const products: ProductRow[] = productRaw.map((r) => ({
      product: r.product,
      revenue: Number(r.revenue),
      gross_profit: Number(r.gross_profit),
    }));

    // 4) Top customers by gross profit (NOTE: still 30d window in your view)
    const { rows: customersRaw } = await client.query<CustomerRow>(
      `
      select
        customer_name,
        revenue,
        gross_profit,
        margin_pct,
        ticket_count
      from customer_totals
      where org_id = $1
      order by gross_profit desc
      limit 10;
      `,
      [ORG_ID]
    );

    const customers: CustomerRow[] = customersRaw.map((r) => ({
      customer_name: r.customer_name,
      revenue: Number(r.revenue),
      gross_profit: Number(r.gross_profit),
      margin_pct: Number(r.margin_pct),
      ticket_count: Number(r.ticket_count),
    }));

    const highlights = buildHighlights({ products, customers, daily });

    return (
      <main className="px-4 pb-10 pt-4 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* HERO */}
          <section className="mt-2 rounded-3xl bg-white/90 px-6 py-5 shadow-[0_24px_70px_rgba(15,23,42,0.07)] ring-1 ring-slate-100 backdrop-blur-sm">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              {/* Left side */}
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-violet-600 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-violet-50">
                    • Live · Bellman
                  </span>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-700">
                    Bellman Oil Company
                  </span>

                  {/* Period selector (server-safe links) */}
                  <PeriodSelector active={range} />

                  <span className="inline-flex items-center rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-[11px] text-amber-700">
                    Status · Pending verification
                  </span>
                </div>

                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                    Bellman performance snapshot
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    A live read on revenue and margin, powered by PetroPulse
                    beta.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {marginPeriod.toFixed(2)}% margin on{" "}
                    {money(Number(totals.revenue_period))} in{" "}
                    {periodLabel.toLowerCase()}
                  </span>

                  <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1">
                    Rev run-rate ≈{" "}
                    {money((Number(totals.revenue_period) * 365) / periodDays || 0)}{" "}
                    / yr
                  </span>
                  <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1">
                    GP run-rate ≈{" "}
                    {money(
                      (Number(totals.gross_profit_period) * 365) / periodDays || 0
                    )}{" "}
                    / yr
                  </span>
                </div>
              </div>

              {/* Right side org summary */}
              <aside className="min-w-[220px] rounded-3xl bg-slate-50 px-4 py-4 text-[12px] shadow-inner ring-1 ring-slate-100">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Org summary
                </div>
                <dl className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">All-time revenue</dt>
                    <dd className="font-semibold text-slate-900 tabular-nums">
                      {money(Number(totals.revenue_all))}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">All-time GP</dt>
                    <dd className="font-semibold text-emerald-600 tabular-nums">
                      {money(Number(totals.gross_profit_all))}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Lifetime margin</dt>
                    <dd className="font-semibold text-slate-900 tabular-nums">
                      {Number(totals.margin_all ?? 0).toFixed(2)}%
                    </dd>
                  </div>
                  <div className="mt-2 border-t border-slate-100 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">7d snapshot</span>
                      <span className="tabular-nums text-slate-500">
                        {money(Number(totals.revenue_7d))}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {Number(totals.revenue_7d) === 0
                        ? "No invoices posted yet this week."
                        : "Includes all posted tickets this week."}
                    </p>
                  </div>
                </dl>
              </aside>
            </div>
          </section>

          {/* MAIN GRID: KPI + charts + sidebar */}
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2.3fr)_minmax(260px,0.9fr)]">
            {/* LEFT COLUMN */}
            <div className="space-y-6">
              {/* KPI STRIP */}
              <section id="overview" className="space-y-3">
                <div className="grid items-stretch gap-3 md:grid-cols-3">
                  <KpiCard
                    label={`${range.toLowerCase()} revenue`}
                    value={money(Number(totals.revenue_period))}
                    sub={`All-time ${money(Number(totals.revenue_all))}`}
                  />
                  <KpiCard
                    label={`${range.toLowerCase()} gross profit`}
                    value={money(Number(totals.gross_profit_period))}
                    sub={`${Number(totals.margin_period ?? 0).toFixed(2)}% margin`}
                    emphasis
                  />
                  <KpiCard
                    label="7d snapshot"
                    value={money(Number(totals.revenue_7d))}
                    sub={
                      Number(totals.revenue_7d) === 0
                        ? "No invoices yet this week."
                        : `${money(Number(totals.gross_profit_7d))} GP · ${Number(
                            totals.margin_7d ?? 0
                          ).toFixed(2)}% margin`
                    }
                  />
                </div>
              </section>

              {/* TRENDS */}
              <section
                id="trends"
                className="rounded-3xl bg-white px-4 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)] ring-1 ring-slate-100"
              >
                <div className="mb-3 flex items-center justify-between gap-4 border-b border-slate-100 pb-2">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Trends
                    </div>
                    <h2 className="mt-1 text-sm font-semibold text-slate-900">
                      Revenue &amp; gross profit · {periodLabel.toLowerCase()}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      See how Bellman&apos;s book is moving day by day.
                    </p>
                  </div>
                  <div className="space-y-0.5 text-right text-[11px] text-slate-500">
                    <div>
                      Period revenue{" "}
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {money(Number(totals.revenue_period))}
                      </span>
                    </div>
                    <div>
                      Period gross profit{" "}
                      <span className="font-semibold text-emerald-600 tabular-nums">
                        {money(Number(totals.gross_profit_period))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 h-[260px]">
                  {daily.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      No data available for this period.
                    </div>
                  ) : (
                    <AreaRevenue data={daily} />
                  )}
                </div>
              </section>

              {/* TOP SKUS */}
              <section
                id="products"
                className="rounded-3xl bg-white px-4 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)] ring-1 ring-slate-100"
              >
                <div className="mb-3 flex items-center justify-between gap-4 border-b border-slate-100 pb-2">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Products
                    </div>
                    <h2 className="mt-1 text-sm font-semibold text-slate-900">
                      Top SKUs · {periodLabel.toLowerCase()}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      Hover a bar to see revenue &amp; gross profit. Click to
                      drill into orders.
                    </p>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Top 10 SKUs by revenue.
                  </div>
                </div>

                <div className="mt-2 h-[260px]">
                  {products.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      No product revenue found yet.
                    </div>
                  ) : (
                    <BarProduct data={products} />
                  )}
                </div>
              </section>

              {/* CUSTOMERS (still 30d via view) */}
              <CustomersSection customers={customers} />
            </div>

            {/* RIGHT COLUMN – insights sidebar */}
            <aside className="space-y-4 lg:sticky lg:top-20">
              {/* Insight */}
              <section className="rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-slate-900 px-4 py-4 text-slate-50 shadow-[0_22px_60px_rgba(15,23,42,0.55)]">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100/80">
                    Insight
                  </span>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-[2px] text-[10px] font-medium text-emerald-50">
                    Profit focus
                  </span>
                </div>
                <p className="text-sm font-semibold">
                  {highlights.topCustomer
                    ? `${highlights.topCustomer.customer_name} is carrying the book this month.`
                    : "No profit leader yet – import more invoices."}
                </p>
                {highlights.topCustomer && (
                  <p className="mt-2 text-[11px] text-emerald-100">
                    {money(highlights.topCustomer.gross_profit)} GP at{" "}
                    {highlights.topCustomer.margin_pct.toFixed(2)}% margin in
                    the last 30 days.
                  </p>
                )}
                {highlights.topProduct && (
                  <p className="mt-2 text-[11px] text-emerald-100/80">
                    Top product: {highlights.topProduct.product} with{" "}
                    {money(highlights.topProduct.revenue)} invoiced.
                  </p>
                )}
                {highlights.bestDay && (
                  <p className="mt-2 text-[11px] text-emerald-100/80">
                    Strongest revenue day: {highlights.bestDay.day} ·{" "}
                    {money(highlights.bestDay.revenue)} revenue.
                  </p>
                )}
                <p className="mt-3 text-[11px] text-emerald-100/70">
                  This panel will soon surface PetroPulse AI forecasts, anomaly
                  alerts, and margin opportunities automatically.
                </p>
              </section>

              {/* Quick nav */}
              <QuickView />

              {/* Highlights strip */}
              <section className="rounded-3xl bg-white/95 px-4 py-4 text-[11px] shadow-[0_18px_45px_rgba(15,23,42,0.07)] ring-1 ring-slate-100">
                <div className="mb-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Highlights
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Quick read on top customer, product, and revenue day.
                  </p>
                </div>

                <div className="space-y-3">
                  <InsightPill
                    label="Top customer · GP"
                    metric={
                      highlights.topCustomer
                        ? highlights.topCustomer.customer_name
                        : "No customer data yet"
                    }
                    value={
                      highlights.topCustomer
                        ? `${money(highlights.topCustomer.gross_profit)} gross profit`
                        : undefined
                    }
                  />

                  <InsightPill
                    label="Top product · revenue"
                    metric={
                      highlights.topProduct
                        ? highlights.topProduct.product
                        : "No product data yet"
                    }
                    value={
                      highlights.topProduct
                        ? `${money(highlights.topProduct.revenue)} invoiced`
                        : undefined
                    }
                  />

                  <InsightPill
                    label="Strongest revenue day"
                    metric={
                      highlights.bestDay
                        ? highlights.bestDay.day
                        : "No daily performance yet"
                    }
                    value={
                      highlights.bestDay
                        ? `${money(highlights.bestDay.revenue)} revenue · ${money(
                            highlights.bestDay.gross_profit
                          )} GP`
                        : undefined
                    }
                  />
                </div>
              </section>
            </aside>
          </div>
        </div>
      </main>
    );
  } finally {
    client.release();
  }
}
