"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/data";
import {
  PageHeader, StatCard, Card, SearchBar, Table, Btn, Badge, Modal, InputField
} from "@/components/ui/dashboard-ui";
import { TrendingDown, DollarSign, BarChart3, Layers, Plus, Edit3, Trash2, FileText, Loader2 } from "lucide-react";

interface Expense {
  id: string;
  description: string;
  amount: number | string;
  category: string;
  expense_date: string;
  created_at?: string;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<Expense | null>(null);
  const [catModal, setCatModal] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [form, setForm] = useState({ description: "", amount: "", category: "General", expense_date: new Date().toISOString().split("T")[0] });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, cats] = await Promise.all([
        api.expenses.getAll().catch(() => []),
        api.expenses.getCategories().catch(() => []),
      ]);
      setExpenses(Array.isArray(data) ? data : []);
      setCategories(Array.isArray(cats) ? cats.map((c) => (typeof c === "string" ? c : (c as { name?: string }).name || "").toString()) : []);
    } catch { setExpenses([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    try {
      const payload = { description: form.description, amount: parseFloat(form.amount) || 0, category: form.category, expense_date: form.expense_date };
      if (editItem) { await api.expenses.update(editItem.id, payload); }
      else { await api.expenses.create(payload); }
      setModal(false); setEditItem(null);
      setForm({ description: "", amount: "", category: "General", expense_date: new Date().toISOString().split("T")[0] });
      load();
    } catch { alert("Failed to save expense"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    try { await api.expenses.delete(id); load(); } catch { alert("Delete failed"); }
  };

  const handleAddCategory = async () => {
    if (!newCat.trim()) return;
    try { await api.expenses.createCategory({ name: newCat }); setCatModal(false); setNewCat(""); load(); }
    catch { alert("Failed to create category"); }
  };

  const filtered = expenses.filter((e) =>
    (e.description || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.category || "").toLowerCase().includes(search.toLowerCase())
  );
  const total = filtered.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  return (
    <div>
      <PageHeader title="Expenses" subtitle="Track and manage business expenses">
        <Btn color="var(--color-warning)" onClick={() => setCatModal(true)} small><Plus className="h-3 w-3" /> Category</Btn>
        <Btn color="var(--color-primary)" onClick={() => { setEditItem(null); setForm({ description: "", amount: "", category: "General", expense_date: new Date().toISOString().split("T")[0] }); setModal(true); }}>
          <Plus className="h-3.5 w-3.5" /> Add Expense
        </Btn>
      </PageHeader>
      <div className="flex flex-wrap gap-3 mb-4">
        <StatCard label="Total Expenses" value={String(filtered.length)} icon={<TrendingDown className="h-4 w-4" />} accent="var(--color-destructive)" />
        <StatCard label="Total Amount" value={formatCurrency(total)} icon={<DollarSign className="h-4 w-4" />} accent="var(--color-warning)" />
        <StatCard label="Avg Expense" value={filtered.length ? formatCurrency(Math.round(total / filtered.length)) : "Ksh 0"} icon={<BarChart3 className="h-4 w-4" />} accent="var(--color-primary)" />
        <StatCard label="Categories" value={String(categories.length || 1)} icon={<Layers className="h-4 w-4" />} accent="var(--color-success)" />
      </div>
      <Card className="mb-3">
        <SearchBar placeholder="Search description or category..." value={search} onChange={setSearch} />
      </Card>
      {loading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <Table cols={["Description", "Category", "Amount", "Date", "Actions"]}
          rows={filtered.map((e) => [
            <span key="d" className="font-medium">{e.description || "N/A"}</span>,
            <Badge key="c" label={e.category || "General"} color="var(--color-primary)" />,
            <span key="a" className="font-bold text-destructive">{formatCurrency(Number(e.amount) || 0)}</span>,
            <span key="dt" className="text-muted-foreground">{e.expense_date ? new Date(e.expense_date).toLocaleDateString("en-GB") : "-"}</span>,
            <div key="ac" className="flex gap-1.5">
              <Btn small outline color="var(--color-accent-foreground)" onClick={() => { setEditItem(e); setForm({ description: e.description || "", amount: String(e.amount || ""), category: e.category || "General", expense_date: e.expense_date?.split("T")[0] || "" }); setModal(true); }}>
                <Edit3 className="h-3 w-3" />
              </Btn>
              <Btn small outline color="var(--color-destructive)" onClick={() => handleDelete(e.id)}>
                <Trash2 className="h-3 w-3" />
              </Btn>
            </div>,
          ])}
          empty="No expenses recorded yet." />
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={editItem ? "Edit Expense" : "Add Expense"}>
        <InputField label="Description" value={form.description} onChange={v => setForm({ ...form, description: v })} placeholder="What was this for?" icon={<FileText className="h-3.5 w-3.5" />} />
        <InputField label="Amount (KES)" value={form.amount} onChange={v => setForm({ ...form, amount: v })} placeholder="0" icon={<DollarSign className="h-3.5 w-3.5" />} type="number" />
        <InputField label="Category" value={form.category} onChange={v => setForm({ ...form, category: v })} placeholder="General" />
        <InputField label="Date" value={form.expense_date} onChange={v => setForm({ ...form, expense_date: v })} type="date" />
        <Btn color="var(--color-primary)" onClick={handleSubmit} className="w-full justify-center mt-2 py-[10px]">{editItem ? "Update Expense" : "Create Expense"}</Btn>
      </Modal>
      <Modal open={catModal} onClose={() => setCatModal(false)} title="Add Expense Category">
        <InputField label="Category Name" value={newCat} onChange={setNewCat} placeholder="e.g. Utilities, Rent" icon={<Layers className="h-3.5 w-3.5" />} />
        <Btn color="var(--color-warning)" onClick={handleAddCategory} className="w-full justify-center mt-2 py-[10px]">Add Category</Btn>
      </Modal>
    </div>
  );
}
