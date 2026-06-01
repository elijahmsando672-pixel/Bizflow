"use client";

import { Users } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/data";
import type { FrequentCustomer } from "@/types";

export function FrequentCustomers({ data }: { data: FrequentCustomer[] }) {
  if (!data.length) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h3 className="flex items-center gap-2 text-card-foreground font-semibold mb-2">
          <Users className="h-5 w-5 text-success" /> Top Customers
        </h3>
        <p className="text-sm text-muted-foreground text-center py-8">No customer data yet</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h3 className="flex items-center gap-2 text-card-foreground font-semibold mb-1">
        <Users className="h-5 w-5 text-success" /> Top Customers
      </h3>
      <p className="text-sm text-muted-foreground mb-4">Ranked by total spend (last 30 days)</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground border-b border-border">
            <tr>
              <th className="text-left py-3">#</th>
              <th className="text-left py-3">Customer</th>
              <th className="text-right py-3">Orders</th>
              <th className="text-right py-3">Total Spent</th>
              <th className="text-right py-3">Avg Order</th>
              <th className="text-right py-3">Last Order</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={item.id} className="border-b border-border/50">
                <td className="py-3 font-bold text-muted-foreground">{idx + 1}</td>
                <td className="py-3">
                  <p className="font-medium text-card-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.email || item.phone || ""}</p>
                </td>
                <td className="py-3 text-right text-card-foreground/70">{item.total_orders}</td>
                <td className="py-3 text-right font-semibold text-success">{formatCurrency(item.total_spent || 0)}</td>
                <td className="py-3 text-right text-card-foreground/70">{formatCurrency(item.avg_order_value || 0)}</td>
                <td className="py-3 text-right text-sm text-muted-foreground">{item.last_order_date ? formatDate(item.last_order_date) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
