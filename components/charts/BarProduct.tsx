// components/charts/BarProduct.tsx
"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useRouter } from "next/navigation";
import type { TooltipProps } from "recharts";
import { money } from "@/lib/format";

type BarProductDatum = {
  product: string;
  revenue: number;
  gross_profit: number;
};

type Props = {
  data: BarProductDatum[];
};

/**
 * Shared tooltip card style (matches AreaRevenue look)
 */
function TooltipCard({
  title,
  revenue,
  grossProfit,
}: {
  title: string;
  revenue: number;
  grossProfit: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-3 py-2 text-xs shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
      <div className="mb-1 max-w-[220px] truncate text-[11px] font-medium text-slate-500">
        {title}
      </div>
      <div className="space-y-0.5">
        {/* Revenue row – BLUE */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
            <span className="text-[11px] text-slate-600">Revenue</span>
          </div>
          <span className="font-medium tabular-nums text-sky-800">
            {money(revenue)}
          </span>
        </div>

        {/* Gross profit row – GREEN */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] text-slate-600">Gross profit</span>
          </div>
          <span className="font-medium tabular-nums text-emerald-700">
            {money(grossProfit)}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Custom tooltip for the product bar chart
 */
function ProductTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0];
  const row = point.payload as BarProductDatum;

  return (
    <TooltipCard
      title={row.product ?? String(label)}
      revenue={row.revenue ?? 0}
      grossProfit={row.gross_profit ?? 0}
    />
  );
}

export default function BarProduct({ data }: Props) {
  const router = useRouter();

  const handleBarClick = (entry: any) => {
    const product = entry?.product as string | undefined;
    if (!product) return;

    router.push(`/orders?product=${encodeURIComponent(product)}`);
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        // More top margin so bars/grid aren’t cut off
        margin={{ top: 24, right: 8, left: -18, bottom: 40 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          className="stroke-slate-200/80"
        />
        <XAxis
          dataKey="product"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          interval={0}
          height={40}
          tick={(props) => {
            const { x, y, payload } = props as any;
            const label = payload.value as string;
            return (
              <g transform={`translate(${x},${y})`}>
                <text
                  x={0}
                  y={0}
                  dy={12}
                  textAnchor="end"
                  transform="rotate(-40)"
                  className="fill-slate-400 text-[10px]"
                >
                  {label}
                </text>
              </g>
            );
          }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={56}
          tick={{ className: "fill-slate-400 text-[10px]" }}
          tickFormatter={(v) => (v === 0 ? "$0" : money(v).replace(".00", ""))}
          // Add headroom so tallest bar doesn’t touch the top
          domain={[0, "dataMax + 1000"]}
        />
        <Tooltip
          cursor={{ fill: "rgba(15,23,42,0.04)" }}
          content={<ProductTooltip />}
        />
        <Bar
          dataKey="revenue"
          radius={[10, 10, 10, 10]}
          className="fill-sky-600"
          onClick={(data) => handleBarClick((data as any).payload)}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
