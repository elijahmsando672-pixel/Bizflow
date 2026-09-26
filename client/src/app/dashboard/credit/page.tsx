"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  HandCoins,
  Plus,
  ReceiptText,
  RefreshCw,
  Trash2,
  Wallet,
} from "lucide-react";
import api from "@/lib/api";
import { formatCurrency, toNumber } from "@/lib/format";
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
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface Debtor {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  opening_balance?: number | string;
  total_owed?: number | string;
  total_paid?: number | string;
}

interface Creditor {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  opening_balance?: number | string;
  balance?: number | string;
}

interface DebtorSummary {
  totalOwed?: number;
  totalPaid?: number;
  overdueCount?: number;
}

type PartyDialog =
  | { kind: "debtor" | "creditor"; party: Debtor | Creditor | null }
  | { kind: "invoice" | "payment"; party: Debtor }
  | null;

export default function CreditPage() {
  const toast = useToast();
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [creditors, setCreditors] = useState<Creditor[]>([]);
  const [summary, setSummary] = useState<DebtorSummary>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dialog, setDialog] = useState<PartyDialog>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [partyForm, setPartyForm] = useState({ name: "", email: "", phone: "", opening_balance: "" });
  const [entryForm, setEntryForm] = useState({ amount: "", reference: "", date: "", notes: "", due_date: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [debtorList, creditorList, debtorSummary] = await Promise.all([
        api.debtors.getAll() as Promise<Debtor[]>,
        api.creditors.getAll() as Promise<Creditor[]>,
        api.debtors.getSummary().catch(() => ({}) as DebtorSummary),
      ]);
      setDebtors(Array.isArray(debtorList) ? debtorList : []);
      setCreditors(Array.isArray(creditorList) ? creditorList : []);
      setSummary((debtorSummary as DebtorSummary) ?? {});
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => {
    const receivable = debtors.reduce(
      (sum, debtor) =>
        sum +
        Math.max(
          0,
          (toNumber(debtor.total_owed) ?? 0) + (toNumber(debtor.opening_balance) ?? 0) - (toNumber(debtor.total_paid) ?? 0)
        ),
      0
    );
    const payable = creditors.reduce(
      (sum, creditor) => sum + Math.max(0, (toNumber(creditor.balance) ?? 0) + (toNumber(creditor.opening_balance) ?? 0)),
      0
    );
    return { receivable, payable, net: receivable - payable };
  }, [debtors, creditors]);

  const openPartyDialog = (kind: "debtor" | "creditor", party: Debtor | Creditor | null) => {
    setPartyForm({
      name: party?.name ?? "",
      email: party?.email ?? "",
      phone: party?.phone ?? "",
      opening_balance: party ? String(toNumber(party.opening_balance) ?? 0) : "0",
    });
    setDialog({ kind, party });
  };

  const openEntryDialog = (kind: "invoice" | "payment", party: Debtor) => {
    setEntryForm({
      amount: "",
      reference: kind === "invoice" ? "" : "",
      date: new Date().toISOString().slice(0, 10),
      notes: "",
      due_date: "",
    });
    setDialog({ kind, party });
  };

  const saveParty = async () => {
    if (!dialog || (dialog.kind !== "debtor" && dialog.kind !== "creditor")) return;
    const name = partyForm.name.trim();
    if (!name) return;
    setSaving(true);
    const payload = {
      name,
      email: partyForm.email.trim() || "",
      phone: partyForm.phone.trim() || "",
      opening_balance: toNumber(partyForm.opening_balance) ?? 0,
      notes: "",
    };
    try {
      if (dialog.kind === "debtor") {
        if (dialog.party) await api.debtors.update(dialog.party.id, payload);
        else await api.debtors.create(payload);
      } else if (dialog.party) {
        await api.creditors.update(dialog.party.id, payload);
      } else {
        await api.creditors.create(payload);
      }
      toast.success(dialog.party ? "Details updated" : `${dialog.kind === "debtor" ? "Debtor" : "Creditor"} added`);
      setDialog(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const saveEntry = async () => {
    if (!dialog || (dialog.kind !== "invoice" && dialog.kind !== "payment")) return;
    const amount = toNumber(entryForm.amount);
    if (!amount || amount <= 0) {
      toast.error("Enter an amount greater than zero");
      return;
    }
    setSaving(true);
    try {
      if (dialog.kind === "invoice") {
        await api.debtors.createInvoice(dialog.party.id, {
          reference: entryForm.reference.trim() || `Invoice ${new Date().toLocaleDateString("en-KE")}`,
          amount,
          date: entryForm.date || undefined,
          due_date: entryForm.due_date || undefined,
          notes: entryForm.notes.trim() || undefined,
        });
        toast.success("Credit invoice recorded");
      } else {
        await api.debtors.recordPayment(dialog.party.id, {
          amount,
          date: entryForm.date || undefined,
          reference: entryForm.reference.trim() || undefined,
          notes: entryForm.notes.trim() || undefined,
        });
        toast.success("Payment recorded");
      }
      setDialog(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the transaction");
    } finally {
      setSaving(false);
    }
  };

  const payCreditor = async (creditor: Creditor) => {
    setBusyId(creditor.id);
    try {
      await api.creditors.recordPayment(creditor.id, {
        amount: toNumber(creditor.balance) ?? 0,
        date: new Date().toISOString().slice(0, 10),
        reference: `Payment to ${creditor.name}`,
      });
      toast.success(`Payment to ${creditor.name} recorded`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not record the payment");
    } finally {
      setBusyId(null);
    }
  };

  const removeParty = async (kind: "debtor" | "creditor", id: string, name: string) => {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    setBusyId(id);
    try {
      if (kind === "debtor") await api.debtors.delete(id);
      else await api.creditors.delete(id);
      toast.success(`${kind === "debtor" ? "Debtor" : "Creditor"} deleted`);
      load();
    } catch {
      toast.error("Could not delete the record");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Credit"
        description="Track who owes you, who you owe, and every credit transaction."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
              Refresh
            </Button>
            <Button size="sm" onClick={() => openPartyDialog("debtor", null)}>
              <Plus className="h-4 w-4" aria-hidden />
              Add debtor
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard
          label="Owed to you"
          value={formatCurrency(totals.receivable)}
          icon={ArrowUpRight}
          tone="success"
        />
        <StatCard
          label="You owe"
          value={formatCurrency(totals.payable)}
          icon={ArrowDownRight}
          tone="warning"
        />
        <StatCard
          label="Net position"
          value={formatCurrency(totals.net)}
          icon={Wallet}
          tone={totals.net >= 0 ? "success" : "danger"}
        />
        <StatCard
          label="Overdue invoices"
          value={String(toNumber(summary.overdueCount) ?? 0)}
          icon={ReceiptText}
          tone={(toNumber(summary.overdueCount) ?? 0) > 0 ? "danger" : "neutral"}
        />
      </div>

      {error ? (
        <ErrorState title="Could not load credit records" onRetry={load} retrying={loading} />
      ) : (
        <Tabs defaultValue="debtors">
          <TabsList>
            <TabsTrigger value="debtors">Debtor accounts ({debtors.length})</TabsTrigger>
            <TabsTrigger value="creditors">Creditor accounts ({creditors.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="debtors">
            <Panel>
              <PanelHeader>
                <PanelTitle>Debtor accounts</PanelTitle>
                <Button variant="outline" size="sm" onClick={() => openPartyDialog("debtor", null)}>
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  Add debtor
                </Button>
              </PanelHeader>
              <PanelBody className="p-0">
                {loading ? (
                  <div className="flex justify-center py-16">
                    <Spinner label="Loading debtors" />
                  </div>
                ) : debtors.length === 0 ? (
                  <EmptyState
                    icon={HandCoins}
                    title="No debtor accounts"
                    description="Add a customer who buys on credit to start tracking balances."
                    className="m-4 border-0 bg-transparent"
                    action={
                      <Button size="sm" onClick={() => openPartyDialog("debtor", null)}>
                        <Plus className="h-4 w-4" aria-hidden />
                        Add debtor
                      </Button>
                    }
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {debtors.map((debtor) => {
                      const balance = Math.max(
                        0,
                        (toNumber(debtor.total_owed) ?? 0) +
                          (toNumber(debtor.opening_balance) ?? 0) -
                          (toNumber(debtor.total_paid) ?? 0)
                      );
                      return (
                        <li
                          key={debtor.id}
                          className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-medium text-foreground">{debtor.name}</p>
                              {balance > 0 ? (
                                <StatusBadge tone="warning" dot>
                                  Outstanding
                                </StatusBadge>
                              ) : (
                                <StatusBadge tone="success" dot>
                                  Settled
                                </StatusBadge>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {debtor.phone || debtor.email || "No contact details"} · invoiced{" "}
                              {formatCurrency(debtor.total_owed)} · paid {formatCurrency(debtor.total_paid)}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold tabular-nums text-foreground">
                              {formatCurrency(balance)}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEntryDialog("invoice", debtor)}
                            >
                              <ReceiptText className="h-3.5 w-3.5" aria-hidden />
                              Invoice
                            </Button>
                            <Button size="sm" onClick={() => openEntryDialog("payment", debtor)}>
                              Record payment
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openPartyDialog("debtor", debtor)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Delete ${debtor.name}`}
                              onClick={() => removeParty("debtor", debtor.id, debtor.name)}
                              disabled={busyId === debtor.id}
                              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden />
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </PanelBody>
            </Panel>
          </TabsContent>

          <TabsContent value="creditors">
            <Panel>
              <PanelHeader>
                <PanelTitle>Creditor accounts</PanelTitle>
                <Button variant="outline" size="sm" onClick={() => openPartyDialog("creditor", null)}>
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  Add creditor
                </Button>
              </PanelHeader>
              <PanelBody className="p-0">
                {loading ? (
                  <div className="flex justify-center py-16">
                    <Spinner label="Loading creditors" />
                  </div>
                ) : creditors.length === 0 ? (
                  <EmptyState
                    icon={Wallet}
                    title="No creditor accounts"
                    description="Add suppliers you buy on credit from to track what you owe."
                    className="m-4 border-0 bg-transparent"
                    action={
                      <Button size="sm" onClick={() => openPartyDialog("creditor", null)}>
                        <Plus className="h-4 w-4" aria-hidden />
                        Add creditor
                      </Button>
                    }
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {creditors.map((creditor) => {
                      const balance = Math.max(
                        0,
                        (toNumber(creditor.balance) ?? 0) + (toNumber(creditor.opening_balance) ?? 0)
                      );
                      return (
                        <li
                          key={creditor.id}
                          className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-medium text-foreground">
                                {creditor.name}
                              </p>
                              {balance > 0 ? (
                                <StatusBadge tone="danger" dot>
                                  Unpaid
                                </StatusBadge>
                              ) : (
                                <StatusBadge tone="success" dot>
                                  Settled
                                </StatusBadge>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {creditor.phone || creditor.email || "No contact details"}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold tabular-nums text-foreground">
                              {formatCurrency(balance)}
                            </span>
                            {balance > 0 ? (
                              <Button
                                size="sm"
                                onClick={() => payCreditor(creditor)}
                                disabled={busyId === creditor.id}
                              >
                                {busyId === creditor.id ? "Recording…" : "Pay in full"}
                              </Button>
                            ) : null}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openPartyDialog("creditor", creditor)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Delete ${creditor.name}`}
                              onClick={() => removeParty("creditor", creditor.id, creditor.name)}
                              disabled={busyId === creditor.id}
                              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden />
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </PanelBody>
            </Panel>
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={dialog !== null} onOpenChange={(open) => (open ? null : setDialog(null))}>
        <DialogContent>
          {dialog?.kind === "debtor" || dialog?.kind === "creditor" ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {dialog?.party ? "Edit" : "Add"} {dialog?.kind === "debtor" ? "debtor" : "creditor"}
                </DialogTitle>
                <DialogDescription>
                  {dialog?.kind === "debtor"
                    ? "A debtor is a customer who buys on credit."
                    : "A creditor is a supplier you buy from on credit."}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label htmlFor="party-name" className="text-sm font-medium text-foreground">
                    Name
                  </label>
                  <Input
                    id="party-name"
                    value={partyForm.name}
                    onChange={(event) => setPartyForm({ ...partyForm, name: event.target.value })}
                    placeholder="Business or person name"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="party-phone" className="text-sm font-medium text-foreground">
                      Phone
                    </label>
                    <Input
                      id="party-phone"
                      value={partyForm.phone}
                      onChange={(event) => setPartyForm({ ...partyForm, phone: event.target.value })}
                      placeholder="07xx xxx xxx"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="party-email" className="text-sm font-medium text-foreground">
                      Email
                    </label>
                    <Input
                      id="party-email"
                      type="email"
                      value={partyForm.email}
                      onChange={(event) => setPartyForm({ ...partyForm, email: event.target.value })}
                      placeholder="name@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="party-opening" className="text-sm font-medium text-foreground">
                    Opening balance (KES)
                  </label>
                  <Input
                    id="party-opening"
                    type="number"
                    min={0}
                    value={partyForm.opening_balance}
                    onChange={(event) =>
                      setPartyForm({ ...partyForm, opening_balance: event.target.value })
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialog(null)}>
                  Cancel
                </Button>
                <Button onClick={saveParty} disabled={saving || !partyForm.name.trim()}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </>
          ) : dialog?.kind === "invoice" || dialog?.kind === "payment" ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {dialog.kind === "invoice" ? "Record credit invoice" : "Record payment"}
                </DialogTitle>
                <DialogDescription>
                  {dialog.kind === "invoice"
                    ? `Amount owed by ${dialog.party.name}. This is added to cashflow as money in.`
                    : `Payment received from ${dialog.party.name}.`}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="entry-amount" className="text-sm font-medium text-foreground">
                      Amount (KES)
                    </label>
                    <Input
                      id="entry-amount"
                      type="number"
                      min={0}
                      value={entryForm.amount}
                      onChange={(event) => setEntryForm({ ...entryForm, amount: event.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="entry-date" className="text-sm font-medium text-foreground">
                      Date
                    </label>
                    <Input
                      id="entry-date"
                      type="date"
                      value={entryForm.date}
                      onChange={(event) => setEntryForm({ ...entryForm, date: event.target.value })}
                    />
                  </div>
                </div>

                {dialog.kind === "invoice" ? (
                  <div className="space-y-1.5">
                    <label htmlFor="entry-due" className="text-sm font-medium text-foreground">
                      Due date
                    </label>
                    <Input
                      id="entry-due"
                      type="date"
                      value={entryForm.due_date}
                      onChange={(event) => setEntryForm({ ...entryForm, due_date: event.target.value })}
                    />
                  </div>
                ) : null}

                <div className="space-y-1.5">
                  <label htmlFor="entry-reference" className="text-sm font-medium text-foreground">
                    Reference
                  </label>
                  <Input
                    id="entry-reference"
                    value={entryForm.reference}
                    onChange={(event) => setEntryForm({ ...entryForm, reference: event.target.value })}
                    placeholder={dialog.kind === "invoice" ? "INV-001" : "M-Pesa code"}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="entry-notes" className="text-sm font-medium text-foreground">
                    Notes
                  </label>
                  <Textarea
                    id="entry-notes"
                    rows={2}
                    value={entryForm.notes}
                    onChange={(event) => setEntryForm({ ...entryForm, notes: event.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialog(null)}>
                  Cancel
                </Button>
                <Button onClick={saveEntry} disabled={saving}>
                  {saving ? "Saving…" : dialog.kind === "invoice" ? "Record invoice" : "Record payment"}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
