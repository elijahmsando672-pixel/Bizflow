"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/data";
import {
  PageHeader, StatCard, Card, SearchBar, Select, Table, Btn, Badge
} from "@/components/dashboard/ui";
import { FileText, ShoppingCart, Clock, RefreshCw, Loader2 } from "lucide-react";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.sales.getAll() as any[];
      setOrders(Array.isArray(data) ? data : []);
    } catch { setOrders([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter((o: any) =>
    (o.customer_name || o.customer || "").toLowerCase().includes(search.toLowerCase()) &&
    (statusFilter === "ALL" || o.status === statusFilter)
  );

  return (
    <div>
      <PageHeader title="Orders" subtitle="View and manage all customer orders">
        <Btn outline color="var(--color-muted-foreground)" onClick={load}><RefreshCw className="h-3 w-3" /> Refresh</Btn>
      </PageHeader>
      <div className="flex flex-wrap gap-3 mb-4">
        <StatCard label="Total Orders" value={String(filtered.length)} icon={<ShoppingCart className="h-4 w-4" />} />
        <StatCard label="Pending" value={String(filtered.filter(o => o.status === "pending").length)} icon={<Clock className="h-4 w-4" />} accent="var(--color-warning)" />
        <StatCard label="Completed" value={String(filtered.filter(o => o.status === "completed" || o.status === "paid").length)} icon={<FileText className="h-4 w-4" />} accent="var(--color-success)" />
      </div>
      <Card className="mb-3">
        <div className="flex gap-3 flex-wrap">
          <SearchBar placeholder="Search by customer..." value={search} onChange={setSearch} />
          <Select options={[{ label: "All Statuses", value: "ALL" }, "completed", "pending", "cancelled"]} value={statusFilter} onChange={setStatusFilter} />
        </div>
      </Card>
      {loading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <Table cols={["Order #", "Customer", "Items", "Total", "Status", "Date"]}
          rows={filtered.map((o: any, i: number) => [
            <span key="id" className="font-bold font-mono" style={{ color: "var(--color-accent-foreground)" }}>#{o.id?.slice?.(0, 7) || (i + 1).toString().padStart(3, "0")}</span>,
            o.customer_name || o.customer || "Walk-in",
            <Badge key="q" label={String(o.items?.length || 1) + " items"} color="var(--color-primary)" />,
            <span key="t" className="font-bold text-success">{formatCurrency(parseFloat(o.total) || 0)}</span>,
            <Badge key="st" label={(o.status || "pending").toUpperCase()} color={o.status === "cancelled" ? "var(--color-destructive)" : o.status === "pending" ? "var(--color-warning)" : "var(--color-success)"} glow />,
            <span key="d" className="text-muted-foreground">{o.sale_date || o.createdAt ? new Date(o.sale_date || o.createdAt).toLocaleDateString("en-GB") : "-"}</span>,
          ])}
          empty="No orders yet." />
      )}
    </div>
  );
}
