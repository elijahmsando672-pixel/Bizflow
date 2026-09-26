"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  CircleCheck,
  Minus,
  Package,
  Plus,
  Printer,
  ScanBarcode,
  Search,
  ShoppingCart,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import api from "@/lib/api";
import { formatCurrency, formatNumber, toNumber } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Panel, PanelBody, PanelFooter, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Spinner } from "@/components/ui/spinner";
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

interface PosProduct {
  id: string;
  name: string;
  sku: string | null;
  category_id: string | null;
  category_name: string | null;
  selling_price: number | string;
  stock_qty: number | string;
  is_active?: boolean;
}

interface PosCustomer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
}

interface CartLine {
  product: PosProduct;
  qty: number;
  discount: number;
}

interface CompletedSale {
  id: string;
  invoice_number?: string;
  total: number | string;
  amount_paid?: number | string;
  status: string;
}

const VAT_RATE = 0.16;
const WALK_IN = "__walk_in__";

export default function PointOfSalePage() {
  const toast = useToast();
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [customers, setCustomers] = useState<PosCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState<string>(WALK_IN);
  const [discount, setDiscount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"paid" | "pending">("paid");
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState<CompletedSale | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [productList, customerList] = await Promise.all([
        api.products.getAll() as Promise<PosProduct[]>,
        api.customers.getAll().catch(() => [] as PosCustomer[]),
      ]);
      setProducts((Array.isArray(productList) ? productList : []).filter((p) => p.is_active !== false));
      setCustomers(Array.isArray(customerList) ? customerList : []);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const product of products) {
      if (product.category_id && product.category_name) map.set(product.category_id, product.category_name);
    }
    return [...map.entries()].map(([value, label]) => ({ value, label }));
  }, [products]);

  const visibleProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((product) => {
      if (category !== "all" && product.category_id !== category) return false;
      if (!q) return true;
      return (
        product.name.toLowerCase().includes(q) || (product.sku ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, query, category]);

  const addToCart = (product: PosProduct) => {
    setCart((prev) => {
      const existing = prev.find((line) => line.product.id === product.id);
      const available = toNumber(product.stock_qty) ?? 0;
      if (existing) {
        if (available > 0 && existing.qty >= available) {
          toast.warning(`Only ${formatNumber(available)} of ${product.name} in stock`);
          return prev;
        }
        return prev.map((line) =>
          line.product.id === product.id ? { ...line, qty: line.qty + 1 } : line
        );
      }
      return [...prev, { product, qty: 1, discount: 0 }];
    });
  };

  const setQty = (productId: string, nextQty: number) => {
    setCart((prev) => {
      const line = prev.find((entry) => entry.product.id === productId);
      if (!line) return prev;
      const available = toNumber(line.product.stock_qty) ?? 0;
      if (nextQty > available && available > 0) {
        toast.warning(`Only ${formatNumber(available)} of ${line.product.name} in stock`);
        return prev.map((entry) =>
          entry.product.id === productId ? { ...entry, qty: available } : entry
        );
      }
      return prev
        .map((entry) => (entry.product.id === productId ? { ...entry, qty: nextQty } : entry))
        .filter((entry) => entry.qty > 0);
    });
  };

  const removeLine = (productId: string) =>
    setCart((prev) => prev.filter((line) => line.product.id !== productId));

  const subtotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.qty * (toNumber(line.product.selling_price) ?? 0) - line.discount, 0),
    [cart]
  );
  const vat = useMemo(() => Math.max(0, subtotal) * VAT_RATE, [subtotal]);
  const manualDiscount = useMemo(() => toNumber(discount) ?? 0, [discount]);
  const total = useMemo(
    () => Math.max(0, subtotal + vat - manualDiscount),
    [subtotal, vat, manualDiscount]
  );

  const resetSale = () => {
    setCart([]);
    setDiscount("");
    setCustomerId(WALK_IN);
    setPaymentMethod("paid");
    setCompleted(null);
  };

  const completeSale = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const sale = (await api.sales.create({
        customer_id: customerId === WALK_IN ? undefined : customerId,
        items: cart.map((line) => ({
          product_id: line.product.id,
          product_name: line.product.name,
          qty: line.qty,
          unit_price: toNumber(line.product.selling_price) ?? 0,
          discount: line.discount,
        })),
        discount_amount: manualDiscount,
        status: paymentMethod,
        amount_paid: paymentMethod === "paid" ? total : 0,
      })) as CompletedSale;

      setCompleted(sale);
      toast.success(`Sale ${sale.invoice_number ?? ""} recorded`.trim());
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not record the sale");
    } finally {
      setSubmitting(false);
    }
  };

  if (completed) {
    return (
      <div className="mx-auto max-w-lg">
        <Panel>
          <PanelBody className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
              <CircleCheck className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Sale completed</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Invoice {completed.invoice_number ?? createdLabel(completed.id)}
              </p>
            </div>
            <dl className="mt-2 w-full space-y-1.5 rounded-md border border-border bg-surface p-3 text-sm">
              <Row label="Items" value={String(cart.reduce((sum, line) => sum + line.qty, 0))} />
              <Row label="VAT (16%)" value={formatCurrency(vat)} />
              <Row label="Total" value={formatCurrency(toNumber(completed.total) ?? total)} strong />
              <Row label="Status" value={<StatusBadge status={completed.status} />} />
            </dl>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <Button asChild>
                <a href={`${process.env.NEXT_PUBLIC_API_URL || "/api"}/sales/${completed.id}/receipt/html`} target="_blank" rel="noreferrer">
                  <Printer className="h-4 w-4" aria-hidden />
                  Print receipt
                </a>
              </Button>
              <Button variant="outline" onClick={resetSale}>
                <Plus className="h-4 w-4" aria-hidden />
                New sale
              </Button>
            </div>
          </PanelBody>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Point of Sale"
        description="Ring up a sale, take payment, and print a receipt."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/dashboard/sales">All sales</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/orders">Orders</Link>
            </Button>
          </>
        }
      />

      {loadError ? (
        <ErrorState title="Could not load the catalogue" onRetry={load} retrying={loading} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Panel className="min-w-0">
            <PanelHeader className="gap-2">
              <div className="relative w-full max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name or SKU…"
                  aria-label="Search products"
                  className="h-9 pl-9"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                ) : null}
              </div>
              <div className="w-full sm:w-48">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger aria-label="Filter by category" className="h-9">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </PanelHeader>

            <PanelBody>
              {loading ? (
                <div className="flex justify-center py-16">
                  <Spinner label="Loading catalogue" />
                </div>
              ) : visibleProducts.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="No products match"
                  description="Adjust the search or category filter."
                  action={
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/dashboard/inventory/new">Add a product</Link>
                    </Button>
                  }
                />
              ) : (
                <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                  {visibleProducts.map((product) => {
                    const stock = toNumber(product.stock_qty) ?? 0;
                    const soldOut = stock <= 0;
                    return (
                      <li key={product.id}>
                        <button
                          type="button"
                          onClick={() => addToCart(product)}
                          disabled={soldOut}
                          className={cn(
                            "flex h-full w-full flex-col items-start gap-1 rounded-lg border border-border bg-card p-3 text-left transition-colors",
                            soldOut
                              ? "cursor-not-allowed opacity-60"
                              : "hover:border-primary/50 hover:bg-accent/40"
                          )}
                        >
                          <span className="flex w-full items-start justify-between gap-2">
                            <span className="line-clamp-2 text-sm font-medium text-foreground">
                              {product.name}
                            </span>
                            {soldOut ? (
                              <StatusBadge tone="danger" className="shrink-0">
                                Out
                              </StatusBadge>
                            ) : null}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {product.category_name || "Uncategorised"}
                          </span>
                          <span className="mt-auto flex w-full items-end justify-between gap-2 pt-2">
                            <span className="text-sm font-semibold text-foreground">
                              {formatCurrency(product.selling_price)}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {formatNumber(stock)} in stock
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </PanelBody>
          </Panel>

          <Panel className="flex h-fit flex-col xl:sticky xl:top-[4.5rem]">
            <PanelHeader>
              <PanelTitle className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-primary" aria-hidden />
                Current sale
              </PanelTitle>
              {cart.length > 0 ? (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setCart([])}>
                  Clear
                </Button>
              ) : null}
            </PanelHeader>

            <PanelBody className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="pos-customer" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <UserRound className="h-3.5 w-3.5" aria-hidden />
                  Customer
                </label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger id="pos-customer" aria-label="Select customer" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={WALK_IN}>Walk-in customer</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {cart.length === 0 ? (
                <EmptyState
                  icon={ScanBarcode}
                  title="Cart is empty"
                  description="Tap a product to add it, or scan a barcode."
                  className="border-0 bg-transparent py-8"
                />
              ) : (
                <ul className="divide-y divide-border rounded-md border border-border">
                  {cart.map((line) => {
                    const price = toNumber(line.product.selling_price) ?? 0;
                    return (
                      <li key={line.product.id} className="flex items-center gap-2 px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{line.product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(price)} each
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setQty(line.product.id, line.qty - 1)}
                            aria-label={`Decrease ${line.product.name}`}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <Minus className="h-3.5 w-3.5" aria-hidden />
                          </button>
                          <span className="w-7 text-center text-sm font-medium tabular-nums text-foreground">
                            {line.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQty(line.product.id, line.qty + 1)}
                            aria-label={`Increase ${line.product.name}`}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        </div>
                        <span className="w-24 shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">
                          {formatCurrency(line.qty * price - line.discount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeLine(line.product.id)}
                          aria-label={`Remove ${line.product.name}`}
                          className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="space-y-1.5">
                <label htmlFor="pos-discount" className="text-xs font-medium text-muted-foreground">
                  Discount (KES)
                </label>
                <Input
                  id="pos-discount"
                  type="number"
                  min={0}
                  step={1}
                  value={discount}
                  onChange={(event) => setDiscount(event.target.value)}
                  placeholder="0"
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Payment</span>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={paymentMethod === "paid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPaymentMethod("paid")}
                    className="gap-1.5"
                  >
                    {paymentMethod === "paid" ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
                    Paid in full
                  </Button>
                  <Button
                    type="button"
                    variant={paymentMethod === "pending" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPaymentMethod("pending")}
                    className="gap-1.5"
                  >
                    {paymentMethod === "pending" ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
                    On credit
                  </Button>
                </div>
              </div>
            </PanelBody>

            <PanelFooter className="block space-y-2">
              <dl className="space-y-1.5 text-sm">
                <Row label="Subtotal" value={formatCurrency(subtotal)} />
                <Row label="VAT (16%)" value={formatCurrency(vat)} />
                {manualDiscount > 0 ? <Row label="Discount" value={`− ${formatCurrency(manualDiscount)}`} /> : null}
                <div className="flex items-center justify-between border-t border-border pt-2">
                  <dt className="font-semibold text-foreground">Total</dt>
                  <dd className="text-lg font-semibold tabular-nums text-foreground">
                    {formatCurrency(total)}
                  </dd>
                </div>
              </dl>
              <Button
                className="w-full"
                onClick={completeSale}
                disabled={cart.length === 0 || submitting || total <= 0}
              >
                {submitting ? (
                  <>
                    <Spinner size="sm" label="" className="text-primary-foreground" />
                    Recording…
                  </>
                ) : (
                  <>
                    <ScanBarcode className="h-4 w-4" aria-hidden />
                    Complete sale
                  </>
                )}
              </Button>
            </PanelFooter>
          </Panel>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className={strong ? "font-medium text-foreground" : "text-muted-foreground"}>{label}</dt>
      <dd className={strong ? "font-semibold text-foreground" : "text-foreground"}>{value}</dd>
    </div>
  );
}

function createdLabel(id: string): string {
  return id.slice(0, 8).toUpperCase();
}
