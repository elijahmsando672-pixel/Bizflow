"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShoppingCart,
} from "lucide-react";
import api from "@/lib/api";

interface DashboardData {
  stats: {
    totalCustomers: number;
    totalRevenue: number;
    pendingPayments: number;
    totalExpenses: number;
    activeInvoices: number;
    lowStockProducts: number;
    totalInflow: number;
    totalOutflow: number;
  };
  recentSales: any[];
  recentExpenses: any[];
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function DashboardCards({ data }: { data: DashboardData }) {
  const stats = [
    {
      title: "Total Revenue",
      value: formatCurrency(data.stats.totalRevenue),
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
    },
    {
      title: "Expenses",
      value: formatCurrency(data.stats.totalExpenses),
      change: "+8.2%",
      trend: "up",
      icon: TrendingUp,
    },
    {
      title: "Profit",
      value: formatCurrency(data.stats.totalRevenue - data.stats.totalExpenses),
      change: "+15.3%",
      trend: "up",
      icon: TrendingDown,
    },
    {
      title: "Low Stock Alerts",
      value: data.stats.lowStockProducts,
      change: "Items",
      trend: "down",
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-500">
                <span
                  className={`font-medium ${
                    stat.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.change}
                </span>{" "}
                from last week
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function RecentTransactions({ data }: { data: DashboardData }) {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your latest sales and payments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.recentSales.length === 0 ? (
            <p className="text-sm text-gray-500">No recent transactions</p>
          ) : (
            data.recentSales.slice(0, 5).map((tx: any) => (
              <div
                key={tx.id}
                className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <ShoppingCart className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {tx.customer_name || "Walk-in Customer"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(tx.sale_date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      tx.status === "paid"
                        ? "bg-green-100 text-green-700"
                        : tx.status === "draft"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {tx.status}
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(tx.total)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatsOverview({ data }: { data: DashboardData }) {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Overview</CardTitle>
        <CardDescription>Business summary</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="text-sm text-gray-500">Total Customers</p>
              <p className="text-2xl font-bold">{data.stats.totalCustomers}</p>
            </div>
            <DollarSign className="h-8 w-8 text-gray-400" />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="text-sm text-gray-500">Active Invoices</p>
              <p className="text-2xl font-bold">{data.stats.activeInvoices}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-gray-400" />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="text-sm text-gray-500">Total Inflow</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(data.stats.totalInflow)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="text-sm text-gray-500">Total Outflow</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(data.stats.totalOutflow)}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const result = await api.dashboard.getStats();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500">Welcome back! Here&apos;s an overview of your business.</p>
      </div>
      <DashboardCards data={data} />
      <div className="grid gap-4 md:grid-cols-2">
        <RecentTransactions data={data} />
        <StatsOverview data={data} />
      </div>
    </div>
  );
}