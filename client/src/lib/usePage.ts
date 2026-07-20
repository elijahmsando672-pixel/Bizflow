"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/toast";

interface PageOptions<T, F extends Record<string, string>> {
  fetchFn: () => Promise<T[]>;
  createFn: (data: Record<string, unknown>) => Promise<unknown>;
  updateFn: (id: string, data: Record<string, unknown>) => Promise<unknown>;
  deleteFn: (id: string) => Promise<unknown>;
  initialForm: F;
  filterFn: (items: T[], search: string) => T[];
  entityName?: string;
}

export function usePage<T extends { id?: string }, F extends Record<string, string>>(opts: PageOptions<T, F>) {
  const toast = useToast();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<T | null>(null);
  const [form, setForm] = useState<F>(opts.initialForm);

  const name = opts.entityName || "item";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await opts.fetchFn();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [opts]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = useCallback(async () => {
    try {
      const payload = { ...form } as unknown as Record<string, unknown>;
      if (editItem) {
        await opts.updateFn(editItem.id!, payload);
        toast.success(`${name} updated`);
      } else {
        await opts.createFn(payload);
        toast.success(`${name} created`);
      }
      setModal(false);
      setEditItem(null);
      setForm(opts.initialForm);
      load();
    } catch {
      toast.error(`Failed to save ${name}`);
    }
  }, [form, editItem, opts, name, load, toast]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm(`Delete this ${name}?`)) return;
    try {
      await opts.deleteFn(id);
      toast.success(`${name} deleted`);
      load();
    } catch {
      toast.error("Delete failed");
    }
  }, [opts, name, load, toast]);

  const openCreate = useCallback(() => {
    setEditItem(null);
    setForm(opts.initialForm);
    setModal(true);
  }, [opts.initialForm]);

  const openEdit = useCallback((item: T, formData: F) => {
    setEditItem(item);
    setForm(formData);
    setModal(true);
  }, []);

  const filtered = opts.filterFn(items, search);

  return {
    items, filtered, loading, search, setSearch,
    modal, setModal, editItem, form, setForm,
    load, handleSubmit, handleDelete, openCreate, openEdit,
  };
}
