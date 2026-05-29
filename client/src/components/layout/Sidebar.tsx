"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BarChart3,
  ShoppingCart,
  Package,
  Database,
  Tags,
  Users,
  Star,
  MessageSquare,
  CreditCard,
  Settings,
  User,
  LogOut,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
  {
    title: "Main",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
      { name: "Orders", href: "/orders", icon: ShoppingCart },
    ],
  },
  {
    title: "Store",
    items: [
      { name: "Products", href: "/products", icon: Package },
      { name: "Inventory", href: "/inventory", icon: Database },
      { name: "Categories", href: "/categories", icon: Tags },
    ],
  },
  {
    title: "Customers",
    items: [
      { name: "Customers", href: "/customers", icon: Users },
      { name: "Reviews", href: "/reviews", icon: Star },
      { name: "Messages", href: "/messages", icon: MessageSquare },
    ],
  },
  {
    title: "System",
    items: [
      { name: "Payments", href: "/payments", icon: CreditCard },
      { name: "Settings", href: "/settings", icon: Settings },
      { name: "Profile", href: "/profile", icon: User },
    ],
  },
];

function NavGroupItem({ group, pathname }: { group: NavGroup; pathname: string }) {
  return (
    <div className="mb-1">
      <div className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500/70">
        {group.title}
      </div>
      <div className="space-y-0.5 px-2">
        {group.items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                active
                  ? "text-indigo-300"
                  : "text-gray-400 hover:bg-white/[0.03] hover:text-gray-200"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-gradient-to-b from-indigo-400 to-purple-400" />
              )}
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md transition-all duration-150",
                  active
                    ? "bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 shadow-sm shadow-indigo-500/10"
                    : "text-gray-500 group-hover:text-gray-300"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              {item.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Sidebar({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center justify-between gap-3 border-b border-white/10 px-5">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9">
            <Image src="/logo.png" alt="BizFlow" fill className="object-contain" />
          </div>
          <h1 className="text-lg font-bold text-white">BizFlow</h1>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white lg:hidden">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        {navigation.map((group) => (
          <NavGroupItem key={group.title} group={group} pathname={pathname} />
        ))}
      </div>
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-semibold text-white shadow-sm">
            {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name || "User"}</p>
            <p className="text-xs text-gray-400 truncate capitalize">{user?.role || "Unknown"}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-all"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-[#080d1a] border-r border-[var(--border)] h-screen">
        {sidebarContent}
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <aside className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col bg-[#080d1a] border-r border-[var(--border)]">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
