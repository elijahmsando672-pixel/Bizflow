"use client";

import { cn } from "@/lib/utils";

export function StatCard({
  title,
  value,
  change,
  icon,
  trend = "up",
}: {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}) {
  const trendColors = {
    up: "text-green-400",
    down: "text-red-400",
    neutral: "text-gray-400",
  };

  return (
    <div className="bg-card p-6 rounded-2xl border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="text-muted-foreground text-sm font-medium">{title}</div>
        <div className="bg-primary/10 p-3 rounded-xl text-primary">
          {icon}
        </div>
      </div>
      <h2 className="text-3xl font-bold text-card-foreground mb-1">{value}</h2>
      <p className={cn("text-sm", trendColors[trend])}>{change}</p>
    </div>
  );
}
