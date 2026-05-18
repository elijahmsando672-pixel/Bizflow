"use client";

import { Package } from "lucide-react";
import { formatCurrency } from "@/lib/data";
import type { TopProduct } from "@/types";

export function TopProducts({ data }: { data: TopProduct[] }) {
  if (!data.length) {
    return (
      <div className="bg-[#121A2B] rounded-2xl p-6 border border-white/10">
        <h3 className="flex items-center gap-2 text-white font-semibold mb-2">
          <Package className="h-5 w-5 text-blue-400" /> Top Selling Products
        </h3>
        <p className="text-sm text-gray-400 text-center py-8">No sales data yet</p>
      </div>
    );
  }

  return (
    <div className="bg-[#121A2B] rounded-2xl p-6 border border-white/10">
      <h3 className="flex items-center gap-2 text-white font-semibold mb-1">
        <Package className="h-5 w-5 text-blue-400" /> Top Selling Products
      </h3>
      <p className="text-sm text-gray-400 mb-4">Best sellers by quantity sold (last 30 days)</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-gray-400 border-b border-white/10">
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
              <tr key={item.id} className="border-b border-white/5">
                <td className="py-3 font-bold text-gray-500">{idx + 1}</td>
                <td className="py-3">
                  <p className="font-medium text-white">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.category_name || "Uncategorized"}</p>
                </td>
                <td className="py-3 text-right font-semibold text-blue-400">{item.total_sold}</td>
                <td className="py-3 text-right text-gray-300">{item.order_count}</td>
                <td className="py-3 text-right font-medium text-white">{formatCurrency(item.total_revenue || 0)}</td>
                <td className="py-3 text-right">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    item.stock_qty < parseInt(item.reorder_level || "0")
                      ? "bg-red-500/10 text-red-400"
                      : "bg-gray-500/10 text-gray-400"
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
