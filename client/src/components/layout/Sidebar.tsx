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
import { motion, AnimatePresence } from "framer-motion";

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
      <div className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
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
                "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
              )}
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground/70 group-hover:text-foreground"
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
      <div className="flex h-16 items-center justify-between gap-3 border-b border-border px-5">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9">
            <Image src="/logo.png" alt="BizFlow" fill sizes="36px" className="object-contain" />
          </div>
          <h1 className="text-lg font-bold text-foreground">BizFlow</h1>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground lg:hidden">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        {navigation.map((group) => (
          <NavGroupItem key={group.title} group={group} pathname={pathname} />
        ))}
      </div>
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow-sm">
            {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate capitalize">{user?.role || "Unknown"}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-all duration-200"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-sidebar border-r border-border h-screen">
        {sidebarContent}
      </aside>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col bg-sidebar border-r border-border shadow-dropdown"
            >
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
