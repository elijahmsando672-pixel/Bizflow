"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatMoney } from "@/lib/modules-data";

interface TooltipEntry {
  value?: number | string;
  name?: string;
  [key: string]: unknown;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<TooltipEntry>;
  label?: string | number;
  formatter?: (value: number | string) => string;
}

const defaultFormatter = (value: number | string) =>
  typeof value === "number" ? formatMoney(value * 1000) : value;

export function ChartTooltip({ active, payload, label, formatter = defaultFormatter }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      {label ? <p className="mb-1 font-medium text-muted-foreground">{label}</p> : null}
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">{entry.name}</span>
          <span className="font-semibold text-foreground">{formatter(entry.value ?? "")}</span>
        </p>
      ))}
    </div>
  );
}

export function KpiSparkline({ data, gradientId }: { data: number[]; gradientId: string }) {
  const chartData = data.map((value, index) => ({ index, value }));
  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--color-primary)"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}