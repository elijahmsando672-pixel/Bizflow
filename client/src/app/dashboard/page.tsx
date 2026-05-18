"use client";

import { useEffect, useState } from "react";
import { DashboardCards } from "@/components/dashboard/dashboard-cards";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { AIInsights } from "@/components/dashboard/ai-insights";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { LowStockAlerts } from "@/components/dashboard/low-stock-alerts";
import { TopProducts } from "@/components/dashboard/top-products";
import { FrequentCustomers } from "@/components/dashboard/frequent-customers";
import { RestockBudget } from "@/components/dashboard/restock-budget";
import {
  fetchDashboardData,
  fetchLowStock,
  fetchTopProducts,
  fetchFrequentCustomers,
  fetchRestockBudget,
  buildRevenueChart,
} from "@/lib/data";
import type {
  DashboardData,
  LowStockItem,
  TopProduct,
  FrequentCustomer,
  RestockBudgetData,
} from "@/types";

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [frequentCustomers, setFrequentCustomers] = useState<FrequentCustomer[]>([]);
  const [restockBudget, setRestockBudget] = useState<RestockBudgetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [stats, low, top, freq, budget] = await Promise.all([
          fetchDashboardData(),
          fetchLowStock(),
          fetchTopProducts(),
          fetchFrequentCustomers(),
          fetchRestockBudget(),
        ]);
        setDashboardData(stats);
        setLowStock(low);
        setTopProducts(top);
        setFrequentCustomers(freq);
        setRestockBudget(budget);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  function handleBudgetCreated() {
    fetchRestockBudget()
      .then(setRestockBudget)
      .catch((err) => console.error("Failed to refresh restock budget:", err));
  }

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
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <p className="text-gray-400 text-sm mt-1">Welcome back! Here&apos;s an overview of your business.</p>
      </div>

      <DashboardCards data={dashboardData} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <RevenueChart data={buildRevenueChart(dashboardData.stats.totalRevenue)} />
        <AIInsights />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <RecentOrders data={dashboardData} />
        <LowStockAlerts data={lowStock} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TopProducts data={topProducts} />
        <FrequentCustomers data={frequentCustomers} />
      </div>

      <div>
        <RestockBudget data={restockBudget} onCreated={handleBudgetCreated} />
      </div>
    </div>
  );
}
