"use client";

import { Wallet } from "lucide-react";

export default function CreditPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="bg-primary/10 p-4 rounded-md mb-4">
        <Wallet className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">Credit</h2>
      <p className="text-muted-foreground text-sm">Manage credit sales and customer credit limits.</p>
    </div>
  );
}
