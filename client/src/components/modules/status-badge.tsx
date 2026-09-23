import * as React from "react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusTone =
  | "success"
  | "warning"
  | "destructive"
  | "default"
  | "neutral"
  | "outline";

interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: StatusTone;
  children: React.ReactNode;
}

const toVariant: Record<Exclude<StatusTone, "success">, BadgeProps["variant"]> = {
  warning: "warning",
  destructive: "destructive",
  default: "default",
  neutral: "secondary",
  outline: "outline",
};

export function StatusBadge({ tone = "neutral", children, className, ...props }: StatusBadgeProps) {
  const variant = tone === "success" ? "default" : toVariant[tone];
  return (
    <Badge
      variant={variant}
      className={cn(
        tone === "success" && "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20",
        className
      )}
      {...props}
    >
      {children}
    </Badge>
  );
}