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
  UserCog,
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
  Shield,
  Database,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

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
      { name: "Users", href: "/users", icon: UserCog },
      { name: "Team", href: "/team", icon: UserPlus },
      { name: "Employees", href: "/employees", icon: HardHat },
    ],
  },
  {
    title: "Insights",
    items: [
      { name: "Reports", href: "/reports", icon: BarChart3 },
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "AI Insights", href: "/ai", icon: Brain },
    ],
  },
  {
    title: "System",
    items: [
      { name: "Permissions", href: "/permissions", icon: Shield },
      { name: "Data Import", href: "/data-import", icon: Database },
      { name: "Documents", href: "/documents", icon: FileText },
      { name: "Notifications", href: "/notifications", icon: Bell },
      { name: "Subscription", href: "/subscription", icon: UserCheck },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

function NavGroupItem({ group, pathname }: { group: NavGroup; pathname: string }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
      >
        {group.title}
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>
      {isOpen && (
        <div className="mt-1 space-y-0.5 px-2">
          {group.items.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                  active
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                    active
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400"
                      : "text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:bg-gray-700 dark:group-hover:text-gray-300"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                {item.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-5 dark:border-gray-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold shadow-sm">
          B
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">BizFlow</h1>
          <p className="text-[11px] leading-tight text-gray-500 dark:text-gray-400">Business OS</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        {navigation.map((group) => (
          <NavGroupItem key={group.title} group={group} pathname={pathname} />
        ))}
      </div>
    </aside>
  );
}
