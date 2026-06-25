"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/data";
import {
  PageHeader, StatCard, Card, SearchBar, Select, Table, Btn, Badge, Modal, InputField
} from "@/components/dashboard/ui";
import { ShoppingCart, DollarSign, Clock, BarChart3, Plus, RefreshCw, Edit3, Trash2, User, Loader2 } from "lucide-react";

export default function SalesPage() {
  const [search, setSearch] = useState("");
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [form, setForm] = useState({ customer_name: "", total: "", status: "completed", sale_date: new Date().toISOString().split("T")[0] });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.sales.getAll(statusFilter !== "ALL" ? statusFilter : undefined) as any[];
      setSales(Array.isArray(data) ? data : []);
    } catch { setSales([]); } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    try {
      const payload = { ...form, total: parseFloat(form.total) || 0 };
      if (editItem) {
        await api.sales.update(editItem.id, payload);
      } else {
        await api.sales.create({ ...payload, items: [{ product_name: "Sale", qty: 1, unit_price: parseFloat(form.total) || 0 }] });
      }
      setModal(false); setEditItem(null);
      setForm({ customer_name: "", total: "", status: "completed", sale_date: new Date().toISOString().split("T")[0] });
      load();
    } catch { alert("Failed to save sale"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this sale?")) return;
    try { await api.sales.delete(id); load(); } catch { alert("Delete failed"); }
  };

  const filtered = sales.filter((s: any) =>
    (s.customer_name || s.customer || "").toLowerCase().includes(search.toLowerCase())
  );
  const totalRevenue = filtered.reduce((sum: number, s: any) => sum + (parseFloat(s.total) || 0), 0);

  return (
    <div>
      <PageHeader title="Sales" subtitle="Point of Sale & Sales Management">
        <Btn color="var(--color-primary)" onClick={() => { setEditItem(null); setForm({ customer_name: "", total: "", status: "completed", sale_date: new Date().toISOString().split("T")[0] }); setModal(true); }}>
          <Plus className="h-3.5 w-3.5" /> New Sale
        </Btn>
        <Btn outline color="var(--color-muted-foreground)" onClick={load}><RefreshCw className="h-3 w-3" /> Refresh</Btn>
      </PageHeader>
      <div className="flex flex-wrap gap-3 mb-4">
        <StatCard label="Total Sales" value={String(filtered.length)} icon={<ShoppingCart className="h-4 w-4" />} />
        <StatCard label="Revenue" value={formatCurrency(totalRevenue)} icon={<DollarSign className="h-4 w-4" />} />
        <StatCard label="Avg Sale" value={filtered.length ? formatCurrency(Math.round(totalRevenue / filtered.length)) : "Ksh 0"} icon={<BarChart3 className="h-4 w-4" />} accent="var(--color-success)" />
        <StatCard label="Today" value={String(filtered.filter((s: any) => { const d = s.sale_date || s.createdAt; return d && new Date(d).toDateString() === new Date().toDateString(); }).length)} icon={<Clock className="h-4 w-4" />} accent="var(--color-warning)" />
      </div>
      <Card className="mb-3">
        <div className="flex gap-3 flex-wrap items-center">
          <SearchBar placeholder="Search by customer name..." value={search} onChange={setSearch} />
          <Select options={[{ label: "All Statuses", value: "ALL" }, "completed", "pending", "cancelled"]} value={statusFilter} onChange={setStatusFilter} />
        </div>
      </Card>
      {loading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <Table cols={["#", "Customer", "Date", "Total", "Status", "Actions"]}
          rows={filtered.map((s: any, i: number) => [
            <span key="id" className="font-bold font-mono text-primary" style={{ color: "var(--color-accent-foreground)" }}>#{s.id?.slice?.(0, 7) || (i + 1).toString().padStart(3, "0")}</span>,
            <span key="n" className="font-medium">{s.customer_name || s.customer || "Walk-in"}</span>,
            <span key="d" className="text-muted-foreground">{s.sale_date ? new Date(s.sale_date).toLocaleDateString("en-GB") : "-"}</span>,
            <span key="t" className="font-bold text-success">{formatCurrency(parseFloat(s.total) || 0)}</span>,
            <Badge key="st" label={(s.status || "completed").toUpperCase()} color={s.status === "cancelled" ? "var(--color-destructive)" : s.status === "pending" ? "var(--color-warning)" : "var(--color-success)"} />,
            <div key="ac" className="flex gap-1.5">
              <Btn small outline color="var(--color-accent-foreground)" onClick={() => { setEditItem(s); setForm({ customer_name: s.customer_name || "", total: String(s.total || ""), status: s.status || "completed", sale_date: s.sale_date?.split("T")[0] || "" }); setModal(true); }}>
                <Edit3 className="h-3 w-3" />
              </Btn>
              <Btn small outline color="var(--color-destructive)" onClick={() => handleDelete(s.id)}>
                <Trash2 className="h-3 w-3" />
              </Btn>
            </div>,
          ])}
          empty="No sales found. Create your first sale above." />
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={editItem ? "Edit Sale" : "New Sale"}>
        <InputField label="Customer Name" value={form.customer_name} onChange={v => setForm({ ...form, customer_name: v })} placeholder="Walk-in Customer" icon={<User className="h-3.5 w-3.5" />} />
        <InputField label="Total Amount (KES)" value={form.total} onChange={v => setForm({ ...form, total: v })} placeholder="0" icon={<DollarSign className="h-3.5 w-3.5" />} type="number" />
        <InputField label="Date" value={form.sale_date} onChange={v => setForm({ ...form, sale_date: v })} type="date" />
        <div className="mb-3.5">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
            className="w-full rounded-lg border border-border bg-muted px-3 py-[9px] text-[13px] text-foreground outline-none">
            <option value="completed">Completed</option><option value="pending">Pending</option><option value="cancelled">Cancelled</option>
          </select>
        </div>
        <Btn color="var(--color-primary)" onClick={handleSubmit} className="w-full justify-center mt-2 py-[10px]">
          {editItem ? "Update Sale" : "Create Sale"}
        </Btn>
      </Modal>
    </div>
  );
}
