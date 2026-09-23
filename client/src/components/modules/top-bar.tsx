"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  Building2,
  Check,
  Plus,
  Settings,
  User,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { workspaces } from "@/lib/modules";
import { notifications, getInitials } from "@/lib/modules-data";
import { useAuth } from "@/lib/auth-context";
import { useClickOutside } from "@/components/modules/use-click-outside";

interface TopBarProps {
  onOpenMobileNav: () => void;
  onOpenCommand: () => void;
}

const unreadCount = notifications.filter((n) => n.unread).length;

export function TopBar({ onOpenMobileNav, onOpenCommand }: TopBarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState(workspaces[0]);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const closeAll = () => {
    setWorkspaceOpen(false);
    setNotifOpen(false);
    setUserOpen(false);
  };

  useClickOutside(workspaceRef, () => setWorkspaceOpen(false), workspaceOpen);
  useClickOutside(notifRef, () => setNotifOpen(false), notifOpen);
  useClickOutside(userRef, () => setUserOpen(false), userOpen);

  const go = (href: string) => {
    closeAll();
    router.push(href);
  };

  const menuItemClass =
    "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-accent/50";

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur lg:px-6">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Workspace switcher */}
      <div className="relative shrink-0" ref={workspaceRef}>
        <button
          type="button"
          onClick={() => {
            closeAll();
            setWorkspaceOpen((o) => !o);
          }}
          aria-expanded={workspaceOpen}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/50"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
            {activeWorkspace.initials}
          </span>
          <span className="hidden max-w-[160px] truncate sm:block">{activeWorkspace.name}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>

        {workspaceOpen ? (
          <div className="absolute left-0 top-full mt-2 w-72 origin-top-left rounded-lg border border-border bg-card shadow-xl">
            <div className="px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Switch workspace
              </p>
            </div>
            <div className="px-1.5 pb-1.5">
              {workspaces.map((ws) => {
                const selected = ws.id === activeWorkspace.id;
                return (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => {
                      setActiveWorkspace(ws);
                      closeAll();
                    }}
                    className={cn("flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left", classNameHover())}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold",
                        selected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                      )}
                    >
                      {ws.initials}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{ws.name}</span>
                    {selected ? <Check className="h-4 w-4 text-primary" /> : null}
                  </button>
                );
              })}
            </div>
            <div className="my-1 h-px bg-border" />
            <div className="px-1.5 pb-1.5">
              <button type="button" onClick={() => go("/modules/settings")} className={menuItemClass}>
                <Plus className="h-4 w-4 text-muted-foreground" />
                <span>Create workspace</span>
              </button>
              <button type="button" onClick={() => go("/modules/settings")} className={menuItemClass}>
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>Workspace settings</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Global search */}
      <div className="flex min-w-0 flex-1 items-center justify-end md:justify-center">
        <button
          type="button"
          onClick={onOpenCommand}
          className="hidden w-full max-w-md items-center gap-2.5 rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-accent/50 hover:text-accent-foreground md:flex"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate text-left">Search projects, tasks, clients...</span>
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </button>
        <button
          type="button"
          onClick={onOpenCommand}
          aria-label="Search"
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground md:hidden"
        >
          <Search className="h-5 w-5" />
        </button>
      </div>

      {/* Notifications */}
      <div className="relative shrink-0" ref={notifRef}>
        <button
          type="button"
          onClick={() => {
            closeAll();
            setNotifOpen((o) => !o);
          }}
          aria-expanded={notifOpen}
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unreadCount}
            </span>
          ) : null}
        </button>

        {notifOpen ? (
          <div className="absolute right-0 top-full mt-2 w-80 origin-top-right rounded-lg border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
            </div>
            <div className="max-h-[320px] overflow-y-auto">
              {notifications.map((n) => (
                <div key={n.id} className="flex gap-3 border-t border-border px-4 py-3">
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      n.unread ? "bg-primary" : "bg-muted-foreground/30"
                    )}
                  />
                  <div className="min-w-0">
                    <p className={cn("text-sm", n.unread ? "font-medium text-foreground" : "text-muted-foreground")}>
                      {n.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{n.detail}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/70">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* User menu */}
      <div className="relative shrink-0" ref={userRef}>
        <button
          type="button"
          onClick={() => {
            closeAll();
            setUserOpen((o) => !o);
          }}
          aria-expanded={userOpen}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          {user ? getInitials(user.name) : "?"}
        </button>

        {userOpen ? (
          <div className="absolute right-0 top-full mt-2 w-64 origin-top-right rounded-lg border border-border bg-card shadow-xl">
            <div className="px-4 py-3">
              <p className="truncate text-sm font-semibold text-foreground">{user?.name ?? "User"}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              <span className="mt-1.5 inline-flex rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium capitalize text-muted-foreground">
                {user?.role ?? "Member"}
              </span>
            </div>
            <div className="h-px bg-border" />
            <div className="p-1.5">
              <button type="button" onClick={() => go("/modules/settings")} className={menuItemClass}>
                <User className="h-4 w-4 text-muted-foreground" />
                <span>My Profile</span>
              </button>
              <button type="button" onClick={() => go("/modules/settings")} className={menuItemClass}>
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>Account Settings</span>
              </button>
              <button type="button" onClick={() => go("/modules/settings")} className={menuItemClass}>
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>Workspace Settings</span>
              </button>
              <div className="my-1 h-px bg-border" />
              <button
                type="button"
                onClick={() => void logout()}
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}

function classNameHover() {
  return "transition-colors hover:bg-accent/50";
}