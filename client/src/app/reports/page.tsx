"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Package, FileDown } from "lucide-react";
import api from "@/lib/api";
import { ProfitLoss, SalesReport, InventoryReport, CashflowReport, TaxSummary } from "@/types/reports";



interface DateRange {
  start_date: string;
  end_date: string;
}

export default function ReportsPage() {
  const [pl, setPL] = useState<ProfitLoss | null>(null);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [inventory, setInventory] = useState<InventoryReport | null>(null);
  const [cashflow, setCashflow] = useState<CashflowReport | null>(null);
  const [taxSummary, setTaxSummary] = useState<TaxSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({ start_date: "", end_date: "" });
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async (start: string, end: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = `?start_date=${start}&end_date=${end}`;
      const [plRes, salesRes, invRes, cfRes, taxRes] = await Promise.all([
        api.reports.getProfitLoss(params),
        api.reports.getSalesReport(params),
        api.reports.getInventoryReport(),
        api.reports.getCashflowReport(params),
        api.reports.getTaxSummary(new Date().getFullYear().toString()),
      ]);
      setPL(plRes as ProfitLoss);
      setSalesReport(salesRes as SalesReport);
      setInventory(invRes as InventoryReport);
      setCashflow(cfRes as CashflowReport);
      setTaxSummary(taxRes as TaxSummary);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
    const end = now.toISOString().split("T")[0];
    setDateRange({ start_date: start, end_date: end });
    loadReports(start, end);
  }, [loadReports]);

  function handleRefresh() {
    loadReports(dateRange.start_date, dateRange.end_date);
  }

  if (loading) return <div className="p-8">Loading reports...</div>;

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            Advanced Reports
          </h2>
          <p className="text-gray-500">Comprehensive business analytics and reports</p>
        </div>
        <div className="flex gap-2">
          <Input
            type="date"
            value={dateRange.start_date}
            onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
            className="w-40"
          />
          <Input
            type="date"
            value={dateRange.end_date}
            onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
            className="w-40"
          />
          <Button onClick={handleRefresh}>
            <FileDown className="mr-2 h-4 w-4" /> Generate
          </Button>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>}

      <Tabs defaultValue="profit-loss">
        <TabsList>
          <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="cashflow">Cashflow</TabsTrigger>
          <TabsTrigger value="tax">Tax Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="profit-loss">
          {pl && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {pl.revenue.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">COGS</CardTitle>
                    <Package className="h-4 w-4 text-yellow-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {pl.cogs.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {pl.gross_profit.toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-500">Margin: {pl.gross_margin}%</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                    <TrendingUp className="h-4 w-4 text-purple-400" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${
                        pl.net_profit >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {pl.net_profit.toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-500">Margin: {pl.net_margin}%</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Expenses by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pl.expenses_by_category.map((cat: {
                        category: string;
                        total: number;
                      }, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">
                            {cat.category || "Uncategorized"}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {cat.total.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="sales">
          {salesReport && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Customers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Purchases</TableHead>
                          <TableHead>Total Spent</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesReport.top_customers.map((c: {
                              name: string;
                              purchase_count: number;
                              total_spent: number;
                            }, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell>{c.purchase_count}</TableCell>
                            <TableCell className="font-semibold">
                              {c.total_spent.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Qty Sold</TableHead>
                          <TableHead>Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesReport.top_products.map((p: { name: string; qty_sold: number; revenue: number }, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{p.name}</TableCell>
                            <TableCell>{p.qty_sold}</TableCell>
                            <TableCell className="font-semibold text-green-600">
                              {p.revenue.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="inventory">
          {inventory && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                    <Package className="h-4 w-4 text-gray-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{inventory.total_products}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                    <TrendingDown className="h-4 w-4 text-yellow-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {inventory.low_stock_count}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {inventory.out_of_stock_count}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {inventory.total_inventory_value.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Stock Movements (Last 30 days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Change</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventory.recent_movements.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-gray-500">
                            No recent movements
                          </TableCell>
                        </TableRow>
                      ) : (
                        inventory.recent_movements.map((m: { product_name: string; qty_change: number; reason: string; created_at: string }, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{m.product_name}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  m.qty_change > 0
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }
                              >
                                {m.qty_change > 0 ? "+" : ""}
                                {m.qty_change}
                              </Badge>
                            </TableCell>
                            <TableCell>{m.reason}</TableCell>
                            <TableCell>
                              {new Date(m.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="cashflow">
          {cashflow && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Inflow</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {cashflow.total_inflow.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Outflow</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {cashflow.total_outflow.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Cashflow</CardTitle>
                    <DollarSign className="h-4 w-4 text-blue-400" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${
                        cashflow.net_cashflow >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {cashflow.net_cashflow.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Inflows by Source</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Source</TableHead>
                          <TableHead>Count</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cashflow.inflows_by_source.map((s: { source: string; count: number; total: number }, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{s.source}</TableCell>
                            <TableCell>{s.count}</TableCell>
                            <TableCell className="text-right text-green-600 font-semibold">
                              {s.total.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Outflows by Source</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Source</TableHead>
                          <TableHead>Count</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cashflow.outflows_by_source.map((s: { source: string; count: number; total: number }, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{s.source}</TableCell>
                            <TableCell>{s.count}</TableCell>
                            <TableCell className="text-right text-red-600 font-semibold">
                              {s.total.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="tax">
          {taxSummary && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tax Summary {taxSummary.year}</CardTitle>
                  <CardDescription>Total tax collected this year</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {taxSummary.total_tax_collected.toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Sales</TableHead>
                        <TableHead>Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {taxSummary.monthly_sales.map((m: { month: string; count: number; revenue: number }, i: number) => {
                        const monthNames = [
                          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
                        ];
                        return (
                          <TableRow key={i}>
                            <TableCell className="font-medium">
                              {monthNames[parseInt(m.month) - 1]}
                            </TableCell>
                            <TableCell>{m.count}</TableCell>
                            <TableCell className="font-semibold">
                              {m.revenue.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
