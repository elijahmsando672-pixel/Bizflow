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
import { Plus, Search, DollarSign, TrendingDown, Loader2 } from "lucide-react";
import api from "@/lib/api";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  status: string;
  receipt_url: string;
}

interface ExpenseForm {
  description: string;
  amount: string;
  category: string;
  expense_date: string;
  status: string;
  receipt_url: string;
}

interface Category {
  id: string;
  name: string;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [expenseForm, setExpenseForm] = useState<ExpenseForm>({ description: "", amount: "", category: "", expense_date: "", status: "pending", receipt_url: "" });
  const [categories, setCategories] = useState<Category[]>([]);
  const toast = useToast();

  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.expenses.getAll();
      setExpenses(data as Expense[]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load expenses";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await api.expenses.getCategories();
      setCategories(data as Category[]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete expense";
      toast.error(message);
    }
  }, []);

  const handleCreateExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount) {
      toast.error("Description and amount are required");
      return;
    }
    try {
      await api.expenses.create({
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        expense_date: expenseForm.expense_date || new Date().toISOString().split("T")[0],
        status: expenseForm.status,
        receipt_url: expenseForm.receipt_url || undefined,
      });
      toast.success("Expense created");
      setDialogOpen(false);
      setExpenseForm({ description: "", amount: "", category: "", expense_date: "", status: "pending", receipt_url: "" });
      loadExpenses();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create expense";
      toast.error(message);
    }
  };

  const handleViewExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setViewDialogOpen(true);
  };

  const handleApproveExpense = async (id: string) => {
    try {
      await api.expenses.update(id, { status: "approved" });
      toast.success("Expense approved");
      loadExpenses();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to approve expense";
      toast.error(message);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await api.expenses.delete(id);
      toast.success("Expense deleted");
      loadExpenses();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete expense";
      toast.error(message);
    }
  };

  const filteredExpenses = expenses.filter((e) =>
    e.description?.toLowerCase().includes(search.toLowerCase()) ||
    e.category?.toLowerCase().includes(search.toLowerCase())
  );

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const approved = expenses.filter((e) => e.status === "approved").reduce((sum, e) => sum + (e.amount || 0), 0);
  const pending = expenses.filter((e) => e.status === "pending").reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Expenses</h2>
          <p className="text-gray-500">Track and manage business expenses</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search expenses..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Expenses</CardDescription>
            <CardTitle className="text-3xl">${totalExpenses.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <DollarSign className="h-4 w-4" />
              This month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="text-3xl text-green-600">${approved.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-green-600">
              <TrendingDown className="h-4 w-4" />
              Processed
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">${pending.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-yellow-600">
              <DollarSign className="h-4 w-4" />
              Awaiting approval
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Expenses</CardTitle>
          <CardDescription>View and manage all expenses</CardDescription>
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
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.description}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>${expense.amount}</TableCell>
                    <TableCell className="text-gray-500">
                      {new Date(expense.expense_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          expense.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {expense.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleViewExpense(expense)}>
                          View
                        </Button>
                        {expense.status === "pending" && (
                          <Button variant="ghost" size="sm" onClick={() => handleApproveExpense(expense.id)}>
                            Approve
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteExpense(expense.id)}>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredExpenses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No expenses found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>Record a new business expense</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Description</Label>
              <Textarea value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="What was this expense for?" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Amount</Label>
                <Input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} placeholder="0.00" />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm({ ...expenseForm, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat: Category) => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={expenseForm.expense_date} onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={expenseForm.status} onValueChange={(v) => setExpenseForm({ ...expenseForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Receipt URL (optional)</Label>
              <Input value={expenseForm.receipt_url} onChange={(e) => setExpenseForm({ ...expenseForm, receipt_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateExpense}>Add Expense</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="font-medium">{selectedExpense.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-medium">KSh {(selectedExpense.amount || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium">{selectedExpense.category || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{new Date(selectedExpense.expense_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                    selectedExpense.status === "approved" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}>{selectedExpense.status}</span>
                </div>
              </div>
              {selectedExpense.receipt_url && (
                <div>
                  <p className="text-sm text-gray-500">Receipt</p>
                  <a href={selectedExpense.receipt_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Receipt</a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}