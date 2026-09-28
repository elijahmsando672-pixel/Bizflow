"use client";

import type { BusinessModule } from "@/lib/business-modules";
import { cn } from "@/lib/utils";

interface ModuleCardProps {
  module: BusinessModule;
  index: number;
  onSelect: (module: BusinessModule) => void;
  disabled?: boolean;
}

/** Cap the stagger so the last cards never wait a noticeable beat. */
const STAGGER_CAP = 14;
const STAGGER_MS = 35;

export function ModuleCard({ module, index, onSelect, disabled }: ModuleCardProps) {
  const Icon = module.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(module)}
      disabled={disabled}
      aria-label={`Open ${module.label}`}
      style={{ animationDelay: `${Math.min(index, STAGGER_CAP) * STAGGER_MS}ms` }}
      className={cn(
        "bw-card group flex min-h-[104px] w-full cursor-pointer flex-col items-center justify-center gap-2.5 rounded-3xl px-3 py-5 text-center",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110 min-[651px]:h-12 min-[651px]:w-12"
        style={{ backgroundColor: `${module.tint}1f`, color: module.tint }}
      >
        <Icon className="h-[22px] w-[22px] min-[651px]:h-6 min-[651px]:w-6" aria-hidden />
      </span>
      <span className="bw-ink text-[13px] font-semibold leading-tight min-[651px]:text-sm">
        {module.label}
      </span>
    </button>
  );
}
