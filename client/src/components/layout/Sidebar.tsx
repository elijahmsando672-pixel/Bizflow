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
} from "lucide-react";

const navigation = [
  {
    title: "Money",
    items: [
      { name: "Sales", href: "/sales", icon: ShoppingCart },
      { name: "Expenses", href: "/expenses", icon: DollarSign },
      { name: "Creditors", href: "/creditors", icon: CreditCard },
    ],
  },
  {
    title: "Inventory",
    items: [
      { name: "Products", href: "/products", icon: Package },
    ],
  },
  {
    title: "People",
    items: [
      { name: "Customers", href: "/customers", icon: Users },
    ],
  },
  {
    title: "Insights",
    items: [
      { name: "Reports", href: "/reports", icon: BarChart3 },
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    title: "System",
    items: [
      { name: "Documents", href: "/documents", icon: FileText },
      { name: "Notifications", href: "/notifications", icon: Bell },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
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