"use client";

import { useState, useEffect, useCallback } from "react";
import { DataTable, type Column } from "@/components/ui/data-table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/data";
import api from "@/lib/api";

interface Product {
  id: string;
  name: string;
  sku: string;
  selling_price: number;
  cost_price: number;
  stock_qty: number;
  reorder_level: number;
  category_name: string;
  category_id?: string;
  description?: string;
}

interface Category {
  id: string;
  name: string;
}

const columns: Column<Product>[] = [
  { key: "name", label: "Product", sortable: true, render: (p) => (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
        <Package className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="font-medium text-foreground">{p.name}</p>
        {p.category_name && (
          <p className="text-xs text-muted-foreground">{p.category_name}</p>
        )}
      </div>
    </div>
  )},
  { key: "sku", label: "SKU", hideOnMobile: true },
  { key: "selling_price", label: "Price", sortable: true, render: (p) => (
    <span className="font-medium">{formatCurrency(p.selling_price)}</span>
  )},
  { key: "cost_price", label: "Cost", sortable: true, hideOnMobile: true, render: (p) => (
    <span className="text-muted-foreground">{formatCurrency(p.cost_price)}</span>
  )},
  { key: "stock_qty", label: "Stock", sortable: true, render: (p) => {
    const low = p.stock_qty <= (p.reorder_level || 0);
    const out = p.stock_qty === 0;
    return (
      <Badge variant={out ? "destructive" : low ? "warning" : "default"}>
        {p.stock_qty} {out ? "(Out)" : low ? "(Low)" : ""}
      </Badge>
    );
  }},
];

export default function ProductsPage() {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: "", sku: "", selling_price: "", cost_price: "",
    stock_qty: "", reorder_level: "", category_id: "", description: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsRes, catsRes] = await Promise.all([
        api.products.getAll(),
        api.products.getCategories().catch(() => []),
      ]);
      const products = (productsRes as { products?: Product[]; data?: Product[] }).products
        || (productsRes as { products?: Product[]; data?: Product[] }).data
        || (productsRes as Product[]);
      setData(Array.isArray(products) ? products : []);
      setCategories(Array.isArray(catsRes) ? catsRes as Category[] : []);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: "", sku: "", selling_price: "", cost_price: "", stock_qty: "", reorder_level: "", category_id: "", description: "" });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditItem(p);
    setForm({
      name: p.name, sku: p.sku || "",
      selling_price: String(p.selling_price || ""),
      cost_price: String(p.cost_price || ""),
      stock_qty: String(p.stock_qty || ""),
      reorder_level: String(p.reorder_level || ""),
      category_id: p.category_id || "",
      description: p.description || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        name: form.name,
        sku: form.sku,
        selling_price: parseFloat(form.selling_price) || 0,
        cost_price: parseFloat(form.cost_price) || 0,
        stock_qty: parseInt(form.stock_qty) || 0,
        reorder_level: parseInt(form.reorder_level) || 0,
        category_id: form.category_id || undefined,
        description: form.description || undefined,
      };
      if (editItem) {
        await api.products.update(editItem.id, payload);
      } else {
        await api.products.create(payload);
      }
      setDialogOpen(false);
      fetchData();
    } catch {
      alert("Failed to save product");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await api.products.delete(id);
      fetchData();
    } catch {
      alert("Failed to delete product");
    }
  };

  const totalValue = data.reduce((s, p) => s + (p.selling_price || 0) * (p.stock_qty || 0), 0);
  const lowStock = data.filter((p) => p.stock_qty <= (p.reorder_level || 0)).length;
  const outOfStock = data.filter((p) => p.stock_qty === 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground">Manage your product inventory</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{data.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stock Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(totalValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-warning">{lowStock}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{outOfStock}</p>
          </CardContent>
        </Card>
      </div>

      <DataTable<Product>
        data={data}
        columns={[
          ...columns,
          {
            key: "actions" as never,
            label: "",
            render: (p) => (
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ),
          },
        ]}
        keyExtractor={(p) => p.id}
        searchKeys={["name", "sku", "category_name"]}
        searchPlaceholder="Search products..."
        selectable
        pageSize={15}
        loading={loading}
        emptyMessage="No products found. Add your first product to get started."
        onSelectionChange={setSelected}
        onExport={() => {
          const csv = [
            ["Name", "SKU", "Price", "Cost", "Stock", "Category"].join(","),
            ...data.map((p) => [p.name, p.sku, p.selling_price, p.cost_price, p.stock_qty, p.category_name].join(",")),
          ].join("\n");
          const blob = new Blob([csv], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = "products.csv"; a.click();
          URL.revokeObjectURL(url);
        }}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Name *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">SKU</label>
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="SKU code" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Selling Price *</label>
                <Input value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} placeholder="0" type="number" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Cost Price</label>
                <Input value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} placeholder="0" type="number" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Stock Quantity</label>
                <Input value={form.stock_qty} onChange={(e) => setForm({ ...form, stock_qty: e.target.value })} placeholder="0" type="number" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Reorder Level</label>
                <Input value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} placeholder="0" type="number" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Category</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description"
                rows={2}
                className="w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editItem ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
