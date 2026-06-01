"use client";

import { AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/data";
import type { LowStockItem } from "@/types";

export function LowStockAlerts({ data }: { data: LowStockItem[] }) {
  if (!data.length) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h3 className="flex items-center gap-2 text-card-foreground font-semibold mb-2">
          <AlertTriangle className="h-5 w-5 text-warning" /> Low Stock Alerts
        </h3>
        <p className="text-sm text-muted-foreground text-center py-8">All products are well stocked</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <h3 className="flex items-center gap-2 text-card-foreground font-semibold mb-1">
        <AlertTriangle className="h-5 w-5 text-warning" /> Low Stock Alerts ({data.length})
      </h3>
      <p className="text-sm text-muted-foreground mb-4">Products below reorder threshold</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground border-b border-border">
            <tr>
              <th className="text-left py-3">Product</th>
              <th className="text-left py-3">SKU</th>
              <th className="text-right py-3">In Stock</th>
              <th className="text-right py-3">Reorder At</th>
              <th className="text-right py-3">Restock Qty</th>
              <th className="text-right py-3">Est. Cost</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              const pct = (item.stock_qty / item.reorder_level) * 100;
              const cls = pct < 25
                ? "bg-destructive/10 text-destructive"
                : pct < 50
                ? "bg-warning/10 text-warning"
                : "bg-warning/10 text-warning";
              return (
                <tr key={item.id} className="border-b border-border/50">
                  <td className="py-3 font-medium text-card-foreground">{item.name}</td>
                  <td className="py-3 text-muted-foreground">{item.sku || "-"}</td>
                  <td className="py-3 text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${cls}`}>{item.stock_qty}</span>
                  </td>
                  <td className="py-3 text-right text-card-foreground/70">{item.reorder_level}</td>
                  <td className="py-3 text-right font-medium text-card-foreground">{item.suggested_restock_qty}</td>
                  <td className="py-3 text-right text-muted-foreground">{formatCurrency(item.estimated_restock_cost || 0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
