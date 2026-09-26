"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, ChevronsLeft, ChevronsRight, LogOut } from "lucide-react";
import { findActiveNav, isNavChildActive, isNavItemActive, NAVIGATION, type NavItem } from "@/lib/navigation";
import { useAuth } from "@/lib/auth-context";
import { Avatar } from "@/components/ui/avatar";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onNavigate?: () => void;
  /** Mobile drawer renders labels always and hides the collapse control. */
  variant?: "desktop" | "mobile";
}

export function AppSidebar({
  collapsed,
  onToggleCollapsed,
  onNavigate,
  variant = "desktop",
}: AppSidebarProps) {
  const pathname = usePathname() || "/dashboard";
  const router = useRouter();
  const { user, logout } = useAuth();
  const isCompact = variant === "desktop" && collapsed;

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  // Always reveal the group and item that own the current route.
  useEffect(() => {
    const active = findActiveNav(pathname);
    if (!active) return;
    setOpenGroups((prev) => (prev[active.group.id] ? prev : { ...prev, [active.group.id]: true }));
    if (active.item.children?.length) {
      setOpenItems((prev) => (prev[active.item.id] ? prev : { ...prev, [active.item.id]: true }));
    }
  }, [pathname]);

  const toggleGroup = (id: string) => setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleItem = (id: string) => setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));

  const go = (href: string) => {
    onNavigate?.();
    if (href !== pathname) router.push(href);
  };

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div
        className={cn(
          "flex h-14 shrink-0 items-center gap-2.5 border-b border-border px-4",
          isCompact && "justify-center px-0"
        )}
      >
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5" onClick={onNavigate}>
          <span className="relative h-8 w-8 shrink-0">
            <Image src="/logo.png" alt="" fill sizes="32px" className="object-contain" priority />
          </span>
          {!isCompact ? (
            <span className="truncate text-base font-semibold tracking-tight text-foreground">BizFlow</span>
          ) : null}
        </Link>
      </div>

      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        {NAVIGATION.map((group) => {
          const visibleItems = group.items;
          if (visibleItems.length === 0) return null;
          const isOpen = openGroups[group.id] ?? true;

          return (
            <div key={group.id} className="mb-5 last:mb-0">
              {!isCompact ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isOpen}
                  className="mb-1.5 flex w-full items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span className="flex-1 text-left">{group.label}</span>
                  <ChevronDown
                    className={cn("h-3.5 w-3.5 transition-transform duration-200", isOpen && "rotate-180")}
                    aria-hidden
                  />
                </button>
              ) : (
                <div className="mx-auto mb-2 h-px w-6 bg-border" aria-hidden />
              )}

              <ul className={cn("space-y-0.5", !isCompact && !isOpen && "hidden")}>
                {visibleItems.map((item) => (
                  <li key={item.id}>
                    <SidebarLink
                      item={item}
                      pathname={pathname}
                      compact={isCompact}
                      expanded={openItems[item.id] ?? false}
                      onToggle={() => toggleItem(item.id)}
                      onNavigate={onNavigate}
                      onGo={go}
                    />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-border p-3">
        {!isCompact ? (
          <div className="mb-2 flex items-center gap-2.5 rounded-md border border-border bg-card px-2.5 py-2">
            <Avatar name={user?.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{user?.name ?? "Signed in"}</p>
              <p className="truncate text-xs capitalize text-muted-foreground">{user?.role ?? "member"}</p>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              aria-label="Sign out"
              className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ) : (
          <div className="mb-2 flex justify-center">
            <Tooltip label={user?.name ? `Sign out ${user.name}` : "Sign out"}>
              <button
                type="button"
                onClick={() => logout()}
                aria-label="Sign out"
                className="rounded p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" aria-hidden />
              </button>
            </Tooltip>
          </div>
        )}

        {variant === "desktop" ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
              isCompact && "justify-center px-0"
            )}
            aria-label={isCompact ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCompact ? (
              <ChevronsRight className="h-4 w-4" aria-hidden />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4" aria-hidden />
                <span>Collapse</span>
              </>
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}

interface SidebarLinkProps {
  item: NavItem;
  pathname: string;
  compact: boolean;
  expanded: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  onGo: (href: string) => void;
}

function SidebarLink({ item, pathname, compact, expanded, onToggle, onNavigate, onGo }: SidebarLinkProps) {
  const Icon = item.icon;
  const isActive = isNavItemActive(pathname, item);
  const hasChildren = Boolean(item.children?.length);

  const rowClasses = cn(
    "group/link relative flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-accent text-accent-foreground"
      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
  );

  const rowContent = (
    <>
      {isActive ? (
        <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary" aria-hidden />
      ) : null}
      <Icon className={cn("h-4.5 w-4.5 shrink-0", isActive && "text-accent-foreground")} aria-hidden />
      {!compact ? <span className="flex-1 truncate text-left">{item.label}</span> : null}
    </>
  );

  const childrenNode = !compact && hasChildren && expanded ? (
    <ul className="mb-1 ml-4 mt-0.5 space-y-0.5 border-l border-border pl-2">
      {item.children!.map((child) => {
        const childActive = isNavChildActive(pathname, child);
        return (
          <li key={child.href}>
            <button
              type="button"
              onClick={() => onGo(child.href)}
              aria-current={childActive ? "page" : undefined}
              className={cn(
                "w-full truncate rounded px-2.5 py-1.5 text-left text-xs transition-colors",
                childActive
                  ? "bg-accent/70 font-medium text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              {child.label}
            </button>
          </li>
        );
      })}
    </ul>
  ) : null;

  if (compact) {
    return (
      <Tooltip label={item.label} side="right" className="w-full">
        <Link
          href={item.href}
          onClick={onNavigate}
          aria-current={isActive ? "page" : undefined}
          className={cn(rowClasses, "justify-center px-0")}
        >
          {rowContent}
        </Link>
      </Tooltip>
    );
  }

  return (
    <>
      <div className="flex items-center gap-0.5">
        <Link
          href={item.href}
          onClick={onNavigate}
          aria-current={isActive ? "page" : undefined}
          aria-expanded={hasChildren ? expanded : undefined}
          className={rowClasses}
        >
          {rowContent}
        </Link>
        {hasChildren ? (
          <button
            type="button"
            onClick={onToggle}
            aria-label={`${expanded ? "Collapse" : "Expand"} ${item.label}`}
            className="shrink-0 rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform duration-200", expanded && "rotate-180")}
              aria-hidden
            />
          </button>
        ) : null}
      </div>
      {childrenNode}
    </>
  );
}

export function useSidebarCollapsed(defaultCollapsed = false) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  useEffect(() => {
    const stored = localStorage.getItem("bizflow:sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
    if (stored === "false") setCollapsed(false);
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("bizflow:sidebar-collapsed", String(next));
      return next;
    });
  }, []);

  return useMemo(() => ({ collapsed, toggle }), [collapsed, toggle]);
}
