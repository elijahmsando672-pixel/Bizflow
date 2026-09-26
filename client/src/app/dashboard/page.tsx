"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  CircleDollarSign,
  CreditCard,
  Package,
  Receipt,
  RefreshCw,
  ScanLine,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Wallet,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency, formatNumber, formatPercent, toNumber } from "@/lib/format";
import type { DashboardData, FrequentCustomer, LowStockItem, RestockBudgetData, TopProduct } from "@/types";
import { SalesOverview } from "@/components/dashboard/sales-overview";
import {
  CustomerSnapshotPanel,
  ExpenseBreakdownPanel,
  InventoryAlertsPanel,
  RecentTransactionsPanel,
  TopProductsPanel,
  type ExpenseSlice,
} from "@/components/dashboard/dashboard-panels";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { Panel, PanelBody } from "@/components/ui/panel";

const QUICK_ACTIONS = [
  { label: "New Sale", href: "/dashboard/sales/new", icon: ScanLine },
  { label: "Add Customer", href: "/dashboard/customers/new", icon: UserPlus },
  { label: "Add Product", href: "/dashboard/inventory/new", icon: Package },
  { label: "Record Expense", href: "/dashboard/expenses/new", icon: TrendingDown },
  { label: "Create Invoice", href: "/dashboard/payments", icon: Receipt },
  { label: "View Reports", href: "/dashboard/reports", icon: BarChart3 },
];

interface ProfitSummary {
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: number | string;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function today(): string {
  return new Date().toLocaleDateString("en-KE", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function DashboardPage() {
  const { user, selectedShop } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [restockBudget, setRestockBudget] = useState<RestockBudgetData | null>(null);
  const [customers, setCustomers] = useState<FrequentCustomer[]>([]);
  const [expenseSlices, setExpenseSlices] = useState<ExpenseSlice[]>([]);
  const [profit, setProfit] = useState<ProfitSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stats, top, low, restock, frequent, expenses, profitSummary] = await Promise.all([
        api.dashboard.getStats() as Promise<DashboardData>,
        api.dashboard.getTopProducts("30").catch(() => [] as TopProduct[]),
        api.dashboard.getLowStockDetails().catch(() => [] as LowStockItem[]),
        api.dashboard.getRestockBudget(2).catch(() => null),
        api.dashboard.getFrequentCustomers("30").catch(() => [] as FrequentCustomer[]),
        api.dashboard.getExpensesChart().catch(() => [] as ExpenseSlice[]),
        api.dashboard.getProfitSummary().catch(() => null),
      ]);

      setData(stats);
      setTopProducts(Array.isArray(top) ? top : []);
      setLowStock(Array.isArray(low) ? low : []);
      setRestockBudget((restock as RestockBudgetData | null) ?? null);
      setCustomers(Array.isArray(frequent) ? frequent : []);
      setExpenseSlices(Array.isArray(expenses) ? expenses : []);
      setProfit((profitSummary as ProfitSummary | null) ?? null);
    } catch {
      setError("We could not load your dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = data?.stats;
  const revenue = toNumber(stats?.totalRevenue) ?? 0;
  const expenses = toNumber(stats?.totalExpenses) ?? 0;
  const netProfit = profit ? toNumber(profit.profit) ?? revenue - expenses : revenue - expenses;
  const margin = profit ? toNumber(profit.profitMargin) : revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const cashBalance = (toNumber(stats?.totalInflow) ?? 0) - (toNumber(stats?.totalOutflow) ?? 0);

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground lg:text-2xl">
            {greeting()}
            {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {today()}
            {selectedShop ? ` · ${selectedShop.name}` : ""} — here is how your business is doing.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild>
            <Link href="/dashboard/sales/new">
              <ScanLine className="h-4 w-4" aria-hidden />
              New Sale
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/reports">
              <BarChart3 className="h-4 w-4" aria-hidden />
              Reports
            </Link>
          </Button>
        </div>
      </header>

      <section aria-label="Quick actions">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.href}
              variant="outline"
              asChild
              className="h-auto justify-start gap-2.5 px-3 py-2.5 text-left"
            >
              <Link href={action.href}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-accent-foreground">
                  <action.icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 truncate text-sm font-medium">{action.label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </section>

      {error ? (
        <ErrorState title="Dashboard unavailable" description={error} onRetry={load} retrying={loading} />
      ) : (
        <>
          <section aria-label="Key metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Revenue"
              value={formatCurrency(revenue)}
              icon={TrendingUp}
              tone="success"
              href="/dashboard/reports"
              hint="Paid sales all time"
              loading={loading}
            />
            <StatCard
              label="Total Expenses"
              value={formatCurrency(expenses)}
              icon={TrendingDown}
              tone="warning"
              href="/dashboard/expenses"
              hint="Recorded all time"
              loading={loading}
            />
            <StatCard
              label="Net Profit"
              value={formatCurrency(netProfit)}
              icon={CircleDollarSign}
              tone={netProfit >= 0 ? "primary" : "danger"}
              hint={`${formatPercent(margin ?? 0)} margin`}
              loading={loading}
            />
            <StatCard
              label="Pending Payments"
              value={formatCurrency(stats?.pendingPayments)}
              icon={CreditCard}
              tone="info"
              href="/dashboard/payments"
              hint={`${formatNumber(stats?.activeInvoices)} active invoices`}
              loading={loading}
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <SalesOverview />
            <TopProductsPanel products={topProducts} loading={loading} />
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RecentTransactionsPanel
                sales={data?.recentSales ?? []}
                expenses={data?.recentExpenses ?? []}
                loading={loading}
              />
            </div>
            <InventoryAlertsPanel
              items={lowStock}
              restockBudget={restockBudget}
              loading={loading}
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <CustomerSnapshotPanel
              customers={customers}
              totalCustomers={toNumber(stats?.totalCustomers) ?? 0}
              loading={loading}
            />
            <ExpenseBreakdownPanel
              slices={expenseSlices}
              loading={loading}
              margin={margin ?? null}
            />
          </section>

          <section aria-label="Business snapshot" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Panel>
              <PanelBody className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Customers</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    {loading ? "—" : formatNumber(stats?.totalCustomers)}
                  </p>
                </div>
                <UserPlus className="h-5 w-5 text-muted-foreground" aria-hidden />
              </PanelBody>
            </Panel>
            <Panel>
              <PanelBody className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Active invoices</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    {loading ? "—" : formatNumber(stats?.activeInvoices)}
                  </p>
                </div>
                <Receipt className="h-5 w-5 text-muted-foreground" aria-hidden />
              </PanelBody>
            </Panel>
            <Panel>
              <PanelBody className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Low stock items</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    {loading ? "—" : formatNumber(stats?.lowStockProducts)}
                  </p>
                </div>
                <Package className="h-5 w-5 text-muted-foreground" aria-hidden />
              </PanelBody>
            </Panel>
            <Panel>
              <PanelBody className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cash balance</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    {loading ? "—" : formatCurrency(cashBalance)}
                  </p>
                </div>
                <Wallet className="h-5 w-5 text-muted-foreground" aria-hidden />
              </PanelBody>
            </Panel>
          </section>
        </>
      )}

      {!error && !loading ? (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={load} className="text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Refresh data
          </Button>
        </div>
      ) : null}
    </div>
  );
}
