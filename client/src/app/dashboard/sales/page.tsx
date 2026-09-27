"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Ban,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Pencil,
  Receipt,
  RefreshCw,
  ShoppingCart,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import api from "@/lib/api";
import { downloadCsv } from "@/lib/csv";
import { formatCurrency, formatDate, formatNumber, toDateKey, toNumber } from "@/lib/format";
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
import { FormField } from "@/components/ui/form-field";
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
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const ALL_STATUS = "__all__";
const PAGE_SIZE = 12;

const STATUSES = ["draft", "pending", "paid", "completed", "cancelled"] as const;

const SETTLED = new Set(["paid", "completed"]);

interface SaleRow {
  id: string;
  invoice_number?: string | null;
  customer_id?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  sale_date?: string | null;
  due_date?: string | null;
  subtotal?: number | string | null;
  tax_amount?: number | string | null;
  discount_amount?: number | string | null;
  total?: number | string | null;
  amount_paid?: number | string | null;
  paid_date?: string | null;
  status?: string | null;
  notes?: string | null;
}

function balanceOf(sale: SaleRow): number {
  const total = toNumber(sale.total) ?? 0;
  const paid = toNumber(sale.amount_paid) ?? 0;
  return Math.max(0, total - paid);
}

function isOverdue(sale: SaleRow): boolean {
  if (!sale.due_date || SETTLED.has(String(sale.status ?? "").toLowerCase())) return false;
  return toDateKey(sale.due_date) < toDateKey(new Date());
}

export default function SalesPage() {
  const toast = useToast();
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL_STATUS);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SaleRow | null>(null);
  const [editStatus, setEditStatus] = useState<string>("pending");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await api.sales.getAll();
      const list = Array.isArray(data)
        ? (data as SaleRow[])
        : ((data as { sales?: SaleRow[] })?.sales ?? []);
      setSales(list);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    let revenue = 0;
    let collected = 0;
    let outstanding = 0;
    const today = toDateKey(new Date());
    let todayCount = 0;

    sales.forEach((sale) => {
      const total = toNumber(sale.total) ?? 0;
      revenue += total;
      collected += Math.min(total, toNumber(sale.amount_paid) ?? 0);
      outstanding += balanceOf(sale);
      if (toDateKey(sale.sale_date) === today) todayCount += 1;
    });

    return {
      revenue,
      collected,
      outstanding,
      average: sales.length ? revenue / sales.length : 0,
      todayCount,
    };
  }, [sales]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sales.filter((sale) => {
      if (query) {
        const haystack = [sale.invoice_number, sale.customer_name, sale.customer_email, sale.notes]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (status !== ALL_STATUS && String(sale.status ?? "") !== status) return false;
      if (from && (!sale.sale_date || String(sale.sale_date) < from)) return false;
      if (to && (!sale.sale_date || String(sale.sale_date) > to)) return false;
      return true;
    });
  }, [sales, search, status, from, to]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, status, from, to]);

  const openDialog = (sale: SaleRow) => {
    setEditing(sale);
    setEditStatus(String(sale.status ?? "pending"));
    setEditNotes(sale.notes ?? "");
    setDialogOpen(true);
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      // The API only applies status and notes on update; totals and line
      // items are immutable once a sale exists.
      await api.sales.update(editing.id, {
        status: editStatus,
        notes: editNotes.trim() || undefined,
      });
      toast.success("Sale updated");
      setDialogOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update the sale");
    } finally {
      setSaving(false);
    }
  };

  const setSaleStatus = async (sale: SaleRow, nextStatus: string) => {
    setBusyId(sale.id);
    try {
      await api.sales.update(sale.id, { status: nextStatus });
      toast.success(
        nextStatus === "paid" ? "Sale marked as paid" : `Sale ${nextStatus.replace(/_/g, " ")}`
      );
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update the sale");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (sale: SaleRow) => {
    const label = sale.invoice_number || "this sale";
    if (!window.confirm(`Delete ${label}? Stock and totals are adjusted by the server.`)) return;
    setBusyId(sale.id);
    try {
      await api.sales.delete(sale.id);
      toast.success("Sale deleted");
      load();
    } catch {
      toast.error("Could not delete the sale");
    } finally {
      setBusyId(null);
    }
  };

  const exportCsv = () => {
    if (filtered.length === 0) {
      toast.error("There is nothing to export yet");
      return;
    }
    downloadCsv(`bizflow-sales-${new Date().toISOString().slice(0, 10)}`, filtered, [
      { header: "Invoice", value: (row) => row.invoice_number ?? "" },
      { header: "Date", value: (row) => row.sale_date ?? "" },
      { header: "Due date", value: (row) => row.due_date ?? "" },
      { header: "Customer", value: (row) => row.customer_name ?? "" },
      { header: "Subtotal (KES)", value: (row) => toNumber(row.subtotal) },
      { header: "VAT (KES)", value: (row) => toNumber(row.tax_amount) },
      { header: "Discount (KES)", value: (row) => toNumber(row.discount_amount) },
      { header: "Total (KES)", value: (row) => toNumber(row.total) },
      { header: "Paid (KES)", value: (row) => toNumber(row.amount_paid) },
      { header: "Balance (KES)", value: (row) => balanceOf(row) },
      { header: "Status", value: (row) => row.status ?? "" },
    ]);
  };

  const clearFilters = () => {
    setSearch("");
    setStatus(ALL_STATUS);
    setFrom("");
    setTo("");
  };

  const filtersActive = Boolean(search) || status !== ALL_STATUS || Boolean(from) || Boolean(to);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Sales"
        description="Every sale your business has raised, with what has been collected and what is still owed."
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
            <Button size="sm" asChild>
              <Link href="/dashboard/sales/new">
                <ShoppingCart className="h-4 w-4" aria-hidden />
                New sale
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Total sales" value={formatNumber(sales.length)} icon={Receipt} tone="primary" />
        <StatCard label="Sales value" value={formatCurrency(stats.revenue)} icon={TrendingUp} tone="success" />
        <StatCard label="Collected" value={formatCurrency(stats.collected)} icon={BadgeCheck} tone="info" />
        <StatCard
          label="Outstanding"
          value={formatCurrency(stats.outstanding)}
          icon={Wallet}
          tone={stats.outstanding > 0 ? "warning" : "neutral"}
          hint={`Avg ${formatCurrency(stats.average)} · ${stats.todayCount} today`}
        />
      </div>

      {error ? (
        <ErrorState title="Could not load sales" onRetry={load} retrying={loading} />
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
              <FormField label="Search" htmlFor="sales-search">
                <Input
                  id="sales-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Invoice number or customer"
                  className="h-9"
                />
              </FormField>
              <FormField label="Status" htmlFor="sales-status">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="sales-status" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_STATUS}>All statuses</SelectItem>
                    {STATUSES.map((entry) => (
                      <SelectItem key={entry} value={entry}>
                        {entry.charAt(0).toUpperCase() + entry.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="From" htmlFor="sales-from">
                <Input
                  id="sales-from"
                  type="date"
                  value={from}
                  max={to || undefined}
                  onChange={(event) => setFrom(event.target.value)}
                  className="h-9"
                />
              </FormField>
              <FormField label="To" htmlFor="sales-to">
                <Input
                  id="sales-to"
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
                {filtered.length} {filtered.length === 1 ? "sale" : "sales"}
              </PanelTitle>
            </PanelHeader>
            <PanelBody className="p-0">
              {loading ? (
                <div className="flex justify-center py-16">
                  <Spinner label="Loading sales" />
                </div>
              ) : rows.length === 0 ? (
                <EmptyState
                  icon={filtersActive ? FileText : ShoppingCart}
                  title={filtersActive ? "No sales match these filters" : "No sales recorded yet"}
                  description={
                    filtersActive
                      ? "Try a different search term, status or date range."
                      : "Ring up a sale at the point of sale and it will show up here."
                  }
                  className="m-4 border-0 bg-transparent"
                  action={
                    filtersActive ? (
                      <Button size="sm" variant="outline" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    ) : (
                      <Button size="sm" asChild>
                        <Link href="/dashboard/sales/new">
                          <ShoppingCart className="h-4 w-4" aria-hidden />
                          Open point of sale
                        </Link>
                      </Button>
                    )
                  }
                />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] text-sm">
                      <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                        <tr className="border-b border-border">
                          <th scope="col" className="px-4 py-2 text-left font-medium">Invoice</th>
                          <th scope="col" className="px-2 py-2 text-left font-medium">Customer</th>
                          <th scope="col" className="px-2 py-2 text-left font-medium">Date</th>
                          <th scope="col" className="px-2 py-2 text-right font-medium">Total</th>
                          <th scope="col" className="px-2 py-2 text-right font-medium">Balance</th>
                          <th scope="col" className="px-2 py-2 text-left font-medium">Status</th>
                          <th scope="col" className="px-4 py-2 text-right font-medium">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {rows.map((sale) => {
                          const balance = balanceOf(sale);
                          const overdue = isOverdue(sale);
                          const settled = SETTLED.has(String(sale.status ?? "").toLowerCase());
                          return (
                            <tr key={sale.id}>
                              <td className="whitespace-nowrap px-4 py-2 font-mono text-xs font-medium text-foreground">
                                {sale.invoice_number || sale.id.slice(0, 8).toUpperCase()}
                              </td>
                              <td className="px-2 py-2">
                                <span className="font-medium text-foreground">
                                  {sale.customer_name || "Walk-in"}
                                </span>
                                {sale.customer_email ? (
                                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                    {sale.customer_email}
                                  </span>
                                ) : null}
                              </td>
                              <td className="whitespace-nowrap px-2 py-2 text-muted-foreground">
                                {formatDate(sale.sale_date)}
                                {overdue ? (
                                  <span className="mt-0.5 block text-xs font-medium text-destructive">
                                    Due {formatDate(sale.due_date)}
                                  </span>
                                ) : null}
                              </td>
                              <td className="whitespace-nowrap px-2 py-2 text-right font-medium tabular-nums text-foreground">
                                {formatCurrency(sale.total)}
                              </td>
                              <td
                                className={cn(
                                  "whitespace-nowrap px-2 py-2 text-right tabular-nums",
                                  balance > 0 ? "font-medium text-warning" : "text-muted-foreground"
                                )}
                              >
                                {balance > 0 ? formatCurrency(balance) : "—"}
                              </td>
                              <td className="px-2 py-2">
                                <StatusBadge status={sale.status} dot />
                              </td>
                              <td className="px-4 py-2">
                                <div className="flex justify-end gap-1">
                                  {!settled ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      disabled={busyId === sale.id}
                                      onClick={() => setSaleStatus(sale, "paid")}
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                                      Mark paid
                                    </Button>
                                  ) : null}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Edit ${sale.invoice_number || "sale"}`}
                                    onClick={() => openDialog(sale)}
                                    className="h-8 w-8"
                                  >
                                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Delete ${sale.invoice_number || "sale"}`}
                                    disabled={busyId === sale.id}
                                    onClick={() => remove(sale)}
                                    className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
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
            <DialogTitle>
              Update {editing?.invoice_number || "sale"}
            </DialogTitle>
            <DialogDescription>
              Line items, VAT and totals are fixed once a sale exists — only the status and notes can change.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {editing ? (
              <dl className="grid grid-cols-2 gap-3 rounded-md border border-border bg-muted/40 p-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Total</dt>
                  <dd className="font-medium tabular-nums text-foreground">
                    {formatCurrency(editing.total)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Balance</dt>
                  <dd className="font-medium tabular-nums text-foreground">
                    {formatCurrency(balanceOf(editing))}
                  </dd>
                </div>
              </dl>
            ) : null}

            <FormField label="Status" htmlFor="sale-status-input">
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger id="sale-status-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">
                    <span className="flex items-center gap-1.5">
                      <Pencil className="h-3 w-3" aria-hidden />
                      Draft
                    </span>
                  </SelectItem>
                  <SelectItem value="pending">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" aria-hidden />
                      Pending
                    </span>
                  </SelectItem>
                  <SelectItem value="paid">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3" aria-hidden />
                      Paid
                    </span>
                  </SelectItem>
                  <SelectItem value="completed">
                    <span className="flex items-center gap-1.5">
                      <BadgeCheck className="h-3 w-3" aria-hidden />
                      Completed
                    </span>
                  </SelectItem>
                  <SelectItem value="cancelled">
                    <span className="flex items-center gap-1.5">
                      <Ban className="h-3 w-3" aria-hidden />
                      Cancelled
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Notes" htmlFor="sale-notes">
              <Textarea
                id="sale-notes"
                rows={3}
                value={editNotes}
                onChange={(event) => setEditNotes(event.target.value)}
                placeholder="Optional notes visible on this sale"
              />
            </FormField>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
