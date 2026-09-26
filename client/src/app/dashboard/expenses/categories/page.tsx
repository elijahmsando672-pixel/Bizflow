"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, RefreshCw, Tags } from "lucide-react";
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
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  description?: string | null;
}

interface Expense {
  id: string;
  category?: string | null;
  amount?: number | string;
}

export default function ExpenseCategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [categoryList, expenseList] = await Promise.all([
        api.expenses.getCategories().catch(() => [] as Category[]),
        api.expenses.getAll().catch(() => [] as Expense[]),
      ]);
      setCategories(Array.isArray(categoryList) ? categoryList : []);
      setExpenses(Array.isArray(expenseList) ? expenseList : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    document.getElementById("expense-category-name")?.focus();
  }, []);

  const usage = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    for (const expense of expenses) {
      const key = String(expense.category ?? "").trim();
      if (!key) continue;
      const entry = map.get(key) ?? { count: 0, total: 0 };
      entry.count += 1;
      entry.total += toNumber(expense.amount) ?? 0;
      map.set(key, entry);
    }
    return map;
  }, [expenses]);

  const create = async () => {
    const name = form.name.trim();
    if (!name) return;
    setSaving(true);
    try {
      await api.expenses.createCategory({
        name,
        description: form.description.trim() || undefined,
      });
      toast.success(`Category "${name}" created`);
      setForm({ name: "", description: "" });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the category");
    } finally {
      setSaving(false);
    }
  };

  const uncategorised = expenses.filter((expense) => !expense.category).length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Expense categories"
        description="Group spend so reports and budgets stay meaningful."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
              Refresh
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/expenses">
                <ArrowLeft className="h-4 w-4" aria-hidden />
                All expenses
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-2.5">
        <StatCard label="Categories" value={String(categories.length)} icon={Tags} />
        <StatCard label="Expenses" value={String(expenses.length)} icon={Tags} tone="info" />
        <StatCard
          label="Uncategorised"
          value={String(uncategorised)}
          icon={Tags}
          tone={uncategorised > 0 ? "warning" : "neutral"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader>
            <PanelTitle>Categories</PanelTitle>
          </PanelHeader>
          <PanelBody className="p-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner label="Loading categories" />
              </div>
            ) : error ? (
              <ErrorState title="Could not load categories" onRetry={load} className="m-4" />
            ) : categories.length === 0 ? (
              <EmptyState
                icon={Tags}
                title="No expense categories yet"
                description="Create your first category, then use it when recording expenses."
                className="m-4 border-0 bg-transparent"
              />
            ) : (
              <ul className="divide-y divide-border">
                {categories.map((category) => {
                  const stats = usage.get(category.name) ?? { count: 0, total: 0 };
                  return (
                    <li
                      key={category.id}
                      className="flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{category.name}</p>
                        {category.description ? (
                          <p className="truncate text-xs text-muted-foreground">{category.description}</p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {stats.count} {stats.count === 1 ? "expense" : "expenses"}
                        </span>
                        <span className="w-24 text-right font-semibold tabular-nums text-foreground">
                          {formatCurrency(stats.total)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </PanelBody>
        </Panel>

        <Panel className="h-fit">
          <PanelHeader>
            <PanelTitle>New category</PanelTitle>
          </PanelHeader>
          <PanelBody>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="expense-category-name"
                  className="text-sm font-medium text-foreground"
                >
                  Name
                </label>
                <Input
                  id="expense-category-name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="e.g. Utilities"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="expense-category-description"
                  className="text-sm font-medium text-foreground"
                >
                  Description
                </label>
                <Textarea
                  id="expense-category-description"
                  rows={2}
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="Optional"
                />
              </div>
              <Button className="w-full" onClick={create} disabled={saving || !form.name.trim()}>
                <Plus className="h-4 w-4" aria-hidden />
                {saving ? "Creating…" : "Create category"}
              </Button>
            </div>
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}
