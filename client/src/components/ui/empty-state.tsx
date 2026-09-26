import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { CircleAlert, Inbox, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  tone?: "empty" | "error";
  loading?: boolean;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  tone = "empty",
  loading = false,
  className,
}: EmptyStateProps) {
  const Icon = loading ? Loader2 : tone === "error" ? CircleAlert : icon ?? Inbox;
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/40 px-6 py-12 text-center",
        className
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full",
          tone === "error" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className={cn("h-5 w-5", loading && "animate-spin")} aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{loading ? "Loading…" : title}</p>
        {!loading && description ? (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {!loading && action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: React.ReactNode;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We could not load this data. Check your connection and try again.",
  onRetry,
  retrying = false,
  className,
}: ErrorStateProps) {
  return (
    <EmptyState
      tone="error"
      title={title}
      description={description}
      className={className}
      action={
        onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry} disabled={retrying}>
            <RefreshCw className={cn("h-4 w-4", retrying && "animate-spin")} aria-hidden />
            {retrying ? "Retrying" : "Try again"}
          </Button>
        ) : null
      }
    />
  );
}
