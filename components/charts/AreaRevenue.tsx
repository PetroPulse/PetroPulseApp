"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useRouter } from "next/navigation";
import { money } from "@/lib/format";

type Point = {
  day: string;
  revenue: number;
  gross_profit: number;
};

// Robust “Oct 30” formatter – works with "2025-10-30" OR full Date strings
function shortDate(raw: string) {
  const date = new Date(raw);
  if (isNaN(date.getTime())) {
    // If parsing fails, just show the raw value so we never render "Invalid Date"
    return raw;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Canonical YYYY-MM-DD formatter for URLs / filters
function canonicalDate(raw: string) {
  const date = new Date(raw);
  if (isNaN(date.getTime())) {
    return raw; // worst case, fall back to raw (but this should parse)
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`; // e.g. 2025-10-31
}

// Make Y-axis ticks more readable (ex: $0, $5k, $12k)
function formatYAxisTick(value: number) {
  if (value >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${value}`;
}

// Compact, pretty tooltip
function CompactTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string | number;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const revenue = payload.find((p) => p.dataKey === "revenue")?.value ?? 0;
  const grossProfit =
    payload.find((p) => p.dataKey === "gross_profit")?.value ?? 0;

  return (
    <div className="rounded-xl border border-slate-100 bg-white/95 px-3 py-2 shadow-xl">
      <div className="text-[11px] font-medium text-slate-500">
        {label ? shortDate(String(label)) : ""}
      </div>

      <div className="mt-1 space-y-0.5 text-[12px]">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1 text-slate-500">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            Revenue
          </span>
          <span className="font-semibold text-slate-900">
            {money(Number(revenue))}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1 text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Gross profit
          </span>
          <span className="font-semibold text-emerald-600">
            {money(Number(grossProfit))}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AreaRevenue({ data }: { data: Point[] }) {
  const router = useRouter();

  // Use activePayload to get the original data point (with raw `day`)
  const handleChartClick = (state: any) => {
    const rawPoint = state?.activePayload?.[0]?.payload as Point | undefined;
    const dayRaw = rawPoint?.day;
    if (!dayRaw) return;

    const day = canonicalDate(String(dayRaw));
    // Only push if we have a canonical date
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return;

    router.push(`/orders?date=${encodeURIComponent(day)}`);
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        onClick={handleChartClick}
      >
        {/* Soft grid */}
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#e2e8f0"
        />

        {/* Clean X-axis */}
        <XAxis
          dataKey="day"
          tickFormatter={(value) => shortDate(String(value))}
          interval={3}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />

        {/* Clean Y-axis */}
        <YAxis
          tickFormatter={(v) => formatYAxisTick(Number(v))}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          width={40}
        />

        <Tooltip content={<CompactTooltip />} />

        {/* Revenue area */}
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#3b82f6"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#revFill)"
          cursor="pointer"
        />

        {/* Gross profit area */}
        <Area
          type="monotone"
          dataKey="gross_profit"
          stroke="#10b981"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#gpFill)"
          cursor="pointer"
        />

        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>

          <linearGradient id="gpFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
      </AreaChart>
    </ResponsiveContainer>
  );
}
