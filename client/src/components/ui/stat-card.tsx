import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type StatTone = "primary" | "success" | "warning" | "danger" | "info" | "neutral";

const ICON_TONES: Record<StatTone, string> = {
  primary: "bg-primary/10 text-accent-foreground",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
  neutral: "bg-muted text-muted-foreground",
};

const DELTA_TONES = {
  up: "text-success",
  down: "text-destructive",
  flat: "text-muted-foreground",
} as const;

export interface StatCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  tone?: StatTone;
  /** Signed percentage change; sign drives the arrow and colour. */
  delta?: number | null;
  /** Optional context line under the value, e.g. "of KES 120,000 target". */
  hint?: React.ReactNode;
  href?: string;
  loading?: boolean;
  /** When true a positive delta is bad (e.g. expenses, out-of-stock). */
  invertDelta?: boolean;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  delta,
  hint,
  href,
  loading = false,
  invertDelta = false,
  className,
  ...props
}: StatCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {Icon ? (
          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md", ICON_TONES[tone])}>
            <Icon className="h-4 w-4" aria-hidden />
          </span>
        ) : null}
      </div>

      <div className="mt-3">
        {loading ? (
          <Skeleton className="h-7 w-24" />
        ) : (
          <p className="text-2xl font-semibold leading-none tracking-tight text-foreground">{value}</p>
        )}
      </div>

      {typeof delta === "number" && Number.isFinite(delta) ? (
        <DeltaRow delta={delta} invert={invertDelta} />
      ) : null}
      {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </>
  );

  const shell = cn(
    "rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm transition-colors",
    href && "hover:border-primary/40 focus-visible:border-primary/40",
    className
  );

  if (href) {
    return (
      <Link href={href} className={cn(shell, "block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}>
        {body}
      </Link>
    );
  }

  return (
    <div className={shell} {...props}>
      {body}
    </div>
  );
}

function DeltaRow({ delta, invert }: { delta: number; invert: boolean }) {
  const magnitude = Math.abs(delta);
  if (magnitude < 0.05) {
    return (
      <p className="mt-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Minus className="h-3.5 w-3.5" aria-hidden />
        No change
      </p>
    );
  }
  const isUp = delta > 0;
  const positive = invert ? !isUp : isUp;
  const tone = positive ? DELTA_TONES.up : DELTA_TONES.down;
  const Icon = isUp ? ArrowUpRight : ArrowDownRight;
  return (
    <p className={cn("mt-2 flex items-center gap-1 text-xs font-medium", tone)}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {magnitude.toFixed(1)}% <span className="font-normal text-muted-foreground">vs last period</span>
    </p>
  );
}
