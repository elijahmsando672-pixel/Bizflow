"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  CreditCard,
  BarChart3,
  FileText,
  Bell,
  Settings,
  UserPlus,
  HardHat,
  BadgeDollarSign,
  Brain,
  UserCheck,
  Target,
  FolderKanban,
  Ticket,
  FolderOpen,
  Truck,
  Clock,
} from "lucide-react";

const navigation = [
  {
    title: "Sales & CRM",
    items: [
      { name: "CRM", href: "/crm", icon: Target },
      { name: "Pipeline", href: "/pipeline", icon: FolderKanban },
      { name: "Sales", href: "/sales", icon: ShoppingCart },
      { name: "Debtors", href: "/debtors", icon: BadgeDollarSign },
    ],
  },
  {
    title: "Operations",
    items: [
      { name: "Projects", href: "/projects", icon: FolderOpen },
      { name: "Procurement", href: "/procurement", icon: Truck },
      { name: "Time Tracking", href: "/timetracking", icon: Clock },
      { name: "Products", href: "/products", icon: Package },
    ],
  },
  {
    title: "Money",
    items: [
      { name: "Expenses", href: "/expenses", icon: DollarSign },
      { name: "Creditors", href: "/creditors", icon: CreditCard },
    ],
  },
  {
    title: "Support",
    items: [
      { name: "Tickets", href: "/support", icon: Ticket },
    ],
  },
  {
    title: "People",
    items: [
      { name: "Customers", href: "/customers", icon: Users },
      { name: "Team", href: "/team", icon: UserPlus },
      { name: "Employees", href: "/employees", icon: HardHat },
    ],
  },
  {
    title: "Insights",
    items: [
      { name: "Reports", href: "/reports", icon: BarChart3 },
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "AI Insights", href: "/ai", icon: Brain },
    ],
  },
  {
    title: "System",
    items: [
      { name: "Documents", href: "/documents", icon: FileText },
      { name: "Notifications", href: "/notifications", icon: Bell },
      { name: "Subscription", href: "/subscription", icon: UserCheck },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
        <img
          src="/logo.png"
          alt="BizFlow"
          width={36}
          height={36}
          className="h-9 w-9 rounded-md"
        />
        <h1 className="text-xl font-bold text-blue-600">BizFlow</h1>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        {navigation.map((group) => (
          <div key={group.title} className="mb-4 px-3">
            <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              {group.title}
            </h2>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}