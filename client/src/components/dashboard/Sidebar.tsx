"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Grid3X3, BarChart3, ShoppingCart, FileText, CreditCard,
  Package, Layers, Users as UsersIcon,
  Wallet, TrendingUp, Building2, Settings,
} from "lucide-react";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const SIDEBAR_GROUPS: { label: string; items: SidebarItem[] }[] = [
  { label: "DASHBOARD", items: [
    { id: "dashboard", label: "Overview", icon: <Grid3X3 className="h-3.5 w-3.5" /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 className="h-3.5 w-3.5" /> },
  ]},
  { label: "SALES", items: [
    { id: "sales", label: "Point of Sale", icon: <ShoppingCart className="h-3.5 w-3.5" /> },
    { id: "orders", label: "Orders", icon: <FileText className="h-3.5 w-3.5" /> },
  ]},
  { label: "PAYMENTS", items: [
    { id: "payments", label: "Transactions", icon: <CreditCard className="h-3.5 w-3.5" /> },
  ]},
  { label: "INVENTORY", items: [
    { id: "inventory", label: "Products", icon: <Package className="h-3.5 w-3.5" /> },
    { id: "categories", label: "Categories", icon: <Layers className="h-3.5 w-3.5" /> },
  ]},
  { label: "CUSTOMERS", items: [
    { id: "customers", label: "Customers", icon: <UsersIcon className="h-3.5 w-3.5" /> },
  ]},
  { label: "FINANCE", items: [
    { id: "expenses", label: "Expenses", icon: <Wallet className="h-3.5 w-3.5" /> },
    { id: "revenue", label: "Revenue", icon: <TrendingUp className="h-3.5 w-3.5" /> },
  ]},
  { label: "SHOPS", items: [
    { id: "shops", label: "Branches", icon: <Building2 className="h-3.5 w-3.5" /> },
  ]},
  { label: "SYSTEM", items: [
    { id: "settings", label: "Settings", icon: <Settings className="h-3.5 w-3.5" /> },
  ]},
];

function getActiveId(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "dashboard" && parts[1]) return parts[1];
  return "dashboard";
}

export default function Sidebar({ collapsed }: { collapsed?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeId = getActiveId(pathname);

  return (
    <div className={cn(
      "h-full flex flex-col bg-card border-r border-border transition-all duration-300",
      collapsed ? "w-[60px]" : "w-[220px]",
    )}>
      <div className="flex items-center gap-2.5 px-4 h-[52px] border-b border-border shrink-0">
        <div className="w-7 h-7 relative shrink-0">
          <Image src="/logo.png" alt="BizFlow" fill sizes="28px" className="object-contain" />
        </div>
        {!collapsed && <span className="text-sm font-bold text-foreground">BizFlow</span>}
      </div>
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {SIDEBAR_GROUPS.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {group.label}
              </div>
            )}
            {group.items.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "dashboard") router.push("/dashboard");
                  else router.push(`/dashboard/${item.id}`);
                }}
                className={cn(
                  "flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all",
                  activeId === item.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  collapsed && "justify-center px-0",
                )}
                title={collapsed ? item.label : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
