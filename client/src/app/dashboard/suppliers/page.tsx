"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Building, Mail, Phone, Plus, RefreshCw, Store, Trash2, Truck } from "lucide-react";
import api from "@/lib/api";
import { formatCurrency, formatDate, formatNumber, toNumber } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Spinner } from "@/components/ui/spinner";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface Vendor {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  contact_person?: string | null;
  payment_terms?: string | null;
  notes?: string | null;
  total_orders?: number | string;
  total_spent?: number | string;
}

interface PurchaseOrder {
  id: string;
  order_number?: string | null;
  vendor_id?: string | null;
  vendor_name?: string | null;
  status?: string | null;
  order_date?: string | null;
  expected_date?: string | null;
  total?: number | string;
  created_at?: string | null;
  created_by_name?: string | null;
}

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  address: "",
  contact_person: "",
  payment_terms: "",
  notes: "",
};

export default function SuppliersPage() {
  const toast = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [orderStatus, setOrderStatus] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [vendorList, orderList] = await Promise.all([
        api.procurement.getVendors() as Promise<Vendor[]>,
        api.procurement
          .getPurchaseOrders(orderStatus === "all" ? undefined : orderStatus)
          .catch(() => [] as PurchaseOrder[]),
      ]);
      setVendors(Array.isArray(vendorList) ? vendorList : []);
      setOrders(Array.isArray(orderList) ? orderList : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [orderStatus]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => {
    const spend = vendors.reduce((sum, vendor) => sum + (toNumber(vendor.total_spent) ?? 0), 0);
    const openOrders = orders.filter((order) =>
      ["pending", "approved", "ordered", "partial"].includes(String(order.status ?? "").toLowerCase())
    ).length;
    return { spend, openOrders };
  }, [vendors, orders]);

  const openDialog = (vendor: Vendor | null) => {
    setEditing(vendor);
    setForm(
      vendor
        ? {
            name: vendor.name ?? "",
            email: vendor.email ?? "",
            phone: vendor.phone ?? "",
            address: vendor.address ?? "",
            contact_person: vendor.contact_person ?? "",
            payment_terms: vendor.payment_terms ?? "",
            notes: vendor.notes ?? "",
          }
        : EMPTY_FORM
    );
    setDialogOpen(true);
  };

  const save = async () => {
    const name = form.name.trim();
    if (!name) return;
    setSaving(true);
    const payload = {
      name,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      contact_person: form.contact_person.trim() || null,
      payment_terms: form.payment_terms.trim() || null,
      notes: form.notes.trim() || null,
    };
    try {
      if (editing) await api.procurement.updateVendor(editing.id, payload);
      else await api.procurement.createVendor(payload);
      toast.success(editing ? "Supplier updated" : "Supplier added");
      setDialogOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the supplier");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (vendor: Vendor) => {
    if (!window.confirm(`Delete ${vendor.name}? This cannot be undone.`)) return;
    setBusyId(vendor.id);
    try {
      await api.procurement.deleteVendor(vendor.id);
      toast.success("Supplier deleted");
      load();
    } catch {
      toast.error("Could not delete the supplier");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Suppliers"
        description="The vendors you buy from and the purchase orders you have raised."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
              Refresh
            </Button>
            <Button size="sm" onClick={() => openDialog(null)}>
              <Plus className="h-4 w-4" aria-hidden />
              Add supplier
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-2.5">
        <StatCard label="Suppliers" value={formatNumber(vendors.length)} icon={Store} />
        <StatCard label="Purchase orders" value={formatNumber(orders.length)} icon={Truck} tone="info" />
        <StatCard label="Total spend" value={formatCurrency(totals.spend)} icon={Building} tone="warning" />
      </div>

      {error ? (
        <ErrorState title="Could not load suppliers" onRetry={load} retrying={loading} />
      ) : (
        <Tabs defaultValue="suppliers">
          <TabsList>
            <TabsTrigger value="suppliers">Suppliers ({vendors.length})</TabsTrigger>
            <TabsTrigger value="orders">Purchase orders ({orders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="suppliers">
            <Panel>
              <PanelHeader>
                <PanelTitle>Supplier directory</PanelTitle>
              </PanelHeader>
              <PanelBody className="p-0">
                {loading ? (
                  <div className="flex justify-center py-16">
                    <Spinner label="Loading suppliers" />
                  </div>
                ) : vendors.length === 0 ? (
                  <EmptyState
                    icon={Store}
                    title="No suppliers yet"
                    description="Add the vendors you buy stock from to track orders and spend."
                    className="m-4 border-0 bg-transparent"
                    action={
                      <Button size="sm" onClick={() => openDialog(null)}>
                        <Plus className="h-4 w-4" aria-hidden />
                        Add supplier
                      </Button>
                    }
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {vendors.map((vendor) => (
                      <li
                        key={vendor.id}
                        className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{vendor.name}</p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                            {vendor.contact_person ? <span>{vendor.contact_person}</span> : null}
                            {vendor.phone ? (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="h-3 w-3" aria-hidden />
                                {vendor.phone}
                              </span>
                            ) : null}
                            {vendor.email ? (
                              <span className="inline-flex items-center gap-1 truncate">
                                <Mail className="h-3 w-3" aria-hidden />
                                {vendor.email}
                              </span>
                            ) : null}
                            {vendor.payment_terms ? <span>{vendor.payment_terms}</span> : null}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formatNumber(vendor.total_orders)} orders
                          </span>
                          <span className="text-sm font-semibold tabular-nums text-foreground">
                            {formatCurrency(vendor.total_spent)}
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => openDialog(vendor)}>
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Delete ${vendor.name}`}
                            onClick={() => remove(vendor)}
                            disabled={busyId === vendor.id}
                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </PanelBody>
            </Panel>
          </TabsContent>

          <TabsContent value="orders">
            <Panel>
              <PanelHeader>
                <PanelTitle>Purchase orders</PanelTitle>
                <div className="w-40">
                  <Select value={orderStatus} onValueChange={setOrderStatus}>
                    <SelectTrigger aria-label="Filter purchase orders by status" className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="ordered">Ordered</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </PanelHeader>
              <PanelBody className="p-0">
                {loading ? (
                  <div className="flex justify-center py-16">
                    <Spinner label="Loading purchase orders" />
                  </div>
                ) : orders.length === 0 ? (
                  <EmptyState
                    icon={Truck}
                    title="No purchase orders"
                    description="Purchase orders raised against your suppliers will appear here."
                    className="m-4 border-0 bg-transparent"
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                        <tr>
                          <th scope="col" className="px-4 py-2 text-left font-medium">Order</th>
                          <th scope="col" className="px-2 py-2 text-left font-medium">Supplier</th>
                          <th scope="col" className="px-2 py-2 text-left font-medium">Status</th>
                          <th scope="col" className="px-2 py-2 text-left font-medium">Ordered</th>
                          <th scope="col" className="px-4 py-2 text-right font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {orders.map((order) => (
                          <tr key={order.id}>
                            <td className="px-4 py-2 font-medium text-foreground">
                              {order.order_number || order.id.slice(0, 8).toUpperCase()}
                            </td>
                            <td className="px-2 py-2 text-muted-foreground">
                              {order.vendor_name || "Unassigned"}
                            </td>
                            <td className="px-2 py-2">
                              <StatusBadge status={order.status} />
                            </td>
                            <td className="px-2 py-2 text-muted-foreground">
                              {formatDate(order.order_date ?? order.created_at)}
                            </td>
                            <td className="px-4 py-2 text-right font-medium tabular-nums text-foreground">
                              {formatCurrency(order.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </PanelBody>
            </Panel>
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit supplier" : "Add supplier"}</DialogTitle>
            <DialogDescription>
              Contact and payment details used on purchase orders.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="vendor-name" className="text-sm font-medium text-foreground">
                Supplier name
              </label>
              <Input
                id="vendor-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Supplier business name"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="vendor-contact" className="text-sm font-medium text-foreground">
                  Contact person
                </label>
                <Input
                  id="vendor-contact"
                  value={form.contact_person}
                  onChange={(event) => setForm({ ...form, contact_person: event.target.value })}
                  placeholder="Jane Wanjiru"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="vendor-phone" className="text-sm font-medium text-foreground">
                  Phone
                </label>
                <Input
                  id="vendor-phone"
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  placeholder="07xx xxx xxx"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="vendor-email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  id="vendor-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="sales@supplier.co.ke"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="vendor-terms" className="text-sm font-medium text-foreground">
                  Payment terms
                </label>
                <Input
                  id="vendor-terms"
                  value={form.payment_terms}
                  onChange={(event) => setForm({ ...form, payment_terms: event.target.value })}
                  placeholder="Net 30"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="vendor-notes" className="text-sm font-medium text-foreground">
                Notes
              </label>
              <Textarea
                id="vendor-notes"
                rows={2}
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                placeholder="Optional"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving || !form.name.trim()}>
              {saving ? "Saving…" : "Save supplier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
