"use client";

import { BarChart3 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/data";
import type { RevenueChartPoint } from "@/types";

export function RevenueChart({ data }: { data: RevenueChartPoint[] }) {
  return (
    <div className="xl:col-span-2 bg-card rounded-2xl p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-card-foreground">Revenue Analytics</h2>
        <BarChart3 className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="name" stroke="var(--color-muted-foreground)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                color: "var(--color-card-foreground)",
              }}
              formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-primary)"
              strokeWidth={4}
              dot={{ fill: "var(--color-primary)", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
