"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchDashboardData, formatCurrency } from "@/lib/data";
import api from "@/lib/api";
import type { DashboardData } from "@/types";
import {
  DollarSign, TrendingDown, TrendingUp, Users, CreditCard, Package,
  Landmark, BarChart3, ShoppingCart, FileText, UserPlus, Bell, List,
} from "lucide-react";

const quickActions = [
  { label: "New Sale", icon: ShoppingCart, route: "/dashboard/sales/new", color: "#10b981" },
  { label: "Add Product", icon: Package, route: "/dashboard/inventory/new", color: "#3b82f6" },
  { label: "Record Expense", icon: TrendingDown, route: "/dashboard/expenses/new", color: "#ef4444" },
  { label: "Create Invoice", icon: FileText, route: "/dashboard/invoices/new", color: "#8b5cf6" },
  { label: "Add Customer", icon: UserPlus, route: "/dashboard/customers/new", color: "#f59e0b" },
  { label: "Receive Payment", icon: CreditCard, route: "/dashboard/payments", color: "#06b6d4" },
];

const weekData = [
  { day: "Mon", value: 70 },
  { day: "Tue", value: 85 },
  { day: "Wed", value: 55 },
  { day: "Thu", value: 90 },
  { day: "Fri", value: 95 },
  { day: "Sat", value: 65 },
  { day: "Sun", value: 40 },
];

const kpiIcons = [
  DollarSign, TrendingDown, TrendingUp, Users,
  CreditCard, Package, Landmark, BarChart3,
];

const kpiColors = [
  "from-emerald-600 to-emerald-400",
  "from-orange-600 to-orange-400",
  "from-purple-600 to-purple-400",
  "from-blue-600 to-blue-400",
  "from-red-600 to-red-400",
  "from-amber-600 to-amber-400",
  "from-teal-600 to-teal-400",
  "from-indigo-600 to-indigo-400",
];

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashResult, notifs] = await Promise.all([
        fetchDashboardData(),
        api.notifications.getAll().catch(() => []),
      ]);
      setData(dashResult);
      setNotifications(Array.isArray(notifs) ? notifs : []);
    } catch {
      setError("Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = data?.stats;

  const totalRevenue = stats?.totalRevenue ?? 0;
  const totalExpenses = stats?.totalExpenses ?? 0;
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  const kpiCards = [
    { label: "Total Revenue", value: formatCurrency(totalRevenue), change: `Inflow ${formatCurrency(stats?.totalInflow ?? 0)}` },
    { label: "Total Expenses", value: formatCurrency(totalExpenses), change: `${data?.recentExpenses?.length ?? 0} recent entries` },
    { label: "Net Profit", value: formatCurrency(netProfit), change: `${profitMargin}% margin` },
    { label: "Customers", value: String(stats?.totalCustomers ?? 0), change: "Registered clients" },
    { label: "Pending Payments", value: formatCurrency(stats?.pendingPayments ?? 0), change: `${stats?.activeInvoices ?? 0} active invoices` },
    { label: "Low Stock Items", value: String(stats?.lowStockProducts ?? 0), change: stats?.lowStockProducts ? "Needs reorder" : "All stocked" },
    { label: "Cash Balance", value: formatCurrency((stats?.totalInflow ?? 0) - (stats?.totalOutflow ?? 0)), change: "Net cash flow" },
    { label: "Budget Usage", value: totalRevenue > 0 ? `${Math.min(100, Math.round((totalExpenses / totalRevenue) * 100))}%` : "N/A", change: `${formatCurrency(Math.max(0, totalRevenue - totalExpenses))} remaining` },
  ];

  const notifList = notifications.length > 0
    ? notifications.slice(0, 5).map((n: any) => ({
        text: n.message || n.title || n.text || "Notification",
        type: n.type === "alert" ? "warning" : n.type || "info",
        time: n.created_at ? new Date(n.created_at).toLocaleDateString() : n.time || "",
      }))
    : [];

  const recentSales = data?.recentSales ?? [];
  const recentExpenses = data?.recentExpenses ?? [];

  const activities = [
    ...recentSales.slice(0, 3).map((s: any) => ({
      text: `Sale: ${s.customer_name || "Walk-in"}`,
      amount: formatCurrency(s.total || 0),
      time: s.sale_date ? new Date(s.sale_date).toLocaleDateString() : "",
    })),
    ...recentExpenses.slice(0, 2).map((e: any) => ({
      text: `Expense: ${e.description || "Untitled"}`,
      amount: formatCurrency(e.amount || 0),
      time: e.expense_date ? new Date(e.expense_date).toLocaleDateString() : "",
    })),
  ];

  if (loading) return null;

  return (
    <>
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 mb-4 text-destructive text-xs">
          {error}
        </div>
      )}

      <div
        className="grid gap-3.5 mb-6"
        style={{ gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)" }}
      >
        {kpiCards.map((kpi, idx) => {
          const Icon = kpiIcons[idx];
          return (
            <div
              key={idx}
              className="bg-card rounded-xl p-5 border border-border shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${kpiColors[idx]} flex items-center justify-center shadow-lg`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-[11px] text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-md">
                  {kpi.change}
                </span>
              </div>
              <div className="text-xl font-bold text-foreground mb-1 tracking-tight">
                {kpi.value}
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                {kpi.label}
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="grid gap-4 mb-6"
        style={{ gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr" }}
      >
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-foreground m-0">Sales This Week</h3>
            <button onClick={() => router.push("/dashboard/sales")} className="text-xs text-primary bg-none border-none cursor-pointer font-medium hover:underline">
              View All →
            </button>
          </div>
          <div className="flex items-end gap-2 h-40 pt-2">
            {weekData.map((d, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end">
                <div
                  className="w-full max-w-[40px] rounded-t-md bg-gradient-to-t from-blue-500 to-blue-400 min-h-[12px]"
                  style={{ height: `${d.value}%` }}
                />
                <span className="text-[10px] text-muted-foreground mt-1.5 font-medium">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, idx) => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={idx}
                  onClick={() => router.push(action.route)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-card cursor-pointer text-xs font-medium text-foreground transition-all duration-150 hover:border-current hover:bg-accent"
                  style={{ borderColor: "var(--border)" }}
                  onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = action.color; el.style.backgroundColor = `${action.color}12`; }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = "var(--border)"; el.style.backgroundColor = ""; }}
                >
                  <ActionIcon className="h-4 w-4" style={{ color: action.color }} />
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        className="grid gap-4 mb-6"
        style={{ gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}
      >
        <div className="bg-card rounded-xl border border-border shadow-sm">
          <div className="px-5 py-4 border-b border-border flex justify-between items-center">
            <h3 className="text-sm font-semibold text-foreground m-0 flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              Notifications
            </h3>
            <button onClick={() => router.push("/notifications")} className="text-xs text-primary bg-none border-none cursor-pointer font-medium hover:underline">
              View All →
            </button>
          </div>
          <div className="py-1">
            {notifList.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground text-xs">No notifications</div>
            ) : (
              notifList.map((n: any, idx: number) => (
                <div key={idx} className={`flex items-center gap-3 px-5 py-2.5 ${idx < notifList.length - 1 ? "border-b border-muted" : ""}`}>
                  <span className="flex-shrink-0">
                    {n.type === "error" ? "🔴" : n.type === "warning" ? "🟡" : n.type === "success" ? "🟢" : "🔵"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-foreground truncate">{n.text}</div>
                    <div className="text-[11px] text-muted-foreground">{n.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <List className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground m-0">Recent Activity</h3>
          </div>
          <div className="py-1">
            {activities.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground text-xs">No recent activity</div>
            ) : (
              activities.map((a: any, idx: number) => (
                <div key={idx} className={`flex items-center justify-between px-5 py-2.5 ${idx < activities.length - 1 ? "border-b border-muted" : ""}`}>
                  <div className="min-w-0">
                    <div className="text-xs text-foreground font-medium truncate">{a.text}</div>
                    <div className="text-[11px] text-muted-foreground">{a.time}</div>
                  </div>
                  {a.amount && <div className="text-xs font-semibold text-success flex-shrink-0 ml-3">{a.amount}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="text-center text-[11px] text-muted-foreground py-4 border-t border-border">
        BizFlow &copy; 2026 &middot; Enterprise Dashboard
      </div>

      <button
        onClick={loadData}
        className="fixed bottom-5 right-5 px-4 py-2.5 border border-border bg-card rounded-lg cursor-pointer text-xs font-medium text-muted-foreground shadow-lg z-50 hover:bg-accent transition-colors"
      >
        <BarChart3 className="h-3.5 w-3.5 inline mr-1.5" />
        Refresh
      </button>
    </>
  );
}
