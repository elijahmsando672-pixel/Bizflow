"use client";

import { useEffect, useState } from "react";
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
import { TicketPlus, AlertCircle, CheckCircle, Clock, MessageSquare } from "lucide-react";
import api from "@/lib/api";

interface Ticket {
  id: string;
  customer_id: string;
  subject: string;
  description: string;
  priority: string;
  category: string;
  assigned_to: string;
  status: string;
}

interface Stats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
}

interface Form {
  customer_id: string;
  subject: string;
  description: string;
  priority: string;
  category: string;
  assigned_to: string;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats>({} as Stats);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<Array<{ id: string; message: string; created_at: string }>>([]);
  const [replyMessage, setReplyMessage] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState<Form>({ customer_id: "", subject: "", description: "", priority: "medium", category: "general", assigned_to: "" });
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = filterStatus !== "all" ? `?status=${filterStatus}` : "";
      const [ticketsData, statsData] = await Promise.all([
        api.support.getTickets(params),
        api.support.getStats(),
      ]);
      setTickets(ticketsData as Ticket[]);
      setStats((statsData as { stats: Stats }).stats || {} as Stats);
    } catch {
      setError("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  const loadCustomers = useCallback(async () => {
    try {
      const data = await api.customers.getAll();
      setCustomers(data as { id: string; name: string }[]);
    } catch {}
  }, []);

  useEffect(() => { loadTickets(); loadCustomers(); }, [loadTickets, loadCustomers]);

  async function handleSubmit() {
    setError(null);
    try {
      await api.support.createTicket(form);
      setSuccess("Ticket created");
      setDialogOpen(false);
      setForm({ customer_id: "", subject: "", description: "", priority: "medium", category: "general", assigned_to: "" });
      loadTickets();
    } catch {
      setError("Failed to create ticket");
    }
  }

  async function updateStatus(ticket: Ticket, status: string) {
    try {
      await api.support.updateTicket(ticket.id, { status });
      loadTickets();
    } catch {
      setError("Failed to update ticket");
    }
  }

  async function loadTicketDetails(ticket: Ticket) {
    setSelectedTicket(ticket);
    setDetailOpen(true);
    try {
      const data = await api.support.getReplies(ticket.id);
      setReplies(data as Reply[]);
    } catch {
      console.error("Failed to load replies");
    }
  }

  async function submitReply() {
    if (!replyMessage.trim() || !selectedTicket) return;
    try {
      await api.support.addReply(selectedTicket.id, { message: replyMessage });
      setReplyMessage("");
      const data = await api.support.getReplies(selectedTicket.id);
      setReplies(data as Reply[]);
      loadTickets();
    } catch {
      setError("Failed to send reply");
    }
  }

  function getPriorityBadge(priority: string) {
    const colors: Record<string, string> = { critical: "bg-red-100 text-red-800", high: "bg-orange-100 text-orange-800", medium: "bg-yellow-100 text-yellow-800", low: "bg-green-100 text-green-800" };
    return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors[priority]}`}>{priority}</span>;
  }

  function getStatusBadge(status: string) {
    const colors: Record<string, string> = { open: "bg-blue-100 text-blue-800", in_progress: "bg-yellow-100 text-yellow-800", resolved: "bg-green-100 text-green-800", closed: "bg-gray-100 text-gray-800" };
    return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors[status] || "bg-gray-100"}`}>{status.replace("_", " ")}</span>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Support — Tickets</h1>
        <p className="text-muted-foreground mt-1">Manage customer support tickets with SLA tracking and response management.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-md">{success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><TicketPlus className="h-4 w-4" />Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total_tickets || 0}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><AlertCircle className="h-4 w-4" />Open</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{stats.open_tickets || 0}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Clock className="h-4 w-4" />In Progress</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">{stats.in_progress_tickets || 0}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><CheckCircle className="h-4 w-4" />Resolved</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{stats.resolved_tickets || 0}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><AlertCircle className="h-4 w-4 text-red-500" />SLA Breached</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{stats.breached_tickets || 0}</div></CardContent></Card>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded-md px-2 py-1 text-sm">
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <Button onClick={() => setDialogOpen(true)}><TicketPlus className="h-4 w-4 mr-2" />New Ticket</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket #</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow> :
               tickets.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No tickets yet</TableCell></TableRow> :
               tickets.map(ticket => (
                <TableRow key={ticket.id} className={ticket.sla_breached ? "bg-red-50" : ""}>
                  <TableCell className="font-mono text-sm">{ticket.ticket_number}</TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">{ticket.subject}</TableCell>
                  <TableCell>{ticket.customer_name || "—"}</TableCell>
                  <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                  <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                  <TableCell>{ticket.assigned_name || "Unassigned"}</TableCell>
                  <TableCell>
                    {ticket.sla_breached ? (
                      <span className="text-red-600 text-xs font-medium flex items-center gap-1"><AlertCircle className="h-3 w-3" />Breached</span>
                    ) : ticket.sla_deadline ? (
                      <span className="text-xs">{new Date(ticket.sla_deadline).toLocaleDateString()}</span>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" className="h-7 px-2" onClick={() => loadTicketDetails(ticket)}><MessageSquare className="h-3 w-3" /></Button>
                      <Select defaultValue={ticket.status} onValueChange={v => updateStatus(ticket, v)}>
                        <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
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
          <DialogHeader><DialogTitle>Create Support Ticket</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={form.customer_id} onValueChange={v => setForm({ ...form, customer_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select customer (optional)" /></SelectTrigger>
              <SelectContent>
                {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Subject *" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="feature">Feature Request</SelectItem>
              </SelectContent>
            </Select>
            <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <textarea className="w-full border rounded-md p-2 text-sm min-h-[80px]" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>Create Ticket</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.ticket_number}: {selectedTicket?.subject}</DialogTitle>
            <DialogDescription>
              <div className="flex items-center gap-2 mt-1">
                {selectedTicket && getPriorityBadge(selectedTicket.priority)}
                {selectedTicket && getStatusBadge(selectedTicket.status)}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {selectedTicket?.description && <p className="text-sm text-muted-foreground">{selectedTicket.description}</p>}
            <div className="space-y-3">
              {replies.map(reply => (
                <Card key={reply.id} className={`p-3 ${reply.is_internal ? "bg-yellow-50 border-yellow-200" : ""}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{reply.author_name || "Unknown"}</span>
                    <span className="text-xs text-muted-foreground">{new Date(reply.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm">{reply.message}</p>
                  {reply.is_internal && <span className="text-xs text-yellow-600 mt-1">Internal Note</span>}
                </Card>
              ))}
              {replies.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No replies yet</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <Input placeholder="Type a reply..." value={replyMessage} onChange={e => setReplyMessage(e.target.value)} onKeyDown={e => e.key === "Enter" && submitReply()} />
            <Button onClick={submitReply}>Send</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
