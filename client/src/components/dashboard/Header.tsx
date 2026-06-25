"use client";

import { usePathname, useRouter } from "next/navigation";
import { LogOut, Grid3X3, BarChart3, ChevronRight, ArrowLeft } from "lucide-react";
import { Avatar } from "./ui";

const pageLabels: Record<string, string> = {
  dashboard: "Overview",
  analytics: "Analytics",
  sales: "Point of Sale",
  orders: "Orders",
  payments: "Transactions",
  inventory: "Products",
  categories: "Categories",
  customers: "Customers",
  expenses: "Expenses",
  revenue: "Revenue",
  shops: "Branches",
  settings: "Settings",
  dispatch: "Dispatch",
  credit: "Credit",
  transfers: "Transfers",
  reports: "Reports",
  suppliers: "Suppliers",
};

const pageIcons: Record<string, React.ReactNode> = {
  dashboard: <Grid3X3 className="h-3.5 w-3.5" />,
  analytics: <BarChart3 className="h-3.5 w-3.5" />,
};

function getActiveId(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "dashboard" && parts[1]) return parts[1];
  return "dashboard";
}

export default function Header({ userName, onLogout }: { userName?: string; onLogout?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeId = getActiveId(pathname);
  const isDashboard = activeId === "dashboard";

  return (
    <div className="sticky top-0 z-40 flex h-[52px] items-center gap-3 border-b border-border px-6 py-2 bg-card/90 backdrop-blur-[12px]">
      <div className="flex flex-1 items-center gap-2">
        {!isDashboard && (
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors mr-1"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <span className="text-muted-foreground">{pageIcons[activeId] || <ChevronRight className="h-3.5 w-3.5" />}</span>
        <span className="text-[15px] font-semibold text-foreground">
          {pageLabels[activeId] || activeId}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <button
          className="flex cursor-pointer items-center gap-1.5 rounded-lg border px-[10px] py-1 text-xs"
          style={{
            background: "color-mix(in srgb, var(--color-primary) 11%, transparent)",
            borderColor: "color-mix(in srgb, var(--color-primary) 22%, transparent)",
            color: "var(--color-primary)",
          }}
        >
          <Avatar name={userName || "U"} size={22} />
          <span className="hidden sm:inline">{(userName || "User").toLowerCase()} · Owner</span>
        </button>
        <button
          onClick={onLogout}
          className="cursor-pointer rounded-lg border px-3 py-1 text-xs font-medium transition-all hover:opacity-80 flex items-center gap-1"
          style={{ borderColor: "color-mix(in srgb, var(--color-destructive) 33%, transparent)", color: "var(--color-destructive)" }}
        >
          <LogOut className="h-3 w-3" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </div>
  );
}
