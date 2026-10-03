import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { moduleAccent, moduleDescriptor, type ModuleTone } from "@/lib/module-accents";

/**
 * Actions sit on a saturated banner, so every control in the row is forced to
 * the translucent-white treatment (buttons render as `<button>`, or as `<a>`
 * when `asChild` is used) to keep every variant legible on any accent hue.
 */
const HERO_ACTIONS = [
  "[&_button]:border-white/45",
  "[&_button]:bg-white/15",
  "[&_button]:text-white",
  "[&_button]:shadow-none",
  "[&_button]:hover:bg-white/28",
  "[&_button]:hover:text-white",
  "[&_a]:border-white/45",
  "[&_a]:bg-white/15",
  "[&_a]:text-white",
  "[&_a]:shadow-none",
  "[&_a]:hover:bg-white/28",
  "[&_a]:hover:text-white",
].join(" ");

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /**
   * Navigation item id from the module registry. When present (and no explicit
   * `icon`) the header renders as a coloured hero banner: module icon, title,
   * description and actions on the module's accent colour.
   */
  module?: string;
  /** Overrides the icon resolved from `module`. */
  icon?: LucideIcon;
  /** Overrides the accent colour resolved from `module`. */
  tone?: ModuleTone;
  /**
   * "hero" (default when a module/icon is known) renders the coloured banner.
   * "plain" keeps the bare heading used by forms and sub-pages.
   */
  variant?: "hero" | "plain";
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  module,
  icon,
  tone,
  variant,
  className,
}: PageHeaderProps) {
  const descriptor = module ? moduleDescriptor(module) : undefined;
  const Icon = icon ?? descriptor?.icon;
  const accent = moduleAccent(tone ?? descriptor?.tone);
  const resolved: "hero" | "plain" = variant ?? (Icon ? "hero" : "plain");

  if (resolved === "hero") {
    return (
      <section
        className={cn(
          "mb-5 overflow-hidden rounded-card p-5 text-white shadow-hero lg:mb-6 lg:p-6",
          accent.hero,
          className
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            {Icon ? (
              <span
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                  accent.heroIcon
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
            ) : null}
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight lg:text-[28px]">
                {title}
              </h1>
              {description ? (
                <div className="mt-1 text-sm text-white/80">{description}</div>
              ) : null}
            </div>
          </div>
          {actions ? (
            <div className={cn("flex flex-wrap items-center gap-2", HERO_ACTIONS)}>{actions}</div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <div className={cn("mb-5 flex flex-col gap-3 lg:mb-6", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight text-foreground lg:text-2xl">
            {title}
          </h1>
          {description ? <div className="mt-1 text-sm text-muted-foreground">{description}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
