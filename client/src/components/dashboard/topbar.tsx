"use client";

import { Search, Bell } from "lucide-react";

export function DashboardTopbar() {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4 bg-[#121A2B] px-4 py-3 rounded-xl w-full max-w-md">
        <Search size={18} className="text-gray-400" />
        <input
          placeholder="Search..."
          className="bg-transparent outline-none w-full text-sm text-white placeholder-gray-500"
        />
      </div>
      <div className="flex items-center gap-4">
        <button className="bg-[#121A2B] p-3 rounded-xl">
          <Bell size={18} className="text-gray-300" />
        </button>
        <img
          src="https://i.pravatar.cc/100"
          alt="profile"
          className="w-11 h-11 rounded-full border border-white/10"
        />
      </div>
    </div>
  );
}
