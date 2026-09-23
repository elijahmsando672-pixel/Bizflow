"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/modules/page-header";
import { ChartTooltip } from "@/components/modules/charts";
import { useToast } from "@/components/ui/toast";
import { reportSummaries, taskCompletionSeries } from "@/lib/modules-data";
import { cn } from "@/lib/utils";

const plainFormatter = (value: number | string) => `${value}`;

function MiniBars({ data, tone }: { data: number[]; tone: "primary" | "destructive" }) {
  const chartData = data.map((v, i) => ({ index: i, value: v }));
  return (
    <div className="h-14 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <Bar
            dataKey="value"
            fill={tone === "primary" ? "var(--color-primary)" : "var(--color-destructive)"}
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function ReportsPage() {
  const toast = useToast();

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Performance insights across your workspace"
        actions={
          <Button>
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {reportSummaries.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-muted-foreground">{r.label}</p>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-medium",
                  r.trend === "up"
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-destructive/10 text-destructive"
                )}
              >
                {r.trend === "up" ? "+" : "−"}
                {r.delta}%
              </span>
            </div>
            <p className="mt-1.5 text-xl font-semibold tracking-tight text-foreground">{r.value}</p>
            <div className="mt-3">
              <MiniBars data={r.series} tone={r.id === "r4" ? "destructive" : "primary"} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-base">Task Completion</CardTitle>
            <CardDescription>Completed vs. monthly target</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-2">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={taskCompletionSeries} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={40}
                    tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                  />
                  <Tooltip content={<ChartTooltip formatter={plainFormatter} />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="Completed"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    name="Target"
                    stroke="var(--color-muted-foreground)"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-base">Quick Exports</CardTitle>
            <CardDescription>Generate on-demand reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-5 pt-2">
            {["Revenue Summary", "Monthly Expenses", "Client Aging"].map((label) => (
              <button
                key={label}
                type="button"
                onClick={() =>
                  toast.info(`${label} export will be available once the reporting API ships to production.`)
                }
                className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                {label}
                <Download className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}