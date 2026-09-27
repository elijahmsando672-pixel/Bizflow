"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CheckCircle2,
  ClipboardList,
  Download,
  PackageCheck,
  RefreshCw,
  ShoppingCart,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import api from "@/lib/api";
import { downloadCsv } from "@/lib/csv";
import { formatCurrency, formatDate, formatNumber, toDateKey, toNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Spinner } from "@/components/ui/spinner";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;
const SETTLED = new Set(["paid", "completed"]);
const VOIDED = new Set(["cancelled"]);

type View = "open" | "overdue" | "settled" | "all";

const VIEWS: ReadonlyArray<{ value: View; label: string }> = [
  { value: "open", label: "Open" },
  { value: "overdue", label: "Overdue" },
  { value: "settled", label: "Settled" },
  { value: "all", label: "All" },
];

interface OrderRow {
  id: string;
  invoice_number?: string | null;
  customer_id?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  sale_date?: string | null;
  due_date?: string | null;
  total?: number | string | null;
  amount_paid?: number | string | null;
  paid_date?: string | null;
  status?: string | null;
  notes?: string | null;
}

function balanceOf(order: OrderRow): number {
  return Math.max(0, (toNumber(order.total) ?? 0) - (toNumber(order.amount_paid) ?? 0));
}

function isSettled(order: OrderRow): boolean {
  return SETTLED.has(String(order.status ?? "").toLowerCase());
}

function isVoided(order: OrderRow): boolean {
  return VOIDED.has(String(order.status ?? "").toLowerCase());
}

function isOverdue(order: OrderRow): boolean {
  if (!order.due_date || isSettled(order) || isVoided(order)) return false;
  return toDateKey(order.due_date) < toDateKey(new Date());
}

export default function OrdersPage() {
  const toast = useToast();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [view, setView] = useState<View>("open");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await api.sales.getAll();
      const list = Array.isArray(data)
        ? (data as OrderRow[])
        : ((data as { orders?: OrderRow[] })?.orders ?? []);
      setOrders(list);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    let open = 0;
    let openValue = 0;
    let overdue = 0;
    let settledToday = 0;
    const today = toDateKey(new Date());

    orders.forEach((order) => {
      if (!isVoided(order) && !isSettled(order)) {
        open += 1;
        openValue += balanceOf(order);
        if (isOverdue(order)) overdue += 1;
      }
      // "Settled today" means it was *paid* today, not merely raised today.
      // Older rows may predate `paid_date`, so fall back to the sale date.
      const settledOn = toDateKey(order.paid_date) || toDateKey(order.sale_date);
      if (isSettled(order) && settledOn === today) settledToday += 1;
    });

    return { open, openValue, overdue, settledToday };
  }, [orders]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (view === "open" && (isSettled(order) || isVoided(order))) return false;
      if (view === "settled" && !isSettled(order)) return false;
      if (view === "overdue" && !isOverdue(order)) return false;
      if (view === "all" && isVoided(order)) return false;
      if (query) {
        const haystack = [order.invoice_number, order.customer_name, order.customer_email, order.notes]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [orders, view, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [view, search]);

  const settle = async (order: OrderRow) => {
    setBusyId(order.id);
    try {
      await api.sales.update(order.id, { status: "paid" });
      toast.success(`${order.invoice_number || "Order"} marked as paid`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update the order");
    } finally {
      setBusyId(null);
    }
  };

  const exportCsv = () => {
    if (filtered.length === 0) {
      toast.error("There is nothing to export yet");
      return;
    }
    downloadCsv(`bizflow-orders-${new Date().toISOString().slice(0, 10)}`, filtered, [
      { header: "Invoice", value: (row) => row.invoice_number ?? "" },
      { header: "Customer", value: (row) => row.customer_name ?? "" },
      { header: "Placed", value: (row) => row.sale_date ?? "" },
      { header: "Due", value: (row) => row.due_date ?? "" },
      { header: "Total (KES)", value: (row) => toNumber(row.total) },
      { header: "Balance (KES)", value: (row) => balanceOf(row) },
      { header: "Status", value: (row) => row.status ?? "" },
      { header: "Overdue", value: (row) => (isOverdue(row) ? "Yes" : "No") },
    ]);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Orders"
        description="Sales that still need handing over or chasing for payment."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
              <Download className="h-4 w-4" aria-hidden />
              Export
            </Button>
            <Button size="sm" asChild>
              <Link href="/dashboard/sales/new">
                <ShoppingCart className="h-4 w-4" aria-hidden />
                New sale
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Open orders" value={formatNumber(stats.open)} icon={ClipboardList} tone="primary" />
        <StatCard
          label="Outstanding value"
          value={formatCurrency(stats.openValue)}
          icon={Wallet}
          tone="info"
        />
        <StatCard
          label="Overdue"
          value={formatNumber(stats.overdue)}
          icon={TriangleAlert}
          tone={stats.overdue > 0 ? "danger" : "neutral"}
        />
        <StatCard
          label="Settled today"
          value={formatNumber(stats.settledToday)}
          icon={PackageCheck}
          tone="success"
        />
      </div>

      {error ? (
        <ErrorState title="Could not load orders" onRetry={load} retrying={loading} />
      ) : (
        <Panel>
          <PanelHeader>
            <PanelTitle>
              {filtered.length} {filtered.length === 1 ? "order" : "orders"}
            </PanelTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <SegmentedControl
                label="Order view"
                value={view}
                onChange={setView}
                options={VIEWS}
                size="sm"
              />
              <div className="sm:w-56">
                <FormField label="Search" htmlFor="orders-search">
                  <Input
                    id="orders-search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Invoice or customer"
                    className="h-8 text-sm"
                  />
                </FormField>
              </div>
            </div>
          </PanelHeader>
          <PanelBody className="p-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner label="Loading orders" />
              </div>
            ) : rows.length === 0 ? (
              <EmptyState
                icon={view === "open" ? PackageCheck : ClipboardList}
                title={
                  search
                    ? "No orders match that search"
                    : view === "overdue"
                      ? "Nothing is overdue"
                      : view === "settled"
                        ? "No settled orders yet"
                        : "No open orders"
                }
                description={
                  view === "overdue"
                    ? "Every order with a due date has been settled on time."
                    : view === "open"
                      ? "Every sale has been paid or completed. New sales will queue here."
                      : "Orders raised at the point of sale will appear here."
                }
                className="m-4 border-0 bg-transparent"
                action={
                  <Button size="sm" asChild>
                    <Link href="/dashboard/sales/new">
                      <ShoppingCart className="h-4 w-4" aria-hidden />
                      Open point of sale
                    </Link>
                  </Button>
                }
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                      <tr className="border-b border-border">
                        <th scope="col" className="px-4 py-2 text-left font-medium">Invoice</th>
                        <th scope="col" className="px-2 py-2 text-left font-medium">Customer</th>
                        <th scope="col" className="px-2 py-2 text-left font-medium">Placed</th>
                        <th scope="col" className="px-2 py-2 text-left font-medium">Due</th>
                        <th scope="col" className="px-2 py-2 text-right font-medium">Total</th>
                        <th scope="col" className="px-2 py-2 text-right font-medium">Balance</th>
                        <th scope="col" className="px-4 py-2 text-right font-medium">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rows.map((order) => {
                        const balance = balanceOf(order);
                        const overdue = isOverdue(order);
                        const settled = isSettled(order);
                        return (
                          <tr key={order.id}>
                            <td className="whitespace-nowrap px-4 py-2 font-mono text-xs font-medium text-foreground">
                              {order.invoice_number || order.id.slice(0, 8).toUpperCase()}
                            </td>
                            <td className="px-2 py-2">
                              <span className="font-medium text-foreground">
                                {order.customer_name || "Walk-in"}
                              </span>
                              <span className="mt-0.5 block">
                                <StatusBadge status={order.status} />
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-muted-foreground">
                              {formatDate(order.sale_date)}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2">
                              {order.due_date ? (
                                <span
                                  className={cn(
                                    overdue ? "font-medium text-destructive" : "text-muted-foreground"
                                  )}
                                >
                                  {formatDate(order.due_date)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-right font-medium tabular-nums text-foreground">
                              {formatCurrency(order.total)}
                            </td>
                            <td
                              className={cn(
                                "whitespace-nowrap px-2 py-2 text-right tabular-nums",
                                balance > 0 ? "font-medium text-warning" : "text-muted-foreground"
                              )}
                            >
                              {balance > 0 ? formatCurrency(balance) : "—"}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {settled ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                                  Settled
                                </span>
                              ) : isVoided(order) ? (
                                <span className="text-xs text-muted-foreground">Void</span>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={busyId === order.id}
                                  onClick={() => settle(order)}
                                >
                                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                                  Mark paid
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  page={safePage}
                  pageCount={pageCount}
                  onPageChange={setPage}
                  total={filtered.length}
                  pageSize={PAGE_SIZE}
                />
              </>
            )}
          </PanelBody>
        </Panel>
      )}
    </div>
  );
}
