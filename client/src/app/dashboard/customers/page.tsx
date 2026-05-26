"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.customers.getAll()
      .then((data: any) => setCustomers(data))
      .catch(() => setError("Failed to load customers"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="space-y-4">
      {[1, 2].map((i) => <div key={i} className="h-24 bg-white/5 animate-pulse rounded-2xl" />)}
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Customers</h1>
          <p className="text-gray-400 text-sm mt-1">{customers.length} total customers</p>
        </div>
        <Link
          href="/customers"
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          View All Customers
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      <div className="bg-[#121A2B] rounded-2xl border border-white/10 p-6">
        {customers.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">No customers yet.</p>
        ) : (
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
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-white/5 text-white">
                    <td className="py-3 font-medium">{c.name}</td>
                    <td className="py-3 text-gray-400">{c.email}</td>
                    <td className="py-3 text-gray-400">{c.phone || "—"}</td>
                    <td className="py-3 text-gray-400">{c.company || "—"}</td>
                    <td className="py-3 text-gray-400">{new Date(c.created_at).toLocaleDateString()}</td>
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
