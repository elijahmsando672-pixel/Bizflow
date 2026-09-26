"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ReceiptText, RefreshCw, Search } from "lucide-react";
import api from "@/lib/api";
import { formatCurrency, formatDate, toNumber } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Spinner } from "@/components/ui/spinner";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface Debtor {
  id: string;
  name: string;
}

interface CreditInvoice {
  id: string;
  debtor_id: string;
  reference: string;
  amount: number | string;
  date?: string | null;
  due_date?: string | null;
  is_paid?: boolean;
  notes?: string | null;
}

interface InvoiceRow extends CreditInvoice {
  debtorName: string;
}

export default function CreditTransactionsPage() {
  const toast = useToast();
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unpaid" | "overdue">("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const debtors = (await api.debtors.getAll()) as Debtor[];
      const list = Array.isArray(debtors) ? debtors : [];
      const invoices = await Promise.all(
        list.map(async (debtor) => {
          try {
            const result = (await api.debtors.getInvoices(debtor.id)) as CreditInvoice[];
            return (Array.isArray(result) ? result : []).map((invoice) => ({
              ...invoice,
              debtorName: debtor.name,
            }));
          } catch {
            return [] as InvoiceRow[];
          }
        })
      );
      setRows(
        invoices
          .flat()
          .sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")))
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

  const isOverdue = (invoice: CreditInvoice) =>
    !invoice.is_paid && Boolean(invoice.due_date) && new Date(String(invoice.due_date)) < new Date();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((invoice) => {
      if (filter === "unpaid" && invoice.is_paid) return false;
      if (filter === "overdue" && !isOverdue(invoice)) return false;
      if (!q) return true;
      return (
        invoice.reference.toLowerCase().includes(q) || invoice.debtorName.toLowerCase().includes(q)
      );
    });
  }, [rows, query, filter]);

  const totals = useMemo(() => {
    const outstanding = rows
      .filter((invoice) => !invoice.is_paid)
      .reduce((sum, invoice) => sum + (toNumber(invoice.amount) ?? 0), 0);
    const overdue = rows.filter(isOverdue).length;
    return { outstanding, overdue, count: rows.length };
  }, [rows]);

  const markPaid = async (invoice: InvoiceRow) => {
    setBusyId(invoice.id);
    try {
      await api.debtors.markInvoicePaid(invoice.id);
      toast.success(`${invoice.reference} marked as paid`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update the invoice");
    } finally {
      setBusyId(null);
    }
  };

  const recordPayment = async (invoice: InvoiceRow) => {
    setBusyId(invoice.id);
    try {
      await api.debtors.recordPayment(invoice.debtor_id, {
        amount: toNumber(invoice.amount) ?? 0,
        date: new Date().toISOString().slice(0, 10),
        reference: invoice.reference,
      });
      toast.success(`Payment recorded for ${invoice.reference}`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not record the payment");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Credit transactions"
        description="Every credit invoice raised for your debtor accounts."
        actions={
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-2.5">
        <StatCard label="Invoices" value={String(totals.count)} icon={ReceiptText} />
        <StatCard label="Outstanding" value={formatCurrency(totals.outstanding)} icon={CheckCircle2} tone="warning" />
        <StatCard
          label="Overdue"
          value={String(totals.overdue)}
          icon={ReceiptText}
          tone={totals.overdue > 0 ? "danger" : "neutral"}
        />
      </div>

      <Panel>
        <PanelHeader className="gap-2">
          <div className="relative w-full max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search reference or debtor…"
              aria-label="Search credit invoices"
              className="h-9 pl-9"
            />
          </div>
          <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
            {(["all", "unpaid", "overdue"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                aria-pressed={filter === option}
                className={cn(
                  "rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                  filter === option
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </PanelHeader>

        <PanelBody className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner label="Loading credit transactions" />
            </div>
          ) : error ? (
            <ErrorState title="Could not load credit transactions" onRetry={load} className="m-4" />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={ReceiptText}
              title={rows.length === 0 ? "No credit invoices yet" : "No invoices match this filter"}
              description={
                rows.length === 0
                  ? "Raise a credit invoice from a debtor account to see it here."
                  : undefined
              }
              className="m-4 border-0 bg-transparent"
            />
          ) : (
            <ul className="divide-y divide-border">
              {visible.map((invoice) => {
                const overdue = isOverdue(invoice);
                return (
                  <li
                    key={invoice.id}
                    className="flex flex-col gap-2 px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">
                          {invoice.reference}
                        </p>
                        {invoice.is_paid ? (
                          <StatusBadge tone="success" dot>
                            Paid
                          </StatusBadge>
                        ) : overdue ? (
                          <StatusBadge tone="danger" dot>
                            Overdue
                          </StatusBadge>
                        ) : (
                          <StatusBadge tone="warning" dot>
                            Unpaid
                          </StatusBadge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {invoice.debtorName} · raised {formatDate(invoice.date)}
                        {invoice.due_date ? ` · due ${formatDate(invoice.due_date)}` : ""}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {formatCurrency(invoice.amount)}
                      </span>
                      {!invoice.is_paid ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => recordPayment(invoice)}
                            disabled={busyId === invoice.id}
                          >
                            {busyId === invoice.id ? "Saving…" : "Record payment"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markPaid(invoice)}
                            disabled={busyId === invoice.id}
                          >
                            Mark paid
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </PanelBody>
      </Panel>
    </div>
  );
}
