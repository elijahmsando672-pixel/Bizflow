"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, FileText, RefreshCw, ScrollText } from "lucide-react";
import api from "@/lib/api";
import { formatCurrency, formatDate, toNumber } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Spinner } from "@/components/ui/spinner";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

interface InvoiceRow {
  id: string;
  invoice_number: string;
  status?: string | null;
  due_date?: string | null;
  total?: number | string;
  amount_paid?: number | string;
}

interface QuotationRow {
  id: string;
  quotation_number: string;
  customer_name?: string | null;
  status?: string | null;
  valid_until?: string | null;
  total?: number | string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function daysUntil(value: string | null | undefined, now: number): number | null {
  if (!value) return null;
  const target = new Date(value).getTime();
  if (Number.isNaN(target)) return null;
  return Math.round((target - now) / DAY_MS);
}

export default function ExpiringDocumentsPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [quotations, setQuotations] = useState<QuotationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [now, setNow] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [invoiceList, quotationList] = await Promise.all([
        api.invoices.getAll().catch(() => [] as InvoiceRow[]),
        api.quotations.getAll().catch(() => [] as QuotationRow[]),
      ]);
      setInvoices(Array.isArray(invoiceList) ? invoiceList : []);
      setQuotations(Array.isArray(quotationList) ? quotationList : []);
      setNow(Date.now());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { openInvoices, expiredQuotations, totals } = useMemo(() => {
    const open = invoices
      .filter((invoice) => invoice.status !== "paid" && invoice.status !== "cancelled")
      .map((invoice) => ({
        ...invoice,
        days: daysUntil(invoice.due_date, now),
        balance: Math.max(0, (toNumber(invoice.total) ?? 0) - (toNumber(invoice.amount_paid) ?? 0)),
      }))
      .filter((invoice) => invoice.days !== null)
      .sort((a, b) => (a.days ?? 0) - (b.days ?? 0));

    const expired = quotations
      .filter((quotation) => quotation.status === "pending" || quotation.status === "sent")
      .map((quotation) => ({
        ...quotation,
        days: daysUntil(quotation.valid_until, now),
      }))
      .filter((quotation) => quotation.days !== null)
      .sort((a, b) => (a.days ?? 0) - (b.days ?? 0));

    return {
      openInvoices: open,
      expiredQuotations: expired,
      totals: {
        due: open.filter((invoice) => (invoice.days ?? 0) <= 7).reduce((sum, i) => sum + i.balance, 0),
        outstanding: open.reduce((sum, i) => sum + i.balance, 0),
        expiring: expired.filter((q) => (q.days ?? 0) <= 7).length,
      },
    };
  }, [invoices, quotations, now]);

  const badge = (days: number | null) => {
    if (days === null) return <StatusBadge tone="neutral">No date</StatusBadge>;
    if (days < 0) return <StatusBadge tone="danger">{Math.abs(days)}d overdue</StatusBadge>;
    if (days === 0) return <StatusBadge tone="warning">Due today</StatusBadge>;
    if (days <= 7) return <StatusBadge tone="warning">In {days}d</StatusBadge>;
    return <StatusBadge tone="info">In {days}d</StatusBadge>;
  };

  const isEmpty = openInvoices.length === 0 && expiredQuotations.length === 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Expiring soon"
        description="Invoices approaching their due date and quotations approaching expiry."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
              Refresh
            </Button>
            <Button size="sm" asChild>
              <Link href="/documents">All documents</Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-2.5">
        <StatCard
          label="Due within 7 days"
          value={formatCurrency(totals.due)}
          icon={CalendarClock}
          tone={totals.due > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label="Total outstanding"
          value={formatCurrency(totals.outstanding)}
          icon={FileText}
          tone="info"
        />
        <StatCard
          label="Quotations expiring"
          value={String(totals.expiring)}
          icon={ScrollText}
          tone={totals.expiring > 0 ? "warning" : "neutral"}
        />
      </div>

      {loading ? (
        <Panel>
          <PanelBody>
            <div className="flex justify-center py-16">
              <Spinner label="Loading expiring documents" />
            </div>
          </PanelBody>
        </Panel>
      ) : error ? (
        <ErrorState title="Could not load expiring documents" onRetry={load} />
      ) : isEmpty ? (
        <Panel>
          <PanelBody>
            <EmptyState
              icon={CalendarClock}
              title="Nothing expiring"
              description="No unpaid invoices or open quotations are approaching their dates."
              className="border-0 bg-transparent"
              action={
                <Button size="sm" asChild>
                  <Link href="/documents">Go to documents</Link>
                </Button>
              }
            />
          </PanelBody>
        </Panel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {openInvoices.length > 0 ? (
            <Panel>
              <PanelHeader>
                <PanelTitle>Invoice due dates</PanelTitle>
              </PanelHeader>
              <PanelBody className="p-0">
                <ul className="divide-y divide-border">
                  {openInvoices.map((invoice) => (
                    <li
                      key={invoice.id}
                      className="flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {invoice.invoice_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Due {formatDate(invoice.due_date)} · {formatCurrency(invoice.balance)} outstanding
                        </p>
                      </div>
                      {badge(invoice.days)}
                    </li>
                  ))}
                </ul>
              </PanelBody>
            </Panel>
          ) : null}

          {expiredQuotations.length > 0 ? (
            <Panel>
              <PanelHeader>
                <PanelTitle>Quotation validity</PanelTitle>
              </PanelHeader>
              <PanelBody className="p-0">
                <ul className="divide-y divide-border">
                  {expiredQuotations.map((quotation) => (
                    <li
                      key={quotation.id}
                      className="flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {quotation.quotation_number}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {quotation.customer_name || "No customer"} · {formatCurrency(quotation.total)}
                        </p>
                      </div>
                      {badge(quotation.days)}
                    </li>
                  ))}
                </ul>
              </PanelBody>
            </Panel>
          ) : null}
        </div>
      )}
    </div>
  );
}
