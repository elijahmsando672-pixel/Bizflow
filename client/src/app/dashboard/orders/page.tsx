"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { formatCurrency, formatDate, statusStyles } from "@/lib/data";
import Link from "next/link";

interface Order {
  id: string;
  invoice_number: string;
  customer_name: string;
  total: number;
  status: string;
  sale_date: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.sales.getAll()
      .then((data: any) => setOrders(data))
      .catch(() => setError("Failed to load orders"))
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const pendingCount = orders.filter((o) => o.status === "draft" || o.status === "pending").length;

  if (loading) {
    return <div className="space-y-4">
      {[1, 2].map((i) => <div key={i} className="h-24 bg-white/5 animate-pulse rounded-2xl" />)}
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-gray-400 text-sm mt-1">{orders.length} total orders</p>
        </div>
        <Link
          href="/orders"
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          View All Orders
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      <div className="flex gap-4">
        <div className="bg-[#121A2B] rounded-xl border border-white/10 p-4 flex-1">
          <p className="text-gray-400 text-xs">Total Revenue</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-[#121A2B] rounded-xl border border-white/10 p-4 flex-1">
          <p className="text-gray-400 text-xs">Pending</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{pendingCount}</p>
        </div>
      </div>

      <div className="bg-[#121A2B] rounded-2xl border border-white/10 p-6">
        {orders.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-white/10">
                  <th className="text-left py-3">Invoice</th>
                  <th className="text-left py-3">Customer</th>
                  <th className="text-left py-3">Date</th>
                  <th className="text-left py-3">Total</th>
                  <th className="text-left py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 10).map((o) => (
                  <tr key={o.id} className="border-b border-white/5 text-white">
                    <td className="py-3 font-medium">{o.invoice_number}</td>
                    <td className="py-3 text-gray-400">{o.customer_name}</td>
                    <td className="py-3 text-gray-400">{formatDate(o.sale_date)}</td>
                    <td className="py-3 text-gray-400">{formatCurrency(Number(o.total))}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${statusStyles[o.status] || "bg-gray-500/10 text-gray-400"}`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
