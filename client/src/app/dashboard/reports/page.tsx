"use client";

import { BarChart2 } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="bg-gradient-to-br from-green-600 to-green-700 p-4 rounded-2xl mb-4">
        <BarChart2 className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">Reports</h2>
      <p className="text-muted-foreground text-sm">View business reports and analytics.</p>
    </div>
  );
}
