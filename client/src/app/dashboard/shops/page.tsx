"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Clock,
  Download,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Store,
  Trash2,
  UserRound,
} from "lucide-react";
import api from "@/lib/api";
import { downloadCsv } from "@/lib/csv";
import { formatNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { FormField, FormGrid } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
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

const ALL_STATUS = "__all__";
const PAGE_SIZE = 12;

const STATUSES = ["active", "inactive", "closed", "renovating"] as const;

interface Shop {
  id: string;
  name: string;
  location?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: string | null;
  manager_name?: string | null;
  opening_time?: string | null;
  closing_time?: string | null;
}

interface ShopForm {
  name: string;
  location: string;
  manager_name: string;
  phone: string;
  email: string;
  opening_time: string;
  closing_time: string;
  status: string;
}

const EMPTY_FORM: ShopForm = {
  name: "",
  location: "",
  manager_name: "",
  phone: "",
  email: "",
  opening_time: "08:00",
  closing_time: "18:00",
  status: "active",
};

/** TIME columns come back as `HH:MM:SS`; the inputs want `HH:MM`. */
function toTimeInput(value: string | null | undefined): string {
  if (!value) return "";
  const [hours, minutes] = String(value).split(":");
  if (!hours) return "";
  return `${hours.padStart(2, "0")}:${(minutes ?? "00").slice(0, 2)}`;
}

/** `HH:MM` or `HH:MM:SS` -> a short human label. */
function formatHour(value: string | null | undefined): string {
  const trimmed = toTimeInput(value);
  if (!trimmed) return "—";
  const [hours, minutes] = trimmed.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return "—";
  const suffix = hours >= 12 ? "pm" : "am";
  const twelve = hours % 12 === 0 ? 12 : hours % 12;
  return `${twelve}:${String(minutes).padStart(2, "0")}${suffix}`;
}

export default function ShopsPage() {
  const toast = useToast();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL_STATUS);
  const [page, setPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Shop | null>(null);
  const [form, setForm] = useState<ShopForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = (await api.shops.getAll()) as Shop[];
      setShops(Array.isArray(data) ? data : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const active = shops.filter((shop) => String(shop.status ?? "active").toLowerCase() === "active").length;
    const managed = shops.filter((shop) => shop.manager_name).length;
    const contactable = shops.filter((shop) => shop.phone || shop.email).length;
    return { total: shops.length, active, managed, contactable };
  }, [shops]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return shops.filter((shop) => {
      if (query) {
        const haystack = [shop.name, shop.location, shop.manager_name, shop.phone, shop.email]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (status !== ALL_STATUS && String(shop.status ?? "active") !== status) return false;
      return true;
    });
  }, [shops, search, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const openDialog = (shop: Shop | null) => {
    setEditing(shop);
    setForm(
      shop
        ? {
            name: shop.name ?? "",
            location: shop.location ?? "",
            manager_name: shop.manager_name ?? "",
            phone: shop.phone ?? "",
            email: shop.email ?? "",
            opening_time: toTimeInput(shop.opening_time) || "08:00",
            closing_time: toTimeInput(shop.closing_time) || "18:00",
            status: String(shop.status ?? "active"),
          }
        : EMPTY_FORM
    );
    setDialogOpen(true);
  };

  const save = async () => {
    const name = form.name.trim();
    if (!name) {
      toast.error("Give the branch a name");
      return;
    }

    setSaving(true);
    const payload = {
      name,
      location: form.location.trim() || null,
      manager_name: form.manager_name.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      opening_time: form.opening_time || null,
      closing_time: form.closing_time || null,
    };
    try {
      if (editing) {
        await api.shops.update(editing.id, { ...payload, status: form.status });
      } else {
        // `POST /shops` does not accept a status — the column defaults to active.
        await api.shops.create(payload);
      }
      toast.success(editing ? "Branch updated" : "Branch added");
      setDialogOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the branch");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (shop: Shop) => {
    if (!window.confirm(`Delete ${shop.name}? This cannot be undone.`)) return;
    setBusyId(shop.id);
    try {
      await api.shops.delete(shop.id);
      toast.success("Branch deleted");
      load();
    } catch {
      toast.error("Could not delete the branch");
    } finally {
      setBusyId(null);
    }
  };

  const exportCsv = () => {
    if (filtered.length === 0) {
      toast.error("There is nothing to export yet");
      return;
    }
    downloadCsv(`bizflow-branches-${new Date().toISOString().slice(0, 10)}`, filtered, [
      { header: "Branch", value: (row) => row.name },
      { header: "Status", value: (row) => row.status ?? "active" },
      { header: "Location", value: (row) => row.location ?? "" },
      { header: "Manager", value: (row) => row.manager_name ?? "" },
      { header: "Phone", value: (row) => row.phone ?? "" },
      { header: "Email", value: (row) => row.email ?? "" },
      { header: "Opens", value: (row) => toTimeInput(row.opening_time) },
      { header: "Closes", value: (row) => toTimeInput(row.closing_time) },
    ]);
  };

  const clearFilters = () => {
    setSearch("");
    setStatus(ALL_STATUS);
  };

  const filtersActive = Boolean(search) || status !== ALL_STATUS;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Business"
        description="The branches, counters and depots you trade from."
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
            <Button size="sm" onClick={() => openDialog(null)}>
              <Plus className="h-4 w-4" aria-hidden />
              Add branch
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard label="Branches" value={formatNumber(stats.total)} icon={Building2} tone="primary" />
        <StatCard label="Open" value={formatNumber(stats.active)} icon={Store} tone="success" />
        <StatCard label="With a manager" value={formatNumber(stats.managed)} icon={UserRound} tone="info" />
        <StatCard
          label="Contactable"
          value={formatNumber(stats.contactable)}
          icon={Phone}
          tone={stats.contactable < stats.total ? "warning" : "neutral"}
        />
      </div>

      {error ? (
        <ErrorState title="Could not load branches" onRetry={load} retrying={loading} />
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
            <PanelBody className="grid gap-3 sm:grid-cols-2">
              <FormField label="Search" htmlFor="shops-search">
                <Input
                  id="shops-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Branch, location or manager"
                  className="h-9"
                />
              </FormField>
              <FormField label="Status" htmlFor="shops-status">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="shops-status" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_STATUS}>All statuses</SelectItem>
                    {STATUSES.map((entry) => (
                      <SelectItem key={entry} value={entry}>
                        {entry.charAt(0).toUpperCase() + entry.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader>
              <PanelTitle>
                {filtered.length} {filtered.length === 1 ? "branch" : "branches"}
              </PanelTitle>
            </PanelHeader>
            <PanelBody className="p-0">
              {loading ? (
                <div className="flex justify-center py-16">
                  <Spinner label="Loading branches" />
                </div>
              ) : rows.length === 0 ? (
                <EmptyState
                  icon={filtersActive ? Building2 : Store}
                  title={filtersActive ? "No branches match these filters" : "No branches yet"}
                  description={
                    filtersActive
                      ? "Try a different search term or status."
                      : "Add your first branch so you can record where each sale happened."
                  }
                  className="m-4 border-0 bg-transparent"
                  action={
                    filtersActive ? (
                      <Button size="sm" variant="outline" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => openDialog(null)}>
                        <Plus className="h-4 w-4" aria-hidden />
                        Add branch
                      </Button>
                    )
                  }
                />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-sm">
                      <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                        <tr className="border-b border-border">
                          <th scope="col" className="px-4 py-2 text-left font-medium">Branch</th>
                          <th scope="col" className="px-2 py-2 text-left font-medium">Location</th>
                          <th scope="col" className="hidden px-2 py-2 text-left font-medium md:table-cell">Manager</th>
                          <th scope="col" className="px-2 py-2 text-left font-medium">Contact</th>
                          <th scope="col" className="hidden px-2 py-2 text-left font-medium lg:table-cell">Hours</th>
                          <th scope="col" className="px-4 py-2 text-right font-medium">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {rows.map((shop) => (
                          <tr key={shop.id}>
                            <td className="px-4 py-2">
                              <span className="font-medium text-foreground">{shop.name}</span>
                              <span className="mt-0.5 block">
                                <StatusBadge status={shop.status ?? "active"} />
                              </span>
                            </td>
                            <td className="px-2 py-2 text-muted-foreground">
                              {shop.location ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                                  {shop.location}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="hidden px-2 py-2 text-muted-foreground md:table-cell">
                              {shop.manager_name || "—"}
                            </td>
                            <td className="px-2 py-2 text-muted-foreground">
                              <span className="flex flex-col gap-0.5">
                                {shop.phone ? (
                                  <span className="inline-flex items-center gap-1.5">
                                    <Phone className="h-3 w-3 shrink-0" aria-hidden />
                                    {shop.phone}
                                  </span>
                                ) : null}
                                {shop.email ? (
                                  <span className="inline-flex items-center gap-1.5 truncate">
                                    <Mail className="h-3 w-3 shrink-0" aria-hidden />
                                    {shop.email}
                                  </span>
                                ) : null}
                                {!shop.phone && !shop.email ? "—" : null}
                              </span>
                            </td>
                            <td className="hidden whitespace-nowrap px-2 py-2 text-muted-foreground lg:table-cell">
                              {shop.opening_time || shop.closing_time ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <Clock className="h-3 w-3 shrink-0" aria-hidden />
                                  {formatHour(shop.opening_time)} – {formatHour(shop.closing_time)}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Edit ${shop.name}`}
                                  onClick={() => openDialog(shop)}
                                  className="h-8 w-8"
                                >
                                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Delete ${shop.name}`}
                                  disabled={busyId === shop.id}
                                  onClick={() => remove(shop)}
                                  className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit branch" : "Add branch"}</DialogTitle>
            <DialogDescription>
              Where this branch is, who runs it, and when it is open.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <FormField label="Branch name" htmlFor="shop-name" required>
              <Input
                id="shop-name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="e.g. Nairobi Main Store"
              />
            </FormField>

            <FormField label="Location" htmlFor="shop-location">
              <Input
                id="shop-location"
                value={form.location}
                onChange={(event) => setForm({ ...form, location: event.target.value })}
                placeholder="Industrial Area, Nairobi"
              />
            </FormField>

            <FormField label="Manager" htmlFor="shop-manager">
              <Input
                id="shop-manager"
                value={form.manager_name}
                onChange={(event) => setForm({ ...form, manager_name: event.target.value })}
                placeholder="Who runs this branch"
              />
            </FormField>

            <FormGrid>
              <FormField label="Phone" htmlFor="shop-phone">
                <Input
                  id="shop-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  placeholder="+254 700 000000"
                />
              </FormField>
              <FormField label="Email" htmlFor="shop-email">
                <Input
                  id="shop-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="branch@example.com"
                />
              </FormField>
            </FormGrid>

            <FormGrid>
              <FormField label="Opens" htmlFor="shop-opens">
                <Input
                  id="shop-opens"
                  type="time"
                  value={form.opening_time}
                  onChange={(event) => setForm({ ...form, opening_time: event.target.value })}
                />
              </FormField>
              <FormField label="Closes" htmlFor="shop-closes">
                <Input
                  id="shop-closes"
                  type="time"
                  value={form.closing_time}
                  onChange={(event) => setForm({ ...form, closing_time: event.target.value })}
                />
              </FormField>
            </FormGrid>

            {editing ? (
              <FormField label="Status" htmlFor="shop-status">
                <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
                  <SelectTrigger id="shop-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((entry) => (
                      <SelectItem key={entry} value={entry}>
                        {entry.charAt(0).toUpperCase() + entry.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Add branch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
