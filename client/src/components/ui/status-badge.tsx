import * as React from "react";
import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral" | "primary";

const TONE_STYLES: Record<StatusTone, string> = {
  success: "bg-success/10 text-success ring-success/20",
  warning: "bg-warning/10 text-warning ring-warning/20",
  danger: "bg-destructive/10 text-destructive ring-destructive/20",
  info: "bg-info/10 text-info ring-info/20",
  primary: "bg-primary/10 text-accent-foreground ring-primary/20",
  neutral: "bg-muted text-muted-foreground ring-border",
};

const DOT_STYLES: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
  info: "bg-info",
  primary: "bg-primary",
  neutral: "bg-muted-foreground",
};

const STATUS_TONES: Record<string, StatusTone> = {
  paid: "success",
  completed: "success",
  active: "success",
  delivered: "success",
  received: "success",
  approved: "success",
  confirmed: "success",
  sold: "success",
  pending: "warning",
  processing: "warning",
  partially_paid: "warning",
  partial: "warning",
  low_stock: "warning",
  low: "warning",
  due: "warning",
  draft: "neutral",
  scheduled: "neutral",
  cancelled: "danger",
  canceled: "danger",
  failed: "danger",
  overdue: "danger",
  returned: "danger",
  void: "danger",
  shipped: "info",
  dispatched: "info",
  in_transit: "info",
  in_progress: "info",
};

export function statusTone(status: string | null | undefined): StatusTone {
  if (!status) return "neutral";
  return STATUS_TONES[status.trim().toLowerCase()] ?? "neutral";
}

export function humanizeStatus(status: string | null | undefined): string {
  if (!status) return "Unknown";
  const spaced = status.trim().toLowerCase().replace(/[_-]+/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone;
  status?: string | null;
  dot?: boolean;
}

export function StatusBadge({ tone, status, dot = false, className, children, ...props }: StatusBadgeProps) {
  const resolved = tone ?? (status ? statusTone(status) : "neutral");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONE_STYLES[resolved],
        className
      )}
      {...props}
    >
      {dot ? <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT_STYLES[resolved])} /> : null}
      {children ?? humanizeStatus(status)}
    </span>
  );
}
