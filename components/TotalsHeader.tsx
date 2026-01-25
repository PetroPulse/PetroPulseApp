// components/TotalsHeader.tsx
import { money, pct } from "@/lib/format";

type Props = {
  // keep loose to avoid TS pain – we normalize inside
  totals: any | null;
};

type KpiCardProps = {
  label: string;
  value: string;
  caption?: string;
  tone?: "default" | "positive";
};

function KpiCard({ label, value, caption, tone = "default" }: KpiCardProps) {
  const valueColor =
    tone === "positive"
      ? "text-emerald-600 group-hover:text-emerald-700"
      : "text-slate-900 group-hover:text-indigo-700";

  const chipColor =
    tone === "positive"
      ? "bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100"
      : "bg-slate-100 text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-700";

  return (
    <div
      className="
        group flex h-32 flex-col justify-between
        rounded-[20px]
        border border-slate-100
        bg-gradient-to-br from-white to-slate-50/40
        px-5 py-4
        shadow-[0_16px_40px_rgba(15,23,42,0.05)]
        transition-all duration-200
        hover:-translate-y-[2px]
        hover:shadow-[0_22px_55px_rgba(15,23,42,0.09)]
      "
    >
      {/* LABEL CHIP */}
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 group-hover:bg-indigo-500 transition-colors" />
        <span
          className={`
            rounded-full px-2 py-0.5
            text-[10px] font-semibold uppercase tracking-[0.18em]
            ${chipColor}
          `}
        >
          {label}
        </span>
      </div>

      {/* VALUE */}
      <div
        className={`
          text-[22px] font-semibold tabular-nums tracking-tight
          ${valueColor}
          transition-colors
        `}
      >
        {value}
      </div>

      {/* CAPTION */}
      <div className="h-[18px] text-[11px] text-slate-500">
        {caption && <span className="truncate">{caption}</span>}
      </div>
    </div>
  );
}

export default function TotalsHeader({ totals }: Props) {
  if (!totals) {
    return (
      <section aria-label="Key performance indicators" className="mt-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-[20px] border border-slate-100 bg-slate-50/70"
            />
          ))}
        </div>
      </section>
    );
  }

  // Helper to read both snake_case and camelCase, then fall back to 0
  const pickNumber = (snake: string, camel: string): number => {
    const v =
      (totals as any)[snake] !== undefined
        ? (totals as any)[snake]
        : (totals as any)[camel];
    if (v === null || v === undefined) return 0;
    if (typeof v === "number") return v;
    const parsed = parseFloat(String(v));
    return isNaN(parsed) ? 0 : parsed;
  };

  const pickMargin = (snake: string, camel: string): number => {
    const v =
      (totals as any)[snake] !== undefined
        ? (totals as any)[snake]
        : (totals as any)[camel];
    if (v === null || v === undefined) return 0;
    return typeof v === "number" ? v : parseFloat(String(v)) || 0;
  };

  const revenueAll = pickNumber("revenue_all", "revenueAll");
  const grossProfitAll = pickNumber("gross_profit_all", "grossProfitAll");
  const marginAll = pickMargin("margin_all", "marginAll");

  const revenue30d = pickNumber("revenue_30d", "revenue30d");
  const grossProfit30d = pickNumber("gross_profit_30d", "grossProfit30d");
  const margin30d = pickMargin("margin_30d", "margin30d");

  const revenue7d = pickNumber("revenue_7d", "revenue7d");
  const grossProfit7d = pickNumber("gross_profit_7d", "grossProfit7d");
  const margin7dRaw =
    (totals as any).margin_7d ?? (totals as any).margin7d ?? null;
  const margin7d =
    margin7dRaw === null || margin7dRaw === undefined
      ? 0
      : typeof margin7dRaw === "number"
      ? margin7dRaw
      : parseFloat(String(margin7dRaw)) || 0;

  const has7dActivity = revenue7d > 0 || grossProfit7d > 0;

  return (
    <section aria-label="Key performance indicators" className="mt-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="All-time revenue"
          value={money(revenueAll)}
          caption="All invoices imported so far."
        />

        <KpiCard
          label="All-time gross profit"
          value={money(grossProfitAll)}
          caption={`${pct(marginAll)} avg margin`}
          tone="positive"
        />

        <KpiCard
          label="30d revenue"
          value={money(revenue30d)}
          caption={`${money(grossProfit30d)} GP · ${pct(margin30d)} margin`}
        />

        <KpiCard
          label="7d revenue"
          value={money(revenue7d)}
          caption={
            has7dActivity
              ? `${money(grossProfit7d)} GP · ${pct(margin7d)} margin`
              : "No invoices yet this week."
          }
        />
      </div>
    </section>
  );
}
