"use client";

import { DollarSign, TrendingUp, TrendingDown, Package } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCurrency } from "@/lib/data";
import type { DashboardData } from "@/types";

export function DashboardCards({ data }: { data: DashboardData }) {
  const cards = [
    {
      title: "Total Revenue",
      value: formatCurrency(data.stats.totalRevenue),
      change: "From paid sales",
      icon: <DollarSign size={20} />,
    },
    {
      title: "Expenses",
      value: formatCurrency(data.stats.totalExpenses),
      change: "Total costs",
      icon: <TrendingUp size={20} />,
    },
    {
      title: "Profit",
      value: formatCurrency(data.stats.totalRevenue - data.stats.totalExpenses),
      change: data.stats.totalRevenue > data.stats.totalExpenses ? "Profitable" : "Loss",
      icon: <TrendingDown size={20} />,
    },
    {
      title: "Low Stock Alerts",
      value: String(data.stats.lowStockProducts),
      change: "Items below threshold",
      icon: <Package size={20} />,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
}
