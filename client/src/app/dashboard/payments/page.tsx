"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRightLeft,
  BadgeCheck,
  BarChart3,
  Clock,
  Download,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Smartphone,
  Trash2,
  TrendingDown,
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
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const TX_PAGE_SIZE = 10;
const INVOICE_PAGE_SIZE = 10;
const VAT_RATE = 0.16;
const NO_CUSTOMER = "__none__";

interface MpesaTransaction {
  id: string;
  entry_type?: "inflow" | "outflow" | string;
  amount?: number | string;
  date?: string | null;
  description?: string | null;
  category?: string | null;
  reference?: string | null;
  payment_method?: string | null;
}

interface TransactionsResponse {
  transactions?: MpesaTransaction[];
  total_inflow?: number;
  total_outflow?: number;
  net?: number;
}

interface InvoiceRow {
  id: string;
  invoice_number?: string | null;
  customer_id?: string | null;
  customer_name?: string | null;
  invoice_date?: string | null;
  due_date?: string | null;
  total?: number | string | null;
  status?: string | null;
  notes?: string | null;
}

interface CustomerOption {
  id: string;
  name: string;
}

interface ProductOption {
  id: string;
  name: string;
  selling_price?: number | string | null;
}

interface DraftLine {
  key: string;
  product_id: string;
  product_name: string;
  qty: string;
  unit_price: string;
}

function newLine(): DraftLine {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    product_id: "",
    product_name: "",
    qty: "1",
    unit_price: "",
  };
}

function invoiceBalance(invoice: InvoiceRow): number {
  return toNumber(invoice.total) ?? 0;
}

export default function PaymentsPage() {
  const toast = useToast();
  const [transactions, setTransactions] = useState<MpesaTransaction[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [txType, setTxType] = useState("all");
  const [txPage, setTxPage] = useState(1);
  const [invoiceStatus, setInvoiceStatus] = useState("all");
  const [invoicePage, setInvoicePage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customerId, setCustomerId] = useState(NO_CUSTOMER);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([newLine()]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [txResult, invoiceList, customerList, productList] = await Promise.all([
        api.payments.mpesa.getTransactions() as Promise<TransactionsResponse | MpesaTransaction[]>,
        api.invoices.getAll().catch(() => [] as unknown),
        api.customers.getAll().catch(() => [] as unknown),
        api.products.getAll().catch(() => [] as unknown),
      ]);

      const txList = Array.isArray(txResult) ? txResult : (txResult?.transactions ?? []);
      setTransactions(txList);
      setInvoices(Array.isArray(invoiceList) ? (invoiceList as InvoiceRow[]) : []);
      setCustomers(
        Array.isArray(customerList)
          ? customerList
              .map((entry) => entry as CustomerOption)
              .filter((entry) => Boolean(entry?.id && entry?.name))
          : []
      );
      setProducts(
        Array.isArray(productList)
          ? productList
              .map((entry) => entry as ProductOption)
              .filter((entry) => Boolean(entry?.id))
          : []
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

  // The legacy page polled every 30s. Poll only while the tab is visible so a
  // backgrounded tab is not left hammering the API.
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible" && !loading) {
        setRefreshing(true);
        load().finally(() => setRefreshing(false));
      }
    };
    const id = window.setInterval(tick, 30000);
    return () => window.clearInterval(id);
  }, [load, loading]);

  const mpesaStats = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    transactions.forEach((tx) => {
      const amount = toNumber(tx.amount) ?? 0;
      if (tx.entry_type === "inflow") inflow += amount;
      else if (tx.entry_type === "outflow") outflow += amount;
    });
    return { inflow, outflow, net: inflow - outflow, count: transactions.length };
  }, [transactions]);

  const filteredTx = useMemo(
    () => (txType === "all" ? transactions : transactions.filter((tx) => tx.entry_type === txType)),
    [transactions, txType]
  );

  const filteredInvoices = useMemo(
    () =>
      invoiceStatus === "all"
        ? invoices
        : invoices.filter((invoice) => String(invoice.status ?? "draft") === invoiceStatus),
    [invoices, invoiceStatus]
  );

  const invoiceStats = useMemo(() => {
    let outstanding = 0;
    let overdue = 0;
    const today = toDateKey(new Date());
    invoices.forEach((invoice) => {
      const status = String(invoice.status ?? "draft").toLowerCase();
      if (status === "paid" || status === "cancelled") return;
      outstanding += invoiceBalance(invoice);
      if (invoice.due_date && toDateKey(invoice.due_date) < today) overdue += 1;
    });
    return { outstanding, overdue, total: invoices.length };
  }, [invoices]);

  const txPageCount = Math.max(1, Math.ceil(filteredTx.length / TX_PAGE_SIZE));
  const safeTxPage = Math.min(txPage, txPageCount);
  const txRows = filteredTx.slice((safeTxPage - 1) * TX_PAGE_SIZE, safeTxPage * TX_PAGE_SIZE);

  const invoicePageCount = Math.max(1, Math.ceil(filteredInvoices.length / INVOICE_PAGE_SIZE));
  const safeInvoicePage = Math.min(invoicePage, invoicePageCount);
  const invoiceRows = filteredInvoices.slice(
    (safeInvoicePage - 1) * INVOICE_PAGE_SIZE,
    safeInvoicePage * INVOICE_PAGE_SIZE
  );

  useEffect(() => setTxPage(1), [txType]);
  useEffect(() => setInvoicePage(1), [invoiceStatus]);

  const openDialog = () => {
    setCustomerId(NO_CUSTOMER);
    setDueDate("");
    setNotes("");
    setLines([newLine()]);
    setDialogOpen(true);
  };

  const updateLine = (key: string, patch: Partial<DraftLine>) => {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  };

  const pickProduct = (key: string, productId: string) => {
    const product = products.find((entry) => entry.id === productId);
    updateLine(key, {
      product_id: productId,
      product_name: product?.name ?? "",
      unit_price: String(toNumber(product?.selling_price) ?? 0),
    });
  };

  const draftTotals = useMemo(() => {
    const subtotal = lines.reduce((sum, line) => {
      const qty = toNumber(line.qty) ?? 0;
      const price = toNumber(line.unit_price) ?? 0;
      return sum + qty * price;
    }, 0);
    const tax = subtotal * VAT_RATE;
    return { subtotal, tax, total: subtotal + tax };
  }, [lines]);

  const saveInvoice = async () => {
    const items = lines
      .map((line) => ({
        product_id: line.product_id || undefined,
        product_name: line.product_name.trim() || "Item",
        qty: toNumber(line.qty) ?? 0,
        unit_price: toNumber(line.unit_price) ?? 0,
      }))
      .filter((line) => line.qty > 0);

    if (items.length === 0) {
      toast.error("Add at least one line with a quantity above zero");
      return;
    }
    if (items.some((line) => line.unit_price < 0)) {
      toast.error("Unit prices cannot be negative");
      return;
    }

    setSaving(true);
    try {
      await api.invoices.create({
        customer_id: customerId === NO_CUSTOMER ? null : customerId,
        items,
        due_date: dueDate || undefined,
        notes: notes.trim() || undefined,
      });
      toast.success("Invoice created");
      setDialogOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the invoice");
    } finally {
      setSaving(false);
    }
  };

  const markInvoicePaid = async (invoice: InvoiceRow) => {
    setBusyId(invoice.id);
    try {
      await api.invoices.update(invoice.id, { status: "paid" });
      toast.success(`${invoice.invoice_number || "Invoice"} marked as paid`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update the invoice");
    } finally {
      setBusyId(null);
    }
  };

  const removeInvoice = async (invoice: InvoiceRow) => {
    const label = invoice.invoice_number || "this invoice";
    if (!window.confirm(`Delete ${label}?`)) return;
    setBusyId(invoice.id);
    try {
      await api.invoices.delete(invoice.id);
      toast.success("Invoice deleted");
      load();
    } catch {
      toast.error("Could not delete the invoice");
    } finally {
      setBusyId(null);
    }
  };

  const exportTx = () => {
    if (filteredTx.length === 0) {
      toast.error("There is nothing to export yet");
      return;
    }
    downloadCsv(`bizflow-mpesa-${new Date().toISOString().slice(0, 10)}`, filteredTx, [
      { header: "Date", value: (row) => row.date ?? "" },
      { header: "Description", value: (row) => row.description ?? "" },
      { header: "Type", value: (row) => row.entry_type ?? "" },
      { header: "Amount (KES)", value: (row) => toNumber(row.amount) },
      { header: "Category", value: (row) => row.category ?? "" },
      { header: "Reference", value: (row) => row.reference ?? "" },
    ]);
  };

  const exportInvoices = () => {
    if (filteredInvoices.length === 0) {
      toast.error("There is nothing to export yet");
      return;
    }
    downloadCsv(`bizflow-invoices-${new Date().toISOString().slice(0, 10)}`, filteredInvoices, [
      { header: "Invoice", value: (row) => row.invoice_number ?? "" },
      { header: "Customer", value: (row) => row.customer_name ?? "" },
      { header: "Date", value: (row) => row.invoice_date ?? "" },
      { header: "Due", value: (row) => row.due_date ?? "" },
      { header: "Total (KES)", value: (row) => toNumber(row.total) },
      { header: "Status", value: (row) => row.status ?? "" },
    ]);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Payments"
        description="Money in and out — mobile money settlements and the invoices you have raised."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={load} disabled={loading || refreshing}>
              <RefreshCw className={cn("h-4 w-4", (loading || refreshing) && "animate-spin")} aria-hidden />
              Refresh
            </Button>
            <Button size="sm" onClick={openDialog}>
              <Plus className="h-4 w-4" aria-hidden />
              New invoice
            </Button>
          </>
        }
      />

      {error ? (
        <ErrorState title="Could not load payments" onRetry={load} retrying={loading} />
      ) : (
        <Tabs defaultValue="mpesa">
          <TabsList>
            <TabsTrigger value="mpesa">M-Pesa ({formatNumber(mpesaStats.count)})</TabsTrigger>
            <TabsTrigger value="invoices">Invoices ({formatNumber(invoiceStats.total)})</TabsTrigger>
          </TabsList>

          <TabsContent value="mpesa">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                <StatCard
                  label="Inflow"
                  value={formatCurrency(mpesaStats.inflow)}
                  icon={TrendingUp}
                  tone="success"
                />
                <StatCard
                  label="Outflow"
                  value={formatCurrency(mpesaStats.outflow)}
                  icon={TrendingDown}
                  tone="danger"
                />
                <StatCard
                  label="Net"
                  value={formatCurrency(mpesaStats.net)}
                  icon={Wallet}
                  tone={mpesaStats.net >= 0 ? "primary" : "danger"}
                />
                <StatCard
                  label="Transactions"
                  value={formatNumber(mpesaStats.count)}
                  icon={ArrowRightLeft}
                  tone="info"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/payments/agents">
                    <Smartphone className="h-3.5 w-3.5" aria-hidden />
                    Agents
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/payments/transactions">
                    <ArrowRightLeft className="h-3.5 w-3.5" aria-hidden />
                    All transactions
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/payments/reports">
                    <BarChart3 className="h-3.5 w-3.5" aria-hidden />
                    Reports
                  </Link>
                </Button>
                {refreshing ? (
                  <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                    Auto-refreshing
                  </span>
                ) : null}
              </div>

              <Panel>
                <PanelHeader>
                  <PanelTitle>Recent M-Pesa activity</PanelTitle>
                  <div className="flex items-center gap-2">
                    <Select value={txType} onValueChange={setTxType}>
                      <SelectTrigger aria-label="Filter transactions by type" className="h-8 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        <SelectItem value="inflow">Inflow</SelectItem>
                        <SelectItem value="outflow">Outflow</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={exportTx} disabled={filteredTx.length === 0}>
                      <Download className="h-3.5 w-3.5" aria-hidden />
                      Export
                    </Button>
                  </div>
                </PanelHeader>
                <PanelBody className="p-0">
                  {loading ? (
                    <div className="flex justify-center py-16">
                      <Spinner label="Loading M-Pesa activity" />
                    </div>
                  ) : txRows.length === 0 ? (
                    <EmptyState
                      icon={Smartphone}
                      title="No M-Pesa transactions yet"
                      description="Money recorded against your paybill, till or M-Pesa paybills will appear here."
                      className="m-4 border-0 bg-transparent"
                    />
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] text-sm">
                          <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                            <tr className="border-b border-border">
                              <th scope="col" className="px-4 py-2 text-left font-medium">Date</th>
                              <th scope="col" className="px-2 py-2 text-left font-medium">Description</th>
                              <th scope="col" className="px-2 py-2 text-left font-medium">Type</th>
                              <th scope="col" className="px-2 py-2 text-right font-medium">Amount</th>
                              <th scope="col" className="hidden px-2 py-2 text-left font-medium md:table-cell">Category</th>
                              <th scope="col" className="hidden px-4 py-2 text-left font-medium lg:table-cell">Reference</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {txRows.map((tx) => {
                              const inflow = tx.entry_type === "inflow";
                              return (
                                <tr key={tx.id}>
                                  <td className="whitespace-nowrap px-4 py-2 text-muted-foreground">
                                    {formatDate(tx.date)}
                                  </td>
                                  <td className="px-2 py-2 font-medium text-foreground">
                                    {tx.description || "—"}
                                  </td>
                                  <td className="px-2 py-2">
                                    <StatusBadge
                                      tone={inflow ? "success" : "danger"}
                                      dot
                                    >
                                      {inflow ? "Inflow" : "Outflow"}
                                    </StatusBadge>
                                  </td>
                                  <td
                                    className={cn(
                                      "whitespace-nowrap px-2 py-2 text-right font-medium tabular-nums",
                                      inflow ? "text-success" : "text-destructive"
                                    )}
                                  >
                                    {formatCurrency(tx.amount)}
                                  </td>
                                  <td className="hidden px-2 py-2 text-muted-foreground md:table-cell">
                                    {tx.category || "—"}
                                  </td>
                                  <td className="hidden px-4 py-2 font-mono text-xs text-muted-foreground lg:table-cell">
                                    {tx.reference || "—"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <Pagination
                        page={safeTxPage}
                        pageCount={txPageCount}
                        onPageChange={setTxPage}
                        total={filteredTx.length}
                        pageSize={TX_PAGE_SIZE}
                      />
                    </>
                  )}
                </PanelBody>
              </Panel>
            </div>
          </TabsContent>

          <TabsContent value="invoices">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                <StatCard label="Invoices" value={formatNumber(invoiceStats.total)} icon={FileText} tone="primary" />
                <StatCard
                  label="Outstanding"
                  value={formatCurrency(invoiceStats.outstanding)}
                  icon={Wallet}
                  tone={invoiceStats.outstanding > 0 ? "warning" : "neutral"}
                />
                <StatCard
                  label="Overdue"
                  value={formatNumber(invoiceStats.overdue)}
                  icon={Clock}
                  tone={invoiceStats.overdue > 0 ? "danger" : "neutral"}
                />
                <StatCard label="Settled" value={formatNumber(
                  invoices.filter((invoice) => String(invoice.status ?? "").toLowerCase() === "paid").length
                )} icon={BadgeCheck} tone="success" />
              </div>

              <Panel>
                <PanelHeader>
                  <PanelTitle>Invoices</PanelTitle>
                  <div className="flex items-center gap-2">
                    <Select value={invoiceStatus} onValueChange={setInvoiceStatus}>
                      <SelectTrigger aria-label="Filter invoices by status" className="h-8 w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportInvoices}
                      disabled={filteredInvoices.length === 0}
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden />
                      Export
                    </Button>
                  </div>
                </PanelHeader>
                <PanelBody className="p-0">
                  {loading ? (
                    <div className="flex justify-center py-16">
                      <Spinner label="Loading invoices" />
                    </div>
                  ) : invoiceRows.length === 0 ? (
                    <EmptyState
                      icon={FileText}
                      title="No invoices yet"
                      description="Raise an invoice to bill a customer and track what is still owed."
                      className="m-4 border-0 bg-transparent"
                      action={
                        <Button size="sm" onClick={openDialog}>
                          <Plus className="h-4 w-4" aria-hidden />
                          New invoice
                        </Button>
                      }
                    />
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] text-sm">
                          <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                            <tr className="border-b border-border">
                              <th scope="col" className="px-4 py-2 text-left font-medium">Invoice</th>
                              <th scope="col" className="px-2 py-2 text-left font-medium">Customer</th>
                              <th scope="col" className="px-2 py-2 text-left font-medium">Date</th>
                              <th scope="col" className="px-2 py-2 text-left font-medium">Due</th>
                              <th scope="col" className="px-2 py-2 text-right font-medium">Total</th>
                              <th scope="col" className="px-2 py-2 text-left font-medium">Status</th>
                              <th scope="col" className="px-4 py-2 text-right font-medium">
                                <span className="sr-only">Actions</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {invoiceRows.map((invoice) => {
                              const settled = String(invoice.status ?? "").toLowerCase() === "paid";
                              const voided = String(invoice.status ?? "").toLowerCase() === "cancelled";
                              return (
                                <tr key={invoice.id}>
                                  <td className="whitespace-nowrap px-4 py-2 font-mono text-xs font-medium text-foreground">
                                    {invoice.invoice_number || invoice.id.slice(0, 8).toUpperCase()}
                                  </td>
                                  <td className="px-2 py-2 text-foreground">
                                    {invoice.customer_name || "Walk-in"}
                                  </td>
                                  <td className="whitespace-nowrap px-2 py-2 text-muted-foreground">
                                    {formatDate(invoice.invoice_date)}
                                  </td>
                                  <td className="whitespace-nowrap px-2 py-2 text-muted-foreground">
                                    {invoice.due_date ? formatDate(invoice.due_date) : "—"}
                                  </td>
                                  <td className="whitespace-nowrap px-2 py-2 text-right font-medium tabular-nums text-foreground">
                                    {formatCurrency(invoice.total)}
                                  </td>
                                  <td className="px-2 py-2">
                                    <StatusBadge status={invoice.status} dot />
                                  </td>
                                  <td className="px-4 py-2">
                                    <div className="flex justify-end gap-1">
                                      {!settled && !voided ? (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          disabled={busyId === invoice.id}
                                          onClick={() => markInvoicePaid(invoice)}
                                        >
                                          <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                                          Mark paid
                                        </Button>
                                      ) : null}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`Delete ${invoice.invoice_number || "invoice"}`}
                                        disabled={busyId === invoice.id}
                                        onClick={() => removeInvoice(invoice)}
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
                        page={safeInvoicePage}
                        pageCount={invoicePageCount}
                        onPageChange={setInvoicePage}
                        total={filteredInvoices.length}
                        pageSize={INVOICE_PAGE_SIZE}
                      />
                    </>
                  )}
                </PanelBody>
              </Panel>
            </div>
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New invoice</DialogTitle>
            <DialogDescription>
              Invoices are raised as drafts with 16% VAT applied. Mark them paid once settled.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">Line items</p>
                <Button variant="ghost" size="sm" onClick={() => setLines((prev) => [...prev, newLine()])}>
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  Add line
                </Button>
              </div>

              {lines.length === 0 ? (
                <p className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  Add a line item to describe what you are billing for.
                </p>
              ) : null}

              <ul className="space-y-3">
                {lines.map((line, index) => (
                  <li key={line.key} className="rounded-md border border-border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Line {index + 1}
                      </span>
                      {lines.length > 1 ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove line ${index + 1}`}
                          onClick={() =>
                            setLines((prev) => prev.filter((entry) => entry.key !== line.key))
                          }
                          className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </Button>
                      ) : null}
                    </div>

                    <div className="space-y-3">
                      <FormField label="Product" htmlFor={`invoice-product-${line.key}`}>
                        <Select
                          value={line.product_id || "custom"}
                          onValueChange={(value) => pickProduct(line.key, value)}
                        >
                          <SelectTrigger id={`invoice-product-${line.key}`}>
                            <SelectValue placeholder="Choose a product" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="custom">Custom line</SelectItem>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormField>

                      {line.product_id ? null : (
                        <FormField
                          label="Description"
                          htmlFor={`invoice-name-${line.key}`}
                        >
                          <Input
                            id={`invoice-name-${line.key}`}
                            value={line.product_name}
                            onChange={(event) =>
                              updateLine(line.key, { product_name: event.target.value })
                            }
                            placeholder="What are you billing for"
                          />
                        </FormField>
                      )}

                      <FormGrid>
                        <FormField label="Quantity" htmlFor={`invoice-qty-${line.key}`}>
                          <Input
                            id={`invoice-qty-${line.key}`}
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="any"
                            value={line.qty}
                            onChange={(event) => updateLine(line.key, { qty: event.target.value })}
                          />
                        </FormField>
                        <FormField label="Unit price (KES)" htmlFor={`invoice-price-${line.key}`}>
                          <Input
                            id={`invoice-price-${line.key}`}
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            value={line.unit_price}
                            onChange={(event) =>
                              updateLine(line.key, { unit_price: event.target.value })
                            }
                          />
                        </FormField>
                      </FormGrid>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <dl className="space-y-1 rounded-md border border-border bg-muted/40 p-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums text-foreground">{formatCurrency(draftTotals.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">VAT (16%)</dt>
                <dd className="tabular-nums text-foreground">{formatCurrency(draftTotals.tax)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-1 font-medium">
                <dt className="text-foreground">Total</dt>
                <dd className="tabular-nums text-foreground">{formatCurrency(draftTotals.total)}</dd>
              </div>
            </dl>

            <FormGrid>
              <FormField label="Customer" htmlFor="invoice-customer">
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger id="invoice-customer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_CUSTOMER}>Walk-in / no customer</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Due date" htmlFor="invoice-due">
                <Input
                  id="invoice-due"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </FormField>
            </FormGrid>

            <FormField label="Notes" htmlFor="invoice-notes">
              <Textarea
                id="invoice-notes"
                rows={2}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional"
              />
            </FormField>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveInvoice} disabled={saving}>
              {saving ? "Creating…" : "Create invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
