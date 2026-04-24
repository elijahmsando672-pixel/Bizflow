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
import { Plus, Search, CreditCard, DollarSign, Clock } from "lucide-react";

const creditors = [
  { id: 1, name: "Acme Suppliers", email: "accounts@acme.com", phone: "+1 555-0101", balance: "$5,200", status: "Active" },
  { id: 2, name: "Tech Solutions", email: "billing@techsol.com", phone: "+1 555-0102", balance: "$3,450", status: "Active" },
  { id: 3, name: "Office Depot", email: "ap@officedepot.com", phone: "+1 555-0103", balance: "$890", status: "Active" },
  { id: 4, name: "Cloud Services", email: "invoices@cloud.com", phone: "+1 555-0104", balance: "$1,200", status: "Pending" },
  { id: 5, name: "Marketing Pro", email: "billing@mp.com", phone: "+1 555-0105", balance: "$0", status: "Paid" },
];

export default function CreditorsPage() {
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
          <Input placeholder="Search creditors..." className="pl-10" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Payable</CardDescription>
            <CardTitle className="text-3xl">$10,740</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <DollarSign className="h-4 w-4" />
              Outstanding balance
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Creditors</CardDescription>
            <CardTitle className="text-3xl">4</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <CreditCard className="h-4 w-4" />
              With pending payments
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Due This Week</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">$890</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-yellow-600">
              <Clock className="h-4 w-4" />
              Needs attention
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
              {creditors.map((creditor) => (
                <TableRow key={creditor.id}>
                  <TableCell className="font-medium">{creditor.name}</TableCell>
                  <TableCell className="text-gray-500">{creditor.email}</TableCell>
                  <TableCell>{creditor.phone}</TableCell>
                  <TableCell>{creditor.balance}</TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        creditor.status === "Paid"
                          ? "bg-green-100 text-green-700"
                          : creditor.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
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
        </CardContent>
      </Card>
    </div>
  );
}