"use client";

import type { ReactNode } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#0B1020]">
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 flex flex-col">
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-6 lg:hidden">
          <Button variant="ghost" size="icon" className="text-gray-400" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold text-white">BizFlow</h1>
          <div className="w-10" />
        </div>
        <div className="flex-1 p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
