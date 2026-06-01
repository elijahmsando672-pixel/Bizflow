"use client";

import { ShoppingCart } from "lucide-react";
import { formatCurrency, formatDate, statusStyles } from "@/lib/data";
import type { DashboardData } from "@/types";

export function RecentOrders({ data }: { data: DashboardData }) {
  const sales = data.recentSales;

  if (!sales.length) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h3 className="text-card-foreground font-semibold mb-1">Recent Orders</h3>
        <p className="text-sm text-muted-foreground mb-4">Your latest sales and payments</p>
        <p className="text-sm text-muted-foreground text-center py-8">No recent orders</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h3 className="text-card-foreground font-semibold mb-1">Recent Orders</h3>
      <p className="text-sm text-muted-foreground mb-4">Your latest sales and payments</p>
      <div className="space-y-3">
        {sales.slice(0, 5).map((tx) => (
          <div key={tx.id} className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-card-foreground text-sm">{tx.customer_name || "Walk-in Customer"}</p>
                <p className="text-xs text-muted-foreground">{formatDate(tx.sale_date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[tx.status] || "bg-muted text-muted-foreground"}`}>
                {tx.status}
              </span>
              <span className="font-medium text-card-foreground text-sm">{formatCurrency(tx.total)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
