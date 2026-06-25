"use client";

import { PageHeader, StatCard, Card } from "@/components/dashboard/ui";
import { BarChart3, TrendingUp, Users as UsersIcon, ShoppingCart } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div>
      <PageHeader title="Analytics" subtitle="Business performance metrics">
      </PageHeader>
      <div className="flex flex-wrap gap-3 mb-4">
        <StatCard label="Page Views" value="--" icon={<BarChart3 className="h-4 w-4" />} />
        <StatCard label="Conversion" value="-- %" icon={<TrendingUp className="h-4 w-4" />} accent="var(--color-success)" />
        <StatCard label="Active Users" value="--" icon={<UsersIcon className="h-4 w-4" />} accent="var(--color-primary)" />
        <StatCard label="Sales Trend" value="--" icon={<ShoppingCart className="h-4 w-4" />} accent="var(--color-warning)" />
      </div>
      <Card className="py-16 text-center">
        <div className="mb-3 text-muted-foreground/30 flex justify-center">
          <BarChart3 className="h-12 w-12" strokeWidth={1} />
        </div>
        <h3 className="text-base font-semibold text-muted-foreground">Analytics Dashboard</h3>
        <p className="mt-1 text-sm text-muted-foreground/60">Coming soon — detailed analytics and reporting.</p>
      </Card>
    </div>
  );
}
