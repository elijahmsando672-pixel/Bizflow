"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import {
  Card, SearchBar, Table, Btn, Modal, InputField, StatCard
} from "@/components/dashboard/ui";
import { Building2, Plus, Edit3, Trash2, User, Truck, Loader2 } from "lucide-react";

export default function ShopsPage() {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: "", location: "", phone: "", email: "", manager_name: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.shops.getAll() as any[];
      setShops(Array.isArray(data) ? data : []);
    } catch { setShops([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    try {
      if (editItem) { await api.shops.update(editItem.id, form); }
      else { await api.shops.create(form); }
      setModal(false); setEditItem(null);
      setForm({ name: "", location: "", phone: "", email: "", manager_name: "" });
      load();
    } catch { alert("Failed to save shop"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this shop?")) return;
    try { await api.shops.delete(id); load(); } catch { alert("Delete failed"); }
  };

  const filtered = shops.filter((s: any) =>
    (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.location || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-amber-800 via-amber-700 to-orange-800 p-6 mb-5">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_60%,rgba(255,255,255,.3),transparent_50%)]" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-white/80" />
            <div>
              <h2 className="text-lg font-bold text-white">Branches</h2>
              <p className="text-sm text-white/70">Manage multi-shop operations</p>
            </div>
          </div>
          <Btn color="rgba(255,255,255,.2)" onClick={() => { setEditItem(null); setForm({ name: "", location: "", phone: "", email: "", manager_name: "" }); setModal(true); }}>
            <Plus className="h-3.5 w-3.5" /> Add Branch
          </Btn>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 mb-4">
        <StatCard label="Total Branches" value={String(filtered.length)} icon={<Building2 className="h-4 w-4" />} />
      </div>
      <Card className="mb-3">
        <SearchBar placeholder="Search by name or location..." value={search} onChange={setSearch} />
      </Card>
      {loading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <Table cols={["Name", "Location", "Phone", "Email", "Manager", "Actions"]}
          rows={filtered.map((s: any) => [
            <span key="n" className="font-medium">{s.name || "N/A"}</span>,
            <span key="l" className="text-muted-foreground">{s.location || "-"}</span>,
            <span key="p" className="text-muted-foreground">{s.phone || "-"}</span>,
            <span key="e" className="text-muted-foreground">{s.email || "-"}</span>,
            <span key="m" className="text-muted-foreground">{s.manager_name || "-"}</span>,
            <div key="ac" className="flex gap-1.5">
              <Btn small outline color="var(--color-accent-foreground)" onClick={() => { setEditItem(s); setForm({ name: s.name || "", location: s.location || "", phone: s.phone || "", email: s.email || "", manager_name: s.manager_name || "" }); setModal(true); }}>
                <Edit3 className="h-3 w-3" />
              </Btn>
              <Btn small outline color="var(--color-destructive)" onClick={() => handleDelete(s.id)}>
                <Trash2 className="h-3 w-3" />
              </Btn>
            </div>,
          ])}
          empty="No branches yet. Add your first branch above." />
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={editItem ? "Edit Branch" : "Add Branch"}>
        <InputField label="Branch Name" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Main Shop" icon={<Building2 className="h-3.5 w-3.5" />} />
        <InputField label="Location" value={form.location} onChange={v => setForm({ ...form, location: v })} placeholder="Nairobi, Kenya" icon={<Truck className="h-3.5 w-3.5" />} />
        <InputField label="Phone" value={form.phone} onChange={v => setForm({ ...form, phone: v })} placeholder="+254 700 000000" icon={<User className="h-3.5 w-3.5" />} />
        <InputField label="Email" value={form.email} onChange={v => setForm({ ...form, email: v })} placeholder="shop@example.com" icon={<User className="h-3.5 w-3.5" />} />
        <InputField label="Manager" value={form.manager_name} onChange={v => setForm({ ...form, manager_name: v })} placeholder="Manager name" icon={<User className="h-3.5 w-3.5" />} />
        <Btn color="var(--color-primary)" onClick={handleSubmit} className="w-full justify-center mt-2 py-[10px]">{editItem ? "Update Branch" : "Create Branch"}</Btn>
      </Modal>
    </div>
  );
}
