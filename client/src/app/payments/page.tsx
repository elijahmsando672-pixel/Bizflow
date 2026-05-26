"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, CreditCard, DollarSign, TrendingUp, Receipt, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/data";

interface Payment {
  id: string;
  customer_name?: string;
  amount: number;
  method: string;
  status: string;
  reference: string;
  created_at: string;
}

export default function PaymentsPage() {
  const [subscriptionPayments, setSubscriptionPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const toast = useToast();

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.subscriptions.getPayments();
      setSubscriptionPayments((data as Payment[]) || []);
    } catch {
      setSubscriptionPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const allPayments = subscriptionPayments;

  const filtered = allPayments.filter((p) =>
    (p.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
    p.reference?.toLowerCase().includes(search.toLowerCase()) ||
    p.method?.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = allPayments
    .filter((p) => p.status === "completed" || p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = allPayments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Payments</h1>
        <p className="text-gray-400 text-sm mt-1">Manage payments and transactions.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[#121A2B] border-white/10">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-white font-bold">{formatCurrency(totalRevenue)}</CardTitle>
              <CardDescription className="text-gray-400">Total Revenue</CardDescription>
            </div>
            <div className="bg-green-500/10 p-3 rounded-xl text-green-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardHeader>
        </Card>
        <Card className="bg-[#121A2B] border-white/10">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-white font-bold">{allPayments.length}</CardTitle>
              <CardDescription className="text-gray-400">Transactions</CardDescription>
            </div>
            <div className="bg-blue-500/10 p-3 rounded-xl text-blue-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardHeader>
        </Card>
        <Card className="bg-[#121A2B] border-white/10">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-white font-bold">{formatCurrency(pendingAmount)}</CardTitle>
              <CardDescription className="text-gray-400">Pending</CardDescription>
            </div>
            <div className="bg-amber-500/10 p-3 rounded-xl text-amber-400">
              <Receipt className="h-5 w-5" />
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card className="bg-[#121A2B] border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">Payment History</CardTitle>
            <CardDescription className="text-gray-400">All transactions</CardDescription>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search payments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 border-gray-700 bg-gray-800 pl-10 text-sm text-white placeholder:text-gray-500"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/5">
                  <TableHead className="text-gray-400">Reference</TableHead>
                  <TableHead className="text-gray-400">Customer</TableHead>
                  <TableHead className="text-gray-400">Method</TableHead>
                  <TableHead className="text-gray-400 text-right">Amount</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                      <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      {search ? "No payments match your search" : "No payment data yet"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id} className="border-white/5">
                      <TableCell className="font-mono text-xs text-gray-300">{p.reference || "-"}</TableCell>
                      <TableCell className="font-medium text-white">{p.customer_name || "N/A"}</TableCell>
                      <TableCell className="text-gray-400 capitalize">{p.method || "-"}</TableCell>
                      <TableCell className="text-right font-medium text-white">{formatCurrency(p.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={p.status === "completed" || p.status === "paid" ? "default" : "warning"}>
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString() : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
