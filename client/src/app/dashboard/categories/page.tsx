"use client";

import { PageHeader, Card } from "@/components/ui/dashboard-ui";
import { Layers } from "lucide-react";

export default function CategoriesPage() {
  return (
    <div>
      <PageHeader title="Categories" subtitle="Manage product categories">
      </PageHeader>
      <Card className="py-16 text-center">
        <div className="mb-3 text-muted-foreground/30 flex justify-center">
          <Layers className="h-12 w-12" strokeWidth={1} />
        </div>
        <h3 className="text-base font-semibold text-muted-foreground">Category Management</h3>
        <p className="mt-1 text-sm text-muted-foreground/60">Coming soon — organize your products by category.</p>
      </Card>
    </div>
  );
}
