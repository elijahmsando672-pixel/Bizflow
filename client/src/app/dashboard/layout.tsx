"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import AuthGuard from "@/components/auth/AuthGuard";
import IdleWarning from "@/components/auth/IdleWarning";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  LayoutGrid, Users, User, Tag, Package, ShoppingCart, TrendingDown,
  Boxes, DollarSign, BarChart3, Lightbulb, Building2, Smartphone,
  Bell, FileText, CreditCard, Settings, ChevronDown, ChevronLeft,
  ChevronRight, Menu, LogOut, Moon, Sun, Check, Store,
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

const crumbLabels: Record<string, string> = {
  new: "New",
  edit: "Edit",
  types: "Types",
  low: "Low Stock",
  audit: "Stock Auditing",
  agents: "Agents",
  transactions: "Transactions",
  reports: "Reports",
  releases: "App Releases",
  expiring: "Expiring Soon",
  account: "Account Settings",
  security: "Security",
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

function buildBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href?: string }[] = [{ label: "Dashboard", href: "/dashboard" }];
  let acc = "";
  parts.forEach((part, idx) => {
    acc += "/" + part;
    if (idx === parts.length - 1) {
      crumbs.push({ label: crumbLabels[part] || part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " ") });
    } else {
      const label = pageLabels[part] || crumbLabels[part] || part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " ");
      crumbs.push({ label, href: acc });
    }
  });
  return crumbs;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout, selectedShop, shops, setSelectedShop } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopMenuOpen, setShopMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(getExpandedDefaults(pathname));
  const activeId = getActiveId(pathname);
  const breadcrumbs = buildBreadcrumbs(pathname);

  const toggleSubmenu = (menuId: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  const renderSidebar = (compact: boolean) => (
    <>
      {/* Branding */}
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-4 flex-shrink-0">
        <div className="relative h-8 w-8 flex-shrink-0">
          <Image src="/logo.png" alt="BizFlow" fill sizes="32px" className="object-contain" />
        </div>
        {!compact && <span className="text-lg font-bold text-foreground">BizFlow</span>}
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isExpanded = expandedMenus[item.id];
          const isActive = activeId === item.id;

          return (
            <div key={item.id} className="mb-0.5">
              <button
                title={compact ? item.label : undefined}
                onClick={() => {
                  if (compact) {
                    setCollapsed(false);
                    if (item.hasSubmenu) toggleSubmenu(item.id);
                  } else if (item.hasSubmenu) {
                    toggleSubmenu(item.id);
                  } else {
                    router.push(item.href);
                    setMobileOpen(false);
                  }
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors group",
                  isActive
                    ? "bg-accent text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!compact && (
                  <>
                    <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                    {item.hasSubmenu && (
                      <ChevronDown
                        size={16}
                        className={cn("transition-transform", isExpanded && "rotate-180")}
                      />
                    )}
                  </>
                )}
              </button>
              {!compact && item.hasSubmenu && isExpanded && item.children && (
                <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-2">
                  {item.children.map((child) => (
                    <button
                      key={child.href}
                      onClick={() => { router.push(child.href); setMobileOpen(false); }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors",
                        pathname === child.href
                          ? "bg-accent/60 text-primary font-medium"
                          : "text-muted-foreground hover:bg-accent/40 hover:text-accent-foreground"
                      )}
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

      {/* Mini-variant toggle */}
      <div className="border-t border-border p-2 text-center flex-shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </>
  );

  const sidebarWidth = collapsed ? "w-20" : "w-[260px]";

  return (
    <AuthGuard>
      <IdleWarning />
      <div className="flex h-screen bg-background">
        {/* Desktop sidebar */}
        <aside className={cn("hidden lg:flex flex-col flex-shrink-0 bg-sidebar border-r border-border transition-all duration-300", sidebarWidth)}>
          {renderSidebar(collapsed)}
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-[260px] flex flex-col overflow-hidden bg-sidebar border-r border-border shadow-modal">
              {renderSidebar(false)}
            </aside>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* App bar */}
          <header className="bg-card/85 backdrop-blur-xl border-b border-border px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>
              {/* Breadcrumbs */}
              <nav className="hidden sm:flex items-center gap-1.5 text-sm min-w-0" aria-label="Breadcrumb">
                {breadcrumbs.map((crumb, idx) => (
                  <span key={idx} className="flex items-center gap-1.5 min-w-0">
                    {idx > 0 && <ChevronRight size={14} className="text-muted-foreground/50 flex-shrink-0" />}
                    {crumb.href ? (
                      <button
                        onClick={() => router.push(crumb.href!)}
                        className="text-muted-foreground hover:text-primary transition-colors truncate"
                      >
                        {crumb.label}
                      </button>
                    ) : (
                      <span className="text-foreground font-semibold truncate">{crumb.label}</span>
                    )}
                  </span>
                ))}
              </nav>
              <span className="sm:hidden text-foreground font-semibold text-base">
                {breadcrumbs[breadcrumbs.length - 1].label}
              </span>
            </div>

            <div className="flex items-center gap-1.5 lg:gap-2">
              {/* Shop switcher */}
              <div className="relative">
                <button
                  onClick={() => setShopMenuOpen(!shopMenuOpen)}
                  className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-accent text-foreground"
                >
                  <Store size={16} className="text-primary" />
                  <span className="hidden md:inline max-w-[140px] truncate font-medium">
                    {(selectedShop?.name || "Main Shop").toUpperCase()}
                  </span>
                  <ChevronDown size={14} className="text-muted-foreground" />
                </button>
                {shopMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShopMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 z-50 w-60 overflow-hidden rounded-md border border-border bg-card shadow-dropdown">
                      <div className="border-b border-border px-3 py-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Switch Shop</p>
                      </div>
                      <div className="p-1">
                        {shops.length === 0 ? (
                          <p className="px-3 py-2 text-sm text-muted-foreground">No shops available</p>
                        ) : shops.map((shop) => (
                          <button
                            key={shop.id}
                            onClick={() => { setSelectedShop(shop); setShopMenuOpen(false); }}
                            className={cn(
                              "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                              selectedShop?.id === shop.id
                                ? "bg-accent text-primary font-medium"
                                : "text-foreground/80 hover:bg-muted"
                            )}
                          >
                            <Store size={14} className="text-muted-foreground" />
                            <span className="flex-1 truncate text-left">{shop.name}</span>
                            {selectedShop?.id === shop.id && <Check size={14} className="text-primary" />}
                          </button>
                        ))}
                        <div className="mt-1 border-t border-border pt-1">
                          <button
                            onClick={() => { setShopMenuOpen(false); router.push("/select-shop"); }}
                            className="w-full text-left rounded-md px-3 py-2 text-sm text-primary hover:bg-accent"
                          >
                            Change shop…
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={toggleTheme}
                className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              >
                {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <button
                onClick={() => router.push("/notifications")}
                className="relative rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                title="Notifications"
              >
                <Bell size={18} />
                <span
                  className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-card"
                />
              </button>

              <div className="ml-1 lg:ml-2 flex items-center gap-2 border-l border-border pl-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#4DD0E1] to-[#0E8FA8] text-xs font-bold text-white shadow-sm"
                  title={user?.name || "User"}
                >
                  {(user?.name || "U")[0].toUpperCase()}
                </div>
                <button
                  onClick={logout}
                  className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </header>

          {/* Page content */}
          <div className="flex-1 overflow-auto bg-background">
            <div className="mx-auto max-w-[1200px] p-4 lg:p-6">
              {children}
              <footer className="mt-8 text-center text-xs text-muted-foreground">
                BizFlow © {new Date().getFullYear()}
              </footer>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}