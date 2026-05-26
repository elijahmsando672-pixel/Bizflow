"use client";

import { DollarSign, ShoppingCart, Users, AlertTriangle } from "lucide-react";
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
      trend: "up" as const,
    },
    {
      title: "Orders Today",
      value: String(data.recentSales.length),
      change: "New orders placed",
      icon: <ShoppingCart size={20} />,
      trend: "up" as const,
    },
    {
      title: "Active Customers",
      value: String(data.stats.totalCustomers),
      change: "Registered customers",
      icon: <Users size={20} />,
      trend: "neutral" as const,
    },
    {
      title: "Low Stock Alerts",
      value: String(data.stats.lowStockProducts),
      change: "Items below threshold",
      icon: <AlertTriangle size={20} />,
      trend: data.stats.lowStockProducts > 0 ? "down" as const : "neutral" as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
}
