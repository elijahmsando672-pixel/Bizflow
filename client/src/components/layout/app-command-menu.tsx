"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search, X } from "lucide-react";
import { NAVIGATION, QUICK_ACTIONS, findActiveNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CommandEntry {
  id: string;
  label: string;
  group: string;
  href: string;
  keywords: string;
  Icon: typeof Search;
}

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);

  const entries = useMemo<CommandEntry[]>(() => {
    const fromNav: CommandEntry[] = NAVIGATION.flatMap((group) =>
      group.items.map((item) => ({
        id: `nav-${item.id}`,
        label: item.label,
        group: group.label,
        href: item.href,
        keywords: `${item.label} ${group.label}`.toLowerCase(),
        Icon: item.icon,
      }))
    );
    const fromActions: CommandEntry[] = QUICK_ACTIONS.map((action) => ({
      id: `action-${action.href}-${action.label}`,
      label: action.label,
      group: "Quick actions",
      href: action.href,
      keywords: `${action.label} ${action.keywords}`.toLowerCase(),
      Icon: action.icon,
    }));
    return [...fromActions, ...fromNav];
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries.slice(0, 12);
    return entries
      .filter((entry) => entry.label.toLowerCase().includes(q) || entry.keywords.includes(q))
      .slice(0, 12);
  }, [entries, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
      const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    setCursor(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  const active = findActiveNav(results[cursor]?.href ?? "");

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search and quick actions"
        className="relative w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-modal"
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setCursor((c) => (results.length === 0 ? 0 : (c + 1) % results.length));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setCursor((c) => (results.length === 0 ? 0 : (c - 1 + results.length) % results.length));
              } else if (event.key === "Enter" && results[cursor]) {
                event.preventDefault();
                go(results[cursor].href);
              }
            }}
            placeholder="Search pages, actions, or jump to…"
            aria-label="Search pages and actions"
            className="h-12 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close search"
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="max-h-[22rem] overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No matches for “{query}”
            </p>
          ) : (
            <ul>
              {results.map((entry, index) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setCursor(index)}
                    onClick={() => go(entry.href)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors",
                      index === cursor ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-muted/70"
                    )}
                  >
                    <entry.Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-sm">{entry.label}</span>
                    <span className="shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground">
                      {entry.group}
                    </span>
                    {index === cursor ? (
                      <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-sans">↑</kbd>
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-sans">↓</kbd>
            to navigate
            <kbd className="ml-2 rounded border border-border bg-muted px-1 py-0.5 font-sans">Enter</kbd>
            to open
          </span>
          {active ? <span className="truncate">in {active.item.label}</span> : null}
        </div>
      </div>
    </div>
  );
}
