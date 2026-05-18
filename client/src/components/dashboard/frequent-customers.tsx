"use client";

import { Users } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/data";
import type { FrequentCustomer } from "@/types";

export function FrequentCustomers({ data }: { data: FrequentCustomer[] }) {
  if (!data.length) {
    return (
      <div className="bg-[#121A2B] rounded-2xl p-6 border border-white/10">
        <h3 className="flex items-center gap-2 text-white font-semibold mb-2">
          <Users className="h-5 w-5 text-green-400" /> Top Customers
        </h3>
        <p className="text-sm text-gray-400 text-center py-8">No customer data yet</p>
      </div>
    );
  }

  return (
    <div className="bg-[#121A2B] rounded-2xl p-6 border border-white/10">
      <h3 className="flex items-center gap-2 text-white font-semibold mb-1">
        <Users className="h-5 w-5 text-green-400" /> Top Customers
      </h3>
      <p className="text-sm text-gray-400 mb-4">Ranked by total spend (last 30 days)</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-gray-400 border-b border-white/10">
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
              <tr key={item.id} className="border-b border-white/5">
                <td className="py-3 font-bold text-gray-500">{idx + 1}</td>
                <td className="py-3">
                  <p className="font-medium text-white">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.email || item.phone || ""}</p>
                </td>
                <td className="py-3 text-right text-gray-300">{item.total_orders}</td>
                <td className="py-3 text-right font-semibold text-green-400">{formatCurrency(item.total_spent || 0)}</td>
                <td className="py-3 text-right text-gray-300">{formatCurrency(item.avg_order_value || 0)}</td>
                <td className="py-3 text-right text-sm text-gray-400">{item.last_order_date ? formatDate(item.last_order_date) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
