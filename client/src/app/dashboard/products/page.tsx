"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Package, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { formatCurrency, toNumber } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Panel, PanelBody } from "@/components/ui/panel";
import { Spinner } from "@/components/ui/spinner";
import { StatCard } from "@/components/ui/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  sku?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  selling_price?: number | string;
  cost_price?: number | string;
  stock_qty?: number | string;
  reorder_level?: number | string;
  is_active?: boolean;
}

interface Category {
  id: string;
  name: string;
}

const EMPTY_FORM = {
  name: "",
  sku: "",
  category_id: "none",
  selling_price: "",
  cost_price: "",
  stock_qty: "",
  reorder_level: "",
  description: "",
};

export default function ProductsPage() {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [lowOnly, setLowOnly] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [productList, categoryList] = await Promise.all([
        api.products.getAll() as Promise<Product[]>,
        api.products.getCategories().catch(() => [] as Category[]),
      ]);
      setProducts(Array.isArray(productList) ? productList : []);
      setCategories(Array.isArray(categoryList) ? categoryList : []);
    } catch {
      setError(true);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("new") !== "1") return;
    setEditing(null);
    setForm(EMPTY_FORM);
    document.getElementById("product-name")?.focus();
  }, []);

  const isLow = (product: Product) => {
    const stock = toNumber(product.stock_qty) ?? 0;
    return stock <= (toNumber(product.reorder_level) ?? 0);
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((product) => {
      if (category !== "all" && product.category_id !== category) return false;
      if (lowOnly && !isLow(product)) return false;
      if (!q) return true;
      return (
        product.name.toLowerCase().includes(q) ||
        String(product.sku ?? "").toLowerCase().includes(q) ||
        String(product.category_name ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, query, category, lowOnly]);

  const stats = useMemo(() => {
    const value = products.reduce(
      (sum, product) => sum + (toNumber(product.stock_qty) ?? 0) * (toNumber(product.cost_price) ?? 0),
      0
    );
    return {
      value,
      low: products.filter(isLow).length,
      outOfStock: products.filter((product) => (toNumber(product.stock_qty) ?? 0) === 0).length,
    };
  }, [products]);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name ?? "",
      sku: product.sku ?? "",
      category_id: product.category_id ?? "none",
      selling_price: String(toNumber(product.selling_price) ?? 0),
      cost_price: String(toNumber(product.cost_price) ?? 0),
      stock_qty: String(toNumber(product.stock_qty) ?? 0),
      reorder_level: String(toNumber(product.reorder_level) ?? 0),
      description: "",
    });
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim() || undefined,
        category_id: form.category_id === "none" ? undefined : form.category_id,
        selling_price: toNumber(form.selling_price) ?? 0,
        cost_price: toNumber(form.cost_price) ?? 0,
        stock_qty: toNumber(form.stock_qty) ?? 0,
        reorder_level: toNumber(form.reorder_level) ?? 0,
        description: form.description.trim() || undefined,
      };
      if (editing) {
        await api.products.update(editing.id, payload);
        toast.success("Product updated");
      } else {
        await api.products.create(payload);
        toast.success("Product created");
      }
      setForm(EMPTY_FORM);
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the product");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (product: Product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await api.products.delete(product.id);
      toast.success("Product deleted");
      if (editing?.id === product.id) setEditing(null);
      load();
    } catch {
      toast.error("Could not delete the product");
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Items & products"
        description="Your catalogue, pricing, and stock levels."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
              Refresh
            </Button>
            <Button size="sm" onClick={openNew}>
              <Plus className="h-4 w-4" aria-hidden />
              New product
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Products" value={String(products.length)} icon={Package} />
        <StatCard
          label="Stock value"
          value={formatCurrency(stats.value)}
          icon={Package}
          tone="info"
        />
        <StatCard label="Low stock" value={String(stats.low)} icon={AlertTriangle} tone="warning" />
        <StatCard
          label="Out of stock"
          value={String(stats.outOfStock)}
          icon={AlertTriangle}
          tone={stats.outOfStock > 0 ? "danger" : "neutral"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <PanelBody className="p-0">
            <div className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name, SKU, or categoryâ€¦"
                  aria-label="Search products"
                  className="h-9 pl-9"
                />
              </div>
              <div className="w-full sm:w-48">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger aria-label="Filter by category" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((entry) => (
                      <SelectItem key={entry.id} value={entry.id}>
                        {entry.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant={lowOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setLowOnly((prev) => !prev)}
                aria-pressed={lowOnly}
              >
                Low stock only
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner label="Loading products" />
              </div>
            ) : error ? (
              <ErrorState title="Could not load products" onRetry={load} className="m-4" />
            ) : visible.length === 0 ? (
              <EmptyState
                icon={Package}
                title={products.length === 0 ? "No products yet" : "No products match your filters"}
                description={
                  products.length === 0 ? "Add your first product to start selling." : undefined
                }
                className="m-4 border-0 bg-transparent"
                action={
                  products.length === 0 ? (
                    <Button size="sm" onClick={openNew}>
                      <Plus className="h-4 w-4" aria-hidden />
                      New product
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((product) => {
                    const low = isLow(product);
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{product.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {product.sku || "No SKU"} Â· {product.category_name || "Uncategorised"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(product.selling_price)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {toNumber(product.stock_qty) ?? 0}
                        </TableCell>
                        <TableCell>
                          {low ? (
                            <StatusBadge tone="warning">Low stock</StatusBadge>
                          ) : (
                            <StatusBadge tone="success">In stock</StatusBadge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon" className="h-8 w-8"
                              aria-label={`Edit ${product.name}`}
                              onClick={() => openEdit(product)}
                            >
                              <Pencil className="h-4 w-4" aria-hidden />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon" className="h-8 w-8"
                              aria-label={`Delete ${product.name}`}
                              onClick={() => remove(product)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" aria-hidden />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </PanelBody>
        </Panel>

        <Panel className="h-fit">
          <PanelBody>
            <h2 className="text-sm font-semibold text-foreground">
              {editing ? `Edit ${editing.name}` : "New product"}
            </h2>
            <div className="mt-3 space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="product-name" className="text-sm font-medium text-foreground">
                  Name
                </label>
                <Input
                  id="product-name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="e.g. 500ml Water"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="product-sku" className="text-sm font-medium text-foreground">
                    SKU
                  </label>
                  <Input
                    id="product-sku"
                    value={form.sku}
                    onChange={(event) => setForm({ ...form, sku: event.target.value })}
                    placeholder="BEV-001"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="product-category" className="text-sm font-medium text-foreground">
                    Category
                  </label>
                  <Select
                    value={form.category_id}
                    onValueChange={(value) => setForm({ ...form, category_id: value })}
                  >
                    <SelectTrigger id="product-category" className="h-9">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No category</SelectItem>
                      {categories.map((entry) => (
                        <SelectItem key={entry.id} value={entry.id}>
                          {entry.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="product-cost" className="text-sm font-medium text-foreground">
                    Cost price
                  </label>
                  <Input
                    id="product-cost"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.cost_price}
                    onChange={(event) => setForm({ ...form, cost_price: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="product-price" className="text-sm font-medium text-foreground">
                    Selling price
                  </label>
                  <Input
                    id="product-price"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.selling_price}
                    onChange={(event) => setForm({ ...form, selling_price: event.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="product-stock" className="text-sm font-medium text-foreground">
                    Stock on hand
                  </label>
                  <Input
                    id="product-stock"
                    type="number"
                    min={0}
                    value={form.stock_qty}
                    onChange={(event) => setForm({ ...form, stock_qty: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="product-reorder" className="text-sm font-medium text-foreground">
                    Reorder level
                  </label>
                  <Input
                    id="product-reorder"
                    type="number"
                    min={0}
                    value={form.reorder_level}
                    onChange={(event) => setForm({ ...form, reorder_level: event.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="product-description" className="text-sm font-medium text-foreground">
                  Description
                </label>
                <Textarea
                  id="product-description"
                  rows={2}
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="Optional"
                />
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={save} disabled={saving || !form.name.trim()}>
                  {saving ? "Savingâ€¦" : editing ? "Save changes" : "Create product"}
                </Button>
                {editing ? (
                  <Button variant="outline" onClick={openNew}>
                    Cancel
                  </Button>
                ) : null}
              </div>

              {categories.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No categories yet â€”{" "}
                  <Link href="/dashboard/categories" className="underline underline-offset-2">
                    create one
                  </Link>{" "}
                  to group your products.
                </p>
              ) : null}
            </div>
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}
