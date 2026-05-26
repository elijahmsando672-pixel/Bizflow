"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { formatCurrency, formatDate, statusStyles } from "@/lib/data";

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

  useEffect(() => {
    api.sales.getAll()
      .then((data: any) => setOrders(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Orders</h1>
        <p className="text-gray-400 text-sm mt-1">{loading ? "" : `${orders.length} total orders`}</p>
      </div>

      <div className="flex gap-4">
        <div className="bg-[#121A2B] rounded-xl border border-white/10 p-4 flex-1">
          <p className="text-gray-400 text-xs">Total Revenue</p>
          <p className="text-2xl font-bold text-white mt-1">
            {loading ? "—" : formatCurrency(orders.reduce((s, o) => s + Number(o.total), 0))}
          </p>
        </div>
        <div className="bg-[#121A2B] rounded-xl border border-white/10 p-4 flex-1">
          <p className="text-gray-400 text-xs">Pending</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">
            {loading ? "—" : orders.filter(o => o.status === "draft" || o.status === "pending").length}
          </p>
        </div>
      </div>

      <div className="bg-[#121A2B] rounded-2xl border border-white/10 p-6">
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
              {(loading ? Array(5).fill(null) : orders).map((o: Order | null, i: number) => (
                <tr key={o?.id || i} className="border-b border-white/5 text-white">
                  <td className="py-3 font-medium">{o?.invoice_number || <div className="h-4 w-20 bg-white/10 animate-pulse rounded" />}</td>
                  <td className="py-3 text-gray-400">{o?.customer_name || "—"}</td>
                  <td className="py-3 text-gray-400">{o?.sale_date ? formatDate(o.sale_date) : "—"}</td>
                  <td className="py-3 text-gray-400">{o ? formatCurrency(Number(o.total)) : "—"}</td>
                  <td className="py-3">
                    {o && <span className={`px-2 py-0.5 rounded text-xs ${statusStyles[o.status] || "bg-gray-500/10 text-gray-400"}`}>{o.status}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
