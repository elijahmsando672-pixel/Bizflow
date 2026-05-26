"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

interface AdminStats {
  totalBusinesses: number;
  activeBusinesses: number;
  pendingBusinesses: number;
  totalUsers: number;
  recentRegistrations: Array<{ id: string; name: string; created_at: string; owner_email: string }>;
}

interface Business {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
  owner_name: string;
  user_count: number;
  customer_count: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.admin.getStats() as Promise<AdminStats>,
      api.admin.getBusinesses() as Promise<Business[]>,
    ])
      .then(([s, b]) => { setStats(s); setBusinesses(b); })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen bg-[#0B1020] p-6"><div className="h-8 w-48 bg-white/10 animate-pulse rounded" /></div>;
  if (error) return <div className="min-h-screen bg-[#0B1020] p-6"><p className="text-red-400">{error}</p></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">System-wide overview and management.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats && (
          <>
            <StatCard label="Total Businesses" value={stats.totalBusinesses} />
            <StatCard label="Active" value={stats.activeBusinesses} />
            <StatCard label="Pending" value={stats.pendingBusinesses} />
            <StatCard label="Total Users" value={stats.totalUsers} />
          </>
        )}
      </div>

      <div className="bg-[#121A2B] rounded-2xl border border-white/10 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">All Businesses</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-white/10">
                <th className="text-left py-3 px-2">Name</th>
                <th className="text-left py-3 px-2">Owner</th>
                <th className="text-left py-3 px-2">Status</th>
                <th className="text-left py-3 px-2">Users</th>
                <th className="text-left py-3 px-2">Customers</th>
                <th className="text-left py-3 px-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((b) => (
                <tr key={b.id} className="border-b border-white/5 text-white hover:bg-white/5">
                  <td className="py-3 px-2">{b.name}</td>
                  <td className="py-3 px-2 text-gray-400">{b.owner_name || "—"}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      b.status === "active" ? "bg-green-500/10 text-green-400" :
                      b.status === "pending" ? "bg-yellow-500/10 text-yellow-400" :
                      "bg-red-500/10 text-red-400"
                    }`}>{b.status}</span>
                  </td>
                  <td className="py-3 px-2 text-gray-400">{b.user_count}</td>
                  <td className="py-3 px-2 text-gray-400">{b.customer_count}</td>
                  <td className="py-3 px-2 text-gray-400">{new Date(b.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[#121A2B] rounded-xl border border-white/10 p-4">
      <p className="text-gray-400 text-xs">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}
