"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Filter } from "lucide-react";
import api from "@/lib/api";

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  job_title: string;
  source: string;
  status: string;
  lead_score: number;
  estimated_value: number;
}

export default function CRMPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [convertDialog, setConvertDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", company: "", job_title: "", source: "inbound", estimated_value: 0, notes: "" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = filterStatus !== "all" ? `?status=${filterStatus}` : "";
      const data = await api.crm.getLeads(params);
      setLeads(data as Lead[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  async function handleSubmit() {
    setError(null);
    try {
      await api.crm.createLead(form);
      setSuccess("Lead created");
      setDialogOpen(false);
      setForm({ first_name: "", last_name: "", email: "", phone: "", company: "", job_title: "", source: "inbound", estimated_value: 0, notes: "" });
      loadLeads();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create lead");
    }
  }

  async function convertLead() {
    if (!selectedLead) return;
    try {
      await api.crm.convertLead(selectedLead.id, {
        customer_name: `${selectedLead.first_name} ${selectedLead.last_name}`,
        customer_email: selectedLead.email,
        company: selectedLead.company,
      });
      setSuccess("Lead converted to customer");
      setConvertDialog(false);
      loadLeads();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to convert lead");
    }
  }

  async function updateLeadStatus(lead: Lead, status: string) {
    try {
      await api.crm.updateLead(lead.id, { status });
      loadLeads();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update lead");
    }
  }

  function getStatusBadge(status: string) {
    const colors: Record<string, string> = { new: "bg-blue-100 text-blue-800", contacted: "bg-yellow-100 text-yellow-800", qualified: "bg-purple-100 text-purple-800", converted: "bg-green-100 text-green-800", lost: "bg-red-100 text-red-800" };
    return <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${colors[status] || "bg-gray-100 text-gray-800"}`}>{status}</span>;
  }

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === "new").length,
    qualified: leads.filter(l => l.status === "qualified").length,
    totalValue: leads.reduce((sum, l) => sum + (l.estimated_value ? parseFloat(String(l.estimated_value)) : 0), 0),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">CRM — Leads</h1>
        <p className="text-muted-foreground mt-1">Track and manage your sales pipeline from first contact to conversion.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-md">{success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Leads</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">New</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{stats.new}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Qualified</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-purple-600">{stats.qualified}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pipeline Value</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">KES {stats.totalValue.toLocaleString()}</div></CardContent></Card>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded-md px-2 py-1 text-sm">
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>
        </div>
        <Button onClick={() => setDialogOpen(true)}><UserPlus className="h-4 w-4 mr-2" />Add Lead</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow> :
               leads.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No leads yet</TableCell></TableRow> :
               leads.map(lead => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.first_name} {lead.last_name}</TableCell>
                  <TableCell>{lead.company || "—"}</TableCell>
                  <TableCell>{lead.email || "—"}</TableCell>
                  <TableCell><span className="capitalize">{lead.source || "—"}</span></TableCell>
                  <TableCell>{getStatusBadge(lead.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full" style={{ width: `${Math.min(lead.lead_score || 0, 100)}%`, background: (lead.lead_score || 0) > 70 ? "#10b981" : (lead.lead_score || 0) > 40 ? "#f59e0b" : "#ef4444" }} />
                      </div>
                      <span className="text-xs">{lead.lead_score || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>KES {(lead.estimated_value || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Select defaultValue={lead.status} onValueChange={v => updateLeadStatus(lead, v)}>
                        <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="converted">Converted</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                      {lead.status !== "converted" && lead.status !== "lost" && (
                        <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => { setSelectedLead(lead); setConvertDialog(true); }}>Convert</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Lead</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="First name *" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
            <Input placeholder="Last name *" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
            <Input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <Input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <Input placeholder="Company" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
            <Input placeholder="Job title" value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })} />
            <Select value={form.source} onValueChange={v => setForm({ ...form, source: v })}>
              <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="inbound">Inbound</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Estimated value" value={form.estimated_value || ""} onChange={e => setForm({ ...form, estimated_value: parseFloat(e.target.value) || 0 })} />
          </div>
          <Input placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="col-span-2" />
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>Create Lead</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={convertDialog} onOpenChange={setConvertDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Convert Lead</DialogTitle><DialogDescription>Convert {selectedLead?.first_name} {selectedLead?.last_name} to a customer?</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setConvertDialog(false)}>Cancel</Button><Button onClick={convertLead}>Confirm Conversion</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
