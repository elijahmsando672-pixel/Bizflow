"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, RefreshCw, Search, Truck } from "lucide-react";
import api from "@/lib/api";
import { formatDate, formatNumber, toNumber } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Spinner } from "@/components/ui/spinner";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge, humanizeStatus } from "@/components/ui/status-badge";
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
  stock_qty?: number | string;
  category_name?: string | null;
}

interface Movement {
  id: string;
  product_id?: string;
  qty_before?: number | string;
  qty_change?: number | string;
  qty_after?: number | string;
  reason?: string | null;
  reference_type?: string | null;
  reference_id?: string | null;
  created_at?: string | null;
}

const REASONS = [
  { value: "all", label: "All movements" },
  { value: "sale", label: "Sales" },
  { value: "purchase", label: "Purchases" },
  { value: "adjustment", label: "Adjustments" },
  { value: "initial_stock", label: "Opening stock" },
  { value: "return", label: "Returns" },
];

export default function StockTransfersPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("all");
  const [reason, setReason] = useState("all");
  const [query, setQuery] = useState("");
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [productLoading, setProductLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = (await api.products.getAll()) as Product[];
        if (!cancelled) setProducts(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setProducts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    if (productId === "all") {
      setMovements([]);
      setLoading(false);
      return;
    }
    setProductLoading(true);
    setError(false);
    try {
      const result = (await api.products.getStockHistory(productId)) as Movement[];
      setMovements(Array.isArray(result) ? result : []);
    } catch {
      setError(true);
      setMovements([]);
    } finally {
      setProductLoading(false);
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === productId) ?? null,
    [products, productId]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return movements.filter((movement) => {
      if (reason !== "all" && String(movement.reason ?? "") !== reason) return false;
      if (!q) return true;
      return (
        String(movement.reference_type ?? "").toLowerCase().includes(q) ||
        String(movement.reference_id ?? "").toLowerCase().includes(q)
      );
    });
  }, [movements, reason, query]);

  const stats = useMemo(() => {
    const inQty = movements
      .filter((movement) => (toNumber(movement.qty_change) ?? 0) > 0)
      .reduce((sum, movement) => sum + (toNumber(movement.qty_change) ?? 0), 0);
    const outQty = movements
      .filter((movement) => (toNumber(movement.qty_change) ?? 0) < 0)
      .reduce((sum, movement) => sum + Math.abs(toNumber(movement.qty_change) ?? 0), 0);
    return { inQty, outQty, net: inQty - outQty };
  }, [movements]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Stock transfers"
        description="Every movement of stock in and out, with the running balance for each item."
        actions={
          <Button variant="outline" size="sm" onClick={load} disabled={loading || productLoading}>
            <RefreshCw className={cn("h-4 w-4", (loading || productLoading) && "animate-spin")} aria-hidden />
            Refresh
          </Button>
        }
      />

      <Panel>
        <PanelHeader className="gap-2">
          <div className="w-full sm:w-72">
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger aria-label="Select a product" className="h-9">
                <SelectValue placeholder="Select a product to trace" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All products</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                    {product.sku ? ` · ${product.sku}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {productId !== "all" ? (
            <>
              <div className="relative w-full sm:w-52">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search reference…"
                  aria-label="Search references"
                  className="h-9 pl-9"
                />
              </div>
              <div className="w-full sm:w-44">
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger aria-label="Filter by reason" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REASONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : null}
        </PanelHeader>

        <PanelBody>
          {productId === "all" ? (
            <>
              <EmptyState
                icon={Truck}
                title="Choose a product to trace its movements"
                description="Select an item above to see every stock movement, the reason, and the running balance."
                className="border-0 bg-transparent"
                action={
                  <Button size="sm" asChild>
                    <Link href="/dashboard/inventory">Go to inventory</Link>
                  </Button>
                }
              />

              {products.length > 0 ? (
                <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {products.slice(0, 6).map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => setProductId(product.id)}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {product.name}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {product.category_name || "Uncategorised"}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                        {formatNumber(product.stock_qty)}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          ) : error ? (
            <ErrorState title="Could not load stock movements" onRetry={load} />
          ) : loading || productLoading ? (
            <div className="flex justify-center py-16">
              <Spinner label="Loading movements" />
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No movements recorded"
              description={`${selectedProduct?.name ?? "This product"} has no stock movement history yet.`}
              className="border-0 bg-transparent"
            />
          ) : (
            <>
              <div className="mb-4 grid grid-cols-3 gap-2.5">
                <StatCard
                  label="Units in"
                  value={formatNumber(stats.inQty)}
                  icon={ArrowUpRight}
                  tone="success"
                />
                <StatCard
                  label="Units out"
                  value={formatNumber(stats.outQty)}
                  icon={ArrowDownRight}
                  tone="danger"
                />
                <StatCard
                  label="On hand now"
                  value={formatNumber(selectedProduct?.stock_qty)}
                  icon={Truck}
                  tone="info"
                />
              </div>

              <ul className="divide-y divide-border rounded-md border border-border">
                {visible.map((movement) => {
                  const change = toNumber(movement.qty_change) ?? 0;
                  return (
                    <li
                      key={movement.id}
                      className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                            change >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                          )}
                        >
                          {change >= 0 ? (
                            <ArrowUpRight className="h-4 w-4" aria-hidden />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" aria-hidden />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {humanizeStatus(movement.reason)}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {formatDate(movement.created_at)}
                            {movement.reference_type
                              ? ` · ${humanizeStatus(movement.reference_type)}`
                              : ""}
                            {movement.reference_id
                              ? ` #${String(movement.reference_id).slice(0, 8)}`
                              : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3 pl-10 sm:pl-0">
                        <span className="text-xs text-muted-foreground">
                          {formatNumber(movement.qty_before)} → {formatNumber(movement.qty_after)}
                        </span>
                        <span
                          className={cn(
                            "w-16 text-right text-sm font-semibold tabular-nums",
                            change >= 0 ? "text-success" : "text-destructive"
                          )}
                        >
                          {change > 0 ? "+" : ""}
                          {formatNumber(change)}
                        </span>
                        <StatusBadge tone="neutral">{humanizeStatus(movement.reason)}</StatusBadge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </PanelBody>
      </Panel>
    </div>
  );
}
