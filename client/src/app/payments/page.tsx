"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Payments</h1>
        <p className="text-gray-400 text-sm mt-1">Payment history and transactions.</p>
      </div>

      <Card className="bg-[#121A2B] border-white/10">
        <CardContent className="pt-6">
          <div className="text-center py-12 text-gray-500">
            <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No payment data yet</p>
            <p className="text-sm text-gray-600 mt-1">Payments from creditors and debtors will appear here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
