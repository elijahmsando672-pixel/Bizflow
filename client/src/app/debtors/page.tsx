"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";
import api from "@/lib/api";

export default function DebtorsPage() {
  const [debtors, setDebtors] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ totalOwed: 0, totalPaid: 0, overdueCount: 0 });
  const [loading, setLoading] = useState(true);
  const [debtorDialog, setDebtorDialog] = useState(false);
  const [invoiceDialog, setInvoiceDialog] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState<any>(null);
  const [debtorForm, setDebtorForm] = useState({ name: "", email: "", phone: "", address: "", notes: "" });
  const [invoiceForm, setInvoiceForm] = useState({ reference: "", amount: 0, due_date: "", notes: "" });
  const [paymentForm, setPaymentForm] = useState({ amount: 0, date: new Date().toISOString().split("T")[0], reference: "", notes: "" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [debtorsRes, summaryRes] = await Promise.all([
        api.debtors.getAll(),
        api.debtors.getSummary(),
      ]);
      setDebtors(debtorsRes as any[]);
      setSummary(summaryRes as any);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateDebtor() {
    try {
      await api.debtors.create(debtorForm);
      setSuccess("Debtor added");
      setDebtorDialog(false);
      setDebtorForm({ name: "", email: "", phone: "", address: "", notes: "" });
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleCreateInvoice() {
    try {
      await api.debtors.createInvoice(selectedDebtor.id, invoiceForm);
      setSuccess("Invoice created");
      setInvoiceDialog(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleRecordPayment() {
    try {
      await api.debtors.recordPayment(selectedDebtor.id, paymentForm);
      setSuccess("Payment recorded");
      setPaymentDialog(false);
      setPaymentForm({ amount: 0, date: new Date().toISOString().split("T")[0], reference: "", notes: "" });
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Accounts Receivable</h2>
          <p className="text-gray-500">Manage debtors and outstanding invoices</p>
        </div>
        <Button onClick={() => setDebtorDialog(true)}>
          <UserPlus className="mr-2 h-4 w-4" /> Add Debtor
        </Button>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>}
      {success && <div className="rounded-lg bg-green-50 p-4 text-green-600">{success}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Owed</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {summary.totalOwed.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.totalPaid.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.overdueCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Debtors</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Total Owed</TableHead>
                <TableHead>Total Paid</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {debtors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    No debtors found
                  </TableCell>
                </TableRow>
              ) : (
                debtors.map((debtor) => (
                  <TableRow key={debtor.id}>
                    <TableCell className="font-medium">{debtor.name}</TableCell>
                    <TableCell>{debtor.email || "-"}</TableCell>
                    <TableCell>{debtor.phone || "-"}</TableCell>
                    <TableCell className="text-yellow-600 font-semibold">
                      {parseFloat(debtor.total_owed || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-green-600">
                      {parseFloat(debtor.total_paid || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDebtor(debtor);
                            setInvoiceDialog(true);
                          }}
                        >
                          Invoice
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDebtor(debtor);
                            setPaymentDialog(true);
                          }}
                        >
                          Payment
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={debtorDialog} onOpenChange={setDebtorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Debtor</DialogTitle>
            <DialogDescription>Record a debtor who owes you money</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Name"
              value={debtorForm.name}
              onChange={(e) => setDebtorForm({ ...debtorForm, name: e.target.value })}
            />
            <Input
              placeholder="Email"
              value={debtorForm.email}
              onChange={(e) => setDebtorForm({ ...debtorForm, email: e.target.value })}
            />
            <Input
              placeholder="Phone"
              value={debtorForm.phone}
              onChange={(e) => setDebtorForm({ ...debtorForm, phone: e.target.value })}
            />
            <Input
              placeholder="Address"
              value={debtorForm.address}
              onChange={(e) => setDebtorForm({ ...debtorForm, address: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDebtorDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateDebtor}>Add Debtor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={invoiceDialog} onOpenChange={setInvoiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Debtor Invoice</DialogTitle>
            <DialogDescription>Invoice for {selectedDebtor?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Reference"
              value={invoiceForm.reference}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, reference: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Amount"
              value={invoiceForm.amount}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: parseFloat(e.target.value) || 0 })}
            />
            <Input
              type="date"
              placeholder="Due Date"
              value={invoiceForm.due_date}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateInvoice}>Create Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Payment from {selectedDebtor?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              placeholder="Amount"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) || 0 })}
            />
            <Input
              type="date"
              value={paymentForm.date}
              onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
            />
            <Input
              placeholder="Reference"
              value={paymentForm.reference}
              onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialog(false)}>Cancel</Button>
            <Button onClick={handleRecordPayment}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
