"use client";

import { PageHeader } from "@/components/dashboard/ui";
import { Card } from "@/components/dashboard/ui";
import { TrendingUp } from "lucide-react";

export default function RevenuePage() {
  return (
    <div>
      <PageHeader title="Revenue" subtitle="Track your income and profit">
      </PageHeader>
      <Card className="py-16 text-center">
        <div className="mb-3 text-muted-foreground/30 flex justify-center">
          <TrendingUp className="h-12 w-12" strokeWidth={1} />
        </div>
        <h3 className="text-base font-semibold text-muted-foreground">Revenue Analytics</h3>
        <p className="mt-1 text-sm text-muted-foreground/60">Coming soon — detailed revenue breakdowns and charts.</p>
      </Card>
    </div>
  );
}
