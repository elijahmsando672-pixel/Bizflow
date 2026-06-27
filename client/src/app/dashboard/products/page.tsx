"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/data";
import {
  PageHeader, StatCard, Card, SearchBar, Table, Btn, Modal, InputField
} from "@/components/ui/dashboard-ui";
import { Package, DollarSign, Plus, RefreshCw, Loader2 } from "lucide-react";
import type { Product as SaleProduct } from "@/types/sales";

interface ProductItem extends SaleProduct {
  selling_price?: number;
  cost_price?: number;
  quantity?: number;
  sku?: string;
  category_name?: string;
  description?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<ProductItem | null>(null);
  const [form, setForm] = useState({ name: "", sku: "", price: "", quantity: "", description: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.products.getAll();
      const list: ProductItem[] = Array.isArray(data) ? data : ((data as { products?: ProductItem[] })?.products ?? []);
      setProducts(list);
    } catch { setProducts([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    try {
      const payload = { name: form.name, sku: form.sku || undefined, selling_price: parseFloat(form.price) || 0, stock_qty: parseInt(form.quantity) || 0, description: form.description || undefined };
      if (editItem) { await api.products.update(editItem.id!, payload); }
      else { await api.products.create(payload); }
      setModal(false); setEditItem(null);
      setForm({ name: "", sku: "", price: "", quantity: "", description: "" });
      load();
    } catch { alert("Failed to save product"); }
  };

  const filtered = products.filter((p) =>
    (p.name || "").toLowerCase().includes(search.toLowerCase())
  );
  const totalValue = filtered.reduce((s, p) => s + (p.selling_price ?? p.price ?? 0) * (p.quantity ?? p.stock_qty ?? 0), 0);

  return (
    <div>
      <PageHeader title="Products" subtitle="Manage your product catalog">
        <Btn color="var(--color-primary)" onClick={() => { setEditItem(null); setForm({ name: "", sku: "", price: "", quantity: "", description: "" }); setModal(true); }}>
          <Plus className="h-3.5 w-3.5" /> Add Product
        </Btn>
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
          rows={filtered.map((p: ProductItem) => [
            <span key="n" className="font-medium">{p.name || "N/A"}</span>,
            <span key="p" className="font-bold text-success">{p.price ? `Ksh ${Number(p.price).toLocaleString()}` : "-"}</span>,
            <span key="q" className="font-bold">{p.quantity ?? 0}</span>,
            <span key="s" className="text-muted-foreground font-mono text-xs">{p.sku || "-"}</span>,
          ])}
          empty="No products found." />
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={editItem ? "Edit Product" : "Add Product"}>
        <InputField label="Product Name" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Product name" icon={<Package className="h-3.5 w-3.5" />} />
        <InputField label="SKU" value={form.sku} onChange={v => setForm({ ...form, sku: v })} placeholder="SKU-001" />
        <InputField label="Price (KES)" value={form.price} onChange={v => setForm({ ...form, price: v })} placeholder="0" icon={<DollarSign className="h-3.5 w-3.5" />} type="number" />
        <InputField label="Stock Qty" value={form.quantity} onChange={v => setForm({ ...form, quantity: v })} placeholder="0" type="number" />
        <InputField label="Description" value={form.description} onChange={v => setForm({ ...form, description: v })} placeholder="Product description" />
        <Btn color="var(--color-primary)" onClick={handleSubmit} className="w-full justify-center mt-2 py-[10px]">{editItem ? "Update Product" : "Create Product"}</Btn>
      </Modal>
    </div>
  );
}
