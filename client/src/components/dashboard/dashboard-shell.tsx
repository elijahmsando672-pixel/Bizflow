import type { ReactNode } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0B1020]">
      <DashboardSidebar />
      <main className="flex-1 flex flex-col">
        <DashboardTopbar />
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
