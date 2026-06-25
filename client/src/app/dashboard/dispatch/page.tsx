"use client";

import { Truck } from "lucide-react";

export default function DispatchPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="bg-gradient-to-br from-teal-500 to-cyan-500 p-4 rounded-2xl mb-4">
        <Truck className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">Dispatch</h2>
      <p className="text-muted-foreground text-sm">Manage deliveries and dispatch operations.</p>
    </div>
  );
}
