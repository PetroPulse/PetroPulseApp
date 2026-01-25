// app/orders/page.tsx
import Link from "next/link";
import { money, pct } from "@/lib/format";
import { pool } from "@/lib/db";

const ORG_ID = "5bf35fd2-a36c-4619-9d85-66f64540b322";

type OrderRow = {
  date: string;
  invoice_no: string;
  invoice_base: string;
  customer: string;
  product: string;
  revenue: number;
  gross_profit: number;
  margin_pct: number; // 0–100
  status: string;
};

type WindowKey = "today" | "7d" | "30d" | "mtd" | "qtd" | "ytd";

type ResolvedRange = {
  key: WindowKey | "custom";
  label: string;
  start: string;
  end: string;
};

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function resolveWindowRange(
  rawKey: string | undefined,
  rawDateOverride?: string
): ResolvedRange {
  if (rawDateOverride && /^\d{4}-\d{2}-\d{2}$/.test(rawDateOverride)) {
    return {
      key: "custom",
      label: "Selected day",
      start: rawDateOverride,
      end: rawDateOverride,
    };
  }

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();

  const key: WindowKey = (rawKey as WindowKey) || "30d";

  switch (key) {
    case "today": {
      const d = toIsoDate(today);
      return { key: "today", label: "Today · live book", start: d, end: d };
    }

    case "7d": {
      const endDate = new Date(year, month, day);
      const startDate = new Date(year, month, day - 6);
      return {
        key: "7d",
        label: "Last 7 days",
        start: toIsoDate(startDate),
        end: toIsoDate(endDate),
      };
    }

    case "mtd": {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month, day);
      return {
        key: "mtd",
        label: "Month to date",
        start: toIsoDate(startDate),
        end: toIsoDate(endDate),
      };
    }

    case "qtd": {
      const quarterStartMonth = Math.floor(month / 3) * 3;
      const startDate = new Date(year, quarterStartMonth, 1);
      const endDate = new Date(year, month, day);
      return {
        key: "qtd",
        label: "Quarter to date",
        start: toIsoDate(startDate),
        end: toIsoDate(endDate),
      };
    }

    case "ytd": {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, month, day);
      return {
        key: "ytd",
        label: "Year to date",
        start: toIsoDate(startDate),
        end: toIsoDate(endDate),
      };
    }

    case "30d":
    default: {
      const endDate = new Date(year, month, day);
      const startDate = new Date(year, month, day - 29);
      return {
        key: "30d",
        label: "Last 30 days",
        start: toIsoDate(startDate),
        end: toIsoDate(endDate),
      };
    }
  }
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams?: {
    q?: string;
    status?: string;
    product?: string;
    customer?: string;
    window?: string;
    date?: string;
  };
}) {
  const rawQ = (searchParams?.q ?? "").trim();
  const productFilter = (searchParams?.product ?? "").trim();
  const customerFilter = (searchParams?.customer ?? "").trim();
  const statusFilter = (searchParams?.status ?? "all").toLowerCase();
  const rawWindow = (searchParams?.window ?? "").trim();
  const rawDate = (searchParams?.date ?? "").trim();

  const range = resolveWindowRange(rawWindow, rawDate);
  const { start, end } = range;

  const effectiveQ = rawQ || productFilter || customerFilter;

  const client = await pool.connect();
  let allRows: OrderRow[] = [];

  try {
    const { rows } = await client.query(
      `
      select
        invoice_date as raw_date,
        invoice_no,
        regexp_replace(invoice_no::text, '-[0-9]+$', '') as invoice_base,
        coalesce(customer, 'Unknown customer') as customer,
        coalesce(product, 'Unspecified') as product,
        (quantity::numeric) * (sell_price::numeric)                 as revenue,
        (quantity::numeric) * (sell_price::numeric - cost::numeric) as gross_profit
      from public.invoices
      where org_id = $1
        and invoice_date >= $2::date
        and invoice_date < ($3::date + interval '1 day')
      order by invoice_date desc, invoice_no desc
      limit 2000;
      `,
      [ORG_ID, start, end]
    );

    allRows = rows.map((r: any) => {
      let isoDate: string;
      if (r.raw_date instanceof Date) {
        isoDate = r.raw_date.toISOString().slice(0, 10);
      } else {
        isoDate = String(r.raw_date ?? "").slice(0, 10);
      }

      const revenue = Number(r.revenue ?? 0);
      const gross_profit = Number(r.gross_profit ?? 0);
      const margin_pct =
        revenue > 0 ? Number(((gross_profit / revenue) * 100).toFixed(2)) : 0;

      return {
        date: isoDate,
        invoice_no: String(r.invoice_no ?? ""),
        invoice_base: String(r.invoice_base ?? r.invoice_no ?? ""),
        customer: String(r.customer ?? "Unknown customer"),
        product: String(r.product ?? "Unspecified"),
        revenue,
        gross_profit,
        margin_pct,
        status: "Ticketed",
      };
    });
  } finally {
    client.release();
  }

  const filteredRows = allRows.filter((row) => {
    if (statusFilter !== "all" && row.status.toLowerCase() !== statusFilter)
      return false;

    if (effectiveQ) {
      const haystack = `${row.customer} ${row.product} ${row.invoice_no} ${row.invoice_base}`
        .toLowerCase()
        .trim();
      if (!haystack.includes(effectiveQ.toLowerCase())) return false;
    }

    return true;
  });

  const hasFilters = !!(
    effectiveQ ||
    productFilter ||
    customerFilter ||
    rawWindow ||
    rawDate
  );

  const filterChips: { label: string; value: string }[] = [];
  if (productFilter) filterChips.push({ label: "Product", value: productFilter });
  if (customerFilter)
    filterChips.push({ label: "Customer", value: customerFilter });
  if (
    effectiveQ &&
    effectiveQ !== productFilter &&
    effectiveQ !== customerFilter
  ) {
    filterChips.push({ label: "Search", value: effectiveQ });
  }

  const ticketsLabel = filteredRows.length === 1 ? "ticket" : "tickets";

  const baseParams = new URLSearchParams();
  if (rawQ) baseParams.set("q", rawQ);
  if (productFilter) baseParams.set("product", productFilter);
  if (customerFilter) baseParams.set("customer", customerFilter);
  if (statusFilter !== "all") baseParams.set("status", statusFilter);

  const windowOptions: { key: WindowKey; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "7d", label: "Last 7D" },
    { key: "30d", label: "Last 30D" },
    { key: "mtd", label: "MTD" },
    { key: "qtd", label: "QTD" },
    { key: "ytd", label: "YTD" },
  ];

  return (
    <main className="px-6 pb-10 space-y-5">
      <section className="mt-3 rounded-3xl border border-slate-100 bg-gradient-to-r from-slate-50 via-white to-violet-50 px-6 py-5 shadow-[0_20px_60px_rgba(15,23,42,0.05)] flex items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-500 text-xs font-semibold text-white shadow-[0_10px_30px_rgba(139,92,246,0.45)]">
            PP
          </div>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-slate-100 px-3 py-1 text-[11px] font-medium text-slate-500">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              PetroPulse · Orders
            </div>
            <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
              Orders for Bellman Oil
            </h1>
            <p className="mt-1 text-sm text-slate-500 max-w-xl">
              Ticket-level view across the book. Search by customer, product, or
              ticket and slice by time window to see what&apos;s actually driving
              gross profit.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm hover:border-slate-300 hover:text-slate-800 transition"
        >
          ← Back to dashboard
        </Link>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <form
            action="/orders"
            method="get"
            className="flex flex-wrap items-center gap-2"
          >
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-700 shadow-sm">
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-700">
                Search
              </span>
              <input
                type="text"
                name="q"
                defaultValue={rawQ}
                placeholder="Customer, product, or ticket #"
                className="min-w-[220px] bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm">
              <select
                name="status"
                defaultValue={statusFilter || "all"}
                className="bg-transparent text-xs text-slate-700 focus:outline-none"
              >
                <option value="all">All statuses</option>
              </select>
            </div>

            {rawWindow && <input type="hidden" name="window" value={rawWindow} />}
            {rawDate && <input type="hidden" name="date" value={rawDate} />}

            {productFilter && (
              <input type="hidden" name="product" value={productFilter} />
            )}
            {customerFilter && (
              <input type="hidden" name="customer" value={customerFilter} />
            )}

            <button
              type="submit"
              className="rounded-full border border-violet-500 bg-violet-500 text-xs font-semibold text-white px-3 py-2 transition hover:bg-violet-400 hover:border-violet-400 shadow-[0_8px_24px_rgba(139,92,246,0.45)]"
            >
              Apply
            </button>
          </form>

          <div className="text-right text-[11px] text-slate-500">
            <div>
              <span className="font-semibold text-slate-900">
                {filteredRows.length}
              </span>{" "}
              {ticketsLabel}
            </div>
            <div>
              <span className="font-medium text-slate-800">{range.label}</span>{" "}
              · {start} → {end}
            </div>
            {effectiveQ && (
              <div>
                Search{" "}
                <span className="font-medium text-slate-900">
                  “{effectiveQ}”
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Time window
          </div>
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 p-1 shadow-sm">
            {windowOptions.map((opt) => {
              const params = new URLSearchParams(baseParams);
              params.set("window", opt.key);
              const href = `/orders?${params.toString()}`;

              const isActive = range.key === opt.key;

              const baseClasses =
                "inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-medium transition";
              const activeClasses =
                "bg-white text-slate-900 shadow-[0_6px_18px_rgba(15,23,42,0.10)] border border-violet-300";
              const inactiveClasses =
                "text-slate-600 hover:bg-white";

              return (
                <Link
                  key={opt.key}
                  href={href}
                  className={`${baseClasses} ${
                    isActive ? activeClasses : inactiveClasses
                  }`}
                >
                  {opt.label}
                </Link>
              );
            })}
          </div>
        </div>

        {hasFilters && filterChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {filterChips.map((chip, idx) => (
              <span
                key={`${chip.label}-${idx}`}
                className="inline-flex items-center rounded-full bg-violet-50 px-3 py-1 text-[11px] text-violet-800 border border-violet-100"
              >
                <span className="mr-1 font-medium">{chip.label}:</span>
                <span className="max-w-[260px] truncate">{chip.value}</span>
              </span>
            ))}

            <Link
              href="/orders"
              className="text-[11px] text-slate-500 underline underline-offset-2 hover:text-slate-800"
            >
              Clear filters
            </Link>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-violet-500 via-violet-400 to-emerald-400" />
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-right">Revenue</th>
                <th className="px-4 py-3 text-right">Profit</th>
                <th className="px-4 py-3 text-right">Margin %</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    No results. Try a different time window or search term.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => {
                  const displayDate = new Date(
                    row.date + "T00:00:00"
                  ).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <tr
                      key={`${row.invoice_no}-${idx}`}
                      className="border-b border-slate-100 last:border-none hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3 align-top text-xs text-slate-600">
                        {displayDate}
                      </td>

                      <td className="px-4 py-3 align-top text-xs text-slate-800">
                        <div className="font-medium">{row.customer}</div>
                        <div className="text-[11px] text-slate-500">
                          <Link
                            href={`/orders/${encodeURIComponent(
                              row.invoice_base
                            )}`}
                            className="underline underline-offset-2 hover:text-slate-800"
                          >
                            Ticket #{row.invoice_base}
                          </Link>
                        </div>
                      </td>

                      <td className="px-4 py-3 align-top text-xs text-slate-800">
                        {row.product}
                      </td>

                      <td className="px-4 py-3 align-top text-right text-xs text-slate-800">
                        {money(row.revenue)}
                      </td>

                      <td className="px-4 py-3 align-top text-right text-xs text-slate-800">
                        {money(row.gross_profit)}
                      </td>

                      <td className="px-4 py-3 align-top text-right text-xs text-slate-800">
                        {pct(row.margin_pct / 100)}
                      </td>

                      <td className="px-4 py-3 align-top text-xs text-slate-700">
                        {row.status}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
