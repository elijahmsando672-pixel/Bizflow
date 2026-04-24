"use client";

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
import { Plus, Search, Filter, Download } from "lucide-react";

const sales = [
  { id: 1, customer: "John Doe", items: "Laptop x1, Mouse x1", total: "$450", status: "Paid", date: "2024-01-15" },
  { id: 2, customer: "Jane Smith", items: "Keyboard x2", total: "$320", status: "Pending", date: "2024-01-15" },
  { id: 3, customer: "Bob Wilson", items: "Monitor x1", total: "$890", status: "Paid", date: "2024-01-14" },
  { id: 4, customer: "Alice Brown", items: "Headphones x1", total: "$150", status: "Overdue", date: "2024-01-14" },
  { id: 5, customer: "Charlie Davis", items: "Webcam x2, Mic x1", total: "$620", status: "Paid", date: "2024-01-13" },
];

export default function SalesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Sales</h2>
          <p className="text-gray-500">Manage your sales and transactions</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Create Sale
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search sales..." className="pl-10" />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Sales</CardTitle>
          <CardDescription>View and manage all sales transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">{sale.customer}</TableCell>
                  <TableCell>{sale.items}</TableCell>
                  <TableCell>{sale.total}</TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        sale.status === "Paid"
                          ? "bg-green-100 text-green-700"
                          : sale.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {sale.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-500">{sale.date}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}