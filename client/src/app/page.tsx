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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShoppingCart,
  Users,
  Package,
  Calculator,
  CheckCircle,
} from "lucide-react";
import api from "@/lib/api";

interface TopProduct {
  id: string;
  name: string;
  category_name: string;
  total_sold: number;
  order_count: number;
  total_revenue: number;
  stock_qty: number;
  reorder_level: string;
}

interface FrequentCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  total_orders: number;
  total_spent: number;
  avg_order_value: number;
  last_order_date: string;
}

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
  recentSales: Array<{
    id: string;
    customer_name: string;
    sale_date: string;
    status: string;
    total: number;
  }>;
  recentExpenses: Array<{
    id: string;
    description: string;
    amount: number;
    expense_date: string;
  }>;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-KE", {
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
      change: "From paid sales",
      trend: "up",
      icon: DollarSign,
    },
    {
      title: "Expenses",
      value: formatCurrency(data.stats.totalExpenses),
      change: "Total costs",
      trend: "up",
      icon: TrendingUp,
    },
    {
      title: "Profit",
      value: formatCurrency(data.stats.totalRevenue - data.stats.totalExpenses),
      change: "Revenue - Expenses",
      trend: data.stats.totalRevenue > data.stats.totalExpenses ? "up" : "down",
      icon: TrendingDown,
    },
    {
      title: "Low Stock Alerts",
      value: data.stats.lowStockProducts,
      change: "Items below threshold",
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
              <p className="text-xs text-gray-500">{stat.change}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function LowStockAlerts({ data }: { data: Array<{
  id: string;
  name: string;
  sku: string;
  stock_qty: number;
  reorder_level: number;
  suggested_restock_qty: number;
  estimated_restock_cost: number;
} | null> }) {
  if (!data || !data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" />Low Stock Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-8">All products are well stocked</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" />Low Stock Alerts ({data.length})</CardTitle>
        <CardDescription>Products below reorder threshold</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">In Stock</TableHead>
              <TableHead className="text-right">Reorder At</TableHead>
              <TableHead className="text-right">Restock Qty</TableHead>
              <TableHead className="text-right">Est. Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {data?.filter((item): item is {
                id: string;
                name: string;
                sku: string;
                stock_qty: number;
                reorder_level: number;
                suggested_restock_qty: number;
                estimated_restock_cost: number;
              } => item !== null).map((item) => {
              const stockPercent = (item.stock_qty / item.reorder_level) * 100;
              const severity = stockPercent < 25 ? "bg-red-100 text-red-700" : stockPercent < 50 ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700";
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-xs text-gray-500">{item.sku || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className={severity}>{item.stock_qty}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{item.reorder_level}</TableCell>
                  <TableCell className="text-right font-medium">{item.suggested_restock_qty}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.estimated_restock_cost || 0)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function TopProducts({ data }: { data: Array<{
  id: string;
  name: string;
  category_name: string;
  total_sold: number;
  order_count: number;
  total_revenue: number;
  stock_qty: number;
  reorder_level: string;
} | null> }) {
  if (!data || !data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-blue-500" />Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-8">No sales data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-blue-500" />Top Selling Products</CardTitle>
        <CardDescription>Best sellers by quantity sold (last 30 days)</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Sold</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">In Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {data?.filter((item): item is TopProduct => item !== null).map((item, idx) => (
               <TableRow key={item.id}>
                 <TableCell className="font-bold text-gray-400">{idx + 1}</TableCell>
                 <TableCell>
                   <p className="font-medium">{item.name}</p>
                   <p className="text-xs text-gray-500">{item.category_name || "Uncategorized"}</p>
                 </TableCell>
                 <TableCell className="text-right font-semibold text-blue-600">{item.total_sold}</TableCell>
                 <TableCell className="text-right">{item.order_count}</TableCell>
                 <TableCell className="text-right font-medium">{formatCurrency(item.total_revenue || 0)}</TableCell>
                 <TableCell className="text-right">
                   <Badge variant={item.stock_qty < parseInt(item.reorder_level || "0") ? "destructive" : "secondary"}>{item.stock_qty}</Badge>
                 </TableCell>
               </TableRow>
             ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function FrequentCustomers({ data }: { data: Array<{
  id: string;
  name: string;
  email: string;
  phone: string;
  total_orders: number;
  total_spent: number;
  avg_order_value: number;
  last_order_date: string;
} | null> }) {
  if (!data || !data.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-green-500" />Top Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-8">No customer data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-green-500" />Top Customers</CardTitle>
        <CardDescription>Ranked by total spend (last 30 days)</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
              <TableHead className="text-right">Avg Order</TableHead>
              <TableHead className="text-right">Last Order</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {data?.filter((item): item is FrequentCustomer => item !== null).map((item, idx) => (
               <TableRow key={item.id}>
                 <TableCell className="font-bold text-gray-400">{idx + 1}</TableCell>
                 <TableCell>
                   <p className="font-medium">{item.name}</p>
                   <p className="text-xs text-gray-500">{item.email || item.phone || ""}</p>
                 </TableCell>
                 <TableCell className="text-right">{item.total_orders}</TableCell>
                 <TableCell className="text-right font-semibold text-green-600">{formatCurrency(item.total_spent || 0)}</TableCell>
                 <TableCell className="text-right">{formatCurrency(item.avg_order_value || 0)}</TableCell>
                 <TableCell className="text-right text-sm text-gray-500">{item.last_order_date ? formatDate(item.last_order_date) : "-"}</TableCell>
               </TableRow>
             ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function RestockBudget({ budgetData, onCreated }: { budgetData: { items: Array<{ id: string; name: string; cost_price: number; stock_qty: number; reorder_level: number }>; totalBudget: number; itemCount: number } | null; onCreated: () => void }) {
  const [multiplier, setMultiplier] = useState("2");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);
  const [selectedVendor] = useState<string>("");
  const total = budgetData?.totalBudget || 0;
  const count = budgetData?.itemCount || 0;

  async function handleCreateBudget() {
    if (!budgetData?.items?.length) return;
    setLoading(true);
    try {
      await api.dashboard.createRestockBudget({
        items: budgetData.items.map((i: { id: string; name: string; cost_price: number; stock_qty: number; reorder_level: number }) => ({ product_id: i.id, name: i.name, cost_price: i.cost_price, stock_qty: i.stock_qty, reorder_level: i.reorder_level })),
        vendor_id: selectedVendor || null,
        multiplier: parseFloat(multiplier),
      });
      setCreated(true);
      onCreated();
      setTimeout(() => setCreated(false), 3000);
    } catch {
      // Error handled by caller
    } finally {
      setLoading(false);
    }
  }

  if (!budgetData?.items?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5 text-purple-500" />Restock Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-8">No items need restocking</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5 text-purple-500" />Restock Budget Calculator</CardTitle>
        <CardDescription>{count} items need restocking · Total estimated: {formatCurrency(total)}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-500">Stock Multiplier</label>
              <Input type="number" value={multiplier} onChange={e => setMultiplier(e.target.value)} min="1" max="5" step="0.5" className="mt-1" />
              <p className="text-xs text-gray-400 mt-1">Target = reorder level × multiplier - current stock</p>
            </div>
            <Button onClick={handleCreateBudget} disabled={loading || created} className="bg-purple-600 hover:bg-purple-700">
              {created ? <><CheckCircle className="h-4 w-4 mr-2" />Created!</> : loading ? "Creating..." : <><Calculator className="h-4 w-4 mr-2" />Create Purchase Order</>}
            </Button>
          </div>

          <div className="border rounded-lg max-h-48 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">Target</TableHead>
                  <TableHead className="text-right">Order Qty</TableHead>
                  <TableHead className="text-right">Est. Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgetData.items.map((item: { id: string; name: string; cost_price: number; stock_qty: number; reorder_level: number }, i: number) => {
                  const targetQty = Math.ceil(item.reorder_level * parseFloat(multiplier));
                  const orderQty = Math.max(0, targetQty - item.stock_qty);
                  const estCost = orderQty * (item.cost_price || 0);
                  return (
                    <TableRow key={`${item.id}-${i}`}>
                      <TableCell className="font-medium text-sm">{item.name}</TableCell>
                      <TableCell className="text-right text-sm">{item.stock_qty}</TableCell>
                      <TableCell className="text-right text-sm">{targetQty}</TableCell>
                      <TableCell className="text-right text-sm font-semibold">{orderQty}</TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(estCost)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
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
            data.recentSales.slice(0, 5).map((tx: DashboardData["recentSales"][0]) => (
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
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [lowStock, setLowStock] = useState<Array<{
    id: string;
    name: string;
    sku: string;
    stock_qty: number;
    reorder_level: number;
    suggested_restock_qty: number;
    estimated_restock_cost: number;
  } | null>>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [frequentCustomers, setFrequentCustomers] = useState<FrequentCustomer[]>([]);
  const [restockBudget, setRestockBudget] = useState<{ items: Array<{ id: string; name: string; cost_price: number; stock_qty: number; reorder_level: number }>; totalBudget: number; itemCount: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [stats, low, top, freq, budget] = await Promise.all([
          api.dashboard.getStats(),
          api.dashboard.getLowStockDetails(),
          api.dashboard.getTopProducts("30"),
          api.dashboard.getFrequentCustomers("30"),
          api.dashboard.getRestockBudget(2),
        ]);
        setDashboardData(stats as DashboardData);
        setLowStock(low as Array<{
          id: string;
          name: string;
          sku: string;
          stock_qty: number;
          reorder_level: number;
          suggested_restock_qty: number;
          estimated_restock_cost: number;
        }>);
        setTopProducts(top as TopProduct[]);
        setFrequentCustomers(freq as FrequentCustomer[]);
        setRestockBudget(budget as { items: Array<{ id: string; name: string; cost_price: number; stock_qty: number; reorder_level: number }>; totalBudget: number; itemCount: number });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    }
    fetchAll();
  }, []);

  function handleBudgetCreated() {
    api.dashboard.getRestockBudget(2)
      .then((b) => setRestockBudget(b as { items: Array<{ id: string; name: string; cost_price: number; stock_qty: number; reorder_level: number }>; totalBudget: number; itemCount: number }))
      .catch((err) => console.error("Failed to refresh restock budget:", err));
  }

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

  if (!dashboardData) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500">Welcome back! Here&apos;s an overview of your business.</p>
      </div>

      <DashboardCards data={dashboardData} />

      <div className="grid gap-4 md:grid-cols-2">
        <RecentTransactions data={dashboardData} />
        <StatsOverview data={dashboardData} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <LowStockAlerts data={lowStock} />
        <TopProducts data={topProducts} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FrequentCustomers data={frequentCustomers} />
        <RestockBudget budgetData={restockBudget} onCreated={handleBudgetCreated} />
      </div>
    </div>
  );
}
