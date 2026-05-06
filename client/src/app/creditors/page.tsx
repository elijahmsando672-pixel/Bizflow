"use client";

import { useState, useEffect, useCallback } from "react";
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
import api from "@/components/ui/toast";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Creditor {
  id: string;
  name: string;
  email: string;
  phone: string;
  balance: number;
  status: string;
}

interface CreditorForm {
  name: string;
  email: string;
  phone: string;
  balance: string;
  notes: string;
}

interface PaymentForm {
  amount: string;
  date: string;
  notes: string;
}

export default function CreditorsPage() {
  const [creditors, setCreditors] = useState<Creditor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedCreditor, setSelectedCreditor] = useState<Creditor | null>(null);
  const [creditorForm, setCreditorForm] = useState<CreditorForm>({ name: "", email: "", phone: "", balance: "", notes: "" });
  const [paymentForm, setPaymentForm] = useState<PaymentForm>({ amount: "", date: "", notes: "" });
  const toast = useToast();

  const loadCreditors = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.customers.getAll();
      setCreditors(data as Creditor[]);
    } catch (err: Error) {
      toast.error(err?.message || "Failed to load creditors");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadCreditors();
  }, [loadCreditors]);

  const filteredCreditors = creditors.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPayable = creditors.reduce((sum, c) => sum + parseFloat(c.balance || 0), 0);

  const handleAddCreditor = async () => {
    if (!creditorForm.name) {
      toast.error("Name is required");
      return;
    }
    try {
      await api.customers.create({
        name: creditorForm.name,
        email: creditorForm.email || undefined,
        phone: creditorForm.phone || undefined,
        address: creditorForm.notes || undefined,
        status: "active",
      });
      toast.success("Creditor added");
      setAddDialogOpen(false);
      setCreditorForm({ name: "", email: "", phone: "", balance: "", notes: "" });
      loadCreditors();
    } catch (err: Error) {
      toast.error(err?.message || "Failed to add creditor");
    }
  };

  const handlePayCreditor = (creditor: Creditor) => {
    setSelectedCreditor(creditor);
    setPaymentForm({ amount: creditor.balance?.toString() || "", date: new Date().toISOString().split("T")[0], notes: "" });
    setPayDialogOpen(true);
  };

  const handleRecordPayment = async () => {
    if (!selectedCreditor || !paymentForm.amount) {
      toast.error("Amount is required");
      return;
    }
    try {
      await api.debtors.recordPayment(selectedCreditor.id, {
        amount: parseFloat(paymentForm.amount),
        date: paymentForm.date,
        notes: paymentForm.notes,
      });
      toast.success("Payment recorded");
      setPayDialogOpen(false);
      setSelectedCreditor(null);
      loadCreditors();
    } catch (err: Error) {
      toast.error(err?.message || "Failed to record payment");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Creditors</h2>
          <p className="text-gray-500">Manage your payable accounts</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => { setCreditorForm({ name: "", email: "", phone: "", balance: "", notes: "" }); setAddDialogOpen(true); }}>
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
                      <Button variant="ghost" size="sm" onClick={() => handlePayCreditor(creditor)}>Pay</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Creditor</DialogTitle>
            <DialogDescription>Create a new payable account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={creditorForm.name} onChange={(e) => setCreditorForm({ ...creditorForm, name: e.target.value })} placeholder="Creditor name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input type="email" value={creditorForm.email} onChange={(e) => setCreditorForm({ ...creditorForm, email: e.target.value })} placeholder="email@example.com" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={creditorForm.phone} onChange={(e) => setCreditorForm({ ...creditorForm, phone: e.target.value })} placeholder="+254..." />
              </div>
            </div>
            <div>
              <Label>Opening Balance</Label>
              <Input type="number" value={creditorForm.balance} onChange={(e) => setCreditorForm({ ...creditorForm, balance: e.target.value })} placeholder="0.00" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={creditorForm.notes} onChange={(e) => setCreditorForm({ ...creditorForm, notes: e.target.value })} placeholder="Optional notes" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleAddCreditor}>Add Creditor</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment to {selectedCreditor?.name}</DialogTitle>
            <DialogDescription>Current balance: KSh {parseFloat(selectedCreditor?.balance || 0).toLocaleString()}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Payment Amount</Label>
              <Input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder="0.00" />
            </div>
            <div>
              <Label>Payment Date</Label>
              <Input type="date" value={paymentForm.date} onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} placeholder="Payment reference" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPayDialogOpen(false)}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleRecordPayment}>Record Payment</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}