"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Boxes,
  Download,
  History,
  Layers,
  Package,
  PackageX,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import api from "@/lib/api";
import { downloadCsv } from "@/lib/csv";
import { formatCurrency, formatNumber, toNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const ALL_CATEGORIES = "__all__";
const PAGE_SIZE = 12;

type StockState = "ok" | "low" | "out";

interface Product {
  id: string;
  name: string;
  sku?: string | null;
  unit?: string | null;
  cost_price?: number | string | null;
  selling_price?: number | string | null;
  stock_qty?: number | string | null;
  reorder_level?: number | string | null;
  category_id?: string | null;
  category_name?: string | null;
}

function stockState(product: Product): StockState {
  const onHand = toNumber(product.stock_qty) ?? 0;
  const reorder = toNumber(product.reorder_level) ?? 0;
  if (onHand <= 0) return "out";
  if (reorder > 0 && onHand <= reorder) return "low";
  return "ok";
}

const STATE_LABEL: Record<StockState, string> = {
  ok: "In stock",
  low: "Low stock",
  out: "Out of stock",
};

const STATE_TONE: Record<StockState, "success" | "warning" | "danger"> = {
  ok: "success",
  low: "warning",
  out: "danger",
};

export default function InventoryPage() {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [stock, setStock] = useState("all");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = (await api.products.getAll()) as Product[];
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((product) => {
      if (product.category_id && product.category_name) {
        map.set(product.category_id, product.category_name);
      }
    });
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [products]);

  const stats = useMemo(() => {
    let units = 0;
    let value = 0;
    let low = 0;
    let out = 0;
    products.forEach((product) => {
      const onHand = toNumber(product.stock_qty) ?? 0;
      units += onHand;
      value += onHand * (toNumber(product.cost_price) ?? 0);
      const state = stockState(product);
      if (state === "low") low += 1;
      if (state === "out") out += 1;
    });
    return { skus: products.length, units, value, low, out };
  }, [products]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      if (query) {
        const haystack = [product.name, product.sku, product.category_name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (category !== ALL_CATEGORIES && product.category_id !== category) return false;
      if (stock === "attention" && stockState(product) === "ok") return false;
      if (stock === "out" && stockState(product) !== "out") return false;
      return true;
    });
  }, [products, search, category, stock]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, category, stock]);

  const exportCsv = () => {
    if (filtered.length === 0) {
      toast.error("There is nothing to export yet");
      return;
    }
    downloadCsv(`bizflow-inventory-${new Date().toISOString().slice(0, 10)}`, filtered, [
      { header: "Product", value: (row) => row.name },
      { header: "SKU", value: (row) => row.sku ?? "" },
      { header: "Category", value: (row) => row.category_name ?? "" },
      { header: "On hand", value: (row) => toNumber(row.stock_qty) },
      { header: "Reorder level", value: (row) => toNumber(row.reorder_level) },
      { header: "Unit cost (KES)", value: (row) => toNumber(row.cost_price) },
      { header: "Selling price (KES)", value: (row) => toNumber(row.selling_price) },
      {
        header: "Status",
        value: (row) => STATE_LABEL[stockState(row)],
      },
    ]);
  };

  const clearFilters = () => {
    setSearch("");
    setCategory(ALL_CATEGORIES);
    setStock("all");
  };

  const filtersActive = Boolean(search) || category !== ALL_CATEGORIES || stock !== "all";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Inventory"
        description="Stock on hand for every product, with reorder levels and the value of the shelf."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
              <Download className="h-4 w-4" aria-hidden />
              Export
            </Button>
            <Button size="sm" asChild>
              <Link href="/dashboard/products?new=1">
                <Package className="h-4 w-4" aria-hidden />
                Add product
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Products tracked" value={formatNumber(stats.skus)} icon={Boxes} tone="primary" />
        <StatCard label="Units on hand" value={formatNumber(stats.units)} icon={Warehouse} tone="info" />
        <StatCard label="Stock value" value={formatCurrency(stats.value)} icon={TrendingUp} tone="success" />
        <StatCard
          label="Needs attention"
          value={formatNumber(stats.low + stats.out)}
          icon={AlertTriangle}
          tone={stats.low + stats.out > 0 ? "warning" : "neutral"}
          hint={`${stats.low} low · ${stats.out} out of stock`}
        />
      </div>

      {error ? (
        <ErrorState title="Could not load inventory" onRetry={load} retrying={loading} />
      ) : (
        <>
          <Panel>
            <PanelHeader>
              <PanelTitle>Filters</PanelTitle>
              {filtersActive ? (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : null}
            </PanelHeader>
            <PanelBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <FormField label="Search" htmlFor="inventory-search">
                <Input
                  id="inventory-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Product name or SKU"
                  className="h-9"
                />
              </FormField>
              <FormField label="Category" htmlFor="inventory-category">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="inventory-category" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
                    {categories.map(([id, name]) => (
                      <SelectItem key={id} value={id}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Stock level" htmlFor="inventory-stock">
                <Select value={stock} onValueChange={setStock}>
                  <SelectTrigger id="inventory-stock" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All stock levels</SelectItem>
                    <SelectItem value="attention">Needs restocking</SelectItem>
                    <SelectItem value="out">Out of stock</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle>
                {filtered.length} {filtered.length === 1 ? "product" : "products"}
              </PanelTitle>
              <div className="flex flex-wrap items-center gap-1">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/budgets">
                    <ShoppingCart className="h-3.5 w-3.5" aria-hidden />
                    Restock plan
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/transfers">
                    <History className="h-3.5 w-3.5" aria-hidden />
                    Movement history
                  </Link>
                </Button>
              </div>
            </PanelHeader>
            <PanelBody className="p-0">
              {loading ? (
                <div className="flex justify-center py-16">
                  <Spinner label="Loading inventory" />
                </div>
              ) : rows.length === 0 ? (
                <EmptyState
                  icon={filtersActive ? Layers : PackageX}
                  title={filtersActive ? "No products match these filters" : "No products yet"}
                  description={
                    filtersActive
                      ? "Try another search term or clear the filters."
                      : "Add your first product to start tracking stock levels."
                  }
                  className="m-4 border-0 bg-transparent"
                  action={
                    filtersActive ? (
                      <Button size="sm" variant="outline" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    ) : (
                      <Button size="sm" asChild>
                        <Link href="/dashboard/products?new=1">
                          <Package className="h-4 w-4" aria-hidden />
                          Add product
                        </Link>
                      </Button>
                    )
                  }
                />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] text-sm">
                      <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                        <tr className="border-b border-border">
                          <th scope="col" className="px-4 py-2 text-left font-medium">Product</th>
                          <th scope="col" className="hidden px-2 py-2 text-left font-medium lg:table-cell">Category</th>
                          <th scope="col" className="px-2 py-2 text-left font-medium">On hand</th>
                          <th scope="col" className="hidden px-2 py-2 text-right font-medium md:table-cell">Reorder at</th>
                          <th scope="col" className="hidden px-2 py-2 text-right font-medium md:table-cell">Unit cost</th>
                          <th scope="col" className="px-2 py-2 text-right font-medium">Sell price</th>
                          <th scope="col" className="px-4 py-2 text-left font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {rows.map((product) => {
                          const onHand = toNumber(product.stock_qty) ?? 0;
                          const reorder = toNumber(product.reorder_level) ?? 0;
                          const cost = toNumber(product.cost_price);
                          const price = toNumber(product.selling_price);
                          const state = stockState(product);
                          // Reorder level treated as 100% of the bar so the bar reads
                          // as "how far through the safe window are we".
                          const target = reorder > 0 ? reorder * 2 : onHand;
                          const ratio = target > 0 ? Math.min(100, Math.round((onHand / target) * 100)) : 100;
                          return (
                            <tr key={product.id}>
                              <td className="px-4 py-2">
                                <span className="font-medium text-foreground">{product.name}</span>
                                <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
                                  {product.sku || "No SKU"}
                                  {product.unit ? ` · ${product.unit}` : ""}
                                </span>
                              </td>
                              <td className="hidden px-2 py-2 text-muted-foreground lg:table-cell">
                                {product.category_name || "Uncategorised"}
                              </td>
                              <td className="px-2 py-2">
                                <span className="font-medium tabular-nums text-foreground">
                                  {formatNumber(onHand)}
                                </span>
                                <span className="mt-1 block w-24">
                                  <Progress
                                    value={ratio}
                                    size="sm"
                                    tone={state === "ok" ? "success" : state === "low" ? "warning" : "danger"}
                                    aria-label={`${product.name} stock level`}
                                  />
                                </span>
                              </td>
                              <td className="hidden px-2 py-2 text-right tabular-nums text-muted-foreground md:table-cell">
                                {reorder > 0 ? formatNumber(reorder) : "—"}
                              </td>
                              <td className="hidden px-2 py-2 text-right tabular-nums text-muted-foreground md:table-cell">
                                {cost != null ? formatCurrency(cost) : "—"}
                              </td>
                              <td className="whitespace-nowrap px-2 py-2 text-right font-medium tabular-nums text-foreground">
                                {price != null ? formatCurrency(price) : "—"}
                              </td>
                              <td className="px-4 py-2">
                                <StatusBadge tone={STATE_TONE[state]} dot>
                                  {STATE_LABEL[state]}
                                </StatusBadge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    page={safePage}
                    pageCount={pageCount}
                    onPageChange={setPage}
                    total={filtered.length}
                    pageSize={PAGE_SIZE}
                  />
                </>
              )}
            </PanelBody>
          </Panel>
        </>
      )}
    </div>
  );
}
