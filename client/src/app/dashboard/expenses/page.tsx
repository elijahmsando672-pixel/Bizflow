"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  FileText,
  Layers,
  Plus,
  Receipt,
  RefreshCw,
  Tags,
  Trash2,
  TrendingDown,
  Wallet,
} from "lucide-react";
import api from "@/lib/api";
import { downloadCsv } from "@/lib/csv";
import { formatCurrency, formatDate, toNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { FormField, FormGrid } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { StatCard } from "@/components/ui/stat-card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const ALL_CATEGORIES = "__all__";
const UNCATEGORISED = "__none__";
const PAGE_SIZE = 12;

interface Expense {
  id: string;
  description: string;
  amount: number | string;
  category_id?: string | null;
  category_name?: string | null;
  date?: string | null;
  vendor?: string | null;
  reference?: string | null;
  is_receipt_attached?: boolean | null;
  notes?: string | null;
}

interface ExpenseCategory {
  id: string;
  name: string;
}

interface ExpenseForm {
  description: string;
  amount: string;
  category_id: string;
  date: string;
  vendor: string;
  reference: string;
  is_receipt_attached: boolean;
  notes: string;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyForm(): ExpenseForm {
  return {
    description: "",
    amount: "",
    category_id: "",
    date: today(),
    vendor: "",
    reference: "",
    is_receipt_attached: false,
    notes: "",
  };
}

export default function ExpensesPage() {
  const toast = useToast();
  const router = useRouter();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<ExpenseForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [expenseList, categoryList] = await Promise.all([
        api.expenses.getAll() as Promise<Expense[]>,
        api.expenses.getCategories().catch(() => [] as unknown),
      ]);
      setExpenses(Array.isArray(expenseList) ? expenseList : []);
      const cats = Array.isArray(categoryList) ? categoryList : [];
      setCategories(
        cats
          .map((entry) => entry as ExpenseCategory)
          .filter((entry) => Boolean(entry?.id && entry?.name))
      );
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Deep link from the "Record expense" quick action and /expenses/new.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("new") === "1") {
      setEditing(null);
      setForm(emptyForm());
      setDialogOpen(true);
    }
  }, []);

  const stats = useMemo(() => {
    const total = expenses.reduce((sum, expense) => sum + (toNumber(expense.amount) ?? 0), 0);
    const monthStart = today().slice(0, 7);
    const thisMonth = expenses
      .filter((expense) => String(expense.date ?? "").startsWith(monthStart))
      .reduce((sum, expense) => sum + (toNumber(expense.amount) ?? 0), 0);
    return {
      total,
      thisMonth,
      average: expenses.length ? total / expenses.length : 0,
      entries: expenses.length,
    };
  }, [expenses]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return expenses.filter((expense) => {
      if (query) {
        const haystack = [expense.description, expense.vendor, expense.reference, expense.category_name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (category === UNCATEGORISED) {
        if (expense.category_id) return false;
      } else if (category !== ALL_CATEGORIES) {
        if (expense.category_id !== category) return false;
      }
      if (from && (!expense.date || expense.date < from)) return false;
      if (to && (!expense.date || expense.date > to)) return false;
      return true;
    });
  }, [expenses, search, category, from, to]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, category, from, to]);

  const openDialog = (expense: Expense | null) => {
    setEditing(expense);
    setForm(
      expense
        ? {
            description: expense.description ?? "",
            amount: toNumber(expense.amount) != null ? String(toNumber(expense.amount)) : "",
            category_id: expense.category_id ?? "",
            date: expense.date ? String(expense.date).slice(0, 10) : today(),
            vendor: expense.vendor ?? "",
            reference: expense.reference ?? "",
            is_receipt_attached: Boolean(expense.is_receipt_attached),
            notes: expense.notes ?? "",
          }
        : emptyForm()
    );
    setDialogOpen(true);
  };

  const save = async () => {
    const description = form.description.trim();
    const amount = toNumber(form.amount);
    if (!description) {
      toast.error("Describe what the expense was for");
      return;
    }
    if (amount == null || amount <= 0) {
      toast.error("Enter an amount greater than zero");
      return;
    }

    setSaving(true);
    const payload = {
      description,
      amount,
      category_id: form.category_id || null,
      date: form.date || undefined,
      vendor: form.vendor.trim() || null,
      reference: form.reference.trim() || null,
      is_receipt_attached: form.is_receipt_attached,
      notes: form.notes.trim() || null,
    };
    try {
      if (editing) await api.expenses.update(editing.id, payload);
      else await api.expenses.create(payload);
      toast.success(editing ? "Expense updated" : "Expense recorded");
      setDialogOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the expense");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (expense: Expense) => {
    if (!window.confirm(`Delete "${expense.description}"? This cannot be undone.`)) return;
    setBusyId(expense.id);
    try {
      await api.expenses.delete(expense.id);
      toast.success("Expense deleted");
      load();
    } catch {
      toast.error("Could not delete the expense");
    } finally {
      setBusyId(null);
    }
  };

  const exportCsv = () => {
    if (filtered.length === 0) {
      toast.error("There is nothing to export yet");
      return;
    }
    downloadCsv(`bizflow-expenses-${today()}`, filtered, [
      { header: "Date", value: (row) => row.date ?? "" },
      { header: "Description", value: (row) => row.description },
      { header: "Category", value: (row) => row.category_name ?? "" },
      { header: "Vendor", value: (row) => row.vendor ?? "" },
      { header: "Reference", value: (row) => row.reference ?? "" },
      { header: "Amount (KES)", value: (row) => toNumber(row.amount) },
      { header: "Receipt attached", value: (row) => (row.is_receipt_attached ? "Yes" : "No") },
      { header: "Notes", value: (row) => row.notes ?? "" },
    ]);
  };

  const clearFilters = () => {
    setSearch("");
    setCategory(ALL_CATEGORIES);
    setFrom("");
    setTo("");
  };

  const filtersActive = Boolean(search) || category !== ALL_CATEGORIES || Boolean(from) || Boolean(to);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Expenses"
        description="Every cost you record also posts to your cash-flow ledger, so reports stay in step."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
              <Download className="h-4 w-4" aria-hidden />
              Export
            </Button>
            <Button size="sm" onClick={() => openDialog(null)}>
              <Plus className="h-4 w-4" aria-hidden />
              Record expense
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Total spend" value={formatCurrency(stats.total)} icon={Wallet} tone="danger" />
        <StatCard label="This month" value={formatCurrency(stats.thisMonth)} icon={TrendingDown} tone="primary" />
        <StatCard
          label="Average expense"
          value={formatCurrency(stats.average)}
          icon={Receipt}
          tone="info"
        />
        <StatCard
          label="Entries"
          value={String(stats.entries)}
          icon={FileText}
          tone="neutral"
          hint={`${categories.length} ${categories.length === 1 ? "category" : "categories"}`}
        />
      </div>

      {error ? (
        <ErrorState title="Could not load expenses" onRetry={load} retrying={loading} />
      ) : (
        <>
          <Panel>
            <PanelHeader>
              <PanelTitle>Filters</PanelTitle>
              {filtersActive ? (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : null}
            </PanelHeader>
            <PanelBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FormField label="Search" htmlFor="expense-search">
                <Input
                  id="expense-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Description, vendor or reference"
                  className="h-9"
                />
              </FormField>
              <FormField label="Category" htmlFor="expense-category">
                <Select
                  value={category}
                  onValueChange={setCategory}
                >
                  <SelectTrigger id="expense-category" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
                    <SelectItem value={UNCATEGORISED}>Uncategorised</SelectItem>
                    {categories.map((entry) => (
                      <SelectItem key={entry.id} value={entry.id}>
                        {entry.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="From" htmlFor="expense-from">
                <Input
                  id="expense-from"
                  type="date"
                  value={from}
                  max={to || undefined}
                  onChange={(event) => setFrom(event.target.value)}
                  className="h-9"
                />
              </FormField>
              <FormField label="To" htmlFor="expense-to">
                <Input
                  id="expense-to"
                  type="date"
                  value={to}
                  min={from || undefined}
                  onChange={(event) => setTo(event.target.value)}
                  className="h-9"
                />
              </FormField>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle>
                {filtered.length} {filtered.length === 1 ? "expense" : "expenses"}
              </PanelTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/expenses/categories")}>
                <Tags className="h-3.5 w-3.5" aria-hidden />
                Manage categories
              </Button>
            </PanelHeader>
            <PanelBody className="p-0">
              {loading ? (
                <div className="flex justify-center py-16">
                  <Spinner label="Loading expenses" />
                </div>
              ) : rows.length === 0 ? (
                <EmptyState
                  icon={filtersActive ? Layers : Wallet}
                  title={filtersActive ? "No expenses match these filters" : "No expenses recorded yet"}
                  description={
                    filtersActive
                      ? "Try widening the date range or clearing the filters."
                      : "Record your first cost and it will appear here and in your cash-flow reports."
                  }
                  className="m-4 border-0 bg-transparent"
                  action={
                    filtersActive ? (
                      <Button size="sm" variant="outline" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => openDialog(null)}>
                        <Plus className="h-4 w-4" aria-hidden />
                        Record expense
                      </Button>
                    )
                  }
                />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                        <tr className="border-b border-border">
                          <th scope="col" className="px-4 py-2 text-left font-medium">Date</th>
                          <th scope="col" className="px-2 py-2 text-left font-medium">Description</th>
                          <th scope="col" className="px-2 py-2 text-left font-medium">Category</th>
                          <th scope="col" className="hidden px-2 py-2 text-left font-medium md:table-cell">Vendor</th>
                          <th scope="col" className="px-2 py-2 text-right font-medium">Amount</th>
                          <th scope="col" className="px-4 py-2 text-right font-medium">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {rows.map((expense) => (
                          <tr key={expense.id}>
                            <td className="whitespace-nowrap px-4 py-2 text-muted-foreground">
                              {formatDate(expense.date)}
                            </td>
                            <td className="px-2 py-2">
                              <span className="font-medium text-foreground">{expense.description}</span>
                              {expense.notes ? (
                                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                  {expense.notes}
                                </span>
                              ) : null}
                            </td>
                            <td className="px-2 py-2 text-muted-foreground">
                              {expense.category_name || "Uncategorised"}
                            </td>
                            <td className="hidden px-2 py-2 text-muted-foreground md:table-cell">
                              <span className="flex items-center gap-1.5">
                                {expense.vendor || "—"}
                                {expense.is_receipt_attached ? (
                                  <span
                                    className="inline-flex items-center gap-0.5 rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success"
                                    title="Receipt attached"
                                  >
                                    <Receipt className="h-2.5 w-2.5" aria-hidden />
                                    Receipt
                                  </span>
                                ) : null}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-right font-medium tabular-nums text-foreground">
                              {formatCurrency(expense.amount)}
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="sm" onClick={() => openDialog(expense)}>
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Delete ${expense.description}`}
                                  disabled={busyId === expense.id}
                                  onClick={() => remove(expense)}
                                  className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    page={safePage}
                    pageCount={pageCount}
                    onPageChange={setPage}
                    total={filtered.length}
                    pageSize={PAGE_SIZE}
                  />
                </>
              )}
            </PanelBody>
          </Panel>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit expense" : "Record expense"}</DialogTitle>
            <DialogDescription>
              Amounts post to your cash-flow ledger as an outflow.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <FormField label="Description" htmlFor="expense-description" required>
              <Input
                id="expense-description"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="e.g. Generator diesel"
              />
            </FormField>

            <FormGrid>
              <FormField label="Amount (KES)" htmlFor="expense-amount" required>
                <Input
                  id="expense-amount"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) => setForm({ ...form, amount: event.target.value })}
                  placeholder="0"
                />
              </FormField>
              <FormField label="Date" htmlFor="expense-date">
                <Input
                  id="expense-date"
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm({ ...form, date: event.target.value })}
                />
              </FormField>
            </FormGrid>

            <FormField label="Category" htmlFor="expense-form-category">
              <Select
                value={form.category_id || "__none__"}
                onValueChange={(value) =>
                  setForm({ ...form, category_id: value === "__none__" ? "" : value })
                }
              >
                <SelectTrigger id="expense-form-category">
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Uncategorised</SelectItem>
                  {categories.map((entry) => (
                    <SelectItem key={entry.id} value={entry.id}>
                      {entry.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormGrid>
              <FormField label="Vendor" htmlFor="expense-vendor">
                <Input
                  id="expense-vendor"
                  value={form.vendor}
                  onChange={(event) => setForm({ ...form, vendor: event.target.value })}
                  placeholder="Who was paid"
                />
              </FormField>
              <FormField label="Reference" htmlFor="expense-reference">
                <Input
                  id="expense-reference"
                  value={form.reference}
                  onChange={(event) => setForm({ ...form, reference: event.target.value })}
                  placeholder="Receipt or M-Pesa code"
                />
              </FormField>
            </FormGrid>

            <FormField label="Notes" htmlFor="expense-notes">
              <Textarea
                id="expense-notes"
                rows={2}
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                placeholder="Optional"
              />
            </FormField>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.is_receipt_attached}
                onChange={(event) =>
                  setForm({ ...form, is_receipt_attached: event.target.checked })
                }
                className="h-4 w-4 rounded border-input"
              />
              A receipt is attached
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Record expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
