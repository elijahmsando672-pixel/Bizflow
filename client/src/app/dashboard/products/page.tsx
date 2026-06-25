"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/data";
import {
  PageHeader, StatCard, Card, SearchBar, Table, Btn
} from "@/components/dashboard/ui";
import { Package, DollarSign, RefreshCw, Loader2 } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.products.getAll() as any[];
      setProducts(Array.isArray(data) ? data : []);
    } catch { setProducts([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = products.filter((p: any) =>
    (p.name || "").toLowerCase().includes(search.toLowerCase())
  );
  const totalValue = filtered.reduce((s: number, p: any) => s + (parseFloat(p.price) || 0) * (p.quantity ?? 0), 0);

  return (
    <div>
      <PageHeader title="Products" subtitle="Manage your product catalog">
        <Btn outline color="var(--color-muted-foreground)" onClick={load}><RefreshCw className="h-3 w-3" /> Refresh</Btn>
      </PageHeader>
      <div className="flex flex-wrap gap-3 mb-4">
        <StatCard label="Total Products" value={String(filtered.length)} icon={<Package className="h-4 w-4" />} />
        <StatCard label="Inventory Value" value={formatCurrency(totalValue)} icon={<DollarSign className="h-4 w-4" />} accent="var(--color-success)" />
      </div>
      <Card className="mb-3">
        <SearchBar placeholder="Search products..." value={search} onChange={setSearch} />
      </Card>
      {loading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <Table cols={["Name", "Price", "Stock", "SKU"]}
          rows={filtered.map((p: any) => [
            <span key="n" className="font-medium">{p.name || "N/A"}</span>,
            <span key="p" className="font-bold text-success">{p.price ? `Ksh ${Number(p.price).toLocaleString()}` : "-"}</span>,
            <span key="q" className="font-bold">{p.quantity ?? 0}</span>,
            <span key="s" className="text-muted-foreground font-mono text-xs">{p.sku || "-"}</span>,
          ])}
          empty="No products found." />
      )}
    </div>
  );
}
