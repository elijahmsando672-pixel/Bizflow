"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  Check,
  Trash2,
  Download,
  Loader2,
} from "lucide-react";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  hideOnMobile?: boolean;
}

export interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: string[];
  filters?: FilterOption[];
  pageSize?: number;
  selectable?: boolean;
  onSelectionChange?: (selected: Set<string>) => void;
  onExport?: () => void;
  onDelete?: (selected: Set<string>) => void;
  loading?: boolean;
  emptyMessage?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  searchable = true,
  searchPlaceholder = "Search...",
  searchKeys,
  filters,
  pageSize = 10,
  selectable = false,
  onSelectionChange,
  onExport,
  onDelete,
  loading = false,
  emptyMessage = "No results found.",
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = [...data];

    if (search && searchKeys) {
      const q = search.toLowerCase();
      result = result.filter((item) =>
        searchKeys.some((key) => {
          const val = item[key];
          return val != null && String(val).toLowerCase().includes(q);
        })
      );
    }

    for (const [key, value] of Object.entries(activeFilters)) {
      if (value) {
        result = result.filter((item) => String(item[key]) === value);
      }
    }

    if (sortKey) {
      result.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [data, search, searchKeys, activeFilters, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      onSelectionChange?.(next);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => {
      if (prev.size === paginated.length) {
        onSelectionChange?.(new Set());
        return new Set();
      }
      const all = new Set(paginated.map((item) => keyExtractor(item)));
      onSelectionChange?.(all);
      return all;
    });
  };

  const clearFilters = () => {
    setActiveFilters({});
    setSearch("");
    setPage(1);
  };

  const hasActiveFilters = search || Object.values(activeFilters).some(Boolean);

  return (
    <div className="space-y-3">
      {(searchable || filters) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            {searchable && (
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="h-9 pl-10 pr-8 text-sm"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
            {filters && filters.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={cn("gap-1.5", hasActiveFilters && "border-primary text-primary")}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filters
                {hasActiveFilters && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {Object.values(activeFilters).filter(Boolean).length + (search ? 1 : 0)}
                  </span>
                )}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selected.size > 0 && onDelete && (
              <Button variant="destructive" size="sm" onClick={() => onDelete(selected)}>
                <Trash2 className="h-3.5 w-3.5" />
                Delete ({selected.size})
              </Button>
            )}
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showFilters && filters && filters.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-card p-4">
              {filters.map((filter) => (
                <div key={filter.key} className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">{filter.label}</label>
                  <select
                    value={activeFilters[filter.key] || ""}
                    onChange={(e) => {
                      setActiveFilters((prev) => ({ ...prev, [filter.key]: e.target.value }));
                      setPage(1);
                    }}
                    className="h-9 rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                  >
                    <option value="">All</option>
                    {filter.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              ))}
              {hasActiveFilters && (
                <div className="flex items-end">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full caption-bottom text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {selectable && (
                  <th className="w-10 px-3 py-3">
                    <button
                      onClick={toggleAll}
                      className="flex h-4 w-4 items-center justify-center rounded border border-input bg-background transition-colors hover:border-primary"
                    >
                      {selected.size === paginated.length && paginated.length > 0 && (
                        <Check className="h-3 w-3 text-primary" />
                      )}
                    </button>
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                      col.hideOnMobile && "hidden md:table-cell",
                      col.sortable && "cursor-pointer select-none hover:text-foreground"
                    )}
                    onClick={() => col.sortable && toggleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.sortable && (
                        sortKey === col.key
                          ? sortDir === "asc"
                            ? <ArrowUp className="h-3 w-3" />
                            : <ArrowDown className="h-3 w-3" />
                          : <ArrowUpDown className="h-3 w-3 opacity-30" />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-16 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-16 text-center">
                    <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                  </td>
                </tr>
              ) : (
                paginated.map((item) => {
                  const id = keyExtractor(item);
                  const isSelected = selected.has(id);
                  return (
                    <motion.tr
                      key={id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={cn(
                        "border-b border-border transition-colors last:border-0 hover:bg-muted/30",
                        isSelected && "bg-primary/5"
                      )}
                    >
                      {selectable && (
                        <td className="w-10 px-3 py-3">
                          <button
                            onClick={() => toggleSelect(id)}
                            className={cn(
                              "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-input bg-background hover:border-primary"
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </button>
                        </td>
                      )}
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            "px-4 py-3 text-foreground",
                            col.hideOnMobile && "hidden md:table-cell"
                          )}
                        >
                          {col.render ? col.render(item) : String(item[col.key] ?? "")}
                        </td>
                      ))}
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              disabled={page === 1}
              onClick={() => setPage(1)}
              className="h-8 w-8"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1 px-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={cn(
                      "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-medium transition-colors",
                      page === pageNum
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <Button
              variant="ghost"
              size="icon"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={page === totalPages}
              onClick={() => setPage(totalPages)}
              className="h-8 w-8"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
