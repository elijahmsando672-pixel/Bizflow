"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, ChevronsLeft, ChevronsRight, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { navMain, navSecondary } from "@/lib/modules";
import { getInitials } from "@/lib/modules-data";
import { useAuth } from "@/lib/auth-context";

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  mobile?: boolean;
  onNavigate?: () => void;
}

function isItemActive(pathname: string, href: string) {
  if (href === "/modules") return pathname === "/modules";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ collapsed = false, onToggleCollapsed, mobile = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-2.5 border-b border-border px-4",
          collapsed && !mobile && "justify-center px-0"
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-cyan-600 text-white shadow-sm">
          <Sparkles className="h-4 w-4" />
        </div>
        {(!collapsed || mobile) && (
          <div className="leading-tight">
            <p className="text-sm font-semibold text-foreground">BizFlow</p>
            <p className="text-xs text-muted-foreground">Business Suite</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {!collapsed && !mobile ? (
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Modules
          </p>
        ) : null}

        <ul className="space-y-1">
          {navMain.map((item) => {
            const active = isItemActive(pathname, item.href);
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    collapsed && !mobile && "justify-center px-0",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {(!collapsed || mobile) && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="my-4 h-px bg-border" />

        {!collapsed && !mobile ? (
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            General
          </p>
        ) : null}

        <ul className="space-y-1">
          {navSecondary.map((item) => {
            const active = isItemActive(pathname, item.href);
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    collapsed && !mobile && "justify-center px-0",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {(!collapsed || mobile) && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {mobile ? (
        <div className="shrink-0 border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {user ? getInitials(user.name) : "?"}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-medium text-foreground">{user?.name ?? "User"}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              aria-label="Sign out"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : onToggleCollapsed ? (
        <div className="shrink-0 border-t border-border p-3">
          <button
            type="button"
            onClick={onToggleCollapsed}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground",
              collapsed && "justify-center px-0"
            )}
          >
            {collapsed ? <ChevronsRight className="h-[18px] w-[18px]" /> : <ChevronsLeft className="h-[18px] w-[18px]" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      ) : null}
    </div>
  );
}