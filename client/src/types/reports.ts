// Report type definitions matching backend API responses

export interface ProfitLoss {
  period: { start: string; end: string };
  revenue: number;
  cogs: number;
  gross_profit: number;
  gross_margin: string | number;
  expenses: number;
  net_profit: number;
  net_margin: string | number;
  expenses_by_category: Array<{ category: string; total: number }>;
  revenue_by_month: Array<{ month: string; revenue: number }>;
}

export interface SalesReport {
  period: { start: string; end: string; group_by: string };
  sales_by_period: Array<{
    period: string;
    count: number;
    revenue: number;
    avg_order: number;
  }>;
  top_customers: Array<{
    name: string;
    purchase_count: number;
    total_spent: number;
  }>;
  top_products: Array<{
    name: string;
    qty_sold: number;
    revenue: number;
  }>;
}

export interface InventoryReport {
  total_products: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_inventory_value: number;
  products: Array<{
    id: string;
    name: string;
    stock_qty: number;
    reorder_level: number;
    cost_price: number;
    selling_price: number;
    sold_30d: number;
    category_name?: string;
  }>;
  recent_movements: Array<{
    id: string;
    product_id: string;
    product_name: string;
    qty_before: number;
    qty_change: number;
    qty_after: number;
    reason: string;
    created_at: string;
  }>;
}

export interface CashflowReport {
  period: { start: string; end: string };
  total_inflow: number;
  total_outflow: number;
  net_cashflow: number;
  inflows_by_source: Array<{
    source: string;
    total: number;
    count: number;
  }>;
  outflows_by_source: Array<{
    source: string;
    total: number;
    count: number;
  }>;
  daily_flow: Array<{
    date: string;
    type: string;
    total: number;
  }>;
}

export interface TaxSummary {
  year: number;
  total_tax_collected: number;
  monthly_sales: Array<{
    month: string;
    count: number;
    revenue: number;
  }>;
  monthly_expenses: Array<{
    month: string;
    total: number;
  }>;
}

export interface DateRange {
  start_date: string;
  end_date: string;
}
