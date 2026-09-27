"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Download,
  ListTree,
  PieChart,
  RefreshCw,
  Scale,
  TrendingUp,
} from "lucide-react";
import api from "@/lib/api";
import { downloadCsv } from "@/lib/csv";
import { formatCurrency, formatNumber, toDateKey, toNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { StatCard } from "@/components/ui/stat-card";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type Period = "7d" | "30d" | "90d";

const PERIODS: Array<{ value: Period; label: string; days: number }> = [
  { value: "7d", label: "7 days", days: 7 },
  { value: "30d", label: "30 days", days: 30 },
  { value: "90d", label: "90 days", days: 90 },
];

interface DailyRow {
  day?: string | null;
  entry_type?: string | null;
  total?: number | string | null;
}

interface SummaryRow {
  entry_type?: string | null;
  count?: number | string | null;
  total?: number | string | null;
}

interface CategoryRow {
  category?: string | null;
  total?: number | string | null;
}

interface ReportsResponse {
  daily?: DailyRow[];
  summary?: SummaryRow[];
  top_categories?: CategoryRow[];
}

interface DayBucket {
  day: string;
  inflow: number;
  outflow: number;
}

function buildBuckets(daily: DailyRow[], days: number): DayBucket[] {
  const byDay = new Map<string, DayBucket>();
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const key = toDateKey(date);
    byDay.set(key, { day: key, inflow: 0, outflow: 0 });
  }

  daily.forEach((row) => {
    const key = toDateKey(row.day);
    if (!key) return;
    const bucket = byDay.get(key);
    if (!bucket) return;
    const amount = toNumber(row.total) ?? 0;
    if (row.entry_type === "inflow") bucket.inflow += amount;
    else if (row.entry_type === "outflow") bucket.outflow += amount;
  });

  return [...byDay.values()];
}

export default function MpesaReportsPage() {
  const toast = useToast();
  const [period, setPeriod] = useState<Period>("30d");
  const [data, setData] = useState<ReportsResponse>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = (await api.payments.mpesa.getReports(period)) as ReportsResponse;
      setData({
        daily: Array.isArray(result?.daily) ? result.daily : [],
        summary: Array.isArray(result?.summary) ? result.summary : [],
        top_categories: Array.isArray(result?.top_categories) ? result.top_categories : [],
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const periodDays = PERIODS.find((entry) => entry.value === period)?.days ?? 30;

  const buckets = useMemo(() => buildBuckets(data.daily ?? [], periodDays), [data.daily, periodDays]);

  const totals = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    buckets.forEach((bucket) => {
      inflow += bucket.inflow;
      outflow += bucket.outflow;
    });
    const activeDays = buckets.filter((bucket) => bucket.inflow > 0 || bucket.outflow > 0).length;
    return { inflow, outflow, net: inflow - outflow, activeDays };
  }, [buckets]);

  const summary = useMemo(() => {
    const inflow = (data.summary ?? []).find((row) => row.entry_type === "inflow");
    const outflow = (data.summary ?? []).find((row) => row.entry_type === "outflow");
    return {
      inflowCount: toNumber(inflow?.count) ?? 0,
      outflowCount: toNumber(outflow?.count) ?? 0,
    };
  }, [data.summary]);

  const categories = useMemo(
    () =>
      (data.top_categories ?? [])
        .map((row) => ({ category: row.category || "Uncategorised", total: toNumber(row.total) ?? 0 }))
        .sort((a, b) => b.total - a.total),
    [data.top_categories]
  );

  const categoryMax = categories.length > 0 ? Math.max(...categories.map((row) => row.total)) : 0;
  const chartMax = Math.max(1, ...buckets.map((bucket) => Math.max(bucket.inflow, bucket.outflow)));
  const isEmpty = totals.inflow === 0 && totals.outflow === 0;

  const exportDaily = () => {
    if (isEmpty) {
      toast.error("There is nothing to export yet");
      return;
    }
    downloadCsv(`bizflow-mpesa-report-${period}`, buckets, [
      { header: "Date", value: (row) => row.day },
      { header: "Inflow (KES)", value: (row) => row.inflow },
      { header: "Outflow (KES)", value: (row) => row.outflow },
      { header: "Net (KES)", value: (row) => row.inflow - row.outflow },
    ]);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="M-Pesa reports"
        description="Where your mobile money came from and where it went."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportDaily} disabled={loading || isEmpty}>
              <Download className="h-4 w-4" aria-hidden />
              Export
            </Button>
          </>
        }
      />

      <div
        className="flex rounded-md border border-border p-0.5"
        role="group"
        aria-label="Report period"
      >
        {PERIODS.map((entry) => (
          <button
            key={entry.value}
            type="button"
            onClick={() => setPeriod(entry.value)}
            aria-pressed={period === entry.value}
            className={cn(
              "flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors",
              period === entry.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState title="Could not load the report" onRetry={load} retrying={loading} />
      ) : loading ? (
        <div className="flex justify-center py-24">
          <Spinner label="Building your report" />
        </div>
      ) : isEmpty ? (
        <Panel>
          <PanelBody className="p-0">
            <EmptyState
              icon={BarChart3}
              title="Nothing to report yet"
              description="Once M-Pesa transactions are recorded, this page will chart your inflow, outflow and net position."
              className="m-4 border-0 bg-transparent"
            />
          </PanelBody>
        </Panel>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <StatCard
              label="Inflow"
              value={formatCurrency(totals.inflow)}
              icon={ArrowUpRight}
              tone="success"
              hint={`${formatNumber(summary.inflowCount)} entries`}
            />
            <StatCard
              label="Outflow"
              value={formatCurrency(totals.outflow)}
              icon={ArrowDownRight}
              tone="danger"
              hint={`${formatNumber(summary.outflowCount)} entries`}
            />
            <StatCard
              label="Net"
              value={formatCurrency(totals.net)}
              icon={Scale}
              tone={totals.net >= 0 ? "primary" : "danger"}
            />
            <StatCard
              label="Active days"
              value={`${formatNumber(totals.activeDays)}/${formatNumber(periodDays)}`}
              icon={TrendingUp}
              tone="info"
            />
          </div>

          <Panel>
            <PanelHeader>
              <PanelTitle>
                <span className="inline-flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4" aria-hidden />
                  Daily movement
                </span>
              </PanelTitle>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-success" aria-hidden />
                  Inflow
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-destructive" aria-hidden />
                  Outflow
                </span>
              </div>
            </PanelHeader>
            <PanelBody>
              <div
                className="flex h-52 items-end gap-[2px] overflow-x-auto"
                role="img"
                aria-label={`Daily M-Pesa inflow and outflow over the last ${periodDays} days`}
              >
                {buckets.map((bucket) => {
                  const inflowHeight = (bucket.inflow / chartMax) * 100;
                  const outflowHeight = (bucket.outflow / chartMax) * 100;
                  return (
                    <div
                      key={bucket.day}
                      className="flex min-w-[6px] flex-1 flex-col justify-end gap-[2px]"
                      title={`${bucket.day} · Inflow ${formatCurrency(bucket.inflow)} · Outflow ${formatCurrency(bucket.outflow)}`}
                    >
                      <div
                        className="rounded-t-sm bg-success"
                        style={{ height: `${inflowHeight}%` }}
                      />
                      <div
                        className="rounded-b-sm bg-destructive"
                        style={{ height: `${outflowHeight}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {buckets[0]?.day} → {buckets[buckets.length - 1]?.day}
              </p>

              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                  View as table
                </summary>
                <div className="mt-2 max-h-64 overflow-y-auto rounded-md border border-border">
                  <table className="w-full min-w-[420px] text-sm">
                    <thead className="sticky top-0 bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th scope="col" className="px-3 py-2 text-left font-medium">Date</th>
                        <th scope="col" className="px-2 py-2 text-right font-medium">Inflow</th>
                        <th scope="col" className="px-2 py-2 text-right font-medium">Outflow</th>
                        <th scope="col" className="px-3 py-2 text-right font-medium">Net</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {buckets
                        .filter((bucket) => bucket.inflow > 0 || bucket.outflow > 0)
                        .map((bucket) => (
                          <tr key={bucket.day}>
                            <td className="px-3 py-1.5 text-muted-foreground">{bucket.day}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums text-success">
                              {formatCurrency(bucket.inflow)}
                            </td>
                            <td className="px-2 py-1.5 text-right tabular-nums text-destructive">
                              {formatCurrency(bucket.outflow)}
                            </td>
                            <td className="px-3 py-1.5 text-right font-medium tabular-nums text-foreground">
                              {formatCurrency(bucket.inflow - bucket.outflow)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </PanelBody>
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel>
              <PanelHeader>
                <PanelTitle>
                  <span className="inline-flex items-center gap-1.5">
                    <PieChart className="h-4 w-4" aria-hidden />
                    Inflow vs outflow
                  </span>
                </PanelTitle>
              </PanelHeader>
              <PanelBody className="space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Inflow</span>
                    <span className="font-medium tabular-nums text-foreground">
                      {formatCurrency(totals.inflow)}
                    </span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Outflow</span>
                    <span className="font-medium tabular-nums text-foreground">
                      {formatCurrency(totals.outflow)}
                    </span>
                  </div>
                  <Progress
                    value={
                      totals.inflow + totals.outflow > 0
                        ? (totals.outflow / (totals.inflow + totals.outflow)) * 100
                        : 0
                    }
                    className="h-2"
                  />
                </div>
                <dl className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Turnover ratio</dt>
                    <dd className="font-medium tabular-nums text-foreground">
                      {totals.outflow > 0
                        ? `${(totals.inflow / totals.outflow).toFixed(2)}×`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Average net / day</dt>
                    <dd className="font-medium tabular-nums text-foreground">
                      {formatCurrency(totals.net / periodDays)}
                    </dd>
                  </div>
                </dl>
              </PanelBody>
            </Panel>

            <Panel>
              <PanelHeader>
                <PanelTitle>
                  <span className="inline-flex items-center gap-1.5">
                    <ListTree className="h-4 w-4" aria-hidden />
                    Top categories
                  </span>
                </PanelTitle>
              </PanelHeader>
              <PanelBody className="p-0">
                {categories.length === 0 ? (
                  <EmptyState
                    icon={ListTree}
                    title="No categories yet"
                    description="Tag transactions with a category to see where your money goes."
                    className="m-4 border-0 bg-transparent"
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {categories.map((row) => (
                      <li key={row.category} className="px-4 py-2.5">
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="truncate font-medium text-foreground">{row.category}</span>
                          <span className="ml-3 shrink-0 font-medium tabular-nums text-foreground">
                            {formatCurrency(row.total)}
                          </span>
                        </div>
                        <Progress
                          value={categoryMax > 0 ? (row.total / categoryMax) * 100 : 0}
                          className="h-1.5"
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </PanelBody>
            </Panel>
          </div>

          <p className="text-xs text-muted-foreground">
            Category totals cover all recorded M-Pesa activity, not only the selected period.
          </p>
        </>
      )}
    </div>
  );
}
