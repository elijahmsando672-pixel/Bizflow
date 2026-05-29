"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const PERIODS = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1Y", days: 365 },
];

function token() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function fetchJson(url: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token()}` },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

const PIE_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#f97316", "#ef4444"];

type Summary = {
  totalRevenue: number;
  totalExpenses: number;
  totalOrders: number;
  profit: number;
  profitMargin: number;
};

type RevenueDataPoint = { date: string; revenue: number };
type ExpenseCategory = { category: string; total: number };
type TopProduct = { name: string; total_sold: number; total_revenue: number };

export default function AnalyticsPage() {
  const [period, setPeriod] = useState(30);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [expenseData, setExpenseData] = useState<ExpenseCategory[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const periodParam = period === 365 ? "year" : period === 30 ? "month" : period === 7 ? "week" : "month";
    const revenueUrl = period === 30
      ? `${API}/dashboard/revenue-chart`
      : `${API}/dashboard/revenue-chart?period=${periodParam}`;

    Promise.all([
      fetchJson(`${API}/dashboard/profit-summary`).then((d: Record<string, unknown>) => ({
        totalRevenue: Number(d.revenue),
        totalExpenses: Number(d.expenses),
        profit: Number(d.profit),
        profitMargin: Number(d.profitMargin),
        totalOrders: 0,
      })),
      fetchJson(revenueUrl) as Promise<RevenueDataPoint[]>,
      fetchJson(`${API}/dashboard/expenses-chart`) as Promise<ExpenseCategory[]>,
      fetchJson(`${API}/dashboard/top-products?period=${period}`) as Promise<TopProduct[]>,
    ])
      .then(([sum, rev, exp, prods]) => {
        setSummary(sum);
        setRevenueData(rev);
        setExpenseData(exp);
        setTopProducts(prods);
      })
      .catch(() => setError("Failed to load analytics data"))
      .finally(() => setLoading(false));
  }, [period]);

  const periodLabel = PERIODS.find((p) => p.days === period)?.label || "30D";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Business performance overview</p>
        </div>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <Button
              key={p.days}
              variant={period === p.days ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod(p.days)}
              className="text-xs"
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}><CardContent className="p-5"><Skeleton className="h-20 w-full" /></CardContent></Card>
            ))}
          </div>
          <Card><CardContent className="p-5"><Skeleton className="h-64 w-full" /></CardContent></Card>
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <Card><CardContent className="p-5"><Skeleton className="h-64 w-full" /></CardContent></Card>
            <Card><CardContent className="p-5"><Skeleton className="h-64 w-full" /></CardContent></Card>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Revenue"
              value={summary?.totalRevenue ?? 0}
              icon={DollarSign}
              prefix="KES"
              color="text-emerald-500"
              bgColor="bg-emerald-500/10"
            />
            <StatCard
              label="Expenses"
              value={summary?.totalExpenses ?? 0}
              icon={TrendingDown}
              prefix="KES"
              color="text-red-500"
              bgColor="bg-red-500/10"
            />
            <StatCard
              label="Profit"
              value={summary?.profit ?? 0}
              icon={TrendingUp}
              prefix="KES"
              color={summary && summary.profit >= 0 ? "text-emerald-500" : "text-red-500"}
              bgColor="bg-blue-500/10"
              suffix={summary ? `(${summary.profitMargin.toFixed(1)}%)` : undefined}
            />
            <StatCard
              label="Orders"
              value={topProducts.reduce((s, p) => s + Number(p.total_sold || 0), 0)}
              icon={ShoppingCart}
              color="text-indigo-500"
              bgColor="bg-indigo-500/10"
            />
          </div>

          <Card className="overflow-hidden">
            <CardHeader><CardTitle>Revenue — {periodLabel}</CardTitle></CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `KES ${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 }}
                      formatter={(value: number) => [`KES ${Number(value).toLocaleString()}`, "Revenue"]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revenueGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Expenses by Category</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  {expenseData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-12">No expense data</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={expenseData} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={90} innerRadius={50}>
                          {expenseData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 }}
                          formatter={(value: number) => [`KES ${Number(value).toLocaleString()}`, "Total"]}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Top Products</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  {topProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-12">No product data</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topProducts.slice(0, 8)} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={120} />
                        <Tooltip
                          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 }}
                          formatter={(value: number) => [value.toLocaleString(), "Sold"]}
                        />
                        <Bar dataKey="total_sold" fill="#6366f1" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, prefix, color, bgColor, suffix,
}: {
  label: string; value: number; icon: React.ComponentType<{ className?: string }>; prefix?: string; color: string; bgColor: string; suffix?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-xl font-bold mt-1">
              {prefix ? `${prefix} ` : ""}{value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            {suffix && <p className="text-xs text-muted-foreground mt-0.5">{suffix}</p>}
          </div>
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", bgColor)}>
            <Icon className={cn("h-4 w-4", color)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
