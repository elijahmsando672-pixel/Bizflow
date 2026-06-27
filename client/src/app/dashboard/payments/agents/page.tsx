"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import {
  PageHeader, Card, SearchBar, Table, Btn, Badge, Modal, InputField
} from "@/components/ui/dashboard-ui";
import { Smartphone, Plus, Edit3, Trash2, RefreshCw, Loader2, Phone, DollarSign, User } from "lucide-react";

interface MpesaAgent {
  id: string;
  name: string;
  phone: string;
  mpesa_number: string;
  commission_rate: number;
  is_active: boolean;
}

export default function MPesaAgentsPage() {
  const [agents, setAgents] = useState<MpesaAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<MpesaAgent | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", mpesa_number: "", commission_rate: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.payments.mpesa.getAgents() as MpesaAgent[];
      setAgents(Array.isArray(data) ? data : []);
    } catch { setAgents([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    try {
      const payload = { ...form, commission_rate: parseFloat(form.commission_rate) || 0 };
      if (editItem) {
        await api.payments.mpesa.updateAgent(editItem.id, payload);
      } else {
        await api.payments.mpesa.createAgent(payload);
      }
      setModal(false); setEditItem(null);
      setForm({ name: "", phone: "", mpesa_number: "", commission_rate: "" });
      load();
    } catch { alert("Failed to save agent"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this agent?")) return;
    try { await api.payments.mpesa.deleteAgent(id); load(); } catch { alert("Delete failed"); }
  };

  const toggleActive = async (agent: MpesaAgent) => {
    try {
      await api.payments.mpesa.updateAgent(agent.id, { is_active: !agent.is_active });
      load();
    } catch { alert("Failed to update"); }
  };

  const filtered = agents.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.phone.includes(search) ||
    a.mpesa_number.includes(search)
  );

  return (
    <div>
      <PageHeader title="M-Pesa Agents" subtitle="Manage mobile money agents">
        <Btn color="var(--color-primary)" onClick={() => { setEditItem(null); setForm({ name: "", phone: "", mpesa_number: "", commission_rate: "" }); setModal(true); }}>
          <Plus className="h-3.5 w-3.5" /> Add Agent
        </Btn>
        <Btn outline color="var(--color-muted-foreground)" onClick={load}><RefreshCw className="h-3 w-3" /> Refresh</Btn>
      </PageHeader>
      <Card className="mb-3">
        <SearchBar placeholder="Search agents by name or number..." value={search} onChange={setSearch} />
      </Card>
      {loading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <Table cols={["Name", "Phone", "M-Pesa Number", "Commission", "Status", "Actions"]}
          rows={filtered.map((a) => [
            <span key="n" className="font-medium flex items-center gap-2">
              <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
              {a.name}
            </span>,
            <span key="p" className="text-muted-foreground">{a.phone}</span>,
            <span key="mn" className="font-mono">{a.mpesa_number}</span>,
            <span key="cr">{a.commission_rate}%</span>,
            <Badge key="st" label={a.is_active ? "Active" : "Inactive"} color={a.is_active ? "var(--color-success)" : "var(--color-muted-foreground)"} />,
            <div key="ac" className="flex gap-1.5">
              <Btn small outline color="var(--color-accent-foreground)" onClick={() => toggleActive(a)}>
                {a.is_active ? "Deact." : "Act."}
              </Btn>
              <Btn small outline color="var(--color-accent-foreground)" onClick={() => { setEditItem(a); setForm({ name: a.name, phone: a.phone, mpesa_number: a.mpesa_number, commission_rate: String(a.commission_rate) }); setModal(true); }}>
                <Edit3 className="h-3 w-3" />
              </Btn>
              <Btn small outline color="var(--color-destructive)" onClick={() => handleDelete(a.id)}>
                <Trash2 className="h-3 w-3" />
              </Btn>
            </div>,
          ])}
          empty="No agents registered. Add your first M-Pesa agent above." />
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={editItem ? "Edit Agent" : "Add M-Pesa Agent"}>
        <InputField label="Agent Name" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="e.g. John Mwangi" icon={<User className="h-3.5 w-3.5" />} />
        <InputField label="Phone Number" value={form.phone} onChange={v => setForm({ ...form, phone: v })} placeholder="+2547XX XXX XXX" icon={<Phone className="h-3.5 w-3.5" />} />
        <InputField label="M-Pesa Paybill/Till" value={form.mpesa_number} onChange={v => setForm({ ...form, mpesa_number: v })} placeholder="e.g. 247247" icon={<Smartphone className="h-3.5 w-3.5" />} />
        <InputField label="Commission Rate (%)" value={form.commission_rate} onChange={v => setForm({ ...form, commission_rate: v })} placeholder="0" icon={<DollarSign className="h-3.5 w-3.5" />} type="number" />
        <Btn color="var(--color-primary)" onClick={handleSubmit} className="w-full justify-center mt-2 py-[10px]">{editItem ? "Update Agent" : "Create Agent"}</Btn>
      </Modal>
    </div>
  );
}
