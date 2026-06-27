"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/data";
import {
  PageHeader, Card, Select, Btn, Badge
} from "@/components/ui/dashboard-ui";
import { BarChart3, TrendingUp, TrendingDown, RefreshCw, Loader2, PieChart } from "lucide-react";

interface DailyEntry {
  day: string;
  entry_type: "inflow" | "outflow";
  total: string;
}

interface SummaryEntry {
  entry_type: "inflow" | "outflow";
  count: string;
  total: string;
}

interface CategoryEntry {
  category: string;
  total: string;
}

interface ReportData {
  daily: DailyEntry[];
  summary: SummaryEntry[];
  top_categories: CategoryEntry[];
}

export default function PaymentReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.payments.mpesa.getReports(period) as ReportData;
      setData(result);
    } catch { setData(null); } finally { setLoading(false); }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const summaryInflow = data?.summary?.find(s => s.entry_type === "inflow");
  const summaryOutflow = data?.summary?.find(s => s.entry_type === "outflow");
  const inflowTotal = parseFloat(summaryInflow?.total || "0");
  const outflowTotal = parseFloat(summaryOutflow?.total || "0");

  const maxDaily = Math.max(
    ...(data?.daily ?? []).map(d => parseFloat(d.total || "0")),
    1
  );

  const dayLabels: Record<string, string> = {
    "7d": "Last 7 Days",
    "30d": "Last 30 Days",
    "90d": "Last 90 Days",
  };

  return (
    <div>
      <PageHeader title="M-Pesa Reports" subtitle={dayLabels[period] || "Transaction analytics"}>
        <div className="flex gap-2">
          {(["7d", "30d", "90d"] as const).map(p => (
            <Btn key={p} small outline={period !== p} color={period === p ? "var(--color-primary)" : "var(--color-muted-foreground)"} onClick={() => setPeriod(p)}>
              {p}
            </Btn>
          ))}
          <Btn outline color="var(--color-muted-foreground)" onClick={load}><RefreshCw className="h-3 w-3" /></Btn>
        </div>
      </PageHeader>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 mb-6">
            <Card accent="var(--color-success)" className="flex-1 min-w-[180px]">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-success" />
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Inflow</div>
                  <div className="text-[22px] font-extrabold text-success">{formatCurrency(inflowTotal)}</div>
                  <div className="text-[11px] text-muted-foreground">{summaryInflow?.count ?? 0} transactions</div>
                </div>
              </div>
            </Card>
            <Card accent="var(--color-destructive)" className="flex-1 min-w-[180px]">
              <div className="flex items-center gap-3">
                <TrendingDown className="h-8 w-8 text-destructive" />
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Outflow</div>
                  <div className="text-[22px] font-extrabold text-destructive">{formatCurrency(outflowTotal)}</div>
                  <div className="text-[11px] text-muted-foreground">{summaryOutflow?.count ?? 0} transactions</div>
                </div>
              </div>
            </Card>
            <Card accent="var(--color-primary)" className="flex-1 min-w-[180px]">
              <div className="flex items-center gap-3">
                <PieChart className="h-8 w-8" style={{ color: "var(--color-primary)" }} />
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Net</div>
                  <div className="text-[22px] font-extrabold" style={{ color: "var(--color-primary)" }}>{formatCurrency(inflowTotal - outflowTotal)}</div>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card>
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Daily Trend
              </h3>
              {(data?.daily ?? []).length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-xs">No data for this period</div>
              ) : (
                <div className="space-y-1">
                  {(data?.daily ?? []).slice(-14).map((d, i) => {
                    const val = parseFloat(d.total || "0");
                    const pct = maxDaily > 0 ? (val / maxDaily) * 100 : 0;
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="w-24 text-muted-foreground flex-shrink-0">
                          {new Date(d.day).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                        <div className="flex-1 h-5 rounded bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded transition-all ${d.entry_type === "inflow" ? "bg-success" : "bg-destructive"}`}
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          />
                        </div>
                        <span className="w-20 text-right font-medium">{formatCurrency(val)}</span>
                        <Badge label={d.entry_type === "inflow" ? "IN" : "OUT"} color={d.entry_type === "inflow" ? "var(--color-success)" : "var(--color-destructive)"} />
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card>
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <PieChart className="h-4 w-4 text-muted-foreground" />
                Top Categories
              </h3>
              {(data?.top_categories ?? []).length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-xs">No categories found</div>
              ) : (
                <div className="space-y-2">
                  {(data?.top_categories ?? []).map((c, i) => {
                    const totalCat = parseFloat(c.total || "0");
                    const grandTotal = (data?.top_categories ?? []).reduce((s, x) => s + parseFloat(x.total || "0"), 0);
                    const pct = grandTotal > 0 ? (totalCat / grandTotal) * 100 : 0;
                    const colors = ["var(--color-primary)", "var(--color-success)", "var(--color-warning)", "var(--color-destructive)", "#ec4899", "#06b6d4", "#a855f7", "#f97316"];
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colors[i % colors.length] }} />
                        <span className="flex-1 text-xs text-foreground">{c.category}</span>
                        <span className="text-xs font-medium">{formatCurrency(totalCat)}</span>
                        <span className="text-xs text-muted-foreground w-10 text-right">{pct.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
