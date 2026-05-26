"use client";

import { useEffect, useState } from "react";
import { DashboardCards } from "@/components/dashboard/dashboard-cards";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { LowStockAlerts } from "@/components/dashboard/low-stock-alerts";
import { TopProducts } from "@/components/dashboard/top-products";
import {
  fetchDashboardData,
  fetchLowStock,
  fetchTopProducts,
  buildRevenueChart,
} from "@/lib/data";
import type {
  DashboardData,
  LowStockItem,
  TopProduct,
} from "@/types";

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [stats, low, top] = await Promise.all([
          fetchDashboardData(),
          fetchLowStock(),
          fetchTopProducts(),
        ]);
        setDashboardData(stats);
        setLowStock(low);
        setTopProducts(top);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) return null;
  if (error) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <p className="text-red-400 mt-2">{error}</p>
      </div>
    );
  }
  if (!dashboardData) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Welcome back! Here&apos;s an overview of your business.</p>
      </div>

      <DashboardCards data={dashboardData} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RevenueChart data={buildRevenueChart(dashboardData.stats.totalRevenue)} />
        </div>
        <TopProducts data={topProducts} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <RecentOrders data={dashboardData} />
        <LowStockAlerts data={lowStock} />
      </div>
    </div>
  );
}
