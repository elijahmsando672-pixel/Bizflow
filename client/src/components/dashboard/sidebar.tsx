"use client";

import { BarChart3, ShoppingCart, Package, Users, X, LayoutDashboard, TrendingUp, CreditCard, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-2xl font-bold text-white">
          Biz<span className="text-blue-500">Flow</span>
        </h1>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white lg:hidden">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <nav className="space-y-1 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition text-sm font-medium",
                active
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
              )}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto">
        <div className="bg-blue-500/10 rounded-2xl p-4 border border-blue-500/20 mb-4">
          <p className="text-sm text-gray-300">
            Upgrade to Pro for AI analytics and automation tools.
          </p>
          <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 transition rounded-xl py-2 text-sm font-medium text-white">
            Upgrade
          </button>
        </div>
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-semibold text-white shadow-sm">
            {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name || "User"}</p>
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
      <aside className="hidden lg:flex lg:flex-col w-72 bg-[#121A2B] border-r border-white/10 p-6">
        {sidebarContent}
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={onClose} />
          <aside className="fixed left-0 top-0 z-50 flex h-full w-72 flex-col bg-[#121A2B] border-r border-white/10 p-6">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
