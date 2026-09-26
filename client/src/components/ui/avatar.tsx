import * as React from "react";
import { cn } from "@/lib/utils";
import { initials as toInitials } from "@/lib/format";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const SIZES: Record<Size, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
  xl: "h-16 w-16 text-xl",
};

const PALETTE = [
  "bg-primary/15 text-accent-foreground",
  "bg-info/15 text-info",
  "bg-success/15 text-success",
  "bg-warning/15 text-warning",
  "bg-chart-3/15 text-chart-3",
  "bg-destructive/15 text-destructive",
];

function paletteFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 9973;
  return PALETTE[hash % PALETTE.length];
}

interface AvatarProps {
  name?: string | null;
  src?: string | null;
  size?: Size;
  className?: string;
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const label = name?.trim() || "User";
  if (src) {
    return (
      <img
        src={src}
        alt={label}
        className={cn("shrink-0 rounded-full border border-border object-cover", SIZES[size], className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        paletteFor(label),
        SIZES[size],
        className
      )}
    >
      {toInitials(label)}
    </span>
  );
}
