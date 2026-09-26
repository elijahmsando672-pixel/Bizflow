"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  Coins,
  FileSpreadsheet,
  Percent,
  TrendingUp,
  Wallet,
} from "lucide-react";
import api from "@/lib/api";
import {
  formatCompact,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  toNumber,
} from "@/lib/format";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge, humanizeStatus } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

export interface ReportRange {
  start: string;
  end: string;
}

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string; dataKey?: string }>;
  label?: string | number;
  formatter?: (value: number, name: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-dropdown">
      {label !== undefined ? (
        <p className="mb-1 font-medium text-muted-foreground">{String(label)}</p>
      ) : null}
      {payload.map((entry, index) => (
        <p key={index} className="flex items-center gap-1.5 text-foreground">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: entry.color }}
            aria-hidden
          />
          {formatter
            ? formatter(Number(entry.value ?? 0), String(entry.name ?? entry.dataKey ?? ""))
            : `${entry.name}: ${formatCurrency(entry.value)}`}
        </p>
      ))}
    </div>
  );
}

function ReportState({
  loading,
  error,
  onRetry,
  empty,
  emptyTitle,
  emptyDescription,
}: {
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  empty: boolean;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner label="Loading report" />
      </div>
    );
  }
  if (error) return <ErrorState title="Could not load this report" onRetry={onRetry} />;
  if (empty) return <EmptyState title={emptyTitle} description={emptyDescription} />;
  return null;
}

/* ------------------------------------------------------------------ */
/* Profit & loss                                                       */
/* ------------------------------------------------------------------ */

interface ProfitLoss {
  period?: { start?: string; end?: string };
  revenue?: number;
  cogs?: number;
  gross_profit?: number;
  gross_margin?: number | string;
  expenses?: number;
  net_profit?: number;
  net_margin?: number | string;
  expenses_by_category?: Array<{ category: string | null; total: number }>;
  revenue_by_month?: Array<{ month: string; revenue: number }>;
}

export function ProfitLossReport({ range, onData }: { range: ReportRange; onData?: (rows: unknown[]) => void }) {
  const [data, setData] = useState<ProfitLoss | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = (await api.reports.getProfitLoss(
        `start_date=${range.start}&end_date=${range.end}`
      )) as ProfitLoss;
      setData(result);
      onData?.(result.expenses_by_category ?? []);
    } catch {
      setError(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [range.start, range.end, onData]);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(() => data?.expenses_by_category ?? [], [data]);
  const maxCategory = useMemo(
    () => categories.reduce((max, row) => Math.max(max, toNumber(row.total) ?? 0), 0),
    [categories]
  );
  const revenueByMonth = (data?.revenue_by_month ?? []).map((row) => ({
    month: monthLabel(row.month),
    revenue: toNumber(row.revenue) ?? 0,
  }));

  const state = (
    <ReportState
      loading={loading}
      error={error}
      onRetry={load}
      empty={!loading && !error && revenueByMonth.length === 0 && categories.length === 0}
      emptyTitle="No figures for this period"
      emptyDescription="Record sales and expenses to build a profit and loss statement."
    />
  );

  if (state) return state;

  const net = toNumber(data?.net_profit) ?? 0;
  const expenses = toNumber(data?.expenses) ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
        <StatCard label="Revenue" value={formatCurrency(data?.revenue)} icon={Coins} />
        <StatCard label="Cost of goods" value={formatCurrency(data?.cogs)} icon={Boxes} tone="info" />
        <StatCard
          label="Gross profit"
          value={formatCurrency(data?.gross_profit)}
          hint={`${formatPercent(data?.gross_margin)} margin`}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard label="Expenses" value={formatCurrency(expenses)} icon={Wallet} tone="warning" />
        <StatCard
          label="Net profit"
          value={formatCurrency(net)}
          hint={`${formatPercent(data?.net_margin)} margin`}
          icon={net >= 0 ? ArrowUpRight : ArrowDownRight}
          tone={net >= 0 ? "success" : "danger"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader>
            <PanelTitle>Revenue by month</PanelTitle>
          </PanelHeader>
          <PanelBody>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByMonth} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(value: number) => formatCompact(value)}
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                    width={56}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-muted)" }} />
                  <Bar dataKey="revenue" name="Revenue" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader>
            <PanelTitle>Expenses by category</PanelTitle>
          </PanelHeader>
          <PanelBody>
            {categories.length === 0 ? (
              <EmptyState
                title="No expenses in this period"
                className="border-0 bg-transparent py-8"
              />
            ) : (
              <ul className="space-y-3">
                {categories.map((row, index) => {
                  const total = toNumber(row.total) ?? 0;
                  const share = maxCategory > 0 ? (total / maxCategory) * 100 : 0;
                  return (
                    <li key={row.category ?? `cat-${index}`}>
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-medium text-foreground">
                          {row.category || "Uncategorised"}
                        </p>
                        <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                          {formatCurrency(total)}
                        </p>
                      </div>
                      <Progress value={share} className="mt-1.5" />
                    </li>
                  );
                })}
              </ul>
            )}
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sales report                                                        */
/* ------------------------------------------------------------------ */

interface SalesReport {
  period?: { start?: string; end?: string; group_by?: string };
  sales_by_period?: Array<{ period: string; count: number; revenue: number; avg_order: number }>;
  top_customers?: Array<{ name: string; purchase_count: number; total_spent: number }>;
  top_products?: Array<{ name: string; qty_sold: number; revenue: number }>;
}

export function SalesReportView({ range, onData }: { range: ReportRange; onData?: (rows: unknown[]) => void }) {
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  const [data, setData] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = (await api.reports.getSalesReport(
        `start_date=${range.start}&end_date=${range.end}&group_by=${groupBy}`
      )) as SalesReport;
      setData(result);
      onData?.(result.sales_by_period ?? []);
    } catch {
      setError(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [range.start, range.end, groupBy, onData]);

  useEffect(() => {
    load();
  }, [load]);

  const periods = useMemo(() => data?.sales_by_period ?? [], [data]);
  const chartRows = periods.map((row) => ({
    period: groupBy === "month" ? monthLabel(row.period) : row.period,
    revenue: toNumber(row.revenue) ?? 0,
    orders: toNumber(row.count) ?? 0,
  }));

  const totals = useMemo(() => {
    const revenue = periods.reduce((sum, row) => sum + (toNumber(row.revenue) ?? 0), 0);
    const orders = periods.reduce((sum, row) => sum + (toNumber(row.count) ?? 0), 0);
    return {
      revenue,
      orders,
      average: orders > 0 ? revenue / orders : 0,
    };
  }, [periods]);

  const state = (
    <ReportState
      loading={loading}
      error={error}
      onRetry={load}
      empty={!loading && !error && chartRows.length === 0}
      emptyTitle="No sales in this period"
      emptyDescription="Use the Point of Sale to record your first sale."
    />
  );

  if (state) return state;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
        <StatCard label="Revenue" value={formatCurrency(totals.revenue)} icon={Coins} />
        <StatCard label="Orders" value={formatNumber(totals.orders)} icon={FileSpreadsheet} tone="info" />
        <StatCard
          label="Average order"
          value={formatCurrency(totals.average)}
          icon={TrendingUp}
          tone="success"
        />
      </div>

      <Panel>
        <PanelHeader>
          <div>
            <PanelTitle>Sales over time</PanelTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Grouped by {groupBy === "day" ? "day" : groupBy === "week" ? "week" : "month"}
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
            {(["day", "week", "month"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setGroupBy(option)}
                aria-pressed={groupBy === option}
                className={cn(
                  "rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                  groupBy === option
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </PanelHeader>
        <PanelBody>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartRows} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={16}
                />
                <YAxis
                  tickFormatter={(value: number) => formatCompact(value)}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--color-border)" }} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </PanelBody>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader>
            <PanelTitle>Top products</PanelTitle>
          </PanelHeader>
          <PanelBody className="p-0">
            <RankList
              rows={(data?.top_products ?? []).map((row) => ({
                key: row.name,
                label: row.name,
                meta: `${formatNumber(row.qty_sold)} sold`,
                value: toNumber(row.revenue) ?? 0,
              }))}
            />
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader>
            <PanelTitle>Top customers</PanelTitle>
          </PanelHeader>
          <PanelBody className="p-0">
            <RankList
              rows={(data?.top_customers ?? []).map((row) => ({
                key: row.name,
                label: row.name,
                meta: `${formatNumber(row.purchase_count)} purchases`,
                value: toNumber(row.total_spent) ?? 0,
              }))}
            />
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Inventory report                                                    */
/* ------------------------------------------------------------------ */

interface InventoryReport {
  total_products?: number;
  low_stock_count?: number;
  out_of_stock_count?: number;
  total_inventory_value?: number;
  products?: Array<{
    id: string;
    name: string;
    category_name?: string | null;
    stock_qty?: number | string;
    reorder_level?: number | string;
    cost_price?: number | string;
    selling_price?: number | string;
    sold_30d?: number;
  }>;
  recent_movements?: Array<{
    id: string;
    product_name?: string;
    qty_before?: number | string;
    qty_change?: number | string;
    qty_after?: number | string;
    reason?: string;
    reference_type?: string;
    created_at?: string;
  }>;
}

export function InventoryReportView({ onData }: { onData?: (rows: unknown[]) => void }) {
  const [data, setData] = useState<InventoryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = (await api.reports.getInventoryReport()) as InventoryReport;
      setData(result);
      onData?.(result.products ?? []);
    } catch {
      setError(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [onData]);

  useEffect(() => {
    load();
  }, [load]);

  const products = data?.products ?? [];
  const state = (
    <ReportState
      loading={loading}
      error={error}
      onRetry={load}
      empty={!loading && !error && products.length === 0}
      emptyTitle="No products yet"
      emptyDescription="Add products to track stock value and movement."
    />
  );

  if (state) return state;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Active products" value={formatNumber(data?.total_products)} icon={Boxes} />
        <StatCard
          label="Inventory value"
          value={formatCurrency(data?.total_inventory_value)}
          hint="At cost price"
          icon={Coins}
          tone="info"
        />
        <StatCard
          label="Low stock"
          value={formatNumber(data?.low_stock_count)}
          icon={ArrowDownRight}
          tone="warning"
        />
        <StatCard
          label="Out of stock"
          value={formatNumber(data?.out_of_stock_count)}
          icon={ArrowDownRight}
          tone="danger"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Panel className="lg:col-span-3">
          <PanelHeader>
            <PanelTitle>Stock position</PanelTitle>
          </PanelHeader>
          <PanelBody className="p-0">
            <div className="max-h-[420px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-2 text-left font-medium">Product</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">Stock</th>
                    <th scope="col" className="hidden px-2 py-2 text-right font-medium sm:table-cell">Sold 30d</th>
                    <th scope="col" className="px-4 py-2 text-right font-medium">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products.map((product) => {
                    const stock = toNumber(product.stock_qty) ?? 0;
                    const reorder = toNumber(product.reorder_level) ?? 0;
                    const value = stock * (toNumber(product.cost_price) ?? 0);
                    return (
                      <tr key={product.id}>
                        <td className="max-w-[220px] px-4 py-2">
                          <p className="truncate font-medium text-foreground">{product.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {product.category_name || "Uncategorised"}
                          </p>
                        </td>
                        <td className="px-2 py-2 text-right">
                          <span className="tabular-nums text-foreground">{formatNumber(stock)}</span>
                          {stock <= reorder ? (
                            <span className="ml-1.5">
                              <StatusBadge tone={stock === 0 ? "danger" : "warning"}>
                                {stock === 0 ? "Out" : "Low"}
                              </StatusBadge>
                            </span>
                          ) : null}
                        </td>
                        <td className="hidden px-2 py-2 text-right tabular-nums text-muted-foreground sm:table-cell">
                          {formatNumber(product.sold_30d)}
                        </td>
                        <td className="px-4 py-2 text-right font-medium tabular-nums text-foreground">
                          {formatCurrency(value)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </PanelBody>
        </Panel>

        <Panel className="lg:col-span-2">
          <PanelHeader>
            <PanelTitle>Recent stock movements</PanelTitle>
          </PanelHeader>
          <PanelBody className="p-0">
            {(data?.recent_movements ?? []).length === 0 ? (
              <EmptyState
                title="No movements in the last 30 days"
                className="m-4 border-0 bg-transparent"
              />
            ) : (
              <ul className="max-h-[420px] divide-y divide-border overflow-y-auto">
                {(data?.recent_movements ?? []).map((movement) => {
                  const change = toNumber(movement.qty_change) ?? 0;
                  return (
                    <li key={movement.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {movement.product_name || "Product"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {humanizeStatus(movement.reason)} · {formatDate(movement.created_at)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p
                          className={cn(
                            "text-sm font-semibold tabular-nums",
                            change >= 0 ? "text-success" : "text-destructive"
                          )}
                        >
                          {change > 0 ? "+" : ""}
                          {formatNumber(change)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatNumber(movement.qty_after)} on hand
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cashflow report                                                     */
/* ------------------------------------------------------------------ */

interface CashflowReport {
  total_inflow?: number;
  total_outflow?: number;
  net_cashflow?: number;
  inflows_by_source?: Array<{ source: string | null; total: number; count: number }>;
  outflows_by_source?: Array<{ source: string | null; total: number; count: number }>;
  daily_flow?: Array<{ date: string; type: string; total: number }>;
}

export function CashflowReportView({ range, onData }: { range: ReportRange; onData?: (rows: unknown[]) => void }) {
  const [data, setData] = useState<CashflowReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = (await api.reports.getCashflowReport(
        `start_date=${range.start}&end_date=${range.end}`
      )) as CashflowReport;
      setData(result);
      onData?.(result.daily_flow ?? []);
    } catch {
      setError(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [range.start, range.end, onData]);

  useEffect(() => {
    load();
  }, [load]);

  const chartRows = useMemo(() => {
    const byDate = new Map<string, { date: string; inflow: number; outflow: number }>();
    for (const row of data?.daily_flow ?? []) {
      const key = String(row.date).slice(0, 10);
      const entry = byDate.get(key) ?? { date: key, inflow: 0, outflow: 0 };
      if (row.type === "inflow") entry.inflow = toNumber(row.total) ?? 0;
      else entry.outflow = toNumber(row.total) ?? 0;
      byDate.set(key, entry);
    }
    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  const state = (
    <ReportState
      loading={loading}
      error={error}
      onRetry={load}
      empty={!loading && !error && chartRows.length === 0}
      emptyTitle="No cash movement in this period"
      emptyDescription="Cashflow entries are created as sales and expenses are recorded."
    />
  );

  if (state) return state;

  const net = toNumber(data?.net_cashflow) ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2.5">
        <StatCard label="Money in" value={formatCurrency(data?.total_inflow)} icon={ArrowUpRight} tone="success" />
        <StatCard label="Money out" value={formatCurrency(data?.total_outflow)} icon={ArrowDownRight} tone="danger" />
        <StatCard
          label="Net cashflow"
          value={formatCurrency(net)}
          icon={Wallet}
          tone={net >= 0 ? "success" : "danger"}
        />
      </div>

      <Panel>
        <PanelHeader>
          <PanelTitle>Daily cash movement</PanelTitle>
        </PanelHeader>
        <PanelBody>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartRows} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="date"
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
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-muted)" }} />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: "var(--color-muted-foreground)" }}
                  iconType="circle"
                />
                <Bar dataKey="inflow" name="Inflow" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outflow" name="Outflow" fill="var(--color-destructive)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </PanelBody>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <SourceList title="Inflows by source" rows={data?.inflows_by_source ?? []} tone="success" />
        <SourceList title="Outflows by source" rows={data?.outflows_by_source ?? []} tone="danger" />
      </div>
    </div>
  );
}

function SourceList({
  title,
  rows,
  tone,
}: {
  title: string;
  rows: Array<{ source: string | null; total: number; count: number }>;
  tone: "success" | "danger";
}) {
  const max = rows.reduce((value, row) => Math.max(value, toNumber(row.total) ?? 0), 0);
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>{title}</PanelTitle>
      </PanelHeader>
      <PanelBody>
        {rows.length === 0 ? (
          <EmptyState title="Nothing recorded" className="border-0 bg-transparent py-8" />
        ) : (
          <ul className="space-y-3">
            {rows.map((row, index) => {
              const total = toNumber(row.total) ?? 0;
              return (
                <li key={`${row.source ?? "source"}-${index}`}>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-medium capitalize text-foreground">
                      {(row.source || "other").replace(/[_-]+/g, " ")}
                    </p>
                    <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                      {formatCurrency(total)}
                    </p>
                  </div>
                  <Progress
                    value={max > 0 ? (total / max) * 100 : 0}
                    className="mt-1.5"
                    tone={tone}
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">{formatNumber(row.count)} entries</p>
                </li>
              );
            })}
          </ul>
        )}
      </PanelBody>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Tax summary                                                         */
/* ------------------------------------------------------------------ */

interface TaxSummary {
  year?: number;
  total_tax_collected?: number;
  monthly_sales?: Array<{ month: string; count: number; revenue: number }>;
  monthly_expenses?: Array<{ month: string; total: number }>;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function TaxSummaryReport({ year, onData }: { year: number; onData?: (rows: unknown[]) => void }) {
  const [data, setData] = useState<TaxSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = (await api.reports.getTaxSummary(String(year))) as TaxSummary;
      setData(result);
      onData?.(result.monthly_sales ?? []);
    } catch {
      setError(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [year, onData]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const sales = data?.monthly_sales ?? [];
    const expenses = data?.monthly_expenses ?? [];
    return MONTH_NAMES.map((name, index) => {
      const key = String(index + 1).padStart(2, "0");
      const sale = sales.find((row) => String(row.month).padStart(2, "0") === key);
      const expense = expenses.find((row) => String(row.month).padStart(2, "0") === key);
      return {
        month: name,
        revenue: toNumber(sale?.revenue) ?? 0,
        expenses: toNumber(expense?.total) ?? 0,
        count: toNumber(sale?.count) ?? 0,
      };
    });
  }, [data]);

  const state = (
    <ReportState
      loading={loading}
      error={error}
      onRetry={load}
      empty={!loading && !error && rows.every((row) => row.revenue === 0 && row.expenses === 0)}
      emptyTitle={`No activity recorded in ${year}`}
      emptyDescription="Sales and expenses recorded this year will appear here."
    />
  );

  if (state) return state;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
        <StatCard
          label={`VAT collected (${year})`}
          value={formatCurrency(data?.total_tax_collected)}
          hint="16% on paid sales"
          icon={Percent}
          tone="info"
        />
        <StatCard
          label="Recorded sales"
          value={formatCurrency(rows.reduce((sum, row) => sum + row.revenue, 0))}
          icon={Coins}
        />
        <StatCard
          label="Recorded expenses"
          value={formatCurrency(rows.reduce((sum, row) => sum + row.expenses, 0))}
          icon={Wallet}
          tone="warning"
        />
      </div>

      <Panel>
        <PanelHeader>
          <PanelTitle>Monthly sales vs expenses</PanelTitle>
        </PanelHeader>
        <PanelBody>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(value: number) => formatCompact(value)}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-muted)" }} />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: "var(--color-muted-foreground)" }}
                  iconType="circle"
                />
                <Bar dataKey="revenue" name="Sales" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="var(--color-warning)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </PanelBody>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

function RankList({
  rows,
}: {
  rows: Array<{ key: string; label: string; meta: string; value: number }>;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState title="Nothing to rank yet" className="m-4 border-0 bg-transparent" />
    );
  }
  const max = rows.reduce((value, row) => Math.max(value, row.value), 0);
  return (
    <ul className="divide-y divide-border">
      {rows.map((row, index) => (
        <li key={`${row.key}-${index}`} className="px-4 py-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate text-sm font-medium text-foreground">
              <span className="mr-2 text-xs text-muted-foreground">{index + 1}</span>
              {row.label}
            </p>
            <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
              {formatCurrency(row.value)}
            </p>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <Progress value={max > 0 ? (row.value / max) * 100 : 0} className="flex-1" />
            <span className="shrink-0 text-[11px] text-muted-foreground">{row.meta}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function monthLabel(value: string): string {
  const [year, month] = String(value).split("-");
  const index = Number(month) - 1;
  if (Number.isNaN(index) || index < 0 || index > 11) return value;
  return year ? `${MONTH_NAMES[index]} ${year.slice(2)}` : MONTH_NAMES[index];
}

export { monthLabel };
