"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Boxes, CircleCheck, Clock, Receipt, TriangleAlert } from "lucide-react";
import api from "@/lib/api";
import { formatCurrency, formatDate, formatRelative, toNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface OverdueSale {
  id: string;
  customer_name: string | null;
  invoice_number?: string | null;
  total: number | string;
  due_date: string;
}

interface LowStockProduct {
  id: string;
  name: string;
  stock_qty: number | string;
  reorder_level: number | string;
}

interface SystemNotification {
  id: string;
  title: string;
  message: string | null;
  type: string;
  is_read: boolean;
  read_at: string | null;
  link: string | null;
  created_at: string;
}

interface NotificationsResponse {
  overdueSales?: OverdueSale[];
  lowStockProducts?: LowStockProduct[];
  systemNotifications?: SystemNotification[];
}

const TYPE_TONE: Record<string, string> = {
  warning: "text-warning",
  error: "text-destructive",
  success: "text-success",
  info: "text-info",
};

export function NotificationsMenu() {
  const router = useRouter();
  const [data, setData] = useState<NotificationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = (await api.notifications.getAll()) as NotificationsResponse;
      setData(result ?? {});
    } catch {
      setData({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const overdue = data?.overdueSales ?? [];
  const lowStock = data?.lowStockProducts ?? [];
  const system = data?.systemNotifications ?? [];
  const unread = system.filter((n) => !n.is_read && !n.read_at).length;
  const total = overdue.length + lowStock.length + unread;

  const markAllRead = async () => {
    setMarking(true);
    try {
      await api.notifications.markAllRead();
      await load();
    } catch {
      /* leave the badge untouched if the call fails */
    } finally {
      setMarking(false);
    }
  };

  return (
    <DropdownMenu onOpenChange={(open) => open && load()}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={total > 0 ? `Notifications, ${total} needing attention` : "Notifications"}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-accent-foreground"
        >
          <Bell className="h-[18px] w-[18px]" aria-hidden />
          {total > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground ring-2 ring-card">
              {total > 9 ? "9+" : total}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          {unread > 0 ? (
            <Button variant="ghost" size="sm" className="h-7 text-xs" disabled={marking} onClick={markAllRead}>
              {marking ? "Marking…" : "Mark all read"}
            </Button>
          ) : null}
        </div>
        <DropdownMenuSeparator className="my-0" />

        <div className="max-h-[26rem] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="sm" label="Loading notifications" />
            </div>
          ) : total === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <CircleCheck className="h-6 w-6 text-success" aria-hidden />
              <p className="text-sm font-medium text-foreground">You&apos;re all caught up</p>
              <p className="text-xs text-muted-foreground">No overdue payments or stock alerts.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {overdue.map((sale) => (
                <li key={`overdue-${sale.id}`}>
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/sales")}
                    className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
                  >
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {sale.customer_name || "Customer"} · {formatCurrency(sale.total)} overdue
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Due {formatDate(sale.due_date)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}

              {lowStock.slice(0, 4).map((product) => (
                <li key={`stock-${product.id}`}>
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/inventory")}
                    className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
                  >
                    <Boxes className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{product.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {toNumber(product.stock_qty) ?? 0} in stock · reorder at{" "}
                        {toNumber(product.reorder_level) ?? 0}
                      </span>
                    </span>
                  </button>
                </li>
              ))}

              {system.slice(0, 6).map((note) => (
                <li key={note.id}>
                  <button
                    type="button"
                    onClick={() => router.push(note.link || "/notifications")}
                    className={cn(
                      "flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/60",
                      !note.is_read && !note.read_at && "bg-primary/5"
                    )}
                  >
                    {note.type === "warning" ? (
                      <TriangleAlert className={cn("mt-0.5 h-4 w-4 shrink-0", TYPE_TONE.warning)} aria-hidden />
                    ) : note.type === "success" ? (
                      <CircleCheck className={cn("mt-0.5 h-4 w-4 shrink-0", TYPE_TONE.success)} aria-hidden />
                    ) : (
                      <Receipt className={cn("mt-0.5 h-4 w-4 shrink-0", TYPE_TONE.info)} aria-hidden />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{note.title}</span>
                      {note.message ? (
                        <span className="line-clamp-2 block text-xs text-muted-foreground">{note.message}</span>
                      ) : null}
                      <span className="block text-[11px] text-muted-foreground">
                        {formatRelative(note.created_at)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DropdownMenuSeparator className="my-0" />
        <div className="p-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-xs"
            onClick={() => router.push("/notifications")}
          >
            View all notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
