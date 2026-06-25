"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/data";
import {
  PageHeader, StatCard, Card, SearchBar, Select, Table, Btn, Badge
} from "@/components/dashboard/ui";
import { Clock, CheckCircle, TrendingUp, RefreshCw, Loader2 } from "lucide-react";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.invoices.getAll() as any[];
      setPayments(Array.isArray(data) ? data : []);
    } catch { setPayments([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(load, 30000); return () => clearInterval(iv); }, [load]);

  const filtered = payments.filter((p: any) =>
    (p.customer || p.customer_name || "").toLowerCase().includes(search.toLowerCase()) &&
    (statusFilter === "ALL" || p.status === statusFilter)
  );
  const pending = filtered.filter((p: any) => p.status === "pending" || p.status === "draft");
  const completed = filtered.filter((p: any) => p.status === "paid" || p.status === "completed");
  const totalVal = filtered.reduce((s: number, p: any) => s + (parseFloat(p.total) || 0), 0);

  return (
    <div>
      <PageHeader title="Payments" subtitle="Track and confirm incoming payments">
        <Btn outline color="var(--color-muted-foreground)" onClick={load}><RefreshCw className="h-3 w-3" /> Refresh</Btn>
      </PageHeader>
      <div className="flex items-center gap-1.5 mb-4 text-xs">
        <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
        <span className="text-success">Auto-refreshing every 30s</span>
      </div>
      <div className="flex flex-wrap gap-3 mb-4">
        <Card className="flex-1 min-w-[200px]" accent="var(--color-warning)">
          <div className="flex gap-3 items-center">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg" style={{ background: "color-mix(in srgb, var(--color-warning) 15%, transparent)", border: "1px solid color-mix(in srgb, var(--color-warning) 20%, transparent)" }}>
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pending</div>
              <div className="text-[26px] font-extrabold text-warning">{pending.length}</div>
              <div className="text-[11px] text-muted-foreground">Awaiting confirmation</div>
            </div>
          </div>
        </Card>
        <StatCard label="Completed" value={String(completed.length)} sub="Confirmed payments" icon={<CheckCircle className="h-4 w-4" />} accent="var(--color-success)" />
        <StatCard label="Total Value" value={formatCurrency(totalVal)} sub="All invoices" icon={<TrendingUp className="h-4 w-4" />} accent="var(--color-primary)" />
      </div>
      <Card className="mb-3">
        <div className="flex gap-3 flex-wrap">
          <SearchBar placeholder="Search by customer..." value={search} onChange={setSearch} />
          <Select options={[{ label: "All Statuses", value: "ALL" }, "pending", "paid", "completed", "cancelled"]} value={statusFilter} onChange={setStatusFilter} />
        </div>
      </Card>
      {loading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <Table cols={["Invoice #", "Customer", "Amount", "Status", "Date"]}
          rows={filtered.map((p: any) => [
            <span key="id" className="font-bold font-mono" style={{ color: "var(--color-accent-foreground)" }}>#{p.id?.slice?.(0, 7) || "-"}</span>,
            p.customer || p.customer_name || "N/A",
            <span key="t" className="font-bold text-success">{formatCurrency(parseFloat(p.total) || 0)}</span>,
            <Badge key="st" label={(p.status || "draft").toUpperCase()} color={p.status === "paid" || p.status === "completed" ? "var(--color-success)" : p.status === "cancelled" ? "var(--color-destructive)" : "var(--color-warning)"} glow />,
            <span key="d" className="text-muted-foreground">{p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-GB") : "-"}</span>,
          ])}
          empty="No transactions found." />
      )}
    </div>
  );
}
