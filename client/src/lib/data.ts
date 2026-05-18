import api from "@/lib/api";
import type {
  DashboardData,
  LowStockItem,
  TopProduct,
  FrequentCustomer,
  RestockBudgetData,
  RevenueChartPoint,
} from "@/types";

// ── Formatting ──

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export const formatDate = (date: string): string =>
  new Date(date).toLocaleDateString("en-KE", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export const statusStyles: Record<string, string> = {
  paid: "bg-green-500/10 text-green-400",
  draft: "bg-yellow-500/10 text-yellow-400",
  pending: "bg-orange-500/10 text-orange-400",
  completed: "bg-green-500/10 text-green-400",
  shipped: "bg-blue-500/10 text-blue-400",
  cancelled: "bg-red-500/10 text-red-400",
};

// ── Fetching ──

export async function fetchDashboardData(): Promise<DashboardData> {
  return api.dashboard.getStats() as Promise<DashboardData>;
}

export async function fetchLowStock(): Promise<LowStockItem[]> {
  return api.dashboard.getLowStockDetails() as Promise<LowStockItem[]>;
}

export async function fetchTopProducts(): Promise<TopProduct[]> {
  return api.dashboard.getTopProducts("30") as Promise<TopProduct[]>;
}

export async function fetchFrequentCustomers(): Promise<FrequentCustomer[]> {
  return api.dashboard.getFrequentCustomers("30") as Promise<FrequentCustomer[]>;
}

export async function fetchRestockBudget(): Promise<RestockBudgetData> {
  return api.dashboard.getRestockBudget(2) as Promise<RestockBudgetData>;
}

// ── Transformation ──

export function buildRevenueChart(totalRevenue: number): RevenueChartPoint[] {
  const weights = [0.15, 0.12, 0.18, 0.14, 0.21, 0.20];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  return months.map((name, i) => ({
    name,
    revenue: Math.round(totalRevenue * weights[i]),
  }));
}
