"use client";

import { ArrowRightLeft } from "lucide-react";

export default function TransfersPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="bg-gradient-to-br from-teal-600 to-teal-700 p-4 rounded-2xl mb-4">
        <ArrowRightLeft className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">Transfers</h2>
      <p className="text-muted-foreground text-sm">Manage stock transfers between shops.</p>
    </div>
  );
}
