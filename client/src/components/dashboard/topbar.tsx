"use client";

import { Search, Bell } from "lucide-react";

export function DashboardTopbar() {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4 bg-card px-4 py-3 rounded-xl w-full max-w-md border border-border">
        <Search size={18} className="text-muted-foreground" />
        <input
          placeholder="Search..."
          className="bg-transparent outline-none w-full text-sm text-foreground placeholder-muted-foreground"
        />
      </div>
      <div className="flex items-center gap-4">
        <button className="bg-card p-3 rounded-xl border border-border">
          <Bell size={18} className="text-muted-foreground" />
        </button>
        <img
          src="https://i.pravatar.cc/100"
          alt="profile"
          className="w-11 h-11 rounded-full border border-border"
        />
      </div>
    </div>
  );
}
