"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/data";
import {
  PageHeader, StatCard, Card, SearchBar, Select, Table, Btn, Badge, Modal, InputField
} from "@/components/ui/dashboard-ui";
import { Clock, CheckCircle, TrendingUp, TrendingDown, Plus, RefreshCw, Loader2, Smartphone, ArrowRightLeft, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [mpesaTx, setMpesaTx] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [tab, setTab] = useState<"invoices" | "mpesa">("invoices");
  const [invModal, setInvModal] = useState(false);
  const [invForm, setInvForm] = useState({ customer: "", total: "", due_date: "" });
  const router = useRouter();

  const handleCreateInvoice = async () => {
    try {
      await api.invoices.create({
        customer_id: "new",
        items: [{ product_name: "Invoice Item", qty: 1, unit_price: parseFloat(invForm.total) || 0 }],
        total: parseFloat(invForm.total) || 0,
        due_date: invForm.due_date || undefined,
      });
      setInvModal(false);
      setInvForm({ customer: "", total: "", due_date: "" });
      load();
    } catch { alert("Failed to create invoice"); }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [invoiceData, mpesaData] = await Promise.all([
        api.invoices.getAll().catch(() => []),
        api.payments.mpesa.getTransactions("?status=ALL").catch(() => ({ transactions: [] })),
      ]);
      setPayments(Array.isArray(invoiceData) ? invoiceData : []);
      setMpesaTx(Array.isArray(mpesaData) ? mpesaData : (mpesaData as any)?.transactions ?? []);
    } catch { setPayments([]); setMpesaTx([]); } finally { setLoading(false); }
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

  const mpesaTotalIn = mpesaTx.filter((t: any) => t.entry_type === "inflow").reduce((s: number, t: any) => s + (parseFloat(t.amount) || 0), 0);
  const mpesaTotalOut = mpesaTx.filter((t: any) => t.entry_type === "outflow").reduce((s: number, t: any) => s + (parseFloat(t.amount) || 0), 0);

  return (
    <div>
      <PageHeader title="Payments" subtitle="Invoices & M-Pesa transactions">
        <Btn color="var(--color-primary)" onClick={() => { setInvForm({ customer: "", total: "", due_date: "" }); setInvModal(true); }}>
          <Plus className="h-3.5 w-3.5" /> New Invoice
        </Btn>
        <Btn outline color="var(--color-muted-foreground)" onClick={load}><RefreshCw className="h-3 w-3" /> Refresh</Btn>
      </PageHeader>
      <div className="flex items-center gap-1.5 mb-4 text-xs">
        <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
        <span className="text-success">Auto-refreshing every 30s</span>
      </div>

      <div className="flex mb-6 bg-muted rounded-xl p-1">
        <button type="button" onClick={() => setTab("invoices")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tab === "invoices" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          <CheckCircle className="h-3.5 w-3.5 inline mr-1.5" />
          Invoices
        </button>
        <button type="button" onClick={() => setTab("mpesa")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tab === "mpesa" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          <Smartphone className="h-3.5 w-3.5 inline mr-1.5" />
          M-Pesa
        </button>
      </div>

      {tab === "invoices" && (
        <>
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
        </>
      )}

      {tab === "mpesa" && (
        <>
          <div className="flex flex-wrap gap-3 mb-4">
            <StatCard label="Total Inflow" value={formatCurrency(mpesaTotalIn)} icon={<TrendingUp className="h-4 w-4" />} accent="var(--color-success)" />
            <StatCard label="Total Outflow" value={formatCurrency(mpesaTotalOut)} icon={<TrendingDown className="h-4 w-4" />} accent="var(--color-destructive)" />
            <StatCard label="Net" value={formatCurrency(mpesaTotalIn - mpesaTotalOut)} icon={<BarChart3 className="h-4 w-4" />} accent="var(--color-primary)" />
            <StatCard label="Transactions" value={String(mpesaTx.length)} icon={<ArrowRightLeft className="h-4 w-4" />} accent="var(--color-warning)" />
          </div>
          <div className="flex gap-2 mb-4 flex-wrap">
            <Btn small outline color="var(--color-primary)" onClick={() => router.push("/dashboard/payments/agents")}>
              <Smartphone className="h-3 w-3" /> Agents
            </Btn>
            <Btn small outline color="var(--color-accent-foreground)" onClick={() => router.push("/dashboard/payments/transactions")}>
              <ArrowRightLeft className="h-3 w-3" /> All Transactions
            </Btn>
            <Btn small outline color="var(--color-warning)" onClick={() => router.push("/dashboard/payments/reports")}>
              <BarChart3 className="h-3 w-3" /> Reports
            </Btn>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : (
            <Table cols={["Date", "Description", "Type", "Amount", "Category", "Reference"]}
              rows={mpesaTx.slice(0, 20).map((t: any) => [
                <span key="d" className="text-muted-foreground text-xs">{t.date ? new Date(t.date).toLocaleDateString("en-GB") : "-"}</span>,
                <span key="desc" className="font-medium">{t.description || "N/A"}</span>,
                <Badge key="ty" label={t.entry_type === "inflow" ? "INFLOW" : "OUTFLOW"} color={t.entry_type === "inflow" ? "var(--color-success)" : "var(--color-destructive)"} />,
                <span key="am" className={`font-bold ${t.entry_type === "inflow" ? "text-success" : "text-destructive"}`}>{formatCurrency(parseFloat(t.amount) || 0)}</span>,
                <span key="cat" className="text-muted-foreground text-xs">{t.category || "-"}</span>,
                <span key="ref" className="text-muted-foreground text-xs font-mono">{t.reference?.slice?.(0, 10) || "-"}</span>,
              ])}
              empty="No M-Pesa transactions yet." />
          )}
        </>
      )}
      <Modal open={invModal} onClose={() => setInvModal(false)} title="New Invoice">
        <InputField label="Customer" value={invForm.customer} onChange={v => setInvForm({ ...invForm, customer: v })} placeholder="Customer name" />
        <InputField label="Total Amount (KES)" value={invForm.total} onChange={v => setInvForm({ ...invForm, total: v })} placeholder="0" type="number" />
        <InputField label="Due Date" value={invForm.due_date} onChange={v => setInvForm({ ...invForm, due_date: v })} type="date" />
        <Btn color="var(--color-primary)" onClick={handleCreateInvoice} className="w-full justify-center mt-2 py-[10px]">Create Invoice</Btn>
      </Modal>
    </div>
  );
}
