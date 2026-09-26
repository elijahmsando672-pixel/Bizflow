"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FolderTree, Package, Plus, RefreshCw } from "lucide-react";
import api from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Spinner } from "@/components/ui/spinner";
import { StatCard } from "@/components/ui/stat-card";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  description?: string | null;
  parent_id?: string | null;
}

interface Product {
  id: string;
  category_id?: string | null;
  is_active?: boolean;
}

export default function CategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", parent_id: "none" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [categoryList, productList] = await Promise.all([
        api.products.getCategories() as Promise<Category[]>,
        api.products.getAll() as Promise<Product[]>,
      ]);
      setCategories(Array.isArray(categoryList) ? categoryList : []);
      setProducts(Array.isArray(productList) ? productList : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of products) {
      if (!product.category_id) continue;
      map.set(product.category_id, (map.get(product.category_id) ?? 0) + 1);
    }
    return map;
  }, [products]);

  const uncategorised = useMemo(
    () => products.filter((product) => !product.category_id).length,
    [products]
  );

  const create = async () => {
    const name = form.name.trim();
    if (!name) return;
    setSaving(true);
    try {
      await api.products.createCategory({
        name,
        description: form.description.trim() || undefined,
        parent_id: form.parent_id === "none" ? null : form.parent_id,
      });
      toast.success(`Category "${name}" created`);
      setForm({ name: "", description: "", parent_id: "none" });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the category");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Categories"
        description="Group your products so the catalogue and reports stay organised."
        actions={
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-2.5">
        <StatCard label="Categories" value={formatNumber(categories.length)} icon={FolderTree} />
        <StatCard label="Products" value={formatNumber(products.length)} icon={Package} tone="info" />
        <StatCard
          label="Uncategorised"
          value={formatNumber(uncategorised)}
          icon={Package}
          tone={uncategorised > 0 ? "warning" : "neutral"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader>
            <PanelTitle>Product categories</PanelTitle>
          </PanelHeader>
          <PanelBody className="p-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner label="Loading categories" />
              </div>
            ) : error ? (
              <ErrorState title="Could not load categories" onRetry={load} className="m-4" />
            ) : categories.length === 0 ? (
              <EmptyState
                icon={FolderTree}
                title="No categories yet"
                description="Create your first category, then assign products to it."
                className="m-4 border-0 bg-transparent"
              />
            ) : (
              <ul className="divide-y divide-border">
                {categories.map((category) => {
                  const count = counts.get(category.id) ?? 0;
                  const parent = categories.find((entry) => entry.id === category.parent_id);
                  return (
                    <li
                      key={category.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{category.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {category.description || "No description"}
                          {parent ? ` · under ${parent.name}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {formatNumber(count)} {count === 1 ? "product" : "products"}
                        </span>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/products?category=${category.id}`}>View</Link>
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </PanelBody>
        </Panel>

        <Panel className="h-fit">
          <PanelHeader>
            <PanelTitle>New category</PanelTitle>
          </PanelHeader>
          <PanelBody>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="category-name" className="text-sm font-medium text-foreground">
                  Name
                </label>
                <Input
                  id="category-name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="e.g. Beverages"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="category-parent" className="text-sm font-medium text-foreground">
                  Parent category
                </label>
                <select
                  id="category-parent"
                  value={form.parent_id}
                  onChange={(event) => setForm({ ...form, parent_id: event.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="none">No parent</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="category-description" className="text-sm font-medium text-foreground">
                  Description
                </label>
                <Textarea
                  id="category-description"
                  rows={2}
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="Optional"
                />
              </div>
              <Button className="w-full" onClick={create} disabled={saving || !form.name.trim()}>
                <Plus className="h-4 w-4" aria-hidden />
                {saving ? "Creating…" : "Create category"}
              </Button>
            </div>
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}
