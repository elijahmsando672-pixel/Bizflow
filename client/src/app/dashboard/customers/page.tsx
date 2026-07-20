"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { fetchFrequentCustomers, formatCurrency } from "@/lib/data";
import {
  PageHeader, StatCard, Card, SearchBar, Table, Btn, Avatar, Badge, Modal, InputField
} from "@/components/ui/dashboard-ui";
import { useToast } from "@/components/ui/toast";
import { Users as UsersIcon, Plus, RefreshCw, Loader2 } from "lucide-react";

interface Customer {
  id?: string;
  name?: string;
  customer_name?: string;
  total_orders?: number;
  total_spent?: number;
  email?: string;
  phone?: string;
  address?: string;
}

export default function CustomersPage() {
  const toast = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const freq = await fetchFrequentCustomers();
      setCustomers(Array.isArray(freq) ? freq : []);
    } catch { setCustomers([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    try {
      const payload = { name: form.name, email: form.email || undefined, phone: form.phone || undefined, address: form.address || undefined };
      if (editItem) { await api.customers.update(editItem.id!, payload); }
      else { await api.customers.create(payload); }
      setModal(false); setEditItem(null);
      setForm({ name: "", email: "", phone: "", address: "" });
      load();
    } catch { toast.error("Failed to save customer"); }
  };

  const filtered = customers.filter((c) =>
    (c.name || c.customer_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Customers" subtitle="Your most valuable customers">
        <Btn color="var(--color-primary)" onClick={() => { setEditItem(null); setForm({ name: "", email: "", phone: "", address: "" }); setModal(true); }}>
          <Plus className="h-3.5 w-3.5" /> Add Customer
        </Btn>
        <Btn outline color="var(--color-muted-foreground)" onClick={load}><RefreshCw className="h-3 w-3" /> Refresh</Btn>
      </PageHeader>
      <div className="flex flex-wrap gap-3 mb-4">
        <StatCard label="Total Customers" value={String(filtered.length)} icon={<UsersIcon className="h-4 w-4" />} />
      </div>
      <Card className="mb-3">
        <SearchBar placeholder="Search customers..." value={search} onChange={setSearch} />
      </Card>
      {loading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <Table cols={["Customer", "Orders", "Total Spent", "Loyalty"]}
          rows={filtered.map((c) => [
            <div key="n" className="flex items-center gap-2">
              <Avatar name={c.name || c.customer_name} size={28} />
              <span className="font-medium">{c.name || c.customer_name || "Unknown"}</span>
            </div>,
            <span key="o" className="font-bold">{c.total_orders || 0}</span>,
            <span key="s" className="font-bold text-success">{formatCurrency(c.total_spent || 0)}</span>,
            <Badge key="l" label={(c.total_orders ?? 0) > 10 ? "Gold" : (c.total_orders ?? 0) > 5 ? "Silver" : "Bronze"}
              color={(c.total_orders ?? 0) > 10 ? "var(--color-warning)" : (c.total_orders ?? 0) > 5 ? "var(--color-accent-foreground)" : "var(--color-primary)"} />,
          ])}
          empty="No customer data yet." />
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={editItem ? "Edit Customer" : "Add Customer"}>
        <InputField label="Name" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Customer name" icon={<UsersIcon className="h-3.5 w-3.5" />} />
        <InputField label="Email" value={form.email} onChange={v => setForm({ ...form, email: v })} placeholder="customer@example.com" />
        <InputField label="Phone" value={form.phone} onChange={v => setForm({ ...form, phone: v })} placeholder="+254 700 000000" />
        <InputField label="Address" value={form.address} onChange={v => setForm({ ...form, address: v })} placeholder="Nairobi, Kenya" />
        <Btn color="var(--color-primary)" onClick={handleSubmit} className="w-full justify-center mt-2 py-[10px]">{editItem ? "Update Customer" : "Create Customer"}</Btn>
      </Modal>
    </div>
  );
}
