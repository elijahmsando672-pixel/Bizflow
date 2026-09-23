"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowUpRight, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { allModules } from "@/lib/modules";
import { projects, clients, tasks, invoices, team } from "@/lib/modules-data";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  detail: string;
  href: string;
  icon?: LucideIcon;
}

interface CommandGroup {
  label: string;
  items: CommandItem[];
}

interface CommandKProps {
  open: boolean;
  onClose: () => void;
}

export function CommandK({ open, onClose }: CommandKProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      const t = window.setTimeout(() => inputRef.current?.focus(), 20);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  const groups = useMemo<CommandGroup[]>(() => {
    const q = query.trim().toLowerCase();
    const match = (s: string) => (q ? s.toLowerCase().includes(q) : true);

    const moduleItems = allModules
      .filter((m) => match(m.label) || match(m.keyword))
      .map<CommandItem>((m) => ({ id: m.id, label: m.label, detail: m.href, href: m.href, icon: m.icon }));

    const projectItems = projects
      .filter((p) => match(p.name) || match(p.client))
      .map<CommandItem>((p) => ({ id: `p-${p.id}`, label: p.name, detail: `${p.client} · ${p.status}`, href: "/modules/projects" }));

    const taskItems = tasks
      .filter((t) => match(t.title))
      .map<CommandItem>((t) => ({ id: `t-${t.id}`, label: t.title, detail: `${t.project} · ${t.status}`, href: "/modules/tasks" }));

    const clientItems = clients
      .filter((c) => match(c.name) || match(c.company))
      .map<CommandItem>((c) => ({ id: `c-${c.id}`, label: c.company, detail: c.email, href: "/modules/clients" }));

    const invoiceItems = invoices
      .filter((i) => match(i.number) || match(i.client))
      .map<CommandItem>((i) => ({ id: `i-${i.id}`, label: i.number, detail: `${i.client} · ${i.status}`, href: "/modules/invoices" }));

    const teamItems = team
      .filter((t) => match(t.name))
      .map<CommandItem>((t) => ({ id: `m-${t.id}`, label: t.name, detail: `${t.role} · ${t.status}`, href: "/modules/team" }));

    const result: CommandGroup[] = [];
    if (!q) {
      result.push({
        label: "Quick links",
        items: [
          { id: "ql1", label: "New Project", detail: "/modules/projects", href: "/modules/projects" },
          { id: "ql2", label: "New Invoice", detail: "/modules/invoices", href: "/modules/invoices" },
          { id: "ql3", label: "Invite Member", detail: "/modules/team", href: "/modules/team" },
          { id: "ql4", label: "Settings", detail: "/modules/settings", href: "/modules/settings" },
        ],
      });
    }
    if (moduleItems.length) result.push({ label: "Modules", items: moduleItems });
    if (projectItems.length) result.push({ label: "Projects", items: projectItems });
    if (taskItems.length) result.push({ label: "Tasks", items: taskItems });
    if (clientItems.length) result.push({ label: "Clients", items: clientItems });
    if (invoiceItems.length) result.push({ label: "Invoices", items: invoiceItems });
    if (teamItems.length) result.push({ label: "Team", items: teamItems });
    return result;
  }, [query]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  useEffect(() => {
    setSelected(0);
  }, [query, groups]);

  const select = (index: number) => {
    const item = flat[index];
    if (!item) return;
    onClose();
    router.push(item.href);
  };

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="absolute inset-x-4 top-[12vh] mx-auto w-[min(640px,100%)] overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSelected((s) => Math.min(s + 1, flat.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSelected((s) => Math.max(s - 1, 0));
                  } else if (e.key === "Enter") {
                    select(selected);
                  } else if (e.key === "Escape") {
                    onClose();
                  }
                }}
                placeholder="Search projects, tasks, clients..."
                className="h-14 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                esc
              </kbd>
            </div>

            <div className="max-h-[360px] overflow-y-auto p-2">
              {flat.length === 0 ? (
                <div className="px-3 py-10 text-center text-sm text-muted-foreground">
                  No results for &ldquo;{query}&rdquo;
                </div>
              ) : (
                <div className="space-y-3">
                  {groups.map((group) => (
                    <div key={group.label}>
                      <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {group.label}
                      </p>
                      <div className="space-y-0.5">
                        {group.items.map((item) => {
                          const flatIndex = flat.indexOf(item);
                          const active = flatIndex === selected;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => select(flatIndex)}
                              onMouseEnter={() => setSelected(flatIndex)}
                              className={cn(
                                "flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors",
                                active ? "bg-primary/10" : "hover:bg-accent/50"
                              )}
                            >
                              {item.icon ? (
                                <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                              ) : (
                                <ArrowUpRight className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                              )}
                              <span className="min-w-0 flex-1">
                                <span className={cn("block truncate text-sm", active ? "text-primary" : "text-foreground")}>
                                  {item.label}
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">{item.detail}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 border-t border-border bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
              <span><kbd className="rounded border border-border bg-card px-1 font-mono">↑</kbd> <kbd className="rounded border border-border bg-card px-1 font-mono">↓</kbd> navigate</span>
              <span><kbd className="rounded border border-border bg-card px-1 font-mono">↵</kbd> select</span>
              <span className="ml-auto"><kbd className="rounded border border-border bg-card px-1 font-mono">⌘K</kbd> open anytime</span>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}