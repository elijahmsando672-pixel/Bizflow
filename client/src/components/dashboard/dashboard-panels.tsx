"use client";

import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Package,
  Receipt,
  ShoppingBag,
  TrendingDown,
  TriangleAlert,
  UserRound,
  Wallet,
} from "lucide-react";
import type { DashboardExpense, DashboardSale, FrequentCustomer, LowStockItem, TopProduct } from "@/types";
import { formatCurrency, formatDate, formatNumber, formatPercent, toNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/status-badge";
import { Panel, PanelBody, PanelFooter, PanelHeader, PanelTitle } from "@/components/ui/panel";

interface PanelLinkProps {
  href: string;
  label: string;
}

function ViewAll({ href, label }: PanelLinkProps) {
  return (
    <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
      <Link href={href}>
        {label}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </Button>
  );
}

export function TopProductsPanel({
  products,
  loading,
}: {
  products: TopProduct[];
  loading: boolean;
}) {
  const maxSold = products.reduce((max, product) => Math.max(max, toNumber(product.total_sold) ?? 0), 0);

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" aria-hidden />
          Top products
        </PanelTitle>
        <ViewAll href="/dashboard/products" label="Catalogue" />
      </PanelHeader>

      {loading ? (
        <PanelBody className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-3.5 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-1.5 w-full animate-pulse rounded bg-muted" />
            </div>
          ))}
        </PanelBody>
      ) : products.length === 0 ? (
        <PanelBody>
          <EmptyState
            icon={Package}
            title="No sales recorded yet"
            description="Top sellers appear here once you complete a sale."
            className="border-0 bg-transparent py-8"
          />
        </PanelBody>
      ) : (
        <ul className="divide-y divide-border">
          {products.slice(0, 6).map((product, index) => {
            const sold = toNumber(product.total_sold) ?? 0;
            return (
              <li key={product.id} className="flex items-center gap-3 px-4 py-3">
                <span className="w-5 shrink-0 text-xs font-semibold text-muted-foreground">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {product.category_name || "Uncategorised"} · {formatNumber(sold)} sold
                  </p>
                  <Progress
                    className="mt-1.5"
                    size="sm"
                    value={maxSold > 0 ? (sold / maxSold) * 100 : 0}
                    tone="primary"
                  />
                </div>
                <span className="shrink-0 text-sm font-semibold text-foreground">
                  {formatCurrency(product.total_revenue)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

export function RecentTransactionsPanel({
  sales,
  expenses,
  loading,
}: {
  sales: DashboardSale[];
  expenses: DashboardExpense[];
  loading: boolean;
}) {
  const rows = [
    ...sales.map((sale) => ({
      id: sale.id,
      kind: "sale" as const,
      title: sale.customer_name || "Walk-in customer",
      meta: `Sale · ${formatDate(sale.sale_date)}`,
      amount: toNumber(sale.total) ?? 0,
      status: sale.status,
      at: new Date(sale.sale_date).getTime() || 0,
    })),
    ...expenses.map((expense) => ({
      id: expense.id,
      kind: "expense" as const,
      title: expense.description || "Expense",
      meta: `Expense · ${formatDate(expense.date)}`,
      amount: -(toNumber(expense.amount) ?? 0),
      status: "posted",
      at: new Date(expense.date).getTime() || 0,
    })),
  ]
    .sort((a, b) => b.at - a.at)
    .slice(0, 8);

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" aria-hidden />
          Recent transactions
        </PanelTitle>
        <ViewAll href="/dashboard/sales" label="All sales" />
      </PanelHeader>

      {loading ? (
        <PanelBody className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="h-3.5 w-1/2 animate-pulse rounded bg-muted" />
              <div className="h-3.5 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </PanelBody>
      ) : rows.length === 0 ? (
        <PanelBody>
          <EmptyState
            icon={Receipt}
            title="No transactions yet"
            description="Sales and expenses you record will appear here."
            className="border-0 bg-transparent py-8"
          />
        </PanelBody>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li key={`${row.kind}-${row.id}`} className="flex items-center gap-3 px-4 py-3">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                  row.amount >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                }`}
              >
                {row.amount >= 0 ? (
                  <ShoppingBag className="h-4 w-4" aria-hidden />
                ) : (
                  <TrendingDown className="h-4 w-4" aria-hidden />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{row.title}</p>
                <p className="truncate text-xs text-muted-foreground">{row.meta}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span
                  className={`text-sm font-semibold ${
                    row.amount >= 0 ? "text-foreground" : "text-destructive"
                  }`}
                >
                  {row.amount >= 0 ? "+" : "−"}
                  {formatCurrency(Math.abs(row.amount))}
                </span>
                {row.kind === "sale" ? <StatusBadge status={row.status} /> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function InventoryAlertsPanel({
  items,
  restockBudget,
  loading,
}: {
  items: LowStockItem[];
  restockBudget: { totalBudget: number; itemCount: number } | null;
  loading: boolean;
}) {
  return (
    <Panel>
      <PanelHeader>
        <div>
          <PanelTitle className="flex items-center gap-2">
            <TriangleAlert className="h-4 w-4 text-warning" aria-hidden />
            Inventory alerts
          </PanelTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">Items at or below their reorder level</p>
        </div>
        <ViewAll href="/dashboard/inventory" label="Inventory" />
      </PanelHeader>

      {loading ? (
        <PanelBody className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-10 animate-pulse rounded bg-muted" />
          ))}
        </PanelBody>
      ) : items.length === 0 ? (
        <PanelBody>
          <EmptyState
            icon={Boxes}
            title="Stock levels are healthy"
            description="Nothing needs reordering right now."
            className="border-0 bg-transparent py-8"
          />
        </PanelBody>
      ) : (
        <>
          <ul className="divide-y divide-border">
            {items.slice(0, 5).map((item) => {
              const stock = toNumber(item.stock_qty) ?? 0;
              const reorder = toNumber(item.reorder_level) ?? 0;
              const ratio = reorder > 0 ? Math.min(100, (stock / reorder) * 100) : stock > 0 ? 100 : 0;
              return (
                <li key={item.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                    <StatusBadge
                      tone={stock <= 0 ? "danger" : "warning"}
                      className="shrink-0"
                    >
                      {stock <= 0 ? "Out of stock" : `${formatNumber(stock)} left`}
                    </StatusBadge>
                  </div>
                  <Progress
                    className="mt-2"
                    size="sm"
                    value={ratio}
                    tone={stock <= 0 ? "danger" : ratio < 50 ? "warning" : "info"}
                    label={`Reorder at ${formatNumber(reorder)}`}
                  />
                </li>
              );
            })}
          </ul>
          {restockBudget && restockBudget.itemCount > 0 ? (
            <PanelFooter className="justify-between">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Wallet className="h-3.5 w-3.5" aria-hidden />
                Restock budget for {formatNumber(restockBudget.itemCount)} items
              </span>
              <span className="text-sm font-semibold text-foreground">
                {formatCurrency(restockBudget.totalBudget)}
              </span>
            </PanelFooter>
          ) : null}
        </>
      )}
    </Panel>
  );
}

export function CustomerSnapshotPanel({
  customers,
  totalCustomers,
  loading,
}: {
  customers: FrequentCustomer[];
  totalCustomers: number;
  loading: boolean;
}) {
  return (
    <Panel>
      <PanelHeader>
        <div>
          <PanelTitle className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-primary" aria-hidden />
            Top customers
          </PanelTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatNumber(totalCustomers)} customers on record
          </p>
        </div>
        <ViewAll href="/dashboard/customers" label="Customers" />
      </PanelHeader>

      {loading ? (
        <PanelBody className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-10 animate-pulse rounded bg-muted" />
          ))}
        </PanelBody>
      ) : customers.length === 0 ? (
        <PanelBody>
          <EmptyState
            icon={UserRound}
            title="No customer activity yet"
            description="Link sales to customers to see your best buyers here."
            className="border-0 bg-transparent py-8"
            action={
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/customers/new">Add customer</Link>
              </Button>
            }
          />
        </PanelBody>
      ) : (
        <ul className="divide-y divide-border">
          {customers.slice(0, 5).map((customer) => (
            <li key={customer.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{customer.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatNumber(customer.total_orders)} orders · avg{" "}
                  {formatCurrency(customer.avg_order_value)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-foreground">{formatCurrency(customer.total_spent)}</p>
                <p className="text-xs text-muted-foreground">lifetime</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export interface ExpenseSlice {
  category: string | null;
  total: number | string;
}

export function ExpenseBreakdownPanel({
  slices,
  loading,
  margin,
}: {
  slices: ExpenseSlice[];
  loading: boolean;
  margin: number | null;
}) {
  const rows = slices
    .map((slice) => ({ label: slice.category || "Uncategorised", total: toNumber(slice.total) ?? 0 }))
    .sort((a, b) => b.total - a.total);
  const total = rows.reduce((sum, row) => sum + row.total, 0);

  return (
    <Panel>
      <PanelHeader>
        <div>
          <PanelTitle className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" aria-hidden />
            Expenses by category
          </PanelTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">Last 30 days</p>
        </div>
        <ViewAll href="/dashboard/expenses" label="Expenses" />
      </PanelHeader>

      <PanelBody>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-8 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No expenses in the last 30 days"
            description="Categorised spending will be summarised here."
            className="border-0 bg-transparent py-6"
          />
        ) : (
          <div className="space-y-3">
            {rows.slice(0, 6).map((row) => (
              <div key={row.label}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-foreground">{row.label}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatCurrency(row.total)} · {formatPercent(total > 0 ? (row.total / total) * 100 : 0, 0)}
                  </span>
                </div>
                <Progress
                  size="sm"
                  tone="warning"
                  value={total > 0 ? (row.total / total) * 100 : 0}
                />
              </div>
            ))}
            {typeof margin === "number" ? (
              <p className="pt-1 text-xs text-muted-foreground">
                Profit margin over the same period:{" "}
                <span className="font-semibold text-foreground">{formatPercent(margin)}</span>
              </p>
            ) : null}
          </div>
        )}
      </PanelBody>
    </Panel>
  );
}
