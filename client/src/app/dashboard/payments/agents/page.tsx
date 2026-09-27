"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Percent,
  Plus,
  RefreshCw,
  Smartphone,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import api from "@/lib/api";
import { downloadCsv } from "@/lib/csv";
import { toNumber } from "@/lib/format";
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
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import { StatCard } from "@/components/ui/stat-card";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

interface Agent {
  id: string;
  name: string;
  phone?: string | null;
  mpesa_number?: string | null;
  commission_rate?: number | string | null;
  is_active?: boolean | null;
  created_at?: string | null;
}

const EMPTY_FORM = {
  name: "",
  phone: "",
  mpesa_number: "",
  commission_rate: "",
};

type FormState = typeof EMPTY_FORM;

function formatCommission(value: number | string | null | undefined): string {
  const rate = toNumber(value);
  if (rate === null) return "0%";
  return `${Number.isInteger(rate) ? rate : rate.toFixed(2)}%`;
}

export default function MpesaAgentsPage() {
  const toast = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState("active");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Agent | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await api.payments.mpesa.getAgents();
      setAgents(Array.isArray(data) ? data : []);
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
    const active = agents.filter((agent) => agent.is_active !== false);
    const commissionRates = active
      .map((agent) => toNumber(agent.commission_rate) ?? 0)
      .filter((rate) => rate > 0);
    const average = commissionRates.length
      ? commissionRates.reduce((sum, rate) => sum + rate, 0) / commissionRates.length
      : 0;    return { total: agents.length, active: active.length, inactive: agents.length - active.length, average };
  }, [agents]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return agents.filter((agent) => {
      if (statusFilter === "active" && agent.is_active === false) return false;
      if (statusFilter === "inactive" && agent.is_active !== false) return false;
      if (!term) return true;
      return [agent.name, agent.phone, agent.mpesa_number].some((value) =>
        String(value ?? "").toLowerCase().includes(term)
      );
    });
  }, [agents, statusFilter, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => setPage(1), [statusFilter, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (agent: Agent) => {
    setEditing(agent);
    setForm({
      name: agent.name ?? "",
      phone: agent.phone ?? "",
      mpesa_number: agent.mpesa_number ?? "",
      commission_rate:
        agent.commission_rate === null || agent.commission_rate === undefined
          ? ""
          : String(toNumber(agent.commission_rate) ?? 0),
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.mpesa_number.trim()) {
      toast.error("Name, phone, and M-Pesa number are all required");
      return;
    }
    const rate = form.commission_rate.trim() === "" ? 0 : Number(form.commission_rate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      toast.error("Commission rate must be between 0 and 100");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await api.payments.mpesa.updateAgent(editing.id, {
          name: form.name.trim(),
          phone: form.phone.trim(),
          mpesa_number: form.mpesa_number.trim(),
          commission_rate: rate,
        });
        toast.success("Agent updated");
      } else {
        await api.payments.mpesa.createAgent({
          name: form.name.trim(),
          phone: form.phone.trim(),
          mpesa_number: form.mpesa_number.trim(),
          commission_rate: rate,
        });
        toast.success("Agent added");
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the agent");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (agent: Agent) => {
    const nextActive = agent.is_active === false;
    setBusyId(agent.id);
    try {
      await api.payments.mpesa.updateAgent(agent.id, { is_active: nextActive });
      toast.success(nextActive ? `${agent.name} reactivated` : `${agent.name} deactivated`);
      load();
    } catch {
      toast.error("Could not update the agent");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (agent: Agent) => {
    if (!window.confirm(`Delete ${agent.name}? Their transaction history is kept.`)) return;
    setBusyId(agent.id);
    try {
      await api.payments.mpesa.deleteAgent(agent.id);
      toast.success("Agent deleted");
      load();
    } catch {
      toast.error("Could not delete the agent");
    } finally {
      setBusyId(null);
    }
  };

  const exportCsv = () => {
    if (filtered.length === 0) {
      toast.error("There is nothing to export yet");
      return;
    }
    downloadCsv(`bizflow-mpesa-agents-${new Date().toISOString().slice(0, 10)}`, filtered, [
      { header: "Name", value: (row) => row.name },
      { header: "Phone", value: (row) => row.phone ?? "" },
      { header: "M-Pesa number", value: (row) => row.mpesa_number ?? "" },
      { header: "Commission rate", value: (row) => toNumber(row.commission_rate) ?? 0 },
      { header: "Active", value: (row) => (row.is_active === false ? "No" : "Yes") },
    ]);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="M-Pesa agents"
        description="The till and paybill numbers you collect through, and the commission each one earns."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
              Refresh
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" aria-hidden />
              Add agent
            </Button>
          </>
        }
      />

      {error ? (
        <ErrorState title="Could not load agents" onRetry={load} retrying={loading} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            <StatCard label="Agents" value={stats.total} icon={Smartphone} tone="primary" />
            <StatCard label="Active" value={stats.active} icon={UserCheck} tone="success" />
            <StatCard label="Inactive" value={stats.inactive} icon={UserX} tone="neutral" />
            <StatCard
              label="Avg commission"
              value={formatCommission(stats.average)}
              icon={Percent}
              tone="info"
            />
          </div>

          <Panel>
            <PanelHeader>
              <PanelTitle>Agent directory</PanelTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, phone, number"
                  aria-label="Search agents"
                  className="h-8 w-44"
                />
                <div className="flex rounded-md border border-border p-0.5" role="group" aria-label="Filter agents by status">
                  {(["active", "inactive", "all"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setStatusFilter(option)}
                      aria-pressed={statusFilter === option}
                      className={cn(
                        "rounded px-2 py-1 text-xs font-medium capitalize transition-colors",
                        statusFilter === option
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
                  Export
                </Button>
              </div>
            </PanelHeader>
            <PanelBody className="p-0">
              {loading ? (
                <div className="flex justify-center py-16">
                  <Spinner label="Loading agents" />
                </div>
              ) : rows.length === 0 ? (
                <EmptyState
                  icon={Smartphone}
                  title={search || statusFilter !== "all" ? "No agents match your filters" : "No agents yet"}
                  description={
                    search || statusFilter !== "all"
                      ? "Try a different search term or status."
                      : "Add the till and paybill numbers you use to collect M-Pesa payments."
                  }
                  className="m-4 border-0 bg-transparent"
                  action={
                    <Button size="sm" onClick={openCreate}>
                      <Plus className="h-4 w-4" aria-hidden />
                      Add agent
                    </Button>
                  }
                />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                        <tr className="border-b border-border">
                          <th scope="col" className="px-4 py-2 text-left font-medium">Agent</th>
                          <th scope="col" className="px-2 py-2 text-left font-medium">Phone</th>
                          <th scope="col" className="px-2 py-2 text-left font-medium">M-Pesa number</th>
                          <th scope="col" className="px-2 py-2 text-left font-medium">Commission</th>
                          <th scope="col" className="px-2 py-2 text-left font-medium">Status</th>
                          <th scope="col" className="px-4 py-2 text-right font-medium">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {rows.map((agent) => {
                          const inactive = agent.is_active === false;
                          return (
                            <tr key={agent.id} className={cn(inactive && "opacity-60")}>
                              <td className="px-4 py-2 font-medium text-foreground">{agent.name}</td>
                              <td className="whitespace-nowrap px-2 py-2 text-muted-foreground">
                                {agent.phone || "—"}
                              </td>
                              <td className="whitespace-nowrap px-2 py-2 font-mono text-xs text-foreground">
                                {agent.mpesa_number || "—"}
                              </td>
                              <td className="whitespace-nowrap px-2 py-2 tabular-nums text-foreground">
                                {formatCommission(agent.commission_rate)}
                              </td>
                              <td className="px-2 py-2">
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1.5 text-xs font-medium",
                                    inactive ? "text-muted-foreground" : "text-success"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "h-1.5 w-1.5 rounded-full",
                                      inactive ? "bg-muted-foreground" : "bg-success"
                                    )}
                                    aria-hidden
                                  />
                                  {inactive ? "Inactive" : "Active"}
                                </span>
                              </td>
                              <td className="px-4 py-2">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={busyId === agent.id}
                                    onClick={() => toggleActive(agent)}
                                  >
                                    {busyId === agent.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                                    ) : inactive ? (
                                      <UserCheck className="h-3.5 w-3.5" aria-hidden />
                                    ) : (
                                      <UserX className="h-3.5 w-3.5" aria-hidden />
                                    )}
                                    {inactive ? "Activate" : "Deactivate"}
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => openEdit(agent)}>
                                    Edit
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Delete ${agent.name}`}
                                    disabled={busyId === agent.id}
                                    onClick={() => remove(agent)}
                                    className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                  </Button>
                                </div>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit agent" : "Add agent"}</DialogTitle>
            <DialogDescription>
              The M-Pesa number is what customers dial to pay you through this agent.
            </DialogDescription>
          </DialogHeader>

          <FormGrid>
            <FormField label="Name" htmlFor="agent-name" required>
              <Input
                id="agent-name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="e.g. Eastleigh till"
              />
            </FormField>
            <FormField label="Phone" htmlFor="agent-phone" required>
              <Input
                id="agent-phone"
                type="tel"
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="07XX XXX XXX"
              />
            </FormField>
            <FormField label="M-Pesa number" htmlFor="agent-number" required>
              <Input
                id="agent-number"
                value={form.mpesa_number}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, mpesa_number: event.target.value }))
                }
                placeholder="Paybill or till number"
              />
            </FormField>
            <FormField
              label="Commission rate"
              htmlFor="agent-commission"
              hint="Percentage earned on collections through this agent"
            >
              <Input
                id="agent-commission"
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                step="0.01"
                value={form.commission_rate}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, commission_rate: event.target.value }))
                }
                placeholder="0"
              />
            </FormField>
          </FormGrid>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Add agent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
