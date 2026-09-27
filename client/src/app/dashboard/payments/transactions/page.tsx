"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  CalendarRange,
  Download,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import api from "@/lib/api";
import { downloadCsv } from "@/lib/csv";
import { formatCurrency, formatDate, formatNumber, toDateKey, toNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Spinner } from "@/components/ui/spinner";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 15;

interface Transaction {
  id: string;
  entry_type?: string | null;
  amount?: number | string | null;
  date?: string | null;
  description?: string | null;
  category?: string | null;
  reference?: string | null;
  payment_method?: string | null;
  notes?: string | null;
}

interface TransactionsResponse {
  transactions?: Transaction[];
  total_inflow?: number;
  total_outflow?: number;
  net?: number;
}

function isoDay(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return toDateKey(date);
}

export default function MpesaTransactionsPage() {
  const toast = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totals, setTotals] = useState({ inflow: 0, outflow: 0, net: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [type, setType] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fromDate, setFromDate] = useState(isoDay(-30));
  const [toDate, setToDate] = useState(isoDay(0));
  const [page, setPage] = useState(1);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(id);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = (await api.payments.mpesa.getTransactions({
        status: type === "all" ? undefined : type,
        search: debouncedSearch || undefined,
        start_date: fromDate || undefined,
        end_date: toDate || undefined,
      })) as TransactionsResponse;
      setTransactions(result?.transactions ?? []);
      setTotals({
        inflow: toNumber(result?.total_inflow) ?? 0,
        outflow: toNumber(result?.total_outflow) ?? 0,
        net: toNumber(result?.net) ?? 0,
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [type, debouncedSearch, fromDate, toDate]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => setPage(1), [type, debouncedSearch, fromDate, toDate]);

  const averageEntry = useMemo(() => {
    if (transactions.length === 0) return 0;
    return Math.abs(totals.net) / transactions.length;
  }, [transactions.length, totals.net]);

  const pageCount = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = transactions.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const filtersActive =
    type !== "all" || debouncedSearch !== "" || fromDate !== isoDay(-30) || toDate !== isoDay(0);

  const resetFilters = () => {
    setType("all");
    setSearch("");
    setDebouncedSearch("");
    setFromDate(isoDay(-30));
    setToDate(isoDay(0));
  };

  const exportCsv = () => {
    if (transactions.length === 0) {
      toast.error("There is nothing to export yet");
      return;
    }
    downloadCsv(
      `bizflow-mpesa-transactions-${new Date().toISOString().slice(0, 10)}`,
      transactions,
      [
        { header: "Date", value: (row) => row.date ?? "" },
        { header: "Description", value: (row) => row.description ?? "" },
        { header: "Type", value: (row) => row.entry_type ?? "" },
        { header: "Amount (KES)", value: (row) => toNumber(row.amount) },
        { header: "Category", value: (row) => row.category ?? "" },
        { header: "Reference", value: (row) => row.reference ?? "" },
        { header: "Notes", value: (row) => row.notes ?? "" },
      ]
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="M-Pesa transactions"
        description="Every mobile money movement recorded against your business."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={transactions.length === 0}>
              <Download className="h-4 w-4" aria-hidden />
              Export
            </Button>
          </>
        }
      />

      {error ? (
        <ErrorState title="Could not load transactions" onRetry={load} retrying={loading} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <StatCard label="Inflow" value={formatCurrency(totals.inflow)} icon={TrendingUp} tone="success" />
            <StatCard label="Outflow" value={formatCurrency(totals.outflow)} icon={TrendingDown} tone="danger" />
            <StatCard
              label="Net"
              value={formatCurrency(totals.net)}
              icon={Wallet}
              tone={totals.net >= 0 ? "primary" : "danger"}
            />
            <StatCard
              label="Entries"
              value={formatNumber(transactions.length)}
              icon={ArrowRightLeft}
              tone="info"
            />
          </div>

          <Panel>
            <PanelHeader>
              <PanelTitle>
                <span className="inline-flex items-center gap-1.5">
                  <Filter className="h-4 w-4" aria-hidden />
                  Filters
                </span>
              </PanelTitle>
              {filtersActive ? (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <X className="h-3.5 w-3.5" aria-hidden />
                  Clear
                </Button>
              ) : null}
            </PanelHeader>
            <PanelBody>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label
                    htmlFor="tx-type"
                    className="mb-1 block text-xs font-medium text-muted-foreground"
                  >
                    Type
                  </label>
                  <select
                    id="tx-type"
                    value={type}
                    onChange={(event) => setType(event.target.value)}
                    className="h-9 w-full rounded-md border border-border bg-background px-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="all">All types</option>
                    <option value="inflow">Inflow</option>
                    <option value="outflow">Outflow</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="tx-from"
                    className="mb-1 block text-xs font-medium text-muted-foreground"
                  >
                    From
                  </label>
                  <Input
                    id="tx-from"
                    type="date"
                    value={fromDate}
                    onChange={(event) => setFromDate(event.target.value)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="tx-to"
                    className="mb-1 block text-xs font-medium text-muted-foreground"
                  >
                    To
                  </label>
                  <Input
                    id="tx-to"
                    type="date"
                    value={toDate}
                    onChange={(event) => setToDate(event.target.value)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="tx-search"
                    className="mb-1 block text-xs font-medium text-muted-foreground"
                  >
                    Search
                  </label>
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      id="tx-search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Description, reference…"
                      className="pl-8"
                    />
                    {search && search !== debouncedSearch ? (
                      <Loader2
                        className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground"
                        aria-hidden
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle>Ledger</PanelTitle>
              <p className="text-xs text-muted-foreground">
                {transactions.length === 0
                  ? "No entries in range"
                  : `${formatNumber(transactions.length)} entries · ${formatCurrency(averageEntry)} average`}
              </p>
            </PanelHeader>
            <PanelBody className="p-0">
              {loading ? (
                <div className="flex justify-center py-16">
                  <Spinner label="Loading transactions" />
                </div>
              ) : rows.length === 0 ? (
                <EmptyState
                  icon={CalendarRange}
                  title="No transactions in this range"
                  description="Widen the dates or clear the filters. M-Pesa settlements appear here once money is recorded against your business."
                  className="m-4 border-0 bg-transparent"
                  action={
                    filtersActive ? (
                      <Button variant="outline" size="sm" onClick={resetFilters}>
                        Clear filters
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[840px] text-sm">
                      <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                        <tr className="border-b border-border">
                          <th scope="col" className="px-4 py-2 text-left font-medium">Date</th>
                          <th scope="col" className="px-2 py-2 text-left font-medium">Description</th>
                          <th scope="col" className="px-2 py-2 text-left font-medium">Type</th>
                          <th scope="col" className="px-2 py-2 text-right font-medium">Amount</th>
                          <th scope="col" className="hidden px-2 py-2 text-left font-medium md:table-cell">Category</th>
                          <th scope="col" className="hidden px-2 py-2 text-left font-medium lg:table-cell">Reference</th>
                          <th scope="col" className="hidden px-4 py-2 text-left font-medium xl:table-cell">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {rows.map((tx) => {
                          const inflow = tx.entry_type === "inflow";
                          return (
                            <tr key={tx.id} className="hover:bg-muted/40">
                              <td className="whitespace-nowrap px-4 py-2 text-muted-foreground">
                                {formatDate(tx.date)}
                              </td>
                              <td className="px-2 py-2 font-medium text-foreground">
                                {tx.description || "—"}
                              </td>
                              <td className="px-2 py-2">
                                <StatusBadge tone={inflow ? "success" : "danger"} dot>
                                  {inflow ? "Inflow" : "Outflow"}
                                </StatusBadge>
                              </td>
                              <td
                                className={cn(
                                  "whitespace-nowrap px-2 py-2 text-right font-medium tabular-nums",
                                  inflow ? "text-success" : "text-destructive"
                                )}
                              >
                                {inflow ? "+" : "−"}
                                {formatCurrency(Math.abs(toNumber(tx.amount) ?? 0))}
                              </td>
                              <td className="hidden px-2 py-2 text-muted-foreground md:table-cell">
                                {tx.category || "—"}
                              </td>
                              <td className="hidden px-2 py-2 font-mono text-xs text-muted-foreground lg:table-cell">
                                {tx.reference || "—"}
                              </td>
                              <td className="hidden max-w-[240px] truncate px-4 py-2 text-muted-foreground xl:table-cell">
                                {tx.notes || "—"}
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
                    total={transactions.length}
                    pageSize={PAGE_SIZE}
                  />
                </>
              )}
            </PanelBody>
          </Panel>
        </>
      )}
    </div>
  );
}
