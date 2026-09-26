"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckSquare, Package, RefreshCw, ShoppingCart, Square, Wallet } from "lucide-react";
import api from "@/lib/api";
import { formatCurrency, formatNumber, toNumber } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Panel, PanelBody, PanelFooter, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Spinner } from "@/components/ui/spinner";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface RestockItem {
  id: string;
  name: string;
  sku?: string | null;
  category_name?: string | null;
  stock_qty?: number | string;
  reorder_level?: number | string;
  cost_price?: number | string;
  selling_price?: number | string;
  suggested_qty?: number | string;
  estimated_cost?: number | string;
}

interface VendorOption {
  id: string;
  name: string;
}

const MULTIPLIERS = [1, 2, 3, 4];

export default function BudgetsPage() {
  const toast = useToast();
  const [items, setItems] = useState<RestockItem[]>([]);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [multiplier, setMultiplier] = useState(2);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [vendorId, setVendorId] = useState("none");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [budget, vendorList] = await Promise.all([
        api.dashboard.getRestockBudget(multiplier) as Promise<{ items?: RestockItem[] }>,
        api.procurement.getVendors().catch(() => [] as VendorOption[]),
      ]);
      const list = Array.isArray(budget?.items) ? budget.items : [];
      setItems(list);
      setSelected(new Set(list.map((item) => item.id)));
      setVendors(Array.isArray(vendorList) ? vendorList : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [multiplier]);

  useEffect(() => {
    load();
  }, [load]);

  const chosen = useMemo(() => items.filter((item) => selected.has(item.id)), [items, selected]);

  const totals = useMemo(() => {
    const subtotal = chosen.reduce((sum, item) => sum + (toNumber(item.estimated_cost) ?? 0), 0);
    const tax = Math.round(subtotal * 0.16);
    return { subtotal, tax, total: subtotal + tax, units: chosen.reduce((sum, item) => sum + (toNumber(item.suggested_qty) ?? 0), 0) };
  }, [chosen]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const createOrder = async () => {
    if (chosen.length === 0) return;
    setCreating(true);
    try {
      const result = (await api.dashboard.createRestockBudget({
        items: chosen.map((item) => ({
          product_id: item.id,
          name: item.name,
          stock_qty: toNumber(item.stock_qty) ?? 0,
          reorder_level: toNumber(item.reorder_level) ?? 0,
          cost_price: toNumber(item.cost_price) ?? 0,
        })),
        vendor_id: vendorId === "none" ? null : vendorId,
        multiplier,
        notes: notes.trim() || undefined,
      })) as { purchaseOrder?: { po_number?: string } };
      toast.success(`Draft order ${result?.purchaseOrder?.po_number ?? ""} created`.trim());
      setNotes("");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the restock order");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Budgets"
        description="Plan what to restock, what it will cost, and raise a draft purchase order in one step."
        actions={
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Items to restock" value={formatNumber(items.length)} icon={Package} tone="warning" />
        <StatCard label="Units required" value={formatNumber(totals.units)} icon={ShoppingCart} tone="info" />
        <StatCard label="Estimated cost" value={formatCurrency(totals.subtotal)} icon={Wallet} />
        <StatCard label="With VAT" value={formatCurrency(totals.total)} icon={Wallet} tone="primary" />
      </div>

      {error ? (
        <ErrorState title="Could not load the restock plan" onRetry={load} retrying={loading} />
      ) : (
        <Panel>
          <PanelHeader className="gap-2">
            <div>
              <PanelTitle>Restock plan</PanelTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Items at or below their reorder level, sized to {multiplier}× the reorder level.
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
              {MULTIPLIERS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMultiplier(option)}
                  aria-pressed={multiplier === option}
                  className={cn(
                    "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                    multiplier === option
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {option}×
                </button>
              ))}
            </div>
          </PanelHeader>

          <PanelBody className="p-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner label="Loading restock plan" />
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Stock levels are healthy"
                description="Nothing needs restocking at the current multiplier. Try a higher multiple to plan ahead."
                className="m-4 border-0 bg-transparent"
              />
            ) : (
              <ul className="divide-y divide-border">
                {items.map((item) => {
                  const isSelected = selected.has(item.id);
                  const stock = toNumber(item.stock_qty) ?? 0;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => toggle(item.id)}
                        aria-pressed={isSelected}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40",
                          isSelected && "bg-info/5"
                        )}
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4.5 w-4.5 shrink-0 text-primary" aria-hidden />
                        ) : (
                          <Square className="h-4.5 w-4.5 shrink-0 text-muted-foreground" aria-hidden />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {item.category_name || "Uncategorised"} · {formatNumber(stock)} in stock ·
                            reorder at {formatNumber(item.reorder_level)}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold tabular-nums text-foreground">
                            +{formatNumber(item.suggested_qty)} units
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(item.estimated_cost)}
                          </p>
                        </div>
                        {stock === 0 ? <StatusBadge tone="danger">Out</StatusBadge> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </PanelBody>

          <PanelFooter className="block space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="budget-vendor" className="text-xs font-medium text-muted-foreground">
                  Supplier
                </label>
                <Select value={vendorId} onValueChange={setVendorId}>
                  <SelectTrigger id="budget-vendor" aria-label="Supplier for the restock order" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No supplier yet</SelectItem>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="budget-notes" className="text-xs font-medium text-muted-foreground">
                  Notes
                </label>
                <Input
                  id="budget-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Optional note on the order"
                  className="h-9"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {chosen.length} of {items.length} items selected ·{" "}
                <span className="font-semibold text-foreground">{formatCurrency(totals.total)}</span> incl. VAT
              </p>
              <Button onClick={createOrder} disabled={creating || chosen.length === 0}>
                {creating ? "Creating…" : "Create draft purchase order"}
              </Button>
            </div>
          </PanelFooter>
        </Panel>
      )}
    </div>
  );
}
