"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import AuthGuard from "@/components/auth/AuthGuard";
import Image from "next/image";
import {
  LayoutGrid, Users, User, Tag, Package, ShoppingCart, TrendingDown,
  Boxes, DollarSign, BarChart3, Lightbulb, Building2, Smartphone,
  Bell, FileText, CreditCard, Settings, ChevronDown, Menu, LogOut, Moon, Sun,
} from "lucide-react";
import { useTheme } from "@/lib/theme-provider";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid, href: "/dashboard" },
  {
    id: "users", label: "Users", icon: Users, href: "/users", hasSubmenu: true,
    children: [
      { label: "All Users", href: "/users" },
      { label: "New User", href: "/users/new" },
    ],
  },
  {
    id: "customers", label: "Customers", icon: User, href: "/dashboard/customers", hasSubmenu: true,
    children: [
      { label: "All Customers", href: "/dashboard/customers" },
      { label: "New Customer", href: "/dashboard/customers/new" },
    ],
  },
  { id: "categories", label: "Categories", icon: Tag, href: "/dashboard/categories" },
  {
    id: "items", label: "Items", icon: Package, href: "/dashboard/inventory", hasSubmenu: true,
    children: [
      { label: "All Items", href: "/dashboard/inventory" },
      { label: "New Item", href: "/dashboard/inventory/new" },
      { label: "Stock Auditing", href: "/dashboard/inventory/audit" },
    ],
  },
  {
    id: "sales", label: "Sales", icon: ShoppingCart, href: "/dashboard/sales", hasSubmenu: true,
    children: [
      { label: "All Sales", href: "/dashboard/sales" },
      { label: "New Sale", href: "/dashboard/sales/new" },
    ],
  },
  {
    id: "expenses", label: "Expenses", icon: TrendingDown, href: "/dashboard/expenses", hasSubmenu: true,
    children: [
      { label: "All Expenses", href: "/dashboard/expenses" },
      { label: "New Expense", href: "/dashboard/expenses/new" },
      { label: "Expense Category", href: "/dashboard/expenses/categories" },
    ],
  },
  {
    id: "stocks", label: "Stocks", icon: Boxes, href: "/dashboard/stocks", hasSubmenu: true,
    children: [
      { label: "All Stocks", href: "/dashboard/stocks" },
      { label: "New Stock", href: "/dashboard/stocks/new" },
      { label: "Low Stocks", href: "/dashboard/stocks/low" },
    ],
  },
  {
    id: "budgets", label: "Budgets", icon: DollarSign, href: "/dashboard/budgets", hasSubmenu: true,
    children: [
      { label: "All Budgets", href: "/dashboard/budgets" },
      { label: "New Budget", href: "/dashboard/budgets/new" },
    ],
  },
  { id: "reports", label: "Reports", icon: BarChart3, href: "/dashboard/reports" },
  { id: "insights", label: "Insights", icon: Lightbulb, href: "/dashboard/analytics" },
  {
    id: "business", label: "Business", icon: Building2, href: "/dashboard/shops", hasSubmenu: true,
    children: [
      { label: "List", href: "/dashboard/shops" },
      { label: "New", href: "/dashboard/shops/new" },
      { label: "Types", href: "/dashboard/shops/types" },
    ],
  },
  {
    id: "mpesa", label: "M-Pesa", icon: Smartphone, href: "/dashboard/payments", hasSubmenu: true,
    children: [
      { label: "Agent", href: "/dashboard/payments/agents" },
      { label: "Transaction", href: "/dashboard/payments/transactions" },
      { label: "Report", href: "/dashboard/payments/reports" },
    ],
  },
  {
    id: "notifications", label: "Notifications", icon: Bell, href: "/notifications", hasSubmenu: true,
    children: [
      { label: "All Notifications", href: "/notifications" },
      { label: "Settings", href: "/notifications/settings" },
    ],
  },
  {
    id: "documents", label: "Documents", icon: FileText, href: "/documents", hasSubmenu: true,
    children: [
      { label: "All Documents", href: "/documents" },
      { label: "Expiring Soon", href: "/documents/expiring" },
    ],
  },
  {
    id: "creditors", label: "Creditors", icon: CreditCard, href: "/dashboard/credit", hasSubmenu: true,
    children: [
      { label: "Transactions", href: "/dashboard/credit/transactions" },
    ],
  },
  {
    id: "settings", label: "Settings", icon: Settings, href: "/dashboard/settings", hasSubmenu: true,
    children: [
      { label: "Management Menu", href: "/dashboard/settings" },
      { label: "App Releases", href: "/dashboard/settings/releases" },
    ],
  },
];

const pageLabels: Record<string, string> = {
  dashboard: "Dashboard",
  users: "Users",
  customers: "Customers",
  categories: "Categories",
  items: "Items",
  sales: "Sales",
  expenses: "Expenses",
  stocks: "Stocks",
  budgets: "Budgets",
  reports: "Reports",
  insights: "Insights",
  business: "Business",
  mpesa: "M-Pesa",
  notifications: "Notifications",
  documents: "Documents",
  creditors: "Creditors",
  settings: "Settings",
};

function getActiveId(pathname: string): string {
  for (const item of menuItems) {
    if (pathname === item.href || pathname.startsWith(item.href + "/")) return item.id;
    if (item.children) {
      for (const child of item.children) {
        if (pathname === child.href || pathname.startsWith(child.href + "/")) return item.id;
      }
    }
  }
  return "dashboard";
}

function getExpandedDefaults(pathname: string): Record<string, boolean> {
  const expanded: Record<string, boolean> = {};
  for (const item of menuItems) {
    if (!item.hasSubmenu || !item.children) continue;
    for (const child of item.children) {
      if (pathname === child.href || pathname.startsWith(child.href + "/")) {
        expanded[item.id] = true;
        break;
      }
    }
  }
  return expanded;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout, selectedShop } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(getExpandedDefaults(pathname));
  const activeId = getActiveId(pathname);

  const toggleSubmenu = (menuId: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? "w-64" : "w-20"
          } bg-sidebar border-r border-border transition-all duration-300 flex flex-col flex-shrink-0`}
        >
          {/* Logo */}
          <div
            className="p-4 border-b border-border cursor-pointer flex items-center gap-2.5"
            onClick={() => router.push("/dashboard")}
          >
            <div className="w-8 h-8 relative flex-shrink-0">
              <Image src="/logo.png" alt="BizFlow" fill sizes="32px" className="object-contain" />
            </div>
            {sidebarOpen && (
              <span className="text-lg font-bold text-foreground">BizFlow</span>
            )}
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isExpanded = expandedMenus[item.id];
              const isActive = activeId === item.id;

              return (
                <div key={item.id}>
                  <button
                    onMouseEnter={() => router.prefetch(item.href)}
                    onClick={() => {
                      if (item.hasSubmenu && !sidebarOpen) {
                        setSidebarOpen(true);
                        toggleSubmenu(item.id);
                      } else if (item.hasSubmenu) {
                        toggleSubmenu(item.id);
                      } else {
                        router.push(item.href);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors group ${
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-left text-sm">{item.label}</span>
                        {item.hasSubmenu && (
                          <ChevronDown
                            size={16}
                            className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          />
                        )}
                      </>
                    )}
                  </button>
                  {sidebarOpen && item.hasSubmenu && isExpanded && item.children && (
                    <div className="ml-3 mt-1 space-y-1 border-l border-border pl-0">
                      {item.children.map((child) => (
                        <button
                          key={child.href}
                          onMouseEnter={() => router.prefetch(child.href)}
                          onClick={() => router.push(child.href)}
                          className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                            pathname === child.href
                              ? "text-primary"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {child.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border text-center text-xs text-muted-foreground">
            {sidebarOpen && <p>BizFlow &copy; 2026</p>}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <div className="bg-sidebar border-b border-border px-6 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Menu size={22} />
              </button>
              <span className="text-foreground font-semibold text-base">
                {pageLabels[activeId] || activeId}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground hidden sm:block">
                {selectedShop?.name?.toUpperCase() || "MAIN SHOP"}
              </div>
              <button
                onClick={toggleTheme}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              >
                {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <button
                onClick={() => router.push("/dashboard/settings")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Settings size={18} />
              </button>
              <button
                onClick={() => router.push("/notifications")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Bell size={18} />
              </button>
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold"
                >
                  {(user?.name || "U")[0].toUpperCase()}
                </div>
                <button
                  onClick={logout}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div className="flex-1 overflow-auto p-6 bg-background">
            {children}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
