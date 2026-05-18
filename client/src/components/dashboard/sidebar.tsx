"use client";

import { BarChart3, ShoppingCart, Package, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 bg-[#121A2B] border-r border-white/10 p-6 hidden lg:flex flex-col">
      <h1 className="text-2xl font-bold mb-10">
        Biz<span className="text-blue-500">Flow</span>
      </h1>
      <nav className="space-y-3">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition",
              pathname === href
                ? "bg-blue-600"
                : "hover:bg-white/5 text-gray-300"
            )}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="mt-auto bg-blue-500/10 rounded-2xl p-4 border border-blue-500/20">
        <p className="text-sm text-gray-300">
          Upgrade to Pro for AI analytics and automation tools.
        </p>
        <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 transition rounded-xl py-2 font-medium">
          Upgrade
        </button>
      </div>
    </aside>
  );
}
