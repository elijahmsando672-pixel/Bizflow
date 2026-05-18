// ── Dashboard ──

export interface DashboardStats {
  totalCustomers: number;
  totalRevenue: number;
  pendingPayments: number;
  totalExpenses: number;
  activeInvoices: number;
  lowStockProducts: number;
  totalInflow: number;
  totalOutflow: number;
}

export interface DashboardSale {
  id: string;
  customer_name: string;
  sale_date: string;
  status: string;
  total: number;
}

export interface DashboardExpense {
  id: string;
  description: string;
  amount: number;
  expense_date: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recentSales: DashboardSale[];
  recentExpenses: DashboardExpense[];
}

// ── Products ──

export interface TopProduct {
  id: string;
  name: string;
  category_name: string;
  total_sold: number;
  order_count: number;
  total_revenue: number;
  stock_qty: number;
  reorder_level: string;
}

// ── Customers ──

export interface FrequentCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  total_orders: number;
  total_spent: number;
  avg_order_value: number;
  last_order_date: string;
}

// ── Stock ──

export interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  stock_qty: number;
  reorder_level: number;
  suggested_restock_qty: number;
  estimated_restock_cost: number;
}

// ── Restock ──

export interface RestockBudgetItem {
  id: string;
  name: string;
  cost_price: number;
  stock_qty: number;
  reorder_level: number;
}

export interface RestockBudgetData {
  items: RestockBudgetItem[];
  totalBudget: number;
  itemCount: number;
}

// ── Charts ──

export interface RevenueChartPoint {
  name: string;
  revenue: number;
}

// ── Orders ──

export type OrderStatus = "pending" | "completed" | "cancelled" | "shipped" | "paid" | "draft";

export interface Order {
  id: string;
  customer: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
}
