"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Mail, MapPin, Pencil, Phone, Plus, RefreshCw, Search, Trash2, User } from "lucide-react";
import api from "@/lib/api";
import { formatDate, toNumber } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Panel, PanelBody } from "@/components/ui/panel";
import { Spinner } from "@/components/ui/spinner";
import { StatCard } from "@/components/ui/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  company?: string | null;
  credit_limit?: number | string;
  created_at?: string | null;
}

const EMPTY_FORM = { name: "", email: "", phone: "", address: "", company: "" };

export default function CustomersPage() {
  const toast = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await api.customers.getAll();
      setCustomers(Array.isArray(data) ? data : []);
    } catch {
      setError(true);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("new") === "1") {
      setEditing(null);
      setForm(EMPTY_FORM);
      document.getElementById("customer-name")?.focus();
    }
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((customer) =>
      [customer.name, customer.email, customer.phone, customer.company]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [customers, query]);

  const stats = useMemo(() => {
    const withEmail = customers.filter((customer) => customer.email).length;
    const credit = customers.reduce((sum, customer) => sum + (toNumber(customer.credit_limit) ?? 0), 0);
    return { withEmail, credit };
  }, [customers]);

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
      };
      if (editing) {
        await api.customers.update(editing.id, payload);
        toast.success("Customer updated");
      } else {
        await api.customers.create(payload);
        toast.success("Customer created");
      }
      setForm(EMPTY_FORM);
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the customer");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (customer: Customer) => {
    if (!window.confirm(`Delete "${customer.name}"? This cannot be undone.`)) return;
    try {
      await api.customers.delete(customer.id);
      toast.success("Customer deleted");
      if (editing?.id === customer.id) setEditing(null);
      load();
    } catch {
      toast.error("Could not delete the customer");
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Customers"
        description="Everyone who buys from your business, with contact details and credit limits."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setForm(EMPTY_FORM);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden />
              New customer
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-2.5">
        <StatCard label="Customers" value={String(customers.length)} icon={User} />
        <StatCard label="With email" value={String(stats.withEmail)} icon={Mail} tone="info" />
        <StatCard label="Credit limits" value={String(stats.credit)} icon={MapPin} tone="neutral" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <PanelBody className="p-0">
            <div className="border-b border-border p-3">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name, email, or phone…"
                  aria-label="Search customers"
                  className="h-9 pl-9"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner label="Loading customers" />
              </div>
            ) : error ? (
              <ErrorState title="Could not load customers" onRetry={load} className="m-4" />
            ) : visible.length === 0 ? (
              <EmptyState
                icon={User}
                title={customers.length === 0 ? "No customers yet" : "No customers match your search"}
                description={
                  customers.length === 0 ? "Add a customer to start tracking sales and credit." : undefined
                }
                className="m-4 border-0 bg-transparent"
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-accent-foreground">
                            {customer.name.slice(0, 2).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{customer.name}</p>
                            {customer.company ? (
                              <p className="truncate text-xs text-muted-foreground">{customer.company}</p>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5 text-xs text-muted-foreground">
                          {customer.email ? (
                            <p className="flex items-center gap-1.5">
                              <Mail className="h-3 w-3 shrink-0" aria-hidden />
                              <span className="truncate">{customer.email}</span>
                            </p>
                          ) : null}
                          {customer.phone ? (
                            <p className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3 shrink-0" aria-hidden />
                              {customer.phone}
                            </p>
                          ) : null}
                          {!customer.email && !customer.phone ? (
                            <p className="italic">No contact details</p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(customer.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`Edit ${customer.name}`}
                            onClick={() => {
                              setEditing(customer);
                              setForm({
                                name: customer.name ?? "",
                                email: customer.email ?? "",
                                phone: customer.phone ?? "",
                                address: customer.address ?? "",
                                company: customer.company ?? "",
                              });
                            }}
                          >
                            <Pencil className="h-4 w-4" aria-hidden />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`Delete ${customer.name}`}
                            onClick={() => remove(customer)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" aria-hidden />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </PanelBody>
        </Panel>

        <Panel className="h-fit">
          <PanelBody>
            <h2 className="text-sm font-semibold text-foreground">
              {editing ? `Edit ${editing.name}` : "New customer"}
            </h2>
            <div className="mt-3 space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="customer-name" className="text-sm font-medium text-foreground">
                  Name
                </label>
                <Input
                  id="customer-name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="e.g. Amina Wanjiru"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="customer-email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  id="customer-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="amina@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="customer-phone" className="text-sm font-medium text-foreground">
                  Phone
                </label>
                <Input
                  id="customer-phone"
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  placeholder="+254 700 000000"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="customer-address" className="text-sm font-medium text-foreground">
                  Address
                </label>
                <Textarea
                  id="customer-address"
                  rows={2}
                  value={form.address}
                  onChange={(event) => setForm({ ...form, address: event.target.value })}
                  placeholder="Nairobi, Kenya"
                />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={save} disabled={saving || !form.name.trim()}>
                  {saving ? "Saving…" : editing ? "Save changes" : "Create customer"}
                </Button>
                {editing ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditing(null);
                      setForm(EMPTY_FORM);
                    }}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
            </div>
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}
