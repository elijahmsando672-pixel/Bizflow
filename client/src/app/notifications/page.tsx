"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  BellRing,
  CheckCheck,
  Mail,
  PackageSearch,
  ReceiptText,
  RefreshCw,
} from "lucide-react";
import api from "@/lib/api";
import { formatCurrency, formatDate, formatRelative, toNumber } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Spinner } from "@/components/ui/spinner";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface OverdueSale {
  id: string;
  invoice_number?: string | null;
  customer_name?: string | null;
  due_date?: string | null;
  total?: number | string | null;
  amount_paid?: number | string | null;
  status?: string | null;
}

interface LowStockProduct {
  id: string;
  name: string;
  sku?: string | null;
  stock_qty?: number | string | null;
  reorder_level?: number | string | null;
  selling_price?: number | string | null;
}

interface SystemNotification {
  id: string;
  title: string;
  message?: string | null;
  type?: string | null;
  is_read?: boolean | null;
  read_at?: string | null;
  link?: string | null;
  created_at?: string | null;
}

interface NotificationFeed {
  overdueSales: OverdueSale[];
  lowStockProducts: LowStockProduct[];
  systemNotifications: SystemNotification[];
}

export default function NotificationsPage() {
  const toast = useToast();
  const [feed, setFeed] = useState<NotificationFeed>({
    overdueSales: [],
    lowStockProducts: [],
    systemNotifications: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = (await api.notifications.getAll()) as Partial<NotificationFeed>;
      setFeed({
        overdueSales: Array.isArray(data.overdueSales) ? data.overdueSales : [],
        lowStockProducts: Array.isArray(data.lowStockProducts) ? data.lowStockProducts : [],
        systemNotifications: Array.isArray(data.systemNotifications) ? data.systemNotifications : [],
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unread = useMemo(
    () => feed.systemNotifications.filter((n) => !n.is_read && !n.read_at),
    [feed.systemNotifications]
  );

  const outstanding = useMemo(
    () =>
      feed.overdueSales.reduce(
        (sum, sale) => sum + Math.max(0, (toNumber(sale.total) ?? 0) - (toNumber(sale.amount_paid) ?? 0)),
        0
      ),
    [feed.overdueSales]
  );

  const markAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      toast.success("All notifications marked as read");
      load();
    } catch {
      toast.error("Could not update notifications");
    }
  };

  const markRead = async (id: string) => {
    setBusyId(id);
    try {
      await api.notifications.markAsRead(id);
      load();
    } catch {
      toast.error("Could not mark as read");
    } finally {
      setBusyId(null);
    }
  };

  const sendReminder = async (sale: OverdueSale) => {
    setBusyId(sale.id);
    try {
      await api.notifications.sendReminder(sale.id);
      toast.success(`Reminder sent to ${sale.customer_name ?? "customer"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send the reminder");
    } finally {
      setBusyId(null);
    }
  };

  const isEmpty =
    feed.overdueSales.length === 0 &&
    feed.lowStockProducts.length === 0 &&
    feed.systemNotifications.length === 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notifications"
        description="Overdue sales, stock alerts, and system messages in one place."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
              Refresh
            </Button>
            <Button size="sm" onClick={markAllRead} disabled={unread.length === 0}>
              <CheckCheck className="h-4 w-4" aria-hidden />
              Mark all read
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard
          label="Unread messages"
          value={String(unread.length)}
          icon={BellRing}
          tone={unread.length > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label="Overdue sales"
          value={String(feed.overdueSales.length)}
          icon={ReceiptText}
          tone={feed.overdueSales.length > 0 ? "danger" : "neutral"}
        />
        <StatCard
          label="Outstanding value"
          value={formatCurrency(outstanding)}
          icon={Mail}
          tone="info"
        />
        <StatCard
          label="Low stock items"
          value={String(feed.lowStockProducts.length)}
          icon={PackageSearch}
          tone={feed.lowStockProducts.length > 0 ? "warning" : "neutral"}
        />
      </div>

      {error ? (
        <ErrorState title="Could not load notifications" onRetry={load} retrying={loading} />
      ) : loading ? (
        <Panel>
          <PanelBody className="flex justify-center py-16">
            <Spinner label="Loading notifications" />
          </PanelBody>
        </Panel>
      ) : isEmpty ? (
        <EmptyState
          icon={Bell}
          title="You are all caught up"
          description="Overdue invoices, low stock items, and system messages will appear here."
        />
      ) : (
        <Tabs defaultValue="overdue">
          <TabsList>
            <TabsTrigger value="overdue">Overdue sales ({feed.overdueSales.length})</TabsTrigger>
            <TabsTrigger value="stock">Low stock ({feed.lowStockProducts.length})</TabsTrigger>
            <TabsTrigger value="system">Messages ({feed.systemNotifications.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overdue">
            <Panel>
              <PanelHeader>
                <PanelTitle>Sales awaiting payment</PanelTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/credit">Open credit</Link>
                </Button>
              </PanelHeader>
              <PanelBody className="p-0">
                {feed.overdueSales.length === 0 ? (
                  <EmptyState
                    icon={ReceiptText}
                    title="No overdue sales"
                    description="Sales more than three days past their due date show up here."
                    className="m-4 border-0 bg-transparent"
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {feed.overdueSales.map((sale) => {
                      const balance = Math.max(
                        0,
                        (toNumber(sale.total) ?? 0) - (toNumber(sale.amount_paid) ?? 0)
                      );
                      return (
                        <li
                          key={sale.id}
                          className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-medium text-foreground">
                                {sale.customer_name || "Walk-in customer"}
                              </p>
                              <StatusBadge status="overdue" />
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {sale.invoice_number || "Sale"} · due {formatDate(sale.due_date)} ·{" "}
                              {formatCurrency(balance)} outstanding
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => sendReminder(sale)}
                              disabled={busyId === sale.id}
                            >
                              <Mail className="h-3.5 w-3.5" aria-hidden />
                              {busyId === sale.id ? "Sending…" : "Send reminder"}
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/dashboard/sales/${sale.id}`}>View</Link>
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </PanelBody>
            </Panel>
          </TabsContent>

          <TabsContent value="stock">
            <Panel>
              <PanelHeader>
                <PanelTitle>Items at or below reorder level</PanelTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/stocks/low">View stock</Link>
                </Button>
              </PanelHeader>
              <PanelBody className="p-0">
                {feed.lowStockProducts.length === 0 ? (
                  <EmptyState
                    icon={PackageSearch}
                    title="Stock levels are healthy"
                    description="Items drop in here once they reach their reorder level."
                    className="m-4 border-0 bg-transparent"
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {feed.lowStockProducts.map((product) => {
                      const stock = toNumber(product.stock_qty) ?? 0;
                      const reorder = toNumber(product.reorder_level) ?? 0;
                      return (
                        <li
                          key={product.id}
                          className="flex items-center justify-between gap-3 px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {product.name}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {product.sku || "No SKU"} · {stock} in stock · reorder at {reorder}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <StatusBadge tone={stock === 0 ? "danger" : "warning"} dot>
                              {stock === 0 ? "Out of stock" : "Low"}
                            </StatusBadge>
                            <Button variant="outline" size="sm" asChild>
                              <Link href="/dashboard/inventory/new">Restock</Link>
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </PanelBody>
            </Panel>
          </TabsContent>

          <TabsContent value="system">
            <Panel>
              <PanelHeader>
                <PanelTitle>System messages</PanelTitle>
              </PanelHeader>
              <PanelBody className="p-0">
                {feed.systemNotifications.length === 0 ? (
                  <EmptyState
                    icon={Bell}
                    title="No messages yet"
                    className="m-4 border-0 bg-transparent"
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {feed.systemNotifications.map((notification) => {
                      const isRead = Boolean(notification.is_read || notification.read_at);
                      return (
                        <li
                          key={notification.id}
                          className={cn(
                            "flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between",
                            !isRead && "bg-info/5"
                          )}
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-medium text-foreground">
                                {notification.title}
                              </p>
                              {notification.type ? (
                                <StatusBadge tone="info">{notification.type}</StatusBadge>
                              ) : null}
                              {!isRead ? <StatusBadge tone="warning" dot>New</StatusBadge> : null}
                            </div>
                            {notification.message ? (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {notification.message}
                              </p>
                            ) : null}
                            <p className="mt-1 text-[11px] text-muted-foreground/80">
                              {formatRelative(notification.created_at)}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {notification.link ? (
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={notification.link}>Open</Link>
                              </Button>
                            ) : null}
                            {!isRead ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => markRead(notification.id)}
                                disabled={busyId === notification.id}
                              >
                                {busyId === notification.id ? "Marking…" : "Mark read"}
                              </Button>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </PanelBody>
            </Panel>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
