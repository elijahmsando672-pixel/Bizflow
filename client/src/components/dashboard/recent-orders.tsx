"use client";

import { ShoppingCart } from "lucide-react";
import { formatCurrency, formatDate, statusStyles } from "@/lib/data";
import type { DashboardData } from "@/types";

export function RecentOrders({ data }: { data: DashboardData }) {
  const sales = data.recentSales;

  if (!sales.length) {
    return (
      <div className="bg-[#121A2B] rounded-2xl p-6 border border-white/10">
        <h3 className="text-white font-semibold mb-1">Recent Orders</h3>
        <p className="text-sm text-gray-400 mb-4">Your latest sales and payments</p>
        <p className="text-sm text-gray-500 text-center py-8">No recent orders</p>
      </div>
    );
  }

  return (
    <div className="bg-[#121A2B] rounded-2xl p-6 border border-white/10">
      <h3 className="text-white font-semibold mb-1">Recent Orders</h3>
      <p className="text-sm text-gray-400 mb-4">Your latest sales and payments</p>
      <div className="space-y-3">
        {sales.slice(0, 5).map((tx) => (
          <div key={tx.id} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                <ShoppingCart className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-white text-sm">{tx.customer_name || "Walk-in Customer"}</p>
                <p className="text-xs text-gray-400">{formatDate(tx.sale_date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[tx.status] || "bg-gray-500/10 text-gray-400"}`}>
                {tx.status}
              </span>
              <span className="font-medium text-white text-sm">{formatCurrency(tx.total)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
