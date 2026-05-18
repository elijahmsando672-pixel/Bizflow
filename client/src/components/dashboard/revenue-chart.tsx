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
    <div className="xl:col-span-2 bg-[#121A2B] rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Revenue Analytics</h2>
        <BarChart3 className="h-5 w-5 text-gray-400" />
      </div>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="name" stroke="#64748B" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1E293B",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                color: "#fff",
              }}
              formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#3B82F6"
              strokeWidth={4}
              dot={{ fill: "#3B82F6", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
