"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Brain, TrendingUp, Lightbulb, LineChart } from "lucide-react";
import api from "@/lib/api";

interface RevenueData {
  current: number;
  change: string;
}

interface InsightsData {
  aiSummary: string;
  data: {
    revenue: RevenueData;
    expenses: number;
    profit: number;
    newCustomers: number;
    lowStockProducts: number;
    topProducts: Product[];
  };
}

interface Prediction {
  month: string;
  predicted_revenue: number;
  confidence: "high" | "medium" | "low";
}

interface Product {
  name: string;
  qty_sold: number;
  revenue: string;
}

interface HistoryItem {
  id: string;
  created_at: string;
  insight_type: string;
  summary: string;
}

export default function AIPage() {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [predictions, setPredictions] = useState<{ predictions: Prediction[] } | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [insightsRes, predictionsRes, historyRes] = await Promise.all([
        api.ai.getInsights(),
        api.ai.getPredictions(),
        api.ai.getHistory(),
      ]);
      setInsights(insightsRes as InsightsData);
      setPredictions(predictionsRes as { predictions: Prediction[] });
      setHistory(historyRes as HistoryItem[]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load AI data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-8">Analyzing your business data...</div>;

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-600" />
            AI Insights
          </h2>
          <p className="text-gray-500">AI-powered business analysis and predictions</p>
        </div>
        <Button onClick={loadData}>Refresh Analysis</Button>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>}

      {insights && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                AI Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm whitespace-pre-wrap">
                {insights.aiSummary}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business Metrics (30 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Revenue</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {insights.data.revenue.current.toLocaleString()}
                    </span>
                    <Badge
                      className={
                        parseFloat(insights.data.revenue.change) >= 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }
                    >
                      {insights.data.revenue.change}%
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Expenses</span>
                  <span className="font-semibold">
                    {insights.data.expenses.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Profit</span>
                  <span
                    className={`font-semibold ${
                      insights.data.profit >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {insights.data.profit.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">New Customers</span>
                  <span className="font-semibold">{insights.data.newCustomers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Low Stock Items</span>
                  <span className="font-semibold">{insights.data.lowStockProducts}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="predictions">
        <TabsList>
          <TabsTrigger value="predictions">Revenue Predictions</TabsTrigger>
          <TabsTrigger value="top-products">Top Products</TabsTrigger>
          <TabsTrigger value="history">Insight History</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Revenue Forecast
              </CardTitle>
              <CardDescription>Predicted revenue for upcoming months</CardDescription>
            </CardHeader>
            <CardContent>
              {predictions?.predictions ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Predicted Revenue</TableHead>
                      <TableHead>Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {predictions.predictions.map((pred: Prediction, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{pred.month}</TableCell>
                        <TableCell>
                          <span className="text-green-600 font-semibold">
                            {pred.predicted_revenue?.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              pred.confidence === "high"
                                ? "bg-green-100 text-green-700"
                                : pred.confidence === "medium"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }
                          >
                            {pred.confidence}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-gray-500">Not enough data for predictions</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-products">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-blue-500" />
                Top Performing Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity Sold</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {insights?.data.topProducts?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500">
                        No sales data yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    insights?.data.topProducts?.map((product: Product, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.qty_sold}</TableCell>
                        <TableCell className="text-green-600 font-semibold">
                          {parseFloat(product.revenue).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Insight History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Summary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500">
                        No insights yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {new Date(item.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge>{item.insight_type}</Badge>
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {item.summary}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
