"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import {
  PageHeader, StatCard, Card, SearchBar, Table, Btn, Badge
} from "@/components/ui/dashboard-ui";
import { Package, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.products.getAll() as any[];
      setItems(Array.isArray(data) ? data : []);
    } catch { setItems([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter((i: any) =>
    (i.name || i.product_name || "").toLowerCase().includes(search.toLowerCase())
  );
  const lowStock = filtered.filter((i: any) => (i.quantity ?? i.stock ?? 0) < 10);

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Manage your product stock">
        <Btn outline color="var(--color-muted-foreground)" onClick={load}><RefreshCw className="h-3 w-3" /> Refresh</Btn>
      </PageHeader>
      <div className="flex flex-wrap gap-3 mb-4">
        <StatCard label="Total Items" value={String(filtered.length)} icon={<Package className="h-4 w-4" />} />
        <StatCard label="Low Stock" value={String(lowStock.length)} sub="Need restock" icon={<AlertTriangle className="h-4 w-4" />} accent="var(--color-warning)" />
      </div>
      <Card className="mb-3">
        <SearchBar placeholder="Search products..." value={search} onChange={setSearch} />
      </Card>
      {loading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <Table cols={["Product", "SKU", "Stock", "Price", "Status"]}
          rows={filtered.map((i: any) => [
            <span key="n" className="font-medium">{i.name || i.product_name || "N/A"}</span>,
            <span key="s" className="text-muted-foreground font-mono text-xs">{i.sku || "-"}</span>,
            <span key="q" className="font-bold">{(i.quantity ?? i.stock ?? 0)}</span>,
            <span key="p" className="font-bold text-success">{i.price ? `Ksh ${Number(i.price).toLocaleString()}` : "-"}</span>,
            <Badge key="st" label={(i.quantity ?? i.stock ?? 0) < 10 ? "LOW STOCK" : "IN STOCK"}
              color={(i.quantity ?? i.stock ?? 0) < 10 ? "var(--color-warning)" : "var(--color-success)"} />,
          ])}
          empty="No inventory items found." />
      )}
    </div>
  );
}
