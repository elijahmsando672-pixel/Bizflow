"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  created_at: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.customers.getAll()
      .then((data: any) => setCustomers(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Customers</h1>
        <p className="text-gray-400 text-sm mt-1">{loading ? "" : `${customers.length} total customers`}</p>
      </div>

      <div className="bg-[#121A2B] rounded-2xl border border-white/10 p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-white/10">
                <th className="text-left py-3">Name</th>
                <th className="text-left py-3">Email</th>
                <th className="text-left py-3">Phone</th>
                <th className="text-left py-3">Company</th>
                <th className="text-left py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {(loading ? Array(5).fill(null) : customers).map((c: Customer | null, i: number) => (
                <tr key={c?.id || i} className="border-b border-white/5 text-white">
                  <td className="py-3 font-medium">{c?.name || <div className="h-4 w-28 bg-white/10 animate-pulse rounded" />}</td>
                  <td className="py-3 text-gray-400">{c?.email || "—"}</td>
                  <td className="py-3 text-gray-400">{c?.phone || "—"}</td>
                  <td className="py-3 text-gray-400">{c?.company || "—"}</td>
                  <td className="py-3 text-gray-400">{c?.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
