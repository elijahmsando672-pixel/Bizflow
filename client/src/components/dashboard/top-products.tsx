"use client";

import { Package } from "lucide-react";
import { formatCurrency } from "@/lib/data";
import type { TopProduct } from "@/types";

export function TopProducts({ data }: { data: TopProduct[] }) {
  if (!data.length) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h3 className="flex items-center gap-2 text-card-foreground font-semibold mb-2">
          <Package className="h-5 w-5 text-primary" /> Top Selling Products
        </h3>
        <p className="text-sm text-muted-foreground text-center py-8">No sales data yet</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h3 className="flex items-center gap-2 text-card-foreground font-semibold mb-1">
        <Package className="h-5 w-5 text-primary" /> Top Selling Products
      </h3>
      <p className="text-sm text-muted-foreground mb-4">Best sellers by quantity sold (last 30 days)</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground border-b border-border">
            <tr>
              <th className="text-left py-3">#</th>
              <th className="text-left py-3">Product</th>
              <th className="text-right py-3">Sold</th>
              <th className="text-right py-3">Orders</th>
              <th className="text-right py-3">Revenue</th>
              <th className="text-right py-3">In Stock</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={item.id} className="border-b border-border/50">
                <td className="py-3 font-bold text-muted-foreground">{idx + 1}</td>
                <td className="py-3">
                  <p className="font-medium text-card-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.category_name || "Uncategorized"}</p>
                </td>
                <td className="py-3 text-right font-semibold text-primary">{item.total_sold}</td>
                <td className="py-3 text-right text-card-foreground/70">{item.order_count}</td>
                <td className="py-3 text-right font-medium text-card-foreground">{formatCurrency(item.total_revenue || 0)}</td>
                <td className="py-3 text-right">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    item.stock_qty < parseInt(item.reorder_level || "0")
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
                  }`}>{item.stock_qty}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
