"use client";

import { UserCheck } from "lucide-react";

export default function SuppliersPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-2xl mb-4">
        <UserCheck className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">Suppliers</h2>
      <p className="text-muted-foreground text-sm">Manage suppliers and purchase orders.</p>
    </div>
  );
}
