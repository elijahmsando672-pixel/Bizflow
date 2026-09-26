"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { formatCompact, formatCurrency, formatDate, toNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Spinner } from "@/components/ui/spinner";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";

type Period = "week" | "month" | "year";

const PERIOD_OPTIONS: ReadonlyArray<{ value: Period; label: string }> = [
  { value: "week", label: "7 days" },
  { value: "month", label: "30 days" },
  { value: "year", label: "12 months" },
];

interface ChartRow {
  date: string;
  revenue: number;
}

function toChartRows(raw: unknown): ChartRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      const entry = row as { date?: string; revenue?: number | string };
      const date = entry.date ?? "";
      return { date, revenue: toNumber(entry.revenue) ?? 0 };
    })
    .filter((row) => Boolean(row.date))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function axisLabel(date: string, period: Period): string {
  if (period === "year") {
    const parsed = new Date(`${date}-01T00:00:00`);
    return Number.isNaN(parsed.getTime())
      ? date
      : parsed.toLocaleDateString("en-KE", { month: "short" });
  }
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? date : formatDate(parsed).replace(/,.*/, "");
}

export function SalesOverview() {
  const [period, setPeriod] = useState<Period>("month");
  const [rows, setRows] = useState<ChartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async (next: Period) => {
    setLoading(true);
    setFailed(false);
    try {
      const result = await api.dashboard.getRevenueChart(next);
      setRows(toChartRows(result));
    } catch {
      setFailed(true);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(period);
  }, [load, period]);

  const total = useMemo(() => rows.reduce((sum, row) => sum + row.revenue, 0), [rows]);
  const best = useMemo(
    () => rows.reduce<ChartRow | null>((top, row) => (!top || row.revenue > top.revenue ? row : top), null),
    [rows]
  );

  return (
    <Panel className="lg:col-span-2">
      <PanelHeader>
        <div>
          <PanelTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
            Sales overview
          </PanelTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">Paid sales over the selected period</p>
        </div>
        <div className="flex items-center gap-2">
          <SegmentedControl
            options={PERIOD_OPTIONS}
            value={period}
            onChange={setPeriod}
            size="sm"
            label="Sales period"
          />
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/dashboard/reports">
              Report
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </Button>
        </div>
      </PanelHeader>

      <PanelBody>
        <div className="mb-4 flex flex-wrap items-end gap-x-6 gap-y-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Revenue</p>
            <p className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground">
              {loading ? <span className="inline-block h-7 w-28 animate-pulse rounded bg-muted" /> : formatCurrency(total)}
            </p>
          </div>
          {best && best.revenue > 0 ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Best day</p>
              <p className="mt-0.5 text-sm font-medium text-foreground">
                {formatCurrency(best.revenue)}{" "}
                <span className="text-muted-foreground">· {axisLabel(best.date, period)}</span>
              </p>
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="flex h-[240px] items-center justify-center">
            <Spinner label="Loading sales trend" />
          </div>
        ) : failed ? (
          <EmptyState
            tone="error"
            title="Could not load the sales trend"
            description="The revenue endpoint did not respond."
            action={
              <Button variant="outline" size="sm" onClick={() => load(period)}>
                Try again
              </Button>
            }
            className="border-0 bg-transparent"
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No paid sales in this period"
            description="Record a sale to start tracking your revenue trend."
            className="border-0 bg-transparent"
          />
        ) : (
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value: string) => axisLabel(value, period)}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={18}
                />
                <YAxis
                  tickFormatter={(value: number) => formatCompact(value)}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <Tooltip
                  cursor={{ stroke: "var(--color-border)" }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-dropdown">
                        <p className="mb-1 font-medium text-muted-foreground">{formatDate(label as string)}</p>
                        <p className="font-semibold text-foreground">{formatCurrency(payload[0].value as number)}</p>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#salesFill)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </PanelBody>
    </Panel>
  );
}
