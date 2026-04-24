"use client";

import { useState, useEffect } from "react";
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
import { Plus, Search, CreditCard, DollarSign, Clock, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";

export default function CreditorsPage() {
  const [creditors, setCreditors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const toast = useToast();

  useEffect(() => {
    loadCreditors();
  }, []);

  const loadCreditors = async () => {
    try {
      setLoading(true);
      const data = await api.customers.getAll();
      setCreditors(data);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load creditors");
    } finally {
      setLoading(false);
    }
  };

  const filteredCreditors = creditors.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPayable = creditors.reduce((sum, c) => sum + parseFloat(c.balance || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Creditors</h2>
          <p className="text-gray-500">Manage your payable accounts</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Creditor
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search creditors..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Payable</CardDescription>
            <CardTitle className="text-3xl">${totalPayable.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <DollarSign className="h-4 w-4" /> Outstanding balance
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Creditors</CardDescription>
            <CardTitle className="text-3xl">{creditors.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CreditCard className="h-4 w-4" /> With pending payments
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Due This Week</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">$0</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-yellow-600">
              <Clock className="h-4 w-4" /> Needs attention
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Creditors</CardTitle>
          <CardDescription>View and manage your payable accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Creditor</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCreditors.map((creditor) => (
                  <TableRow key={creditor.id}>
                    <TableCell className="font-medium">{creditor.name}</TableCell>
                    <TableCell className="text-gray-500">{creditor.email}</TableCell>
                    <TableCell>{creditor.phone}</TableCell>
                    <TableCell>${creditor.balance || 0}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                        creditor.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {creditor.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Pay</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}