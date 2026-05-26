"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Tags, Package, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Category {
  id: string;
  name: string;
  description: string;
  product_count?: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.products.getCategories();
      setCategories(data as Category[]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load categories";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleCreate = async () => {
    if (!form.name) {
      toast.error("Category name is required");
      return;
    }
    try {
      setSaving(true);
      await api.products.createCategory({ name: form.name, description: form.description || undefined });
      toast.success("Category created");
      setDialogOpen(false);
      setForm({ name: "", description: "" });
      loadCategories();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setSaving(false);
    }
  };

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Categories</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your product categories.</p>
      </div>

      <Card className="bg-[#121A2B] border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">All Categories</CardTitle>
            <CardDescription className="text-gray-400">{categories.length} categories</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 border-gray-700 bg-gray-800 pl-10 text-sm text-white placeholder:text-gray-500"
              />
            </div>
            <Button onClick={() => setDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" /> Add Category
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/5">
                  <TableHead className="text-gray-400">Name</TableHead>
                  <TableHead className="text-gray-400">Description</TableHead>
                  <TableHead className="text-gray-400 text-right">Products</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-12 text-gray-500">
                      <Tags className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      {search ? "No categories match your search" : "No categories yet"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((cat) => (
                    <TableRow key={cat.id} className="border-white/5">
                      <TableCell className="font-medium text-white">{cat.name}</TableCell>
                      <TableCell className="text-gray-400">{cat.description || "-"}</TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center gap-1 text-gray-300">
                          <Package className="h-3.5 w-3.5" />
                          {cat.product_count ?? 0}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1a2332] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a new product category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Category name"
                className="border-gray-700 bg-gray-800 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Description (optional)</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description"
                className="border-gray-700 bg-gray-800 text-white"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-gray-400">
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
