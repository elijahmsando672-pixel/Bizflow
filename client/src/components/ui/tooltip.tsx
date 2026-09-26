"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Lightweight, dependency-free tooltip. Visible on hover and keyboard focus,
 * positioned above the trigger by default.
 */
interface TooltipProps {
  label: React.ReactNode;
  children: React.ReactElement;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

const SIDE_CLASSES: Record<NonNullable<TooltipProps["side"]>, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
  left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
  right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
};

export function Tooltip({ label, children, side = "top", className }: TooltipProps) {
  const id = React.useId();
  return (
    <span className={cn("group/tt relative inline-flex", className)}>
      {React.cloneElement(children, {
        "aria-describedby": id,
      } as React.HTMLAttributes<HTMLElement>)}
      <span
        id={id}
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 hidden w-max max-w-[16rem] rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-card-foreground shadow-dropdown",
          "group-hover/tt:block group-focus-within/tt:block",
          SIDE_CLASSES[side]
        )}
      >
        {label}
      </span>
    </span>
  );
}

/** Icon button with an accessible name and a tooltip. */
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: React.ReactNode;
  variant?: "ghost" | "outline";
  size?: "sm" | "default";
}

export function IconButton({
  label,
  children,
  variant = "ghost",
  size = "default",
  className,
  ...props
}: IconButtonProps) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        aria-label={label}
        className={cn(
          "inline-flex items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          size === "sm" ? "h-8 w-8" : "h-9 w-9",
          variant === "ghost"
            ? "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            : "border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
          className
        )}
        {...props}
      >
        {children}
      </button>
    </Tooltip>
  );
}
