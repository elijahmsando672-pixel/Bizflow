"use client";

import { AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/data";
import type { LowStockItem } from "@/types";

export function LowStockAlerts({ data }: { data: LowStockItem[] }) {
  if (!data.length) {
    return (
      <div className="bg-[#121A2B] rounded-2xl p-6 border border-white/10">
        <h3 className="flex items-center gap-2 text-white font-semibold mb-2">
          <AlertTriangle className="h-5 w-5 text-amber-400" /> Low Stock Alerts
        </h3>
        <p className="text-sm text-gray-400 text-center py-8">All products are well stocked</p>
      </div>
    );
  }

  return (
    <div className="bg-[#121A2B] rounded-2xl p-6 border border-white/10">
      <h3 className="flex items-center gap-2 text-white font-semibold mb-1">
        <AlertTriangle className="h-5 w-5 text-amber-400" /> Low Stock Alerts ({data.length})
      </h3>
      <p className="text-sm text-gray-400 mb-4">Products below reorder threshold</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-gray-400 border-b border-white/10">
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
                ? "bg-red-500/10 text-red-400"
                : pct < 50
                ? "bg-orange-500/10 text-orange-400"
                : "bg-yellow-500/10 text-yellow-400";
              return (
                <tr key={item.id} className="border-b border-white/5">
                  <td className="py-3 font-medium text-white">{item.name}</td>
                  <td className="py-3 text-gray-400">{item.sku || "-"}</td>
                  <td className="py-3 text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${cls}`}>{item.stock_qty}</span>
                  </td>
                  <td className="py-3 text-right text-gray-300">{item.reorder_level}</td>
                  <td className="py-3 text-right font-medium text-white">{item.suggested_restock_qty}</td>
                  <td className="py-3 text-right text-gray-300">{formatCurrency(item.estimated_restock_cost || 0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
